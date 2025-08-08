#!/usr/bin/env node

/**
 * CI Test Orchestrator
 * 
 * Orchestrates all tests in CI environment with proper fallbacks,
 * error handling, and reporting.
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  isCI, 
  getCIPlatform, 
  checkDevServerAvailability,
  logEnvironmentInfo,
  getTestEnvironmentConfig 
} from '../src/utils/test-environment.js';
import CIErrorReporter from './ci-error-reporter.js';

class CITestOrchestrator {
  constructor() {
    this.config = null;
    this.errorReporter = new CIErrorReporter();
    this.results = [];
    this.reportDir = './ci-reports';
  }
  
  async initialize() {
    console.log('🎯 Initializing CI Test Orchestrator...');
    
    this.config = await getTestEnvironmentConfig({
      devServerUrl: 'http://localhost:4321',
      timeout: 10000
    });
    
    await this.errorReporter.initialize();
    
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
    
    logEnvironmentInfo(this.config);
  }
  
  /**
   * Define test suite with fallback strategies
   */
  getTestSuite() {
    return [
      {
        name: 'Unit Tests',
        type: 'unit',
        command: 'pnpm test',
        required: true,
        requiresServer: false,
        fallback: null
      },
      {
        name: 'Blog Image Tests',
        type: 'blog-images',
        command: 'pnpm test:blog-images',
        required: true,
        requiresServer: false,
        fallback: 'pnpm test src/components/__tests__/BlogCard.test.js --run'
      },
      {
        name: 'Function Tests',
        type: 'functions',
        command: 'pnpm functions:test',
        required: true,
        requiresServer: false,
        fallback: null
      },
      {
        name: 'Visual Regression Tests',
        type: 'visual-regression',
        command: 'pnpm test:visual:ci-safe',
        required: false,
        requiresServer: true,
        fallback: 'echo "Visual tests skipped - no dev server in CI"'
      },
      {
        name: 'Accessibility Tests',
        type: 'accessibility',
        command: 'pnpm test:a11y:ci-safe',
        required: false,
        requiresServer: true,
        fallback: 'echo "Accessibility tests skipped - no dev server in CI"'
      },
      {
        name: 'Security Tests',
        type: 'security',
        command: 'pnpm test:security:ci-safe',
        required: false,
        requiresServer: true,
        fallback: 'npm audit --audit-level=high'
      }
    ];
  }
  
  /**
   * Execute a single test with fallback handling
   */
  async executeTest(testConfig) {
    const { name, type, command, required, requiresServer, fallback } = testConfig;
    
    console.log(`\n🧪 Running: ${name}`);
    console.log(`   Type: ${type}`);
    console.log(`   Required: ${required ? 'Yes' : 'No'}`);
    console.log(`   Requires Server: ${requiresServer ? 'Yes' : 'No'}`);
    
    // Check if test should be skipped due to server requirements
    if (requiresServer && !this.config.devServerAvailable) {
      console.log(`⏭️  Skipping ${name} - dev server not available`);
      
      if (fallback) {
        console.log(`🔄 Running fallback: ${fallback}`);
        return await this.runCommand(fallback, testConfig, true);
      } else {
        return {
          name,
          type,
          success: true,
          skipped: true,
          reason: 'no-server',
          required
        };
      }
    }
    
    // Run the main command
    const result = await this.runCommand(command, testConfig, false);
    
    // If main command failed and we have a fallback, try it
    if (!result.success && fallback && !result.skipped) {
      console.log(`🔄 Main command failed, trying fallback: ${fallback}`);
      const fallbackResult = await this.runCommand(fallback, testConfig, true);
      
      // Merge results
      return {
        ...result,
        fallbackUsed: true,
        fallbackSuccess: fallbackResult.success,
        fallbackOutput: fallbackResult.output
      };
    }
    
    return result;
  }
  
  /**
   * Run a command and capture results
   */
  async runCommand(command, testConfig, isFallback = false) {
    return new Promise((resolve) => {
      const args = command.split(' ');
      const cmd = args.shift();
      
      console.log(`   ${isFallback ? 'Fallback ' : ''}Command: ${command}`);
      
      const childProcess = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          CI: this.config.isCI ? 'true' : process.env.CI,
          NODE_ENV: 'test'
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      childProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Show real-time output for important tests
        if (testConfig.required || !this.config.isCI) {
          process.stdout.write(text);
        }
      });
      
      childProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (testConfig.required || !this.config.isCI) {
          process.stderr.write(text);
        }
      });
      
      childProcess.on('exit', (code) => {
        const success = code === 0;
        
        console.log(`   ${success ? '✅' : '❌'} ${testConfig.name} ${isFallback ? 'fallback ' : ''}${success ? 'passed' : 'failed'} (exit code: ${code})`);
        
        resolve({
          name: testConfig.name,
          type: testConfig.type,
          success,
          skipped: false,
          exitCode: code,
          output,
          errorOutput,
          required: testConfig.required,
          isFallback
        });
      });
      
      childProcess.on('error', (error) => {
        console.log(`   ❌ ${testConfig.name} ${isFallback ? 'fallback ' : ''}failed to execute: ${error.message}`);
        
        resolve({
          name: testConfig.name,
          type: testConfig.type,
          success: false,
          skipped: false,
          error: error.message,
          required: testConfig.required,
          isFallback
        });
      });
    });
  }
  
  /**
   * Run all tests with orchestration
   */
  async runAllTests() {
    console.log('\n🚀 Starting CI Test Orchestration...');
    
    const testSuite = this.getTestSuite();
    const results = [];
    
    for (const testConfig of testSuite) {
      try {
        const result = await this.executeTest(testConfig);
        results.push(result);
        
        // If a required test fails, we might want to stop
        if (result.required && !result.success && !result.skipped) {
          console.log(`\n❌ Required test failed: ${result.name}`);
          
          // Report the failure
          await this.errorReporter.reportFailure({
            testType: result.type,
            exitCode: result.exitCode,
            error: result.error || `Test failed with exit code ${result.exitCode}`,
            logs: [result.output, result.errorOutput].filter(Boolean)
          });
          
          // In CI, we might continue with other tests for better reporting
          if (this.config.isCI) {
            console.log('ℹ️  Continuing with remaining tests for complete CI report...');
          } else {
            console.log('💥 Stopping test execution due to required test failure');
            break;
          }
        }
        
      } catch (error) {
        console.error(`💥 Failed to execute test ${testConfig.name}:`, error.message);
        results.push({
          name: testConfig.name,
          type: testConfig.type,
          success: false,
          skipped: false,
          error: error.message,
          required: testConfig.required
        });
      }
    }
    
    this.results = results;
    return results;
  }
  
  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        ci: this.config.isCI,
        platform: this.config.ciPlatform,
        nodeEnv: this.config.nodeEnv,
        devServerAvailable: this.config.devServerAvailable
      },
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success && !r.skipped).length,
        skipped: this.results.filter(r => r.skipped).length,
        required: this.results.filter(r => r.required).length,
        requiredPassed: this.results.filter(r => r.required && r.success).length,
        requiredFailed: this.results.filter(r => r.required && !r.success && !r.skipped).length
      }
    };
    
    // Save detailed report
    const reportPath = join(this.reportDir, `ci-orchestrator-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    // Log summary
    console.log('\n📊 CI Test Orchestration Summary:');
    console.log(`   Environment: ${summary.environment.platform}`);
    console.log(`   Total Tests: ${summary.summary.total}`);
    console.log(`   Passed: ${summary.summary.passed}`);
    console.log(`   Failed: ${summary.summary.failed}`);
    console.log(`   Skipped: ${summary.summary.skipped}`);
    console.log(`   Required Tests: ${summary.summary.required}`);
    console.log(`   Required Passed: ${summary.summary.requiredPassed}`);
    console.log(`   Required Failed: ${summary.summary.requiredFailed}`);
    
    // Detailed results
    console.log('\n📋 Test Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : result.skipped ? '⏭️' : '❌';
      const required = result.required ? ' (Required)' : '';
      const fallback = result.fallbackUsed ? ' (Used Fallback)' : '';
      console.log(`   ${status} ${result.name}${required}${fallback}`);
    });
    
    console.log(`\n📁 Full report saved to: ${reportPath}`);
    
    return summary;
  }
  
  /**
   * Determine overall success/failure
   */
  shouldExitWithError() {
    const requiredFailed = this.results.filter(r => r.required && !r.success && !r.skipped);
    
    if (requiredFailed.length > 0) {
      console.log(`\n❌ CI Test Orchestration FAILED: ${requiredFailed.length} required tests failed`);
      requiredFailed.forEach(result => {
        console.log(`   - ${result.name}: ${result.error || 'Test failed'}`);
      });
      return true;
    }
    
    console.log('\n✅ CI Test Orchestration PASSED: All required tests passed');
    
    const optionalFailed = this.results.filter(r => !r.required && !r.success && !r.skipped);
    if (optionalFailed.length > 0) {
      console.log(`ℹ️  Note: ${optionalFailed.length} optional tests failed but CI continues`);
    }
    
    return false;
  }
  
  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      const report = await this.generateReport();
      
      const shouldFail = this.shouldExitWithError();
      process.exit(shouldFail ? 1 : 0);
      
    } catch (error) {
      console.error('💥 CI Test Orchestrator failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new CITestOrchestrator();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received interrupt signal, exiting...');
    process.exit(0);
  });
  
  orchestrator.run();
}

export default CITestOrchestrator;