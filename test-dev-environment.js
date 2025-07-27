// Test script to verify development environment compatibility
// This script will help us check for any console errors or warnings

const puppeteer = require('puppeteer');

async function testDevEnvironment() {
  console.log('🚀 Starting development environment compatibility test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
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
  
  try {
    console.log('📍 Navigating to development server...');
    await page.goto('http://localhost:4321', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for blog cards to load
    await page.waitForSelector('.blog-card', { timeout: 10000 });
    console.log('✅ Blog cards found on page');
    
    // Check for cover images
    const coverImages = await page.$$eval('.cover-image', images => 
      images.map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      }))
    );
    
    console.log(`📸 Found ${coverImages.length} cover images:`);
    coverImages.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.alt} - ${img.complete ? '✅ Loaded' : '❌ Failed'} (${img.naturalWidth}x${img.naturalHeight})`);
    });
    
    // Test navigation to a blog post
    console.log('🔗 Testing blog post navigation...');
    const firstBlogLink = await page.$('.blog-card a');
    if (firstBlogLink) {
      const href = await page.evaluate(el => el.href, firstBlogLink);
      console.log(`📍 Navigating to: ${href}`);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        firstBlogLink.click()
      ]);
      
      console.log('✅ Blog post page loaded');
      
      // Check for inline images in blog content
      const inlineImages = await page.$$eval('img', images => 
        images.map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete
        }))
      );
      
      console.log(`🖼️ Found ${inlineImages.length} inline images in blog post:`);
      inlineImages.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.alt || 'No alt text'} - ${img.complete ? '✅ Loaded' : '❌ Failed'}`);
      });
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`- Console messages: ${consoleMessages.length}`);
    console.log(`- Network failures: ${networkFailures.length}`);
    console.log(`- Cover images loaded: ${coverImages.filter(img => img.complete).length}/${coverImages.length}`);
    
    if (consoleMessages.filter(msg => msg.type === 'error').length > 0) {
      console.log('❌ Errors found in console');
      consoleMessages.filter(msg => msg.type === 'error').forEach(msg => {
        console.log(`  ERROR: ${msg.text}`);
      });
    } else {
      console.log('✅ No console errors found');
    }
    
    if (networkFailures.length > 0) {
      console.log('❌ Network failures detected');
      networkFailures.forEach(failure => {
        console.log(`  FAILED: ${failure.url} - ${failure.failure.errorText}`);
      });
    } else {
      console.log('✅ No network failures detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testDevEnvironment().catch(console.error);