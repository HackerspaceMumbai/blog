#!/usr/bin/env node

// Test script to verify responsive design and cross-screen compatibility
// This script tests blog posts rendering across different screen sizes

import puppeteer from 'puppeteer';

const SCREEN_SIZES = [
  { name: 'Mobile Portrait', width: 375, height: 667 },
  { name: 'Mobile Landscape', width: 667, height: 375 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop Small', width: 1280, height: 720 },
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Ultra Wide', width: 2560, height: 1440 }
];

async function testResponsiveDesign() {
  console.log('📱 Starting responsive design test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
      console.log(`❌ Console error: ${msg.text()}`);
    }
  });
  
  // Track layout issues
  const layoutIssues = [];
  
  try {
    console.log('📍 Navigating to development server...');
    await page.goto('http://localhost:4321', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Test each screen size
    for (const screenSize of SCREEN_SIZES) {
      console.log(`\n🔍 Testing ${screenSize.name} (${screenSize.width}x${screenSize.height})`);
      
      // Set viewport
      await page.setViewport({
        width: screenSize.width,
        height: screenSize.height,
        deviceScaleFactor: 1
      });
      
      // Wait for layout to settle
      await page.waitForTimeout(1000);
      
      // Test homepage layout
      const homePageResults = await testPageLayout(page, 'Homepage', screenSize);
      
      // Find and test a blog post
      const blogLinks = await page.$$('.blog-card a, [href*="/blog/"]');
      if (blogLinks.length > 0) {
        const href = await page.evaluate(el => el.href, blogLinks[0]);
        console.log(`  📖 Testing blog post: ${href.split('/').pop()}`);
        
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          blogLinks[0].click()
        ]);
        
        const blogResults = await testPageLayout(page, 'Blog Post', screenSize);
        
        // Navigate back to homepage for next test
        await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });
        
        // Combine results
        if (homePageResults.issues.length > 0 || blogResults.issues.length > 0) {
          layoutIssues.push({
            screenSize: screenSize.name,
            homepage: homePageResults,
            blogPost: blogResults
          });
        }
      }
    }
    
    // Test image optimization across screen sizes
    console.log('\n🖼️ Testing image optimization across screen sizes...');
    
    for (const screenSize of SCREEN_SIZES) {
      await page.setViewport({
        width: screenSize.width,
        height: screenSize.height,
        deviceScaleFactor: 1
      });
      
      await page.waitForTimeout(500);
      
      const imageResults = await testImageOptimization(page, screenSize);
      console.log(`  ${screenSize.name}: ${imageResults.optimizedImages}/${imageResults.totalImages} images optimized`);
    }
    
    // Summary
    console.log('\n📊 Responsive Design Test Results:');
    console.log(`- Screen sizes tested: ${SCREEN_SIZES.length}`);
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- Layout issues found: ${layoutIssues.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    }
    
    if (layoutIssues.length > 0) {
      console.log('\n⚠️ Layout Issues:');
      layoutIssues.forEach(issue => {
        console.log(`  ${issue.screenSize}:`);
        if (issue.homepage.issues.length > 0) {
          console.log(`    Homepage: ${issue.homepage.issues.join(', ')}`);
        }
        if (issue.blogPost.issues.length > 0) {
          console.log(`    Blog Post: ${issue.blogPost.issues.join(', ')}`);
        }
      });
    }
    
    // Overall assessment
    const passed = consoleErrors.length === 0 && layoutIssues.length === 0;
    console.log(`\n🎯 Responsive Design Test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (passed) {
      console.log('🎉 All blog posts render correctly across different screen sizes!');
    } else {
      console.log('⚠️ Some issues found that need attention.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testPageLayout(page, pageType, screenSize) {
  const issues = [];
  
  try {
    // Check for horizontal scrollbars (indicates overflow)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      issues.push('Horizontal scrollbar detected');
    }
    
    // Check if images are properly sized
    const imageIssues = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const problems = [];
      
      images.forEach((img, index) => {
        if (img.naturalWidth > 0 && img.offsetWidth > img.parentElement.offsetWidth) {
          problems.push(`Image ${index + 1} overflows container`);
        }
        if (!img.alt && !img.getAttribute('aria-label')) {
          problems.push(`Image ${index + 1} missing alt text`);
        }
      });
      
      return problems;
    });
    
    issues.push(...imageIssues);
    
    // Check for text readability (minimum font size)
    const textIssues = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div'));
      const problems = [];
      
      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        
        if (fontSize < 14 && el.textContent.trim().length > 0) {
          problems.push(`Text element ${index + 1} too small (${fontSize}px)`);
        }
      });
      
      return problems.slice(0, 5); // Limit to first 5 issues
    });
    
    issues.push(...textIssues);
    
    // Check for proper spacing on mobile
    if (screenSize.width <= 768) {
      const spacingIssues = await page.evaluate(() => {
        const clickableElements = Array.from(document.querySelectorAll('button, a, input'));
        const problems = [];
        
        clickableElements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            problems.push(`Clickable element ${index + 1} too small for touch (${Math.round(rect.width)}x${Math.round(rect.height)})`);
          }
        });
        
        return problems.slice(0, 3); // Limit to first 3 issues
      });
      
      issues.push(...spacingIssues);
    }
    
    console.log(`    ${pageType}: ${issues.length === 0 ? '✅ No issues' : `⚠️ ${issues.length} issues`}`);
    
  } catch (error) {
    issues.push(`Layout test error: ${error.message}`);
  }
  
  return { issues };
}

async function testImageOptimization(page, screenSize) {
  try {
    const results = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      let optimizedImages = 0;
      
      images.forEach(img => {
        const hasModernFormat = img.src.includes('.webp') || img.src.includes('.avif');
        const hasLazyLoading = img.loading === 'lazy' || img.getAttribute('loading') === 'lazy';
        const hasResponsive = img.srcset && img.srcset.length > 0;
        
        if (hasModernFormat || hasLazyLoading || hasResponsive) {
          optimizedImages++;
        }
      });
      
      return {
        totalImages: images.length,
        optimizedImages
      };
    });
    
    return results;
  } catch (error) {
    return { totalImages: 0, optimizedImages: 0 };
  }
}

// Run the test
testResponsiveDesign().catch(console.error);