#!/usr/bin/env node

/**
 * Accessibility Testing Script
 * Tests the website for WCAG compliance using axe-core and Puppeteer
 */

import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:4321',
  pages: ['/', '/blog', '/events'],
  outputDir: './accessibility-reports',
  timeout: 30000,
  viewport: { width: 1280, height: 720 }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'baseUrl':
          config.baseUrl = value;
          break;
        case 'pages':
          config.pages = value.split(',');
          break;
        case 'outputDir':
          config.outputDir = value;
          break;
        case 'timeout':
          config.timeout = parseInt(value);
          break;
      }
    }
  }
  
  return config;
}

// Create output directory
async function ensureOutputDir(outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create output directory: ${error.message}`);
    process.exit(1);
  }
}

// Test a single page for accessibility
async function testPageAccessibility(page, url, config) {
  console.log(`Testing accessibility for: ${url}`);
  
  try {
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: config.timeout 
    });
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Run axe accessibility tests
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    return {
      url,
      timestamp: new Date().toISOString(),
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      summary: {
        violationCount: results.violations.length,
        passCount: results.passes.length,
        incompleteCount: results.incomplete.length,
        inapplicableCount: results.inapplicable.length
      }
    };
  } catch (error) {
    console.error(`Error testing ${url}: ${error.message}`);
    return {
      url,
      timestamp: new Date().toISOString(),
      error: error.message,
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
      summary: {
        violationCount: 0,
        passCount: 0,
        incompleteCount: 0,
        inapplicableCount: 0
      }
    };
  }
}

// Generate HTML report
function generateHTMLReport(results, config) {
  const totalViolations = results.reduce((sum, result) => sum + result.summary.violationCount, 0);
  const totalPasses = results.reduce((sum, result) => sum + result.summary.passCount, 0);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba; }
        .metric.error { border-left-color: #d63384; }
        .metric.success { border-left-color: #198754; }
        .metric.warning { border-left-color: #fd7e14; }
        .page-result { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; }
        .page-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .violations { padding: 15px; }
        .violation { margin-bottom: 20px; padding: 15px; background: #fff5f5; border-left: 4px solid #d63384; }
        .violation-title { font-weight: bold; color: #d63384; margin-bottom: 10px; }
        .violation-description { margin-bottom: 10px; }
        .violation-help { font-size: 0.9em; color: #666; }
        .no-violations { padding: 15px; color: #198754; font-weight: bold; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Test Report</h1>
        <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
        <p>Base URL: ${config.baseUrl}</p>
        <p>Pages tested: ${config.pages.length}</p>
    </div>
    
    <div class="summary">
        <div class="metric ${totalViolations > 0 ? 'error' : 'success'}">
            <h3>Total Violations</h3>
            <div style="font-size: 2em; font-weight: bold;">${totalViolations}</div>
        </div>
        <div class="metric success">
            <h3>Total Passes</h3>
            <div style="font-size: 2em; font-weight: bold;">${totalPasses}</div>
        </div>
        <div class="metric">
            <h3>Pages Tested</h3>
            <div style="font-size: 2em; font-weight: bold;">${results.length}</div>
        </div>
    </div>
    
    ${results.map(result => `
        <div class="page-result">
            <div class="page-header">
                <h2>${result.url}</h2>
                <p>Violations: ${result.summary.violationCount} | Passes: ${result.summary.passCount}</p>
            </div>
            <div class="violations">
                ${result.violations.length === 0 ? 
                    '<div class="no-violations">✅ No accessibility violations found!</div>' :
                    result.violations.map(violation => `
                        <div class="violation">
                            <div class="violation-title">${violation.id}: ${violation.description}</div>
                            <div class="violation-description">${violation.help}</div>
                            <div class="violation-help">
                                Impact: ${violation.impact} | 
                                Elements affected: ${violation.nodes.length}
                                ${violation.helpUrl ? ` | <a href="${violation.helpUrl}" target="_blank">Learn more</a>` : ''}
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `).join('')}
</body>
</html>`;
  
  return html;
}

// Main test function
async function runAccessibilityTests() {
  const config = parseArgs();
  
  console.log('🔍 Starting accessibility tests...');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Pages: ${config.pages.join(', ')}`);
  console.log(`Output: ${config.outputDir}`);
  
  // Ensure output directory exists
  await ensureOutputDir(config.outputDir);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport(config.viewport);
    
    // Test each page
    const results = [];
    for (const pagePath of config.pages) {
      const url = `${config.baseUrl}${pagePath}`;
      const result = await testPageAccessibility(page, url, config);
      results.push(result);
    }
    
    // Generate reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      config,
      results,
      summary: {
        totalPages: results.length,
        totalViolations: results.reduce((sum, r) => sum + r.summary.violationCount, 0),
        totalPasses: results.reduce((sum, r) => sum + r.summary.passCount, 0),
        pagesWithViolations: results.filter(r => r.summary.violationCount > 0).length
      }
    };
    
    await fs.writeFile(
      path.join(config.outputDir, `accessibility-report-${timestamp}.json`),
      JSON.stringify(jsonReport, null, 2)
    );
    
    // HTML report
    const htmlReport = generateHTMLReport(results, config);
    await fs.writeFile(
      path.join(config.outputDir, `accessibility-report-${timestamp}.html`),
      htmlReport
    );
    
    // Console summary
    console.log('\n📊 Accessibility Test Summary:');
    console.log(`Total pages tested: ${results.length}`);
    console.log(`Total violations: ${jsonReport.summary.totalViolations}`);
    console.log(`Total passes: ${jsonReport.summary.totalPasses}`);
    console.log(`Pages with violations: ${jsonReport.summary.pagesWithViolations}`);
    
    // Detailed results
    results.forEach(result => {
      console.log(`\n📄 ${result.url}:`);
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        console.log(`  ✅ Passes: ${result.summary.passCount}`);
        if (result.summary.violationCount > 0) {
          console.log(`  ❌ Violations: ${result.summary.violationCount}`);
          result.violations.forEach(violation => {
            console.log(`    - ${violation.id}: ${violation.description} (${violation.impact} impact)`);
          });
        }
      }
    });
    
    console.log(`\n📁 Reports saved to: ${config.outputDir}`);
    
    // Exit with error code if violations found
    if (jsonReport.summary.totalViolations > 0) {
      console.log('\n❌ Accessibility violations found. Please review and fix the issues.');
      process.exit(1);
    } else {
      console.log('\n✅ All accessibility tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runAccessibilityTests().catch(error => {
  console.error('❌ Failed to run accessibility tests:', error.message);
  process.exit(1);
});