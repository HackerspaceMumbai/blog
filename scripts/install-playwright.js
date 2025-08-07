#!/usr/bin/env node

/**
 * Playwright Installation Script
 * 
 * Ensures Playwright browsers are installed for visual regression testing.
 */

import { execSync } from 'child_process';

function installPlaywrightBrowsers() {
  console.log('🎭 Installing Playwright and browsers...');
  
  try {
    // First ensure Playwright is installed
    console.log('📦 Installing Playwright package...');
    execSync('pnpm add -D playwright', { stdio: 'inherit' });
    
    // Then install browsers
    console.log('🌐 Installing Playwright browsers...');
    execSync('pnpm exec playwright install chromium', { stdio: 'inherit' });
    
    console.log('✅ Playwright and browsers installed successfully');
  } catch (error) {
    console.error('❌ Failed to install Playwright:', error.message);
    console.log('💡 Try running manually:');
    console.log('   pnpm add -D playwright');
    console.log('   pnpm exec playwright install chromium');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  installPlaywrightBrowsers();
}

export default installPlaywrightBrowsers;