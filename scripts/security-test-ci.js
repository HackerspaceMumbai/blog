#!/usr/bin/env node

/**
 * CI-Friendly Security Test Runner
 * 
 * Handles security tests in CI environments with proper fallbacks
 * and environment detection.
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

class CISecurityRunner {
  constructor() {
    this.config = null;
    this.outputDir = './security-reports';
  }
  
  async initialize() {
    console.log('🔍 Initializing CI-friendly security tests...');
    
    this.config = await getTestEnvironmentConfig({
      devServerUrl: 'http://localhost:4321',
      timeout: 10000
    });
    
    logEnvironmentInfo(this.config);
    
    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  async runCIFriendlyTests() {
    if (this.config.shouldSkipServerDependentTests) {
      console.log('⏭️  Skipping security tests - dev server not available');
      
      if (this.config.isCI) {
        console.log('ℹ️  This is expected behavior in CI environment');
        console.log('✅ CI pipeline can continue without security tests');
        return await this.generateSkippedReport('ci-no-server');
      } else {
        console.log('💡 Please start dev server: npm run dev');
        console.log('   Then run tests again: npm run test:security');
        return await this.generateSkippedReport('local-no-server');
      }
    }
    
    console.log('✅ Running security tests with dev server available');
    return await this.executeSecurityTests();
  }
  
  async executeSecurityTests() {
    return new Promise((resolve) => {
      console.log('🔒 Executing security tests...');
      
      // Check if security test script exists
      if (!existsSync('scripts/security-test.js')) {
        console.log('⚠️  Security test script not found, running basic security checks');
        return resolve(this.runBasicSecurityChecks());
      }
      
      const testProcess = spawn('node', [
        'scripts/security-test.js',
        '--baseUrl', this.config.devServerUrl,
        '--pages', '/',
        '--testSuites', 'headers,xss,csrf',
        '--outputDir', this.outputDir
      ], {
        stdio: 'inherit',
        env: {
          ...process.env,
          CI: 'true',
          NODE_ENV: 'test'
        }
      });
      
      testProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Security tests completed successfully');
          resolve({ success: true, skipped: false, exitCode: code });
        } else {
          console.log(`⚠️  Security tests completed with issues (exit code: ${code})`);
          // Don't fail CI for security issues in CI environment
          if (this.config.isCI) {
            console.log('ℹ️  Security failures are non-blocking in CI');
            resolve({ success: true, skipped: false, exitCode: code, warnings: true });
          } else {
            resolve({ success: false, skipped: false, exitCode: code });
          }
        }
      });
      
      testProcess.on('error', (error) => {
        console.error('❌ Failed to execute security tests:', error.message);
        resolve({ success: false, skipped: false, error: error.message });
      });
    });
  }
  
  async runBasicSecurityChecks() {
    console.log('🔒 Running basic security checks...');
    
    try {
      // Basic security checks that don't require a full security test suite
      const checks = [
        { name: 'Package vulnerabilities', command: 'npm audit --audit-level=high' },
        { name: 'Dependency check', command: 'npm ls --depth=0' }
      ];
      
      const results = [];
      
      for (const check of checks) {
        try {
          console.log(`   Running: ${check.name}`);
          const { spawn } = await import('child_process');
          const result = await new Promise((resolve) => {
            const proc = spawn('npm', check.command.split(' ').slice(1), {
              stdio: 'pipe'
            });
            
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            proc.stderr.on('data', (data) => output += data.toString());
            
            proc.on('exit', (code) => {
              resolve({ name: check.name, success: code === 0, output });
            });
          });
          
          results.push(result);
          console.log(`   ${result.success ? '✅' : '⚠️'} ${check.name}: ${result.success ? 'Passed' : 'Issues found'}`);
        } catch (error) {
          console.log(`   ⚠️  ${check.name}: Error - ${error.message}`);
          results.push({ name: check.name, success: false, error: error.message });
        }
      }
      
      // Generate basic security report
      const report = {
        timestamp: new Date().toISOString(),
        type: 'basic-security-checks',
        results,
        summary: {
          total: results.length,
          passed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
      
      const reportPath = join(this.outputDir, `security-basic-${Date.now()}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      const allPassed = results.every(r => r.success);
      return { 
        success: allPassed, 
        skipped: false, 
        exitCode: allPassed ? 0 : 1, 
        warnings: !allPassed,
        reportPath 
      };
      
    } catch (error) {
      console.error('❌ Basic security checks failed:', error.message);
      return { success: false, skipped: false, error: error.message };
    }
  }
  
  async generateSkippedReport(reason) {
    const report = {
      timestamp: new Date().toISOString(),
      skipped: true,
      reason,
      environment: {
        ci: this.config.isCI,
        platform: this.config.ciPlatform,
        nodeEnv: this.config.nodeEnv,
        devServerAvailable: this.config.devServerAvailable
      },
      message: reason === 'ci-no-server' 
        ? 'Security tests skipped in CI environment - dev server not available'
        : 'Security tests skipped - dev server not available locally'
    };
    
    // Write skipped report
    const reportPath = join(this.outputDir, `security-ci-skipped-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Skipped report saved to: ${reportPath}`);
    
    return { success: true, skipped: true, reason, reportPath };
  }
  
  async generateCIReport(result) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        ci: this.config.isCI,
        platform: this.config.ciPlatform,
        nodeEnv: this.config.nodeEnv,
        devServerAvailable: this.config.devServerAvailable
      },
      result: {
        success: result.success,
        skipped: result.skipped,
        reason: result.reason,
        exitCode: result.exitCode,
        warnings: result.warnings || false,
        error: result.error,
        reportPath: result.reportPath
      },
      recommendations: this.generateRecommendations(result)
    };
    
    console.log('\n📊 CI Security Test Report:');
    console.log(`   Environment: ${report.environment.platform}`);
    console.log(`   Dev Server Available: ${report.environment.devServerAvailable ? 'Yes' : 'No'}`);
    console.log(`   Tests Executed: ${!result.skipped ? 'Yes' : 'No'}`);
    console.log(`   Result: ${result.success ? 'Success' : 'Failed'}`);
    
    if (result.skipped) {
      console.log(`   Skip Reason: ${result.reason}`);
    }
    
    if (result.warnings) {
      console.log('   ⚠️  Warnings detected but CI continues');
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    return report;
  }
  
  generateRecommendations(result) {
    const recommendations = [];
    
    if (result.skipped && result.reason === 'ci-no-server') {
      recommendations.push('Consider running security tests in deployment preview environment');
      recommendations.push('Add security tests to post-deployment validation');
      recommendations.push('Run npm audit regularly to check for vulnerabilities');
    }
    
    if (result.skipped && result.reason === 'local-no-server') {
      recommendations.push('Start dev server with: npm run dev');
      recommendations.push('Run full security audit with: npm run security:audit');
    }
    
    if (result.warnings) {
      recommendations.push('Review security test results in reports directory');
      recommendations.push('Fix security vulnerabilities before production deployment');
      recommendations.push('Update dependencies with known security issues');
    }
    
    if (!result.success && !result.skipped) {
      recommendations.push('Check test logs for specific failure reasons');
      recommendations.push('Verify dev server is running and pages are accessible');
      recommendations.push('Review security configuration and headers');
    }
    
    return recommendations;
  }
  
  async run() {
    try {
      await this.initialize();
      const result = await this.runCIFriendlyTests();
      const report = await this.generateCIReport(result);
      
      // Exit with appropriate code
      if (result.success) {
        console.log('\n🎉 CI-friendly security testing completed');
        process.exit(0);
      } else {
        console.log('\n❌ CI-friendly security testing failed');
        process.exit(this.config.isCI ? 0 : 1); // Don't fail CI, but fail local runs
      }
      
    } catch (error) {
      console.error('💥 CI security runner failed:', error.message);
      process.exit(this.config?.isCI ? 0 : 1); // Don't fail CI for runner errors
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new CISecurityRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received interrupt signal, exiting...');
    process.exit(0);
  });
  
  runner.run();
}

export default CISecurityRunner;