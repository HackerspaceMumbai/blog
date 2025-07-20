#!/usr/bin/env node

/**
 * Accessibility Testing Script for CI/CD
 * 
 * This script runs comprehensive accessibility tests using axe-core
 * and generates reports for continuous integration.
 */

const puppeteer = require('puppeteer');
const axeCore = require('axe-core');
const fs = require('fs').promises;
const path = require('path');

class AccessibilityTestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4321';
    this.outputDir = options.outputDir || './accessibility-reports';
    this.pages = options.pages || ['/'];
    this.browser = null;
    this.results = [];
  }

  async run() {
    console.log('🔍 Starting accessibility test suite...');
    
    try {
      await this.setup();
      await this.runTests();
      await this.generateReports();
      await this.cleanup();
      
      const hasViolations = this.results.some(result => result.violations.length > 0);
      
      if (hasViolations) {
        console.error('❌ Accessibility tests failed with violations');
        process.exit(1);
      } else {
        console.log('✅ All accessibility tests passed');
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Accessibility test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async setup() {
    console.log('🚀 Setting up test environment...');
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }

  async runTests() {
    console.log(`📋 Testing ${this.pages.length} pages...`);
    
    for (const pagePath of this.pages) {
      await this.testPage(pagePath);
    }
  }

  async testPage(pagePath) {
    const url = `${this.baseUrl}${pagePath}`;
    console.log(`🔍 Testing: ${url}`);
    
    const page = await this.browser.newPage();
    
    try {
      // Configure page
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for dynamic content
      await page.waitForTimeout(2000);
      
      // Inject axe-core
      await page.addScriptTag({
        path: require.resolve('axe-core/axe.min.js')
      });
      
      // Run axe tests
      const results = await page.evaluate(async () => {
        return await axe.run(document, {
          rules: {
            // Configure rules
            'color-contrast': { enabled: true },
            'color-contrast-enhanced': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'tabindex': { enabled: true },
            'aria-allowed-attr': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'image-alt': { enabled: true },
            'label': { enabled: true },
            'heading-order': { enabled: true },
            'link-name': { enabled: true },
            'page-has-heading-one': { enabled: true },
            'landmark-one-main': { enabled: true }
          },
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
        });
      });
      
      // Add page info to results
      results.url = url;
      results.pagePath = pagePath;
      results.timestamp = new Date().toISOString();
      
      this.results.push(results);
      
      // Log summary
      console.log(`  ✅ Passed: ${results.passes.length}`);
      console.log(`  ❌ Violations: ${results.violations.length}`);
      console.log(`  ⚠️ Incomplete: ${results.incomplete.length}`);
      
      // Log violations
      if (results.violations.length > 0) {
        console.log('  🚨 Violations found:');
        results.violations.forEach(violation => {
          console.log(`    - ${violation.id}: ${violation.description}`);
          console.log(`      Impact: ${violation.impact}, Nodes: ${violation.nodes.length}`);
        });
      }
      
    } finally {
      await page.close();
    }
  }

  async generateReports() {
    console.log('📊 Generating accessibility reports...');
    
    // Generate JSON report
    await this.generateJSONReport();
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate JUnit XML report (for CI/CD)
    await this.generateJUnitReport();
    
    // Generate summary report
    await this.generateSummaryReport();
  }

  async generateJSONReport() {
    const reportPath = path.join(this.outputDir, 'accessibility-results.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 JSON report saved: ${reportPath}`);
  }

  async generateHTMLReport() {
    const html = this.generateHTMLContent();
    const reportPath = path.join(this.outputDir, 'accessibility-report.html');
    await fs.writeFile(reportPath, html);
    console.log(`📄 HTML report saved: ${reportPath}`);
  }

  generateHTMLContent() {
    const totalViolations = this.results.reduce((sum, result) => sum + result.violations.length, 0);
    const totalPasses = this.results.reduce((sum, result) => sum + result.passes.length, 0);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 0.875rem; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .warning { color: #f59e0b; }
        .page-results { background: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .page-header { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .page-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 5px; }
        .page-url { color: #64748b; font-size: 0.875rem; }
        .violations { padding: 20px; }
        .violation { margin-bottom: 20px; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; }
        .violation-title { font-weight: 600; color: #dc2626; margin-bottom: 5px; }
        .violation-description { color: #374151; margin-bottom: 10px; }
        .violation-impact { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .impact-critical { background: #fee2e2; color: #dc2626; }
        .impact-serious { background: #fed7aa; color: #ea580c; }
        .impact-moderate { background: #fef3c7; color: #d97706; }
        .impact-minor { background: #dbeafe; color: #2563eb; }
        .nodes { margin-top: 10px; }
        .node { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 0.875rem; }
        .no-violations { text-align: center; padding: 40px; color: #10b981; }
        .timestamp { color: #64748b; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Accessibility Test Report</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number success">${totalPasses}</div>
                <div class="stat-label">Passed Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number error">${totalViolations}</div>
                <div class="stat-label">Violations</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.results.length}</div>
                <div class="stat-label">Pages Tested</div>
            </div>
        </div>
        
        ${this.results.map(result => `
            <div class="page-results">
                <div class="page-header">
                    <div class="page-title">${result.pagePath}</div>
                    <div class="page-url">${result.url}</div>
                </div>
                
                ${result.violations.length > 0 ? `
                    <div class="violations">
                        ${result.violations.map(violation => `
                            <div class="violation">
                                <div class="violation-title">${violation.id}</div>
                                <div class="violation-description">${violation.description}</div>
                                <span class="violation-impact impact-${violation.impact}">${violation.impact}</span>
                                <div class="nodes">
                                    ${violation.nodes.map(node => `
                                        <div class="node">
                                            <strong>Target:</strong> ${node.target.join(', ')}<br>
                                            <strong>HTML:</strong> ${node.html}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-violations">
                        ✅ No accessibility violations found!
                    </div>
                `}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  async generateJUnitReport() {
    const xml = this.generateJUnitXML();
    const reportPath = path.join(this.outputDir, 'accessibility-junit.xml');
    await fs.writeFile(reportPath, xml);
    console.log(`📄 JUnit report saved: ${reportPath}`);
  }

  generateJUnitXML() {
    const totalTests = this.results.length;
    const failures = this.results.filter(result => result.violations.length > 0).length;
    
    const testCases = this.results.map(result => {
      const hasViolations = result.violations.length > 0;
      
      return `
        <testcase name="${result.pagePath}" classname="AccessibilityTest" time="0">
          ${hasViolations ? `
            <failure message="Accessibility violations found">
              ${result.violations.map(v => `${v.id}: ${v.description} (${v.nodes.length} nodes)`).join('\n')}
            </failure>
          ` : ''}
        </testcase>
      `;
    }).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Accessibility Tests" tests="${totalTests}" failures="${failures}" time="0">
  ${testCases}
</testsuite>`;
  }

  async generateSummaryReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      totalPages: this.results.length,
      totalViolations: this.results.reduce((sum, result) => sum + result.violations.length, 0),
      totalPasses: this.results.reduce((sum, result) => sum + result.passes.length, 0),
      pages: this.results.map(result => ({
        path: result.pagePath,
        url: result.url,
        violations: result.violations.length,
        passes: result.passes.length,
        incomplete: result.incomplete.length
      })),
      violationsByType: this.getViolationsByType(),
      violationsByImpact: this.getViolationsByImpact()
    };
    
    const reportPath = path.join(this.outputDir, 'accessibility-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary report saved: ${reportPath}`);
    
    // Also log summary to console
    console.log('\n📊 Test Summary:');
    console.log(`   Pages tested: ${summary.totalPages}`);
    console.log(`   Total violations: ${summary.totalViolations}`);
    console.log(`   Total passes: ${summary.totalPasses}`);
    
    if (Object.keys(summary.violationsByImpact).length > 0) {
      console.log('\n🎯 Violations by impact:');
      Object.entries(summary.violationsByImpact).forEach(([impact, count]) => {
        console.log(`   ${impact}: ${count}`);
      });
    }
  }

  getViolationsByType() {
    const violations = {};
    
    this.results.forEach(result => {
      result.violations.forEach(violation => {
        violations[violation.id] = (violations[violation.id] || 0) + 1;
      });
    });
    
    return violations;
  }

  getViolationsByImpact() {
    const impacts = {};
    
    this.results.forEach(result => {
      result.violations.forEach(violation => {
        impacts[violation.impact] = (impacts[violation.impact] || 0) + 1;
      });
    });
    
    return impacts;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'baseUrl':
        options.baseUrl = value;
        break;
      case 'outputDir':
        options.outputDir = value;
        break;
      case 'pages':
        options.pages = value.split(',');
        break;
    }
  }
  
  const runner = new AccessibilityTestRunner(options);
  runner.run();
}

module.exports = AccessibilityTestRunner;