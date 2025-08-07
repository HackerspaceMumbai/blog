#!/usr/bin/env node

/**
 * Blog Image Test Runner
 * 
 * Comprehensive test runner for blog image functionality.
 * Runs all blog image related tests and provides detailed reporting.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

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

function runTests(options = {}) {
  return new Promise((resolve, reject) => {
    const args = ['run'];
    
    if (options.coverage) {
      args.push('--coverage');
    }
    
    if (options.watch) {
      args.splice(0, 1); // Remove 'run' for watch mode
    }
    
    args.push(...TEST_FILES);
    
    console.log(`🧪 Running blog image tests...`);
    console.log(`Command: vitest ${args.join(' ')}`);
    
    const vitestProcess = spawn('vitest', args, {
      stdio: 'inherit',
      shell: true
    });
    
    vitestProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All blog image tests passed!');
        resolve();
      } else {
        console.error(`❌ Blog image tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    vitestProcess.on('error', (error) => {
      console.error('❌ Failed to run tests:', error);
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
    if (!options.skipPrereqs && !checkPrerequisites()) {
      console.error('❌ Prerequisites not met. Please ensure all test files and test blog posts exist.');
      process.exit(1);
    }
    
    await runTests(options);
    
    console.log('🎉 Blog image test suite completed successfully!');
    
  } catch (error) {
    console.error('💥 Blog image test suite failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}