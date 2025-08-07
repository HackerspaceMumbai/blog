#!/usr/bin/env node

/**
 * Production Deployment Smoke Tests
 * 
 * Comprehensive smoke tests to verify blog image functionality
 * in production environment after deployment.
 */

import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class ProductionSmokeTest {
  constructor(baseUrl = 'https://hackmum.in') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.reportDir = 'smoke-test-reports';
  }
  
  async setup() {
    console.log('🚀 Starting production smoke tests...');
    console.log(`🌐 Testing URL: ${this.baseUrl}`);
    
    // Ensure report directory exists
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
    
    this.browser = await chromium.launch({
      headless: true
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1200, height: 800 });
    
    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          type: 'console',
          message: msg.text(),
          location: msg.location()
        });
      }
    });
    
    // Monitor network failures
    this.page.on('requestfailed', request => {
      this.results.errors.push({
        type: 'network',
        message: `Failed to load: ${request.url()}`,
        error: request.failure().errorText
      });
    });
  }
  
  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    
    // Generate report
    await this.generateReport();
  }
  
  async runTest(testName, testFn) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      await testFn();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({
        type: 'test',
        test: testName,
        message: error.message
      });
    }
  }
  
  async testHomepageBlogImages() {
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for images to load
    await this.page.waitForSelector('img', { timeout: 10000 });
    await this.page.waitForTimeout(2000);
    
    // Check all images are loaded
    const images = await this.page.locator('img').evaluateAll(imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        loading: img.loading
      }))
    );
    
    const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
    if (brokenImages.length > 0) {
      throw new Error(`${brokenImages.length} broken images found on homepage`);
    }
    
    // Check for blog section specifically
    const blogSection = await this.page.locator('section[aria-labelledby="blog-section-title"]').first();
    if (!(await blogSection.count())) {
      throw new Error('Blog section not found on homepage');
    }
    
    // Verify blog card images
    const blogImages = await this.page.locator('.card img').evaluateAll(imgs => 
      imgs.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }))
    );
    
    const brokenBlogImages = blogImages.filter(img => !img.complete || img.naturalWidth === 0);
    if (brokenBlogImages.length > 0) {
      throw new Error(`${brokenBlogImages.length} broken blog card images found`);
    }
    
    console.log(`   📊 Found ${images.length} total images, ${blogImages.length} blog card images`);
  }
  
  async testBlogIndexPage() {
    await this.page.goto(`${this.baseUrl}/blog`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for images to load
    await this.page.waitForSelector('img', { timeout: 10000 });
    await this.page.waitForTimeout(2000);
    
    // Check all blog card images (blog index uses .post-grid with .card elements)
    const blogCards = await this.page.locator('.post-grid .card img');
    const blogCardCount = await blogCards.count();
    if (blogCardCount === 0) {
      throw new Error('No blog cards found on blog index page');
    }
    
    let brokenCount = 0;
    for (let i = 0; i < blogCardCount; i++) {
      const img = blogCards.nth(i);
      const isLoaded = await img.evaluate(el => el.complete && el.naturalWidth > 0);
      if (!isLoaded) brokenCount++;
    }
    
    if (brokenCount > 0) {
      throw new Error(`${brokenCount} broken blog card images on blog index page`);
    }
    
    console.log(`   📊 Verified ${blogCardCount} blog card images`);
  }
  
  async testBlogPostImages() {
    // Start from homepage to find a blog post
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
    
    // Find first blog post link
    const blogLink = await this.page.locator('.card a[href*="/blog/"]').first();
    if (!(await blogLink.count())) {
      console.log('   ⚠️  No blog posts found to test');
      this.results.warnings++;
      return;
    }
    
    // Navigate to blog post
    await blogLink.click();
    await this.page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await this.page.waitForTimeout(3000);
    
    // Check all images in the post
    const postImages = await this.page.locator('img').evaluateAll(imgs => 
      imgs.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }))
    );
    
    const brokenPostImages = postImages.filter(img => !img.complete || img.naturalWidth === 0);
    if (brokenPostImages.length > 0) {
      throw new Error(`${brokenPostImages.length} broken images in blog post`);
    }
    
    console.log(`   📊 Verified ${postImages.length} images in blog post`);
  }
  
  async testImageOptimization() {
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);
    
    // Check for modern image formats
    const images = await this.page.locator('img').evaluateAll(imgs => 
      imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        srcset: img.srcset
      }))
    );
    
    const modernFormats = images.filter(img => 
      img.src.includes('.webp') || img.src.includes('.avif')
    );
    
    const lazyImages = images.filter(img => img.loading === 'lazy');
    const responsiveImages = images.filter(img => img.srcset && img.srcset.length > 0);
    
    console.log(`   📊 Modern formats: ${modernFormats.length}/${images.length}`);
    console.log(`   📊 Lazy loading: ${lazyImages.length}/${images.length}`);
    console.log(`   📊 Responsive: ${responsiveImages.length}/${images.length}`);
    
    // At least some images should use modern formats in production
    if (modernFormats.length === 0 && images.length > 0) {
      console.log('   ⚠️  No modern image formats detected');
      this.results.warnings++;
    }
  }
  
  async testPerformance() {
    const startTime = Date.now();
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`   ⚡ Page load time: ${loadTime}ms`);
    
    // Performance thresholds for production
    if (loadTime > 5000) {
      console.log('   ⚠️  Slow page load time detected');
      this.results.warnings++;
    }
    
    // Check for performance metrics (Playwright doesn't have direct metrics like Puppeteer)
    // We can use evaluate to get basic performance info
    const performanceInfo = await this.page.evaluate(() => ({
      domNodes: document.querySelectorAll('*').length,
      images: document.querySelectorAll('img').length,
      scripts: document.querySelectorAll('script').length
    }));
    
    console.log(`   📊 DOM nodes: ${performanceInfo.domNodes}`);
    console.log(`   📊 Images: ${performanceInfo.images}`);
    console.log(`   📊 Scripts: ${performanceInfo.scripts}`);
  }
  
  async testHealthEndpoint() {
    try {
      const response = await this.page.goto(`${this.baseUrl}/.netlify/functions/health`, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      if (response.status() !== 200) {
        throw new Error(`Health endpoint returned status ${response.status()}`);
      }
      
      const body = await response.text();
      const healthData = JSON.parse(body);
      
      if (healthData.status !== 'healthy') {
        throw new Error(`Health check failed: ${healthData.message || 'Unknown error'}`);
      }
      
      console.log('   ✅ Health endpoint responding correctly');
    } catch (error) {
      throw new Error(`Health endpoint test failed: ${error.message}`);
    }
  }
  
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        success: this.results.failed === 0
      }
    };
    
    const reportPath = join(this.reportDir, `smoke-test-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Smoke Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`);
      });
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return report.summary.success;
  }
  
  async run() {
    try {
      await this.setup();
      
      await this.runTest('Homepage Blog Images', () => this.testHomepageBlogImages());
      await this.runTest('Blog Index Page', () => this.testBlogIndexPage());
      await this.runTest('Blog Post Images', () => this.testBlogPostImages());
      await this.runTest('Image Optimization', () => this.testImageOptimization());
      await this.runTest('Performance', () => this.testPerformance());
      await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
      
      const success = await this.teardown();
      
      if (success) {
        console.log('\n🎉 All smoke tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some smoke tests failed!');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 Smoke test suite failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] || 'https://hackmum.in';
  const smokeTest = new ProductionSmokeTest(baseUrl);
  smokeTest.run();
}

export default ProductionSmokeTest;