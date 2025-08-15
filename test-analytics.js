#!/usr/bin/env node

/**
 * Test script to verify analytics integration
 * Run with: node test-analytics.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testing Analytics Integration...\n');

// Check if TrackingScripts component exists and has proper structure
try {
  const trackingScriptsPath = join(__dirname, 'src', 'components', 'TrackingScripts.astro');
  const trackingScripts = readFileSync(trackingScriptsPath, 'utf-8');
  
  console.log('✅ TrackingScripts.astro found');
  
  // Check for Google Analytics integration
  if (trackingScripts.includes('googletagmanager.com/gtag/js')) {
    console.log('✅ Google Analytics 4 integration detected');
  } else {
    console.log('❌ Google Analytics integration missing');
  }
  
  // Check for Clarity integration
  if (trackingScripts.includes('clarity.ms/tag')) {
    console.log('✅ Microsoft Clarity integration detected');
  } else {
    console.log('❌ Microsoft Clarity integration missing');
  }
  
  // Check for privacy features
  if (trackingScripts.includes('anonymize_ip: true')) {
    console.log('✅ IP anonymization enabled');
  } else {
    console.log('⚠️  IP anonymization not found');
  }
  
  // Check for production-only loading
  if (trackingScripts.includes('isProduction')) {
    console.log('✅ Production-only loading configured');
  } else {
    console.log('⚠️  Production check not found');
  }
  
} catch (error) {
  console.log('❌ Error reading TrackingScripts.astro:', error.message);
}

// Check Layout integration
try {
  const layoutPath = join(__dirname, 'src', 'components', 'Layout.astro');
  const layout = readFileSync(layoutPath, 'utf-8');
  
  if (layout.includes('TrackingScripts')) {
    console.log('✅ TrackingScripts integrated in Layout');
  } else {
    console.log('❌ TrackingScripts not found in Layout');
  }
  
} catch (error) {
  console.log('❌ Error reading Layout.astro:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 ID');
console.log('2. Replace CLARITY_PROJECT_ID with your actual Microsoft Clarity ID');
console.log('3. Set these environment variables in Netlify dashboard');
console.log('4. Deploy and test in production');
console.log('\n🔗 Useful Links:');
console.log('- Google Analytics: https://analytics.google.com/');
console.log('- Microsoft Clarity: https://clarity.microsoft.com/');
console.log('- Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/');