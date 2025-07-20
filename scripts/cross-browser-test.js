#!/usr/bin/env node

/**
 * Cross-Browser Mobile Testing Script for CI/CD
 * 
 * This script runs comprehensive cross-browser mobile tests using Puppeteer
 * with different browser engines and mobile device emulation.
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class CrossBrowserTestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4321';
    this.outputDir = options.outputDir || './cross-browser-reports';
    this.pages = options.pages || ['/'];
    this.browsers = options.browsers || ['chrome', 'firefox'];
    this.devices = options.devices || [
      'iPhone 12',
      'Pixel 5',
      'iPad Air',
      'Galaxy S21'
    ];
    this.results = [];
  }

  async run() {
    console.log('🌐 Starting cross-browser mobile test suite...');
    
    try {
      await this.setup();
      await this.runTests();
      await this.generateReports();
      
      const hasFailures = this.results.some(result => result.issues.length > 0);
      
      if (hasFailures) {
        console.error('❌ Cross-browser tests found compatibility issues');
        process.exit(1);
      } else {
        console.log('✅ All cross-browser tests passed');
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Cross-browser test suite failed:', error);
      process.exit(1);
    }
  }

  async setup() {
    console.log('🚀 Setting up cross-browser test environment...');
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async runTests() {
    console.log(`📋 Testing ${this.pages.length} pages across ${this.browsers.length} browsers and ${this.devices.length} devices...`);
    
    for (const browserName of this.browsers) {
      await this.testBrowser(browserName);
    }
  }

  async testBrowser(browserName) {
    console.log(`🔍 Testing browser: ${browserName}`);
    
    const browserConfig = this.getBrowserConfig(browserName);
    const browser = await puppeteer.launch(browserConfig);
    
    try {
      for (const device of this.devices) {
        await this.testDevice(browser, browserName, device);
      }
    } finally {
      await browser.close();
    }
  }

  getBrowserConfig(browserName) {
    const baseConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };

    switch (browserName) {
      case 'chrome':
        return {
          ...baseConfig,
          product: 'chrome'
        };
      
      case 'firefox':
        return {
          ...baseConfig,
          product: 'firefox'
        };
      
      default:
        return baseConfig;
    }
  }

  async testDevice(browser, browserName, deviceName) {
    console.log(`📱 Testing device: ${deviceName} on ${browserName}`);
    
    const page = await browser.newPage();
    
    try {
      // Emulate device
      const device = puppeteer.devices[deviceName];
      if (device) {
        await page.emulate(device);
      } else {
        // Fallback to custom mobile viewport
        await page.setViewport({
          width: 375,
          height: 667,
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2
        });
      }

      for (const pagePath of this.pages) {
        await this.testPage(page, browserName, deviceName, pagePath);
      }
    } finally {
      await page.close();
    }
  }

  async testPage(page, browserName, deviceName, pagePath) {
    const url = `${this.baseUrl}${pagePath}`;
    console.log(`🔍 Testing: ${url} on ${deviceName} (${browserName})`);
    
    try {
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for dynamic content
      await page.waitForTimeout(2000);
      
      // Inject cross-browser testing script
      const testResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Create a simplified version of our cross-browser tester
          const tester = {
            browserInfo: {
              name: navigator.userAgent.includes('Chrome') ? 'chrome' : 
                    navigator.userAgent.includes('Firefox') ? 'firefox' :
                    navigator.userAgent.includes('Safari') ? 'safari' : 'unknown',
              version: navigator.userAgent.match(/(?:Chrome|Firefox|Safari)\/(\d+)/)?.[1] || 'unknown',
              mobile: /Mobi|Android/i.test(navigator.userAgent)
            },
            deviceInfo: {
              mobile: /Mobi|Android/i.test(navigator.userAgent),
              touchDevice: 'ontouchstart' in window,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              pixelRatio: window.devicePixelRatio || 1
            },
            issues: [],
            
            runTests() {
              this.testViewport();
              this.testTouchSupport();
              this.testCSSSupport();
              this.testJavaScriptAPIs();
              this.testLayoutRendering();
              this.testFormElements();
              
              return {
                browser: this.browserInfo,
                device: this.deviceInfo,
                issues: this.issues,
                timestamp: new Date().toISOString()
              };
            },
            
            addIssue(category, message, severity) {
              this.issues.push({ category, message, severity });
            },
            
            testViewport() {
              const viewportMeta = document.querySelector('meta[name="viewport"]');
              if (!viewportMeta) {
                this.addIssue('viewport', 'Missing viewport meta tag', 'critical');
              }
            },
            
            testTouchSupport() {
              if (this.deviceInfo.mobile && !this.deviceInfo.touchDevice) {
                this.addIssue('touch', 'Touch events not supported on mobile', 'high');
              }
            },
            
            testCSSSupport() {
              const features = {
                'CSS Grid': CSS.supports('display', 'grid'),
                'CSS Flexbox': CSS.supports('display', 'flex'),
                'CSS Custom Properties': CSS.supports('color', 'var(--test)'),
                'CSS Transforms': CSS.supports('transform', 'translateX(1px)')
              };
              
              Object.entries(features).forEach(([feature, supported]) => {
                if (!supported) {
                  const severity = feature.includes('Grid') || feature.includes('Flexbox') ? 'high' : 'medium';
                  this.addIssue('css', `${feature} not supported`, severity);
                }
              });
            },
            
            testJavaScriptAPIs() {
              const apis = {
                'Fetch API': typeof fetch !== 'undefined',
                'Promise': typeof Promise !== 'undefined',
                'localStorage': typeof localStorage !== 'undefined'
              };
              
              Object.entries(apis).forEach(([api, supported]) => {
                if (!supported) {
                  this.addIssue('javascript', `${api} not supported`, 'high');
                }
              });
            },
            
            testLayoutRendering() {
              // Test if flexbox actually works
              const container = document.createElement('div');
              container.style.display = 'flex';
              container.style.position = 'absolute';
              container.style.left = '-9999px';
              document.body.appendChild(container);
              
              const computedStyle = window.getComputedStyle(container);
              if (computedStyle.display !== 'flex') {
                this.addIssue('layout', 'Flexbox rendering not working', 'high');
              }
              
              document.body.removeChild(container);
            },
            
            testFormElements() {
              const input = document.createElement('input');
              input.type = 'email';
              if (input.type !== 'email') {
                this.addIssue('forms', 'HTML5 input types not supported', 'medium');
              }
            }
          };
          
          const results = tester.runTests();
          resolve(results);
        });
      });
      
      // Add test metadata
      testResults.url = url;
      testResults.pagePath = pagePath;
      testResults.browserName = browserName;
      testResults.deviceName = deviceName;
      
      this.results.push(testResults);
      
      // Log results
      console.log(`  📊 Issues found: ${testResults.issues.length}`);
      if (testResults.issues.length > 0) {
        testResults.issues.forEach(issue => {
          console.log(`    🚨 ${issue.severity}: ${issue.message} [${issue.category}]`);
        });
      }
      
      // Take screenshot for visual comparison
      await this.takeScreenshot(page, browserName, deviceName, pagePath);
      
      // Test specific mobile interactions
      await this.testMobileInteractions(page, browserName, deviceName, pagePath);
      
    } catch (error) {
      console.error(`❌ Failed to test ${url} on ${deviceName} (${browserName}):`, error.message);
      
      this.results.push({
        url,
        pagePath,
        browserName,
        deviceName,
        error: error.message,
        issues: [{ category: 'error', message: error.message, severity: 'critical' }],
        timestamp: new Date().toISOString()
      });
    }
  }

  async takeScreenshot(page, browserName, deviceName, pagePath) {
    try {
      const screenshotDir = path.join(this.outputDir, 'screenshots');
      await fs.mkdir(screenshotDir, { recursive: true });
      
      const filename = `${browserName}-${deviceName.replace(/\s+/g, '-')}-${pagePath.replace(/\//g, '_') || 'home'}.png`;
      const screenshotPath = path.join(screenshotDir, filename);
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      console.log(`  📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.warn(`⚠️ Failed to take screenshot: ${error.message}`);
    }
  }

  async testMobileInteractions(page, browserName, deviceName, pagePath) {
    try {
      // Test touch interactions
      const touchElements = await page.$$('button, a, input, [onclick]');
      
      for (const element of touchElements.slice(0, 5)) { // Test first 5 elements
        try {
          // Test tap
          await element.tap();
          await page.waitForTimeout(100);
          
          // Test if element responds to touch
          const isVisible = await element.isIntersectingViewport();
          if (!isVisible) {
            console.log(`  ⚠️ Touch element not visible after interaction`);
          }
        } catch (error) {
          console.log(`  ⚠️ Touch interaction failed: ${error.message}`);
        }
      }
      
      // Test scroll behavior
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(500);
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      
      // Test orientation change simulation
      const currentViewport = page.viewport();
      await page.setViewport({
        ...currentViewport,
        width: currentViewport.height,
        height: currentViewport.width
      });
      await page.waitForTimeout(1000);
      
      // Restore original orientation
      await page.setViewport(currentViewport);
      
    } catch (error) {
      console.warn(`⚠️ Mobile interaction testing failed: ${error.message}`);
    }
  }

  async generateReports() {
    console.log('📊 Generating cross-browser test reports...');
    
    // Generate JSON report
    await this.generateJSONReport();
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate compatibility matrix
    await this.generateCompatibilityMatrix();
    
    // Generate summary report
    await this.generateSummaryReport();
  }

  async generateJSONReport() {
    const reportPath = path.join(this.outputDir, 'cross-browser-results.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 JSON report saved: ${reportPath}`);
  }

  async generateHTMLReport() {
    const html = this.generateHTMLContent();
    const reportPath = path.join(this.outputDir, 'cross-browser-report.html');
    await fs.writeFile(reportPath, html);
    console.log(`📄 HTML report saved: ${reportPath}`);
  }

  generateHTMLContent() {
    const totalTests = this.results.length;
    const totalIssues = this.results.reduce((sum, result) => sum + (result.issues?.length || 0), 0);
    const criticalIssues = this.results.reduce((sum, result) => 
      sum + (result.issues?.filter(i => i.severity === 'critical').length || 0), 0);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Mobile Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 0.875rem; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .warning { color: #f59e0b; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .test-result { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .test-header { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .test-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 5px; }
        .test-meta { color: #64748b; font-size: 0.875rem; }
        .test-issues { padding: 20px; }
        .issue { margin-bottom: 15px; padding: 12px; border-left: 4px solid; border-radius: 4px; }
        .issue-critical { background: #fef2f2; border-color: #ef4444; }
        .issue-high { background: #fef3c7; border-color: #f59e0b; }
        .issue-medium { background: #dbeafe; border-color: #3b82f6; }
        .issue-low { background: #f0fdf4; border-color: #10b981; }
        .no-issues { text-align: center; padding: 40px; color: #10b981; }
        .compatibility-matrix { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .matrix-table { width: 100%; border-collapse: collapse; }
        .matrix-table th, .matrix-table td { padding: 12px; text-align: center; border: 1px solid #e2e8f0; }
        .matrix-table th { background: #f8fafc; font-weight: 600; }
        .matrix-pass { background: #dcfce7; color: #166534; }
        .matrix-fail { background: #fecaca; color: #dc2626; }
        .matrix-warning { background: #fef3c7; color: #92400e; }
        .screenshot { max-width: 100%; height: auto; border-radius: 4px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Cross-Browser Mobile Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number error">${totalIssues}</div>
                <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number error">${criticalIssues}</div>
                <div class="stat-label">Critical Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.browsers.length}</div>
                <div class="stat-label">Browsers Tested</div>
            </div>
        </div>
        
        ${this.generateCompatibilityMatrixHTML()}
        
        <div class="test-grid">
            ${this.results.map(result => `
                <div class="test-result">
                    <div class="test-header">
                        <div class="test-title">${result.pagePath || '/'}</div>
                        <div class="test-meta">
                            ${result.browserName} • ${result.deviceName}
                        </div>
                    </div>
                    
                    ${result.issues && result.issues.length > 0 ? `
                        <div class="test-issues">
                            ${result.issues.map(issue => `
                                <div class="issue issue-${issue.severity}">
                                    <strong>${issue.category}:</strong> ${issue.message}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-issues">
                            ✅ No compatibility issues found!
                        </div>
                    `}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  generateCompatibilityMatrixHTML() {
    const matrix = this.generateCompatibilityMatrixData();
    
    return `
        <div class="compatibility-matrix">
            <h2>Browser Compatibility Matrix</h2>
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Page</th>
                        ${this.browsers.map(browser => 
                            this.devices.map(device => `<th>${browser}<br><small>${device}</small></th>`).join('')
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.pages.map(page => `
                        <tr>
                            <td><strong>${page}</strong></td>
                            ${this.browsers.map(browser => 
                                this.devices.map(device => {
                                    const result = this.results.find(r => 
                                        r.pagePath === page && r.browserName === browser && r.deviceName === device
                                    );
                                    const issues = result?.issues?.length || 0;
                                    const criticalIssues = result?.issues?.filter(i => i.severity === 'critical').length || 0;
                                    
                                    let className = 'matrix-pass';
                                    let content = '✅';
                                    
                                    if (criticalIssues > 0) {
                                        className = 'matrix-fail';
                                        content = `❌ ${criticalIssues}`;
                                    } else if (issues > 0) {
                                        className = 'matrix-warning';
                                        content = `⚠️ ${issues}`;
                                    }
                                    
                                    return `<td class="${className}">${content}</td>`;
                                }).join('')
                            ).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
  }

  async generateCompatibilityMatrix() {
    const matrix = this.generateCompatibilityMatrixData();
    const reportPath = path.join(this.outputDir, 'compatibility-matrix.json');
    await fs.writeFile(reportPath, JSON.stringify(matrix, null, 2));
    console.log(`📄 Compatibility matrix saved: ${reportPath}`);
  }

  generateCompatibilityMatrixData() {
    const matrix = {};
    
    this.pages.forEach(page => {
      matrix[page] = {};
      
      this.browsers.forEach(browser => {
        matrix[page][browser] = {};
        
        this.devices.forEach(device => {
          const result = this.results.find(r => 
            r.pagePath === page && r.browserName === browser && r.deviceName === device
          );
          
          matrix[page][browser][device] = {
            compatible: !result?.issues?.some(i => i.severity === 'critical'),
            issues: result?.issues?.length || 0,
            criticalIssues: result?.issues?.filter(i => i.severity === 'critical').length || 0,
            warnings: result?.issues?.filter(i => i.severity === 'medium' || i.severity === 'high').length || 0
          };
        });
      });
    });
    
    return matrix;
  }

  async generateSummaryReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      totalIssues: this.results.reduce((sum, result) => sum + (result.issues?.length || 0), 0),
      criticalIssues: this.results.reduce((sum, result) => 
        sum + (result.issues?.filter(i => i.severity === 'critical').length || 0), 0),
      browsers: this.browsers,
      devices: this.devices,
      pages: this.pages,
      compatibilityScore: this.calculateOverallCompatibilityScore(),
      issuesByCategory: this.getIssuesByCategory(),
      issuesBySeverity: this.getIssuesBySeverity(),
      browserCompatibility: this.getBrowserCompatibilityScores()
    };
    
    const reportPath = path.join(this.outputDir, 'cross-browser-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary report saved: ${reportPath}`);
    
    // Log summary to console
    console.log('\n📊 Cross-Browser Test Summary:');
    console.log(`   Total tests: ${summary.totalTests}`);
    console.log(`   Total issues: ${summary.totalIssues}`);
    console.log(`   Critical issues: ${summary.criticalIssues}`);
    console.log(`   Compatibility score: ${summary.compatibilityScore.toFixed(1)}%`);
    
    if (Object.keys(summary.issuesBySeverity).length > 0) {
      console.log('\n🎯 Issues by severity:');
      Object.entries(summary.issuesBySeverity).forEach(([severity, count]) => {
        console.log(`   ${severity}: ${count}`);
      });
    }
    
    console.log('\n🌐 Browser compatibility scores:');
    Object.entries(summary.browserCompatibility).forEach(([browser, score]) => {
      console.log(`   ${browser}: ${score.toFixed(1)}%`);
    });
  }

  calculateOverallCompatibilityScore() {
    const totalTests = this.results.length;
    if (totalTests === 0) return 100;
    
    const successfulTests = this.results.filter(result => 
      !result.issues?.some(i => i.severity === 'critical')
    ).length;
    
    return (successfulTests / totalTests) * 100;
  }

  getIssuesByCategory() {
    const categories = {};
    
    this.results.forEach(result => {
      result.issues?.forEach(issue => {
        categories[issue.category] = (categories[issue.category] || 0) + 1;
      });
    });
    
    return categories;
  }

  getIssuesBySeverity() {
    const severities = {};
    
    this.results.forEach(result => {
      result.issues?.forEach(issue => {
        severities[issue.severity] = (severities[issue.severity] || 0) + 1;
      });
    });
    
    return severities;
  }

  getBrowserCompatibilityScores() {
    const scores = {};
    
    this.browsers.forEach(browser => {
      const browserResults = this.results.filter(r => r.browserName === browser);
      const totalTests = browserResults.length;
      
      if (totalTests === 0) {
        scores[browser] = 100;
        return;
      }
      
      const successfulTests = browserResults.filter(result => 
        !result.issues?.some(i => i.severity === 'critical')
      ).length;
      
      scores[browser] = (successfulTests / totalTests) * 100;
    });
    
    return scores;
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
      case 'browsers':
        options.browsers = value.split(',');
        break;
      case 'devices':
        options.devices = value.split(',');
        break;
    }
  }
  
  const runner = new CrossBrowserTestRunner(options);
  runner.run();
}

module.exports = CrossBrowserTestRunner;