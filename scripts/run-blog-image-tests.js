#!/usr/bin/env node

/**
 * Blog Image Test Runner
 * 
 * Comprehensive test runner for blog image functionality.
 * Runs all blog image related tests and provides detailed reporting.
 * Now includes CI-friendly environment detection.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { 
  isCI, 
  getCIPlatform, 
  logEnvironmentInfo,
  getTestEnvironmentConfig 
} from '../src/utils/test-environment.js';

const TEST_FILES = [
  'src/components/__tests__/BlogCard.test.js',
  'src/components/__tests__/BlogSection.test.js', 
  'src/components/__tests__/BlogIndexPage.test.js',
  'src/components/__tests__/BlogCard.image-display.test.js',
  'src/components/__tests__/BlogCard.edge-cases.test.js'
];

// No longer require specific test blog posts - tests use mock data
const REQUIRED_TEST_POSTS = [];

function checkPrerequisites() {
  console.log('🔍 Checking blog image test prerequisites...');
  
  let allGood = true;
  
  // Check test files exist
  for (const testFile of TEST_FILES) {
    if (!existsSync(testFile)) {
      console.error(`❌ Missing test file: ${testFile}`);
      allGood = false;
    }
  }
  
  // Check test blog posts exist
  for (const testPost of REQUIRED_TEST_POSTS) {
    if (!existsSync(testPost)) {
      console.error(`❌ Missing test blog post: ${testPost}`);
      allGood = false;
    }
  }
  
  if (allGood) {
    console.log('✅ All prerequisites met');
  }
  
  return allGood;
}

async function runTests(options = {}) {
  // Get environment configuration for CI-friendly behavior
  const config = await getTestEnvironmentConfig();
  
  return new Promise((resolve, reject) => {
    const args = ['run'];
    
    if (options.coverage) {
      args.push('--coverage');
    }
    
    if (options.watch) {
      args.splice(0, 1); // Remove 'run' for watch mode
    }
    
    // Add CI-specific options
    if (config.isCI) {
      args.push('--reporter=verbose');
      args.push('--no-watch');
    }
    
    args.push(...TEST_FILES);
    
    console.log(`🧪 Running blog image tests...`);
    console.log(`Environment: ${config.ciPlatform}`);
    console.log(`Command: vitest ${args.join(' ')}`);
    
    const vitestProcess = spawn('vitest', args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        CI: config.isCI ? 'true' : process.env.CI,
        NODE_ENV: 'test'
      }
    });
    
    vitestProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All blog image tests passed!');
        resolve({ success: true, exitCode: code });
      } else {
        console.error(`❌ Blog image tests failed with exit code ${code}`);
        
        // In CI, provide more context about failures
        if (config.isCI) {
          console.log('ℹ️  CI Environment detected - check logs above for details');
          console.log('💡 These tests may require dev server for full functionality');
        }
        
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    vitestProcess.on('error', (error) => {
      console.error('❌ Failed to run tests:', error);
      
      if (config.isCI) {
        console.log('ℹ️  Test execution failed in CI environment');
        console.log('💡 This may be due to missing dependencies or environment issues');
      }
      
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    skipPrereqs: args.includes('--skip-prereqs')
  };
  
  try {
    // Get environment configuration
    const config = await getTestEnvironmentConfig();
    logEnvironmentInfo(config);
    
    if (!options.skipPrereqs && !checkPrerequisites()) {
      console.error('❌ Prerequisites not met. Please ensure all test files and test blog posts exist.');
      
      if (config.isCI) {
        console.log('ℹ️  CI Environment: Some prerequisites may be expected to be missing');
        console.log('✅ Continuing with available tests...');
      } else {
        process.exit(1);
      }
    }
    
    const result = await runTests(options);
    
    console.log('🎉 Blog image test suite completed successfully!');
    
    // Provide CI-specific success information
    if (config.isCI) {
      console.log(`✅ CI Environment: Tests completed on ${config.ciPlatform}`);
      console.log('📊 Test results have been processed for CI pipeline');
    }
    
  } catch (error) {
    console.error('💥 Blog image test suite failed:', error.message);
    
    // Get environment config for error handling
    try {
      const config = await getTestEnvironmentConfig();
      if (config.isCI) {
        console.log('ℹ️  CI Environment: Test failure detected');
        console.log('💡 Check the logs above for specific test failures');
        console.log('🔧 Consider running tests locally for debugging: npm run test:blog-images');
      }
    } catch (configError) {
      console.error('Failed to get environment config for error reporting');
    }
    
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}