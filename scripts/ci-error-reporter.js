#!/usr/bin/env node

/**
 * CI Error Reporter
 * 
 * Provides standardized error reporting and recovery suggestions for CI failures.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  isCI, 
  getCIPlatform, 
  getTestEnvironmentConfig 
} from '../src/utils/test-environment.js';

class CIErrorReporter {
  constructor() {
    this.reportDir = './ci-reports';
    this.config = null;
  }
  
  async initialize() {
    this.config = await getTestEnvironmentConfig();
    
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }
  
  /**
   * Report a CI failure with context and recovery suggestions
   */
  async reportFailure(failureInfo) {
    const {
      testType,
      exitCode,
      error,
      logs,
      context = {}
    } = failureInfo;
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        ci: this.config.isCI,
        platform: this.config.ciPlatform,
        nodeEnv: this.config.nodeEnv,
        devServerAvailable: this.config.devServerAvailable
      },
      failure: {
        testType,
        exitCode,
        error: error?.message || error,
        stack: error?.stack,
        logs: logs || []
      },
      context,
      analysis: this.analyzeFailure(failureInfo),
      recommendations: this.generateRecommendations(failureInfo),
      recoveryStrategies: this.generateRecoveryStrategies(failureInfo)
    };
    
    // Save detailed report
    const reportPath = join(this.reportDir, `ci-failure-${testType}-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Log summary to console
    this.logFailureSummary(report);
    
    return report;
  }
  
  /**
   * Analyze the failure to determine likely causes
   */
  analyzeFailure(failureInfo) {
    const { testType, exitCode, error } = failureInfo;
    const analysis = {
      likelyCauses: [],
      severity: 'medium',
      category: 'unknown'
    };
    
    // Analyze based on test type
    switch (testType) {
      case 'visual-regression':
        analysis.category = 'visual-testing';
        if (!this.config.devServerAvailable) {
          analysis.likelyCauses.push('Dev server not available in CI environment');
          analysis.severity = 'low';
        }
        if (exitCode === 1) {
          analysis.likelyCauses.push('Visual differences detected');
          analysis.severity = 'medium';
        }
        break;
        
      case 'accessibility':
        analysis.category = 'accessibility-testing';
        if (!this.config.devServerAvailable) {
          analysis.likelyCauses.push('Dev server not available for accessibility scanning');
          analysis.severity = 'low';
        }
        if (exitCode === 1) {
          analysis.likelyCauses.push('Accessibility violations found');
          analysis.severity = 'high';
        }
        break;
        
      case 'security':
        analysis.category = 'security-testing';
        if (error?.message?.includes('ECONNREFUSED')) {
          analysis.likelyCauses.push('Cannot connect to application for security testing');
          analysis.severity = 'low';
        }
        if (exitCode === 1) {
          analysis.likelyCauses.push('Security vulnerabilities detected');
          analysis.severity = 'high';
        }
        break;
        
      case 'blog-images':
        analysis.category = 'functional-testing';
        if (error?.message?.includes('timeout')) {
          analysis.likelyCauses.push('Test timeout - possibly slow CI environment');
          analysis.severity = 'medium';
        }
        break;
        
      default:
        analysis.likelyCauses.push('Unknown test failure');
    }
    
    // Common CI issues
    if (this.config.isCI) {
      if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('localhost')) {
        analysis.likelyCauses.push('Service not available in CI environment');
      }
      if (error?.message?.includes('timeout')) {
        analysis.likelyCauses.push('CI environment timeout - resource constraints');
      }
    }
    
    return analysis;
  }
  
  /**
   * Generate specific recommendations based on failure type
   */
  generateRecommendations(failureInfo) {
    const { testType, exitCode } = failureInfo;
    const recommendations = [];
    
    // General CI recommendations
    if (this.config.isCI) {
      recommendations.push('Review CI logs for detailed error information');
      recommendations.push('Consider running tests locally to reproduce the issue');
    }
    
    // Test-specific recommendations
    switch (testType) {
      case 'visual-regression':
        if (!this.config.devServerAvailable) {
          recommendations.push('Visual regression tests require dev server - consider using deployment previews');
          recommendations.push('Add visual testing to post-deployment validation instead');
        } else {
          recommendations.push('Review visual differences and update baselines if changes are intentional');
          recommendations.push('Check for responsive design issues or content changes');
        }
        break;
        
      case 'accessibility':
        recommendations.push('Fix accessibility violations before merging');
        recommendations.push('Use axe-core browser extension for local testing');
        recommendations.push('Review WCAG guidelines for specific violations');
        break;
        
      case 'security':
        recommendations.push('Address security vulnerabilities immediately');
        recommendations.push('Update dependencies with known security issues');
        recommendations.push('Review security headers and configuration');
        break;
        
      case 'blog-images':
        recommendations.push('Verify blog image paths and formats are correct');
        recommendations.push('Check that image optimization is working properly');
        recommendations.push('Ensure content collections are properly configured');
        break;
    }
    
    return recommendations;
  }
  
  /**
   * Generate recovery strategies for different failure scenarios
   */
  generateRecoveryStrategies(failureInfo) {
    const { testType } = failureInfo;
    const strategies = [];
    
    // Immediate recovery strategies
    strategies.push({
      type: 'immediate',
      title: 'Skip failing tests temporarily',
      description: 'Use continue-on-error in GitHub Actions to prevent blocking deployments',
      commands: ['# Add continue-on-error: true to workflow step']
    });
    
    // Test-specific recovery strategies
    switch (testType) {
      case 'visual-regression':
        strategies.push({
          type: 'alternative',
          title: 'Use deployment preview testing',
          description: 'Run visual tests against deployed preview instead of local dev server',
          commands: [
            'npm run build',
            'npm run preview',
            'npm run test:visual'
          ]
        });
        break;
        
      case 'accessibility':
        strategies.push({
          type: 'fix',
          title: 'Run accessibility audit locally',
          description: 'Identify and fix accessibility issues in development',
          commands: [
            'npm run dev',
            'npm run a11y:audit'
          ]
        });
        break;
        
      case 'security':
        strategies.push({
          type: 'fix',
          title: 'Update vulnerable dependencies',
          description: 'Fix security vulnerabilities in dependencies',
          commands: [
            'npm audit',
            'npm audit fix',
            'npm update'
          ]
        });
        break;
    }
    
    // Long-term strategies
    strategies.push({
      type: 'improvement',
      title: 'Improve CI resilience',
      description: 'Make tests more resilient to CI environment constraints',
      commands: [
        '# Add retry logic to flaky tests',
        '# Use environment detection for conditional testing',
        '# Add proper timeout handling'
      ]
    });
    
    return strategies;
  }
  
  /**
   * Log failure summary to console
   */
  logFailureSummary(report) {
    console.log('\n🚨 CI Failure Report Summary:');
    console.log(`   Test Type: ${report.failure.testType}`);
    console.log(`   Environment: ${report.environment.platform}`);
    console.log(`   Exit Code: ${report.failure.exitCode}`);
    console.log(`   Severity: ${report.analysis.severity}`);
    
    if (report.analysis.likelyCauses.length > 0) {
      console.log('\n🔍 Likely Causes:');
      report.analysis.likelyCauses.forEach(cause => {
        console.log(`   - ${cause}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
    
    if (report.recoveryStrategies.length > 0) {
      console.log('\n🔧 Recovery Strategies:');
      report.recoveryStrategies.slice(0, 2).forEach(strategy => {
        console.log(`   - ${strategy.title}: ${strategy.description}`);
      });
    }
    
    console.log(`\n📁 Full report saved to: ${join(this.reportDir, `ci-failure-${report.failure.testType}-*.json`)}`);
  }
  
  /**
   * Generate a summary report of all CI failures
   */
  async generateSummaryReport() {
    // This would analyze all failure reports and generate trends/patterns
    console.log('📊 Generating CI failure summary report...');
    // Implementation would read all failure reports and analyze patterns
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const reporter = new CIErrorReporter();
  
  if (args.includes('--summary')) {
    reporter.initialize().then(() => {
      return reporter.generateSummaryReport();
    });
  } else {
    console.log('CI Error Reporter - Use with --summary to generate summary report');
    console.log('This utility is typically used programmatically by other test scripts');
  }
}

export default CIErrorReporter;