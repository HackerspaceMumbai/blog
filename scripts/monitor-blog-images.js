#!/usr/bin/env node

/**
 * Blog Image Monitoring Script
 * 
 * Continuous monitoring script for blog image functionality.
 * Can be run periodically to detect regressions in production.
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class BlogImageMonitor {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://hackmum.in';
    this.interval = options.interval || 300000; // 5 minutes
    this.maxFailures = options.maxFailures || 3;
    this.reportDir = options.reportDir || 'monitoring-reports';
    this.browser = null;
    this.page = null;
    this.failureCount = 0;
    this.isRunning = false;
  }
  
  async setup() {
    console.log('🔍 Setting up blog image monitoring...');
    console.log(`🌐 Monitoring URL: ${this.baseUrl}`);
    console.log(`⏱️  Check interval: ${this.interval / 1000}s`);
    
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
    
    this.browser = await chromium.launch({
      headless: true
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  async checkBlogImages() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      url: this.baseUrl,
      status: 'unknown',
      errors: [],
      metrics: {}
    };
    
    try {
      console.log(`\n🔍 [${timestamp}] Checking blog images...`);
      
      // Test homepage blog section
      const startTime = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;
      
      report.metrics.pageLoadTime = loadTime;
      
      // Wait for images to load
      await this.page.waitForSelector('img', { timeout: 10000 });
      await this.page.waitForTimeout(2000);
      
      // Check all images
      const images = await this.page.locator('img').evaluateAll(imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      );
      
      const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
      const blogImages = images.filter(img => 
        img.src.includes('blog') || img.alt.includes('blog') || 
        img.src.includes('posts') || img.src.includes('cover')
      );
      
      report.metrics.totalImages = images.length;
      report.metrics.blogImages = blogImages.length;
      report.metrics.brokenImages = brokenImages.length;
      
      // Check blog section specifically
      const blogSection = await this.page.locator('section[aria-labelledby="blog-section-title"]').first();
      if (!(await blogSection.count())) {
        report.errors.push('Blog section not found on homepage');
      }
      
      // Check blog card images
      const blogCardImages = await this.page.locator('.card img').evaluateAll(imgs => 
        imgs.map(img => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth
        }))
      );
      
      const brokenBlogCardImages = blogCardImages.filter(img => !img.complete || img.naturalWidth === 0);
      report.metrics.blogCardImages = blogCardImages.length;
      report.metrics.brokenBlogCardImages = brokenBlogCardImages.length;
      
      // Test blog index page
      await this.page.goto(`${this.baseUrl}/blog`, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      const blogIndexImages = await this.page.locator('.post-grid .card img');
      const blogIndexImageCount = await blogIndexImages.count();
      report.metrics.blogIndexImages = blogIndexImageCount;
      
      let brokenBlogIndexCount = 0;
      for (let i = 0; i < blogIndexImageCount; i++) {
        const img = blogIndexImages.nth(i);
        const isLoaded = await img.evaluate(el => el.complete && el.naturalWidth > 0);
        if (!isLoaded) brokenBlogIndexCount++;
      }
      report.metrics.brokenBlogIndexImages = brokenBlogIndexCount;
      
      // Determine overall status
      if (brokenImages.length > 0 || brokenBlogCardImages.length > 0 || brokenBlogIndexCount > 0) {
        report.status = 'failed';
        report.errors.push(`Found ${brokenImages.length + brokenBlogCardImages.length + brokenBlogIndexCount} broken images`);
        this.failureCount++;
      } else {
        report.status = 'passed';
        this.failureCount = 0; // Reset failure count on success
      }
      
      console.log(`   📊 Total images: ${report.metrics.totalImages}`);
      console.log(`   📊 Blog card images: ${report.metrics.blogCardImages}`);
      console.log(`   📊 Blog index images: ${report.metrics.blogIndexImages}`);
      console.log(`   📊 Broken images: ${report.metrics.brokenImages + report.metrics.brokenBlogCardImages + report.metrics.brokenBlogIndexImages}`);
      console.log(`   ⚡ Load time: ${loadTime}ms`);
      
      if (report.status === 'passed') {
        console.log('   ✅ All blog images loading correctly');
      } else {
        console.log('   ❌ Blog image issues detected');
        report.errors.forEach(error => console.log(`      - ${error}`));
      }
      
    } catch (error) {
      report.status = 'error';
      report.errors.push(error.message);
      this.failureCount++;
      console.log(`   💥 Monitoring check failed: ${error.message}`);
    }
    
    // Save report
    const reportPath = join(this.reportDir, `monitor-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Alert on consecutive failures
    if (this.failureCount >= this.maxFailures) {
      await this.sendAlert(report);
    }
    
    return report;
  }
  
  async sendAlert(report) {
    console.log('\n🚨 ALERT: Multiple consecutive failures detected!');
    console.log(`   Failure count: ${this.failureCount}/${this.maxFailures}`);
    console.log(`   Last error: ${report.errors[0] || 'Unknown error'}`);
    
    // In a production environment, you would send this to:
    // - Slack webhook
    // - Email notification
    // - PagerDuty
    // - Discord webhook
    // - etc.
    
    const alertData = {
      timestamp: new Date().toISOString(),
      severity: 'high',
      service: 'blog-images',
      message: `Blog image monitoring detected ${this.failureCount} consecutive failures`,
      details: report,
      url: this.baseUrl
    };
    
    const alertPath = join(this.reportDir, `alert-${Date.now()}.json`);
    writeFileSync(alertPath, JSON.stringify(alertData, null, 2));
    
    console.log(`   📄 Alert saved to: ${alertPath}`);
    console.log('   💡 Configure webhook/email notifications for production use');
  }
  
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }
    
    this.isRunning = true;
    await this.setup();
    
    console.log('🚀 Blog image monitoring started');
    
    // Initial check
    await this.checkBlogImages();
    
    // Set up interval
    const intervalId = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        await this.checkBlogImages();
      } catch (error) {
        console.error('Monitor check failed:', error);
      }
    }, this.interval);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down monitor...');
      this.isRunning = false;
      clearInterval(intervalId);
      await this.cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received termination signal...');
      this.isRunning = false;
      clearInterval(intervalId);
      await this.cleanup();
      process.exit(0);
    });
  }
  
  async runOnce() {
    await this.setup();
    const report = await this.checkBlogImages();
    await this.cleanup();
    
    return report.status === 'passed';
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'url':
        options.baseUrl = value;
        break;
      case 'interval':
        options.interval = parseInt(value) * 1000; // Convert to ms
        break;
      case 'max-failures':
        options.maxFailures = parseInt(value);
        break;
      case 'report-dir':
        options.reportDir = value;
        break;
    }
  }
  
  const monitor = new BlogImageMonitor(options);
  
  if (args.includes('--once')) {
    // Run once and exit
    monitor.runOnce().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Run continuously
    monitor.start();
  }
}

export default BlogImageMonitor;