#!/usr/bin/env node

/**
 * Security Testing Script
 * 
 * This script runs comprehensive security tests including:
 * - XSS vulnerability testing
 * - SQL injection testing
 * - CSRF protection testing
 * - Security header validation
 * - Input sanitization testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SecurityTestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4321';
    this.outputDir = options.outputDir || './security-reports';
    this.pages = options.pages || ['/'];
    this.testSuites = options.testSuites || [
      'headers',
      'xss',
      'csrf',
      'input-validation',
      'content-security'
    ];
    this.results = [];
  }

  async run() {
    console.log('🔒 Starting security test suite...');
    
    try {
      await this.setup();
      await this.runTests();
      await this.generateReports();
      
      const hasVulnerabilities = this.results.some(result => 
        result.vulnerabilities && result.vulnerabilities.length > 0
      );
      
      if (hasVulnerabilities) {
        console.error('❌ Security vulnerabilities found');
        process.exit(1);
      } else {
        console.log('✅ No security vulnerabilities detected');
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Security test suite failed:', error);
      process.exit(1);
    }
  }

  async setup() {
    console.log('🚀 Setting up security test environment...');
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async runTests() {
    console.log(`🔍 Running security tests on ${this.pages.length} pages...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    try {
      for (const pagePath of this.pages) {
        await this.testPage(browser, pagePath);
      }
    } finally {
      await browser.close();
    }
  }

  async testPage(browser, pagePath) {
    const url = `${this.baseUrl}${pagePath}`;
    console.log(`🔍 Testing: ${url}`);
    
    const page = await browser.newPage();
    
    try {
      // Set up security event monitoring
      const securityEvents = [];
      
      page.on('console', (msg) => {
        if (msg.text().includes('Security Event')) {
          securityEvents.push(msg.text());
        }
      });
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for security enhancements to load
      await page.waitForTimeout(2000);
      
      const testResult = {
        url,
        pagePath,
        timestamp: new Date().toISOString(),
        vulnerabilities: [],
        securityEvents,
        testResults: {}
      };

      // Run test suites
      for (const suite of this.testSuites) {
        console.log(`  🧪 Running ${suite} tests...`);
        testResult.testResults[suite] = await this.runTestSuite(page, suite);
      }
      
      // Collect vulnerabilities
      Object.values(testResult.testResults).forEach(suiteResult => {
        if (suiteResult.vulnerabilities) {
          testResult.vulnerabilities.push(...suiteResult.vulnerabilities);
        }
      });
      
      this.results.push(testResult);
      
      console.log(`  📊 Found ${testResult.vulnerabilities.length} vulnerabilities`);
      
    } finally {
      await page.close();
    }
  }

  async runTestSuite(page, suite) {
    switch (suite) {
      case 'headers':
        return await this.testSecurityHeaders(page);
      case 'xss':
        return await this.testXSSProtection(page);
      case 'csrf':
        return await this.testCSRFProtection(page);
      case 'input-validation':
        return await this.testInputValidation(page);
      case 'content-security':
        return await this.testContentSecurity(page);
      default:
        return { passed: false, error: `Unknown test suite: ${suite}` };
    }
  }

  async testSecurityHeaders(page) {
    try {
      const response = await page.goto(page.url(), { waitUntil: 'networkidle0' });
      const headers = response.headers();
      
      const requiredHeaders = {
        'x-xss-protection': '1; mode=block',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin'
      };
      
      const vulnerabilities = [];
      const results = {};
      
      Object.entries(requiredHeaders).forEach(([header, expectedValue]) => {
        const actualValue = headers[header];
        results[header] = {
          present: !!actualValue,
          value: actualValue,
          expected: expectedValue,
          correct: actualValue === expectedValue
        };
        
        if (!actualValue) {
          vulnerabilities.push({
            type: 'missing-security-header',
            severity: 'medium',
            description: `Missing security header: ${header}`,
            recommendation: `Add ${header}: ${expectedValue} header`
          });
        } else if (actualValue !== expectedValue) {
          vulnerabilities.push({
            type: 'incorrect-security-header',
            severity: 'low',
            description: `Incorrect security header value for ${header}`,
            actual: actualValue,
            expected: expectedValue,
            recommendation: `Update ${header} header to: ${expectedValue}`
          });
        }
      });
      
      // Check for HTTPS
      if (!page.url().startsWith('https://')) {
        vulnerabilities.push({
          type: 'insecure-protocol',
          severity: 'high',
          description: 'Site not served over HTTPS',
          recommendation: 'Implement HTTPS with proper SSL/TLS certificate'
        });
      }
      
      return {
        passed: vulnerabilities.length === 0,
        vulnerabilities,
        results,
        headers: headers
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        vulnerabilities: [{
          type: 'test-error',
          severity: 'high',
          description: `Failed to test security headers: ${error.message}`
        }]
      };
    }
  }

  async testXSSProtection(page) {
    try {
      const vulnerabilities = [];
      const testCases = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '\';alert("XSS");//',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];
      
      // Test XSS in form inputs
      const forms = await page.$$('form');
      
      for (const form of forms) {
        const inputs = await form.$$('input[type="text"], input[type="email"], textarea');
        
        for (const input of inputs) {
          for (const testCase of testCases) {
            try {
              await input.clear();
              await input.type(testCase);
              
              // Check if the malicious content was sanitized
              const value = await input.evaluate(el => el.value);
              
              if (value === testCase) {
                vulnerabilities.push({
                  type: 'xss-vulnerability',
                  severity: 'high',
                  description: 'Input field vulnerable to XSS injection',
                  payload: testCase,
                  element: await input.evaluate(el => el.outerHTML),
                  recommendation: 'Implement proper input sanitization'
                });
              }
            } catch (error) {
              // Input sanitization might throw errors, which is good
            }
          }
        }
      }
      
      // Test XSS in URL parameters
      const currentUrl = page.url();
      for (const testCase of testCases) {
        try {
          const testUrl = `${currentUrl}?test=${encodeURIComponent(testCase)}`;
          await page.goto(testUrl, { waitUntil: 'networkidle0' });
          
          // Check if XSS payload is reflected in the page
          const pageContent = await page.content();
          if (pageContent.includes(testCase)) {
            vulnerabilities.push({
              type: 'reflected-xss',
              severity: 'high',
              description: 'URL parameter vulnerable to reflected XSS',
              payload: testCase,
              recommendation: 'Sanitize URL parameters before rendering'
            });
          }
        } catch (error) {
          // Navigation errors might indicate protection
        }
      }
      
      return {
        passed: vulnerabilities.length === 0,
        vulnerabilities,
        testCases: testCases.length,
        formstested: forms.length
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        vulnerabilities: [{
          type: 'test-error',
          severity: 'medium',
          description: `Failed to test XSS protection: ${error.message}`
        }]
      };
    }
  }

  async testCSRFProtection(page) {
    try {
      const vulnerabilities = [];
      const forms = await page.$$('form');
      
      for (const form of forms) {
        // Check for CSRF token
        const csrfToken = await form.$('input[name="csrf_token"]');
        
        if (!csrfToken) {
          const action = await form.evaluate(el => el.action || 'unknown');
          vulnerabilities.push({
            type: 'missing-csrf-token',
            severity: 'high',
            description: 'Form missing CSRF protection token',
            form: action,
            recommendation: 'Add CSRF token to all forms'
          });
        } else {
          // Check if token has a value
          const tokenValue = await csrfToken.evaluate(el => el.value);
          if (!tokenValue || tokenValue.length < 16) {
            vulnerabilities.push({
              type: 'weak-csrf-token',
              severity: 'medium',
              description: 'CSRF token is empty or too short',
              recommendation: 'Generate strong, random CSRF tokens'
            });
          }
        }
      }
      
      return {
        passed: vulnerabilities.length === 0,
        vulnerabilities,
        formsChecked: forms.length
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        vulnerabilities: [{
          type: 'test-error',
          severity: 'medium',
          description: `Failed to test CSRF protection: ${error.message}`
        }]
      };
    }
  }

  async testInputValidation(page) {
    try {
      const vulnerabilities = [];
      const testPayloads = {
        sql: [
          "'; DROP TABLE users; --",
          "1' OR '1'='1",
          "UNION SELECT * FROM users",
          "'; INSERT INTO users VALUES ('hacker', 'password'); --"
        ],
        command: [
          "; cat /etc/passwd",
          "| whoami",
          "&& rm -rf /",
          "`id`"
        ],
        pathTraversal: [
          "../../../etc/passwd",
          "..\\..\\..\\windows\\system32\\config\\sam",
          "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
        ]
      };
      
      const forms = await page.$$('form');
      
      for (const form of forms) {
        const inputs = await form.$$('input[type="text"], input[type="email"], textarea');
        
        for (const input of inputs) {
          const inputName = await input.evaluate(el => el.name || el.id || 'unknown');
          
          // Test each payload type
          Object.entries(testPayloads).forEach(async ([type, payloads]) => {
            for (const payload of payloads) {
              try {
                await input.clear();
                await input.type(payload);
                
                const value = await input.evaluate(el => el.value);
                
                // If the payload wasn't sanitized, it's a vulnerability
                if (value === payload) {
                  vulnerabilities.push({
                    type: `${type}-injection-vulnerability`,
                    severity: type === 'sql' ? 'critical' : 'high',
                    description: `Input field vulnerable to ${type} injection`,
                    field: inputName,
                    payload: payload,
                    recommendation: `Implement proper input validation and sanitization for ${type} injection`
                  });
                }
              } catch (error) {
                // Errors might indicate good sanitization
              }
            }
          });
        }
      }
      
      return {
        passed: vulnerabilities.length === 0,
        vulnerabilities,
        inputsChecked: forms.reduce(async (total, form) => {
          const inputs = await form.$$('input[type="text"], input[type="email"], textarea');
          return total + inputs.length;
        }, 0)
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        vulnerabilities: [{
          type: 'test-error',
          severity: 'medium',
          description: `Failed to test input validation: ${error.message}`
        }]
      };
    }
  }

  async testContentSecurity(page) {
    try {
      const vulnerabilities = [];
      
      // Check for mixed content
      if (page.url().startsWith('https://')) {
        const httpResources = await page.$$eval('[src], [href]', elements => {
          return elements
            .map(el => el.src || el.href)
            .filter(url => url && url.startsWith('http://'));
        });
        
        if (httpResources.length > 0) {
          vulnerabilities.push({
            type: 'mixed-content',
            severity: 'medium',
            description: 'HTTP resources loaded on HTTPS page',
            resources: httpResources,
            recommendation: 'Update all resources to use HTTPS'
          });
        }
      }
      
      // Check for inline scripts
      const inlineScripts = await page.$$eval('script:not([src])', scripts => {
        return scripts.map(script => script.innerHTML).filter(content => content.trim());
      });
      
      if (inlineScripts.length > 0) {
        vulnerabilities.push({
          type: 'inline-scripts',
          severity: 'low',
          description: 'Inline scripts detected (CSP concern)',
          count: inlineScripts.length,
          recommendation: 'Move scripts to external files or use CSP nonces'
        });
      }
      
      // Check for external scripts from untrusted domains
      const externalScripts = await page.$$eval('script[src]', scripts => {
        return scripts.map(script => script.src);
      });
      
      const trustedDomains = [
        'unpkg.com',
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
        'www.google-analytics.com'
      ];
      
      const untrustedScripts = externalScripts.filter(src => {
        try {
          const url = new URL(src);
          return !trustedDomains.some(domain => 
            url.hostname === domain || url.hostname.endsWith('.' + domain)
          );
        } catch (e) {
          return true;
        }
      });
      
      if (untrustedScripts.length > 0) {
        vulnerabilities.push({
          type: 'untrusted-external-scripts',
          severity: 'medium',
          description: 'Scripts loaded from untrusted domains',
          scripts: untrustedScripts,
          recommendation: 'Review and whitelist trusted script sources'
        });
      }
      
      return {
        passed: vulnerabilities.length === 0,
        vulnerabilities,
        inlineScripts: inlineScripts.length,
        externalScripts: externalScripts.length
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        vulnerabilities: [{
          type: 'test-error',
          severity: 'medium',
          description: `Failed to test content security: ${error.message}`
        }]
      };
    }
  }

  async generateReports() {
    console.log('📊 Generating security reports...');
    
    // Generate JSON report
    await this.generateJSONReport();
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate summary report
    await this.generateSummaryReport();
  }

  async generateJSONReport() {
    const reportPath = path.join(this.outputDir, 'security-results.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 JSON report saved: ${reportPath}`);
  }

  async generateHTMLReport() {
    const html = this.generateHTMLContent();
    const reportPath = path.join(this.outputDir, 'security-report.html');
    await fs.writeFile(reportPath, html);
    console.log(`📄 HTML report saved: ${reportPath}`);
  }

  generateHTMLContent() {
    const totalVulnerabilities = this.results.reduce((sum, result) => 
      sum + (result.vulnerabilities?.length || 0), 0);
    const criticalVulns = this.results.reduce((sum, result) => 
      sum + (result.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0);
    const highVulns = this.results.reduce((sum, result) => 
      sum + (result.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 0.875rem; }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #d97706; }
        .low { color: #059669; }
        .success { color: #10b981; }
        .vulnerability { margin-bottom: 20px; padding: 15px; border-left: 4px solid; border-radius: 4px; }
        .vulnerability-critical { background: #fef2f2; border-color: #dc2626; }
        .vulnerability-high { background: #fff7ed; border-color: #ea580c; }
        .vulnerability-medium { background: #fffbeb; border-color: #d97706; }
        .vulnerability-low { background: #f0fdf4; border-color: #059669; }
        .vulnerability-title { font-weight: 600; margin-bottom: 5px; }
        .vulnerability-description { margin-bottom: 10px; }
        .vulnerability-recommendation { font-style: italic; color: #64748b; }
        .test-results { background: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-header { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .test-content { padding: 20px; }
        .no-vulnerabilities { text-align: center; padding: 40px; color: #10b981; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number ${totalVulnerabilities === 0 ? 'success' : 'critical'}">${totalVulnerabilities}</div>
                <div class="stat-label">Total Vulnerabilities</div>
            </div>
            <div class="stat-card">
                <div class="stat-number critical">${criticalVulns}</div>
                <div class="stat-label">Critical</div>
            </div>
            <div class="stat-card">
                <div class="stat-number high">${highVulns}</div>
                <div class="stat-label">High Risk</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.results.length}</div>
                <div class="stat-label">Pages Tested</div>
            </div>
        </div>
        
        ${this.results.map(result => `
            <div class="test-results">
                <div class="test-header">
                    <h2>${result.pagePath}</h2>
                    <p>${result.url}</p>
                </div>
                <div class="test-content">
                    ${result.vulnerabilities.length > 0 ? `
                        ${result.vulnerabilities.map(vuln => `
                            <div class="vulnerability vulnerability-${vuln.severity}">
                                <div class="vulnerability-title">${vuln.type}: ${vuln.description}</div>
                                ${vuln.recommendation ? `<div class="vulnerability-recommendation">Recommendation: ${vuln.recommendation}</div>` : ''}
                            </div>
                        `).join('')}
                    ` : `
                        <div class="no-vulnerabilities">
                            ✅ No security vulnerabilities found!
                        </div>
                    `}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  async generateSummaryReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      totalPages: this.results.length,
      totalVulnerabilities: this.results.reduce((sum, result) => 
        sum + (result.vulnerabilities?.length || 0), 0),
      vulnerabilitiesBySeverity: this.getVulnerabilitiesBySeverity(),
      vulnerabilitiesByType: this.getVulnerabilitiesByType(),
      testSuites: this.testSuites,
      pages: this.results.map(result => ({
        path: result.pagePath,
        url: result.url,
        vulnerabilities: result.vulnerabilities?.length || 0,
        passed: (result.vulnerabilities?.length || 0) === 0
      }))
    };
    
    const reportPath = path.join(this.outputDir, 'security-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary report saved: ${reportPath}`);
    
    // Log summary to console
    console.log('\n📊 Security Test Summary:');
    console.log(`   Pages tested: ${summary.totalPages}`);
    console.log(`   Total vulnerabilities: ${summary.totalVulnerabilities}`);
    
    if (Object.keys(summary.vulnerabilitiesBySeverity).length > 0) {
      console.log('\n🎯 Vulnerabilities by severity:');
      Object.entries(summary.vulnerabilitiesBySeverity).forEach(([severity, count]) => {
        console.log(`   ${severity}: ${count}`);
      });
    }
  }

  getVulnerabilitiesBySeverity() {
    const severities = {};
    
    this.results.forEach(result => {
      result.vulnerabilities?.forEach(vuln => {
        severities[vuln.severity] = (severities[vuln.severity] || 0) + 1;
      });
    });
    
    return severities;
  }

  getVulnerabilitiesByType() {
    const types = {};
    
    this.results.forEach(result => {
      result.vulnerabilities?.forEach(vuln => {
        types[vuln.type] = (types[vuln.type] || 0) + 1;
      });
    });
    
    return types;
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
      case 'testSuites':
        options.testSuites = value.split(',');
        break;
    }
  }
  
  const runner = new SecurityTestRunner(options);
  runner.run();
}

module.exports = SecurityTestRunner;