#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * 
 * Sets up git hooks to run blog image tests before commits.
 * This helps prevent regressions in blog image functionality.
 */

import { execSync } from 'child_process';
import { existsSync, chmodSync } from 'fs';
import { join } from 'path';

function setupGitHooks() {
  console.log('🔧 Setting up git hooks...');
  
  try {
    // Configure git to use our hooks directory
    execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
    console.log('✅ Git hooks path configured');
    
    // Make hooks executable
    const preCommitHook = '.githooks/pre-commit';
    if (existsSync(preCommitHook)) {
      chmodSync(preCommitHook, '755');
      console.log('✅ Pre-commit hook made executable');
    } else {
      console.warn('⚠️  Pre-commit hook not found');
    }
    
    console.log('🎉 Git hooks setup complete!');
    console.log('');
    console.log('The following hooks are now active:');
    console.log('  • pre-commit: Runs blog image tests before each commit');
    console.log('');
    console.log('To bypass hooks (not recommended), use: git commit --no-verify');
    
  } catch (error) {
    console.error('❌ Failed to setup git hooks:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupGitHooks();
}