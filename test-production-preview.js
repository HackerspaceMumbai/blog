#!/usr/bin/env node

// Test script to verify production preview environment
// This script tests image loading, performance, and lazy loading in production-like environment

import puppeteer from 'puppeteer';

async function testProductionPreview() {
  console.log('🚀 Starting production preview environment test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Capture network failures
  const networkFailures = [];
  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      failure: request.failure()
    });
    console.log(`❌ Network failure: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Track image loading performance
  const imageLoadTimes = [];
  page.on('response', response => {
    if (response.url().match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      imageLoadTimes.push({
        url: response.url(),
        status: response.status(),
        loadTime: Date.now()
      });
    }
  });
  
  try {
    console.log('📍 Navigating to production preview server...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:4321', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const pageLoadTime = Date.now() - startTime;
    console.log(`✅ Page loaded successfully in ${pageLoadTime}ms`);
    
    // Test image optimization features
    console.log('🔍 Testing image optimization features...');
    
    // Check for modern image formats (WebP, AVIF)
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        loading: img.loading,
        srcset: img.srcset
      }))
    );
    
    console.log(`📸 Found ${images.length} images on homepage:`);
    images.forEach((img, index) => {
      const hasModernFormat = img.src.includes('.webp') || img.src.includes('.avif');
      const hasLazyLoading = img.loading === 'lazy';
      const hasSrcset = img.srcset && img.srcset.length > 0;
      
      console.log(`  ${index + 1}. ${img.alt || 'No alt text'}`);
      console.log(`     - Status: ${img.complete ? '✅ Loaded' : '❌ Failed'}`);
      console.log(`     - Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
      console.log(`     - Modern format: ${hasModernFormat ? '✅' : '❌'}`);
      console.log(`     - Lazy loading: ${hasLazyLoading ? '✅' : '❌'}`);
      console.log(`     - Responsive: ${hasSrcset ? '✅' : '❌'}`);
    });
    
    // Test lazy loading behavior
    console.log('🔄 Testing lazy loading behavior...');
    
    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for lazy loaded images
    await page.waitForTimeout(2000);
    
    // Check if more images loaded
    const imagesAfterScroll = await page.$$eval('img', imgs => 
      imgs.filter(img => img.complete).length
    );
    
    console.log(`📊 Images loaded after scroll: ${imagesAfterScroll}/${images.length}`);
    
    // Test blog post page with images
    console.log('🔗 Testing blog post with images...');
    
    // Navigate back to home
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });
    
    // Find and click on a blog post
    const blogLinks = await page.$$('.blog-card a, [href*="/posts/"]');
    if (blogLinks.length > 0) {
      const href = await page.evaluate(el => el.href, blogLinks[0]);
      console.log(`📍 Navigating to blog post: ${href}`);
      
      const blogStartTime = Date.now();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        blogLinks[0].click()
      ]);
      
      const blogLoadTime = Date.now() - blogStartTime;
      console.log(`✅ Blog post loaded in ${blogLoadTime}ms`);
      
      // Check for inline images in blog content
      const blogImages = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          loading: img.loading
        }))
      );
      
      console.log(`🖼️ Found ${blogImages.length} images in blog post:`);
      blogImages.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.alt || 'No alt text'} - ${img.complete ? '✅ Loaded' : '❌ Failed'}`);
      });
    } else {
      console.log('ℹ️ No blog posts found to test');
    }
    
    // Performance summary
    console.log('\n⚡ Performance Summary:');
    console.log(`- Homepage load time: ${pageLoadTime}ms`);
    console.log(`- Images with modern formats: ${images.filter(img => img.src.includes('.webp') || img.src.includes('.avif')).length}/${images.length}`);
    console.log(`- Images with lazy loading: ${images.filter(img => img.loading === 'lazy').length}/${images.length}`);
    console.log(`- Images successfully loaded: ${images.filter(img => img.complete).length}/${images.length}`);
    
    // Final summary
    console.log('\n📊 Test Results Summary:');
    console.log(`- Console messages: ${consoleMessages.length}`);
    console.log(`- Network failures: ${networkFailures.length}`);
    console.log(`- Image load requests: ${imageLoadTimes.length}`);
    
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    if (errors.length > 0) {
      console.log('❌ Console errors found:');
      errors.forEach(msg => {
        console.log(`  ERROR: ${msg.text}`);
      });
    } else {
      console.log('✅ No console errors found');
    }
    
    if (networkFailures.length > 0) {
      console.log('❌ Network failures detected:');
      networkFailures.forEach(failure => {
        console.log(`  FAILED: ${failure.url} - ${failure.failure.errorText}`);
      });
    } else {
      console.log('✅ No network failures detected');
    }
    
    // Overall assessment
    const allImagesLoaded = images.every(img => img.complete);
    const hasModernFormats = images.some(img => img.src.includes('.webp') || img.src.includes('.avif'));
    const hasLazyLoading = images.some(img => img.loading === 'lazy');
    const noErrors = errors.length === 0 && networkFailures.length === 0;
    
    console.log('\n🎯 Production Preview Assessment:');
    console.log(`✅ All images display correctly: ${allImagesLoaded ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Image optimization active: ${hasModernFormats ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Lazy loading working: ${hasLazyLoading ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No critical errors: ${noErrors ? 'PASS' : 'FAIL'}`);
    
    if (allImagesLoaded && hasModernFormats && hasLazyLoading && noErrors) {
      console.log('\n🎉 Production preview environment test PASSED!');
    } else {
      console.log('\n⚠️ Production preview environment test has issues that need attention.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testProductionPreview().catch(console.error);