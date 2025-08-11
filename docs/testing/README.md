# Testing Procedures and Best Practices

This document outlines comprehensive testing procedures and best practices for the Hackerspace Mumbai website, covering accessibility, performance, security, and cross-browser compatibility.

## 📋 Table of Contents

- [Testing Overview](#testing-overview)
- [Accessibility Testing](#accessibility-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Mobile Testing](#mobile-testing)
- [Automated Testing](#automated-testing)
- [Manual Testing](#manual-testing)

## 🎯 Testing Overview

### Testing Philosophy

Our testing approach follows a comprehensive strategy:

1. **Shift-Left Testing**: Test early and often in the development process
2. **Multi-Layer Testing**: Unit, integration, and end-to-end testing
3. **Accessibility First**: Every feature tested for accessibility compliance
4. **Performance Focused**: Continuous performance monitoring and testing
5. **Security Minded**: Regular security audits and vulnerability testing
6. **Real-World Testing**: Testing on actual devices and networks

### Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  Unit Tests (Many)
```

## 🛠️ Built-in Development Testing Tools

When you run `pnpm run dev`, the development server includes integrated testing tools visible in your browser:

### Accessibility Tester

**Location**: Left sidebar panel in development mode (Performance section)

**Features**:
- Real-time accessibility audit results
- WCAG compliance checking  
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility checks

**How to Toggle**:
- The accessibility tester appears automatically in the left sidebar
- Click on the "Accessibility Audit" section to expand/collapse
- Individual issues can be clicked for detailed explanations
- Results update in real-time as you make changes

**Usage**:
1. Start development server: `pnpm run dev`
2. Open your browser to `localhost:4321`
3. Look for the Performance panel on the left side
4. Click "Accessibility Audit" to see current issues
5. Fix issues in your code and see results update immediately
6. Use the detailed explanations to understand each violation

### Compatibility Tester

**Location**: Development toolbar (visible during development)

**Features**:
- Cross-browser compatibility checks
- Mobile device simulation
- Performance metrics monitoring
- Responsive design validation

**How to Toggle**:
- Available in the development environment toolbar
- Can be toggled on/off using browser developer tools
- Accessible through the performance monitoring panel

**Usage**:
1. Open browser developer tools (F12)
2. Navigate to the compatibility testing section
3. Select different browsers/devices to simulate
4. Test responsive breakpoints
5. Monitor performance metrics in real-time

### Development Testing Workflow

```bash
# Start development with testing tools
pnpm run dev

# Your browser will show:
# - Left sidebar: Accessibility audit results
# - Performance panel: Core Web Vitals
# - Compatibility checker: Cross-browser testing
```

**Best Practices**:
- Keep the accessibility panel open while developing
- Address accessibility issues as they appear
- Test different viewport sizes using the compatibility tools
- Monitor performance metrics during development
- Use the real-time feedback to improve code quality

**Debugging Tips**:
- Red indicators show critical accessibility issues
- Yellow indicators show warnings that should be addressed
- Green indicators show passed accessibility checks
- Click on any issue for detailed remediation steps
- Use the browser's responsive design mode alongside these tools

## ♿ Accessibility Testing

### Automated Accessibility Testing

#### axe-core Integration

```javascript
// accessibility-test.js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage accessibility', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
  
  test('Events page accessibility', async ({ page }) => {
    await page.goto('/events');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    });
  });
});
```

#### Lighthouse Accessibility Audit

```bash
# Run Lighthouse accessibility audit
lighthouse https://hackmum.in \
  --only-categories=accessibility \
  --output=json \
  --output-path=./reports/accessibility-audit.json

# CI/CD integration
npm run test:a11y:ci
```

### Manual Accessibility Testing

#### Keyboard Navigation Testing

```javascript
// keyboard-navigation-test.js
test('Keyboard navigation', async ({ page }) => {
  await page.goto('/');
  
  // Test tab navigation
  await page.keyboard.press('Tab');
  let focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Test skip links
  await page.keyboard.press('Tab');
  const skipLink = page.locator('.skip-link:focus');
  await expect(skipLink).toBeVisible();
  
  // Test menu navigation
  await page.keyboard.press('Enter');
  const mainContent = page.locator('#main-content');
  await expect(mainContent).toBeFocused();
});
```

#### Screen Reader Testing

```javascript
// screen-reader-test.js
test('Screen reader compatibility', async ({ page }) => {
  await page.goto('/');
  
  // Check for proper ARIA labels
  const navigation = page.locator('nav[role="navigation"]');
  await expect(navigation).toHaveAttribute('aria-label');
  
  // Check for proper heading structure
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingLevels = await headings.evaluateAll(elements => 
    elements.map(el => parseInt(el.tagName.charAt(1)))
  );
  
  // Verify proper heading hierarchy
  for (let i = 1; i < headingLevels.length; i++) {
    expect(headingLevels[i] - headingLevels[i-1]).toBeLessThanOrEqual(1);
  }
});
```

### Accessibility Testing Checklist

- [ ] All images have appropriate alt text
- [ ] All form inputs have associated labels
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Content is readable when zoomed to 200%
- [ ] Screen reader announces content correctly
- [ ] No keyboard traps exist
- [ ] Error messages are clearly associated with inputs
- [ ] Page structure uses proper heading hierarchy
- [ ] ARIA labels and roles are used appropriately
- [ ] Live regions announce dynamic content changes

## ⚡ Performance Testing

### Core Web Vitals Testing

```javascript
// performance-test.js
import { test, expect } from '@playwright/test';

test('Core Web Vitals', async ({ page }) => {
  await page.goto('/');
  
  // Measure Core Web Vitals
  const vitals = await page.evaluate(() => {
    return new Promise(resolve => {
      const vitals = {};
      
      // Largest Contentful Paint
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        vitals.fid = entries[0].processingStart - entries[0].startTime;
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => resolve(vitals), 5000);
    });
  });
  
  // Assert Core Web Vitals thresholds
  expect(vitals.lcp).toBeLessThan(2500); // Good: < 2.5s
  expect(vitals.fid).toBeLessThan(100);  // Good: < 100ms
  expect(vitals.cls).toBeLessThan(0.1);  // Good: < 0.1
});
```

### Performance Budget Testing

```javascript
// performance-budget-test.js
test('Performance budget', async ({ page }) => {
  const response = await page.goto('/');
  
  // Check response time
  expect(response.request().timing().responseEnd).toBeLessThan(3000);
  
  // Check resource sizes
  const resources = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map(resource => ({
      name: resource.name,
      size: resource.transferSize,
      type: resource.initiatorType
    }));
  });
  
  // Assert resource budgets
  const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
  expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB total
  
  const jsSize = resources
    .filter(r => r.type === 'script')
    .reduce((sum, resource) => sum + resource.size, 0);
  expect(jsSize).toBeLessThan(500 * 1024); // 500KB JS
  
  const cssSize = resources
    .filter(r => r.type === 'css')
    .reduce((sum, resource) => sum + resource.size, 0);
  expect(cssSize).toBeLessThan(100 * 1024); // 100KB CSS
});
```

### Performance Testing Checklist

- [ ] LCP < 2.5 seconds
- [ ] FID < 100 milliseconds
- [ ] CLS < 0.1
- [ ] TTFB < 800 milliseconds
- [ ] Total page size < 2MB
- [ ] JavaScript bundle < 500KB
- [ ] CSS bundle < 100KB
- [ ] Images are optimized and responsive
- [ ] Fonts load with font-display: swap
- [ ] Critical resources are preloaded
- [ ] Non-critical resources are lazy loaded

## 🔒 Security Testing

### Automated Security Testing

```javascript
// security-test.js
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('Security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Check security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toBeDefined();
  });
  
  test('External links security', async ({ page }) => {
    await page.goto('/');
    
    const externalLinks = page.locator('a[href^="http"]:not([href*="hackmum.in"])');
    const linkCount = await externalLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
  
  test('Form security', async ({ page }) => {
    await page.goto('/newsletter');
    
    // Check CSRF protection
    const form = page.locator('form');
    const csrfToken = form.locator('input[name="_token"]');
    await expect(csrfToken).toBeAttached();
    
    // Test XSS protection
    await page.fill('input[type="email"]', '<script>alert("xss")</script>');
    await page.click('button[type="submit"]');
    
    // Should not execute script
    const alertDialog = page.locator('.alert-error');
    await expect(alertDialog).toBeVisible();
  });
});
```

### Security Testing Checklist

- [ ] Security headers are properly set
- [ ] External links have rel="noopener noreferrer"
- [ ] Forms include CSRF protection
- [ ] User input is properly sanitized
- [ ] XSS protection is implemented
- [ ] Content Security Policy is configured
- [ ] HTTPS is enforced
- [ ] Sensitive data is not exposed in client-side code
- [ ] File uploads are properly validated
- [ ] Rate limiting is implemented for forms

## 🌐 Cross-Browser Testing

### Automated Cross-Browser Testing

```javascript
// cross-browser-test.js
import { test, devices } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'];
const pages = ['/', '/events', '/blog'];

browsers.forEach(browserName => {
  test.describe(`${browserName} tests`, () => {
    pages.forEach(pagePath => {
      test(`${pagePath} renders correctly in ${browserName}`, async ({ page }) => {
        await page.goto(pagePath);
        
        // Check basic rendering
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('footer')).toBeVisible();
        
        // Check interactive elements
        const buttons = page.locator('button, .btn');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          await expect(buttons.nth(i)).toBeVisible();
        }
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `screenshots/${browserName}-${pagePath.replace('/', 'home')}.png`,
          fullPage: true 
        });
      });
    });
  });
});
```

### Device-Specific Testing

```javascript
// device-test.js
const mobileDevices = [
  devices['iPhone 12'],
  devices['Pixel 5'],
  devices['Samsung Galaxy S21']
];

const tabletDevices = [
  devices['iPad Air'],
  devices['iPad Mini']
];

[...mobileDevices, ...tabletDevices].forEach(device => {
  test.describe(`${device.name} tests`, () => {
    test.use({ ...device });
    
    test('Mobile navigation works', async ({ page }) => {
      await page.goto('/');
      
      // Test mobile menu
      const menuButton = page.locator('[aria-label*="menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        const mobileMenu = page.locator('.mobile-menu, .drawer-side');
        await expect(mobileMenu).toBeVisible();
      }
    });
    
    test('Touch interactions work', async ({ page }) => {
      await page.goto('/');
      
      // Test touch scrolling
      await page.touchscreen.tap(200, 300);
      await page.mouse.wheel(0, 500);
      
      // Test touch on buttons
      const ctaButton = page.locator('.btn-primary').first();
      if (await ctaButton.isVisible()) {
        await ctaButton.tap();
      }
    });
  });
});
```

### Cross-Browser Testing Checklist

- [ ] Layout renders correctly in Chrome, Firefox, Safari, Edge
- [ ] JavaScript functionality works across browsers
- [ ] CSS features have appropriate fallbacks
- [ ] Touch interactions work on mobile browsers
- [ ] Form submissions work correctly
- [ ] Media queries respond properly
- [ ] Fonts load correctly across browsers
- [ ] Performance is acceptable on all browsers

## 📱 Mobile Testing

### Mobile-Specific Test Cases

```javascript
// mobile-test.js
test.describe('Mobile-specific tests', () => {
  test.use({ ...devices['iPhone 12'] });
  
  test('Viewport meta tag is correct', async ({ page }) => {
    await page.goto('/');
    
    const viewportMeta = page.locator('meta[name="viewport"]');
    const content = await viewportMeta.getAttribute('content');
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });
  
  test('Touch targets are large enough', async ({ page }) => {
    await page.goto('/');
    
    const interactiveElements = page.locator('button, a, input, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();
      
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44); // iOS guideline
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });
  
  test('Mobile form experience', async ({ page }) => {
    await page.goto('/newsletter');
    
    // Check input types for mobile keyboards
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('inputmode', 'email');
    
    const telInput = page.locator('input[type="tel"]');
    if (await telInput.count() > 0) {
      await expect(telInput).toHaveAttribute('inputmode', 'tel');
    }
  });
});
```

### Mobile Performance Testing

```javascript
// mobile-performance-test.js
test('Mobile performance', async ({ page }) => {
  // Simulate slow 3G connection
  await page.route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Add delay
    await route.continue();
  });
  
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  // Should load within reasonable time on slow connection
  expect(loadTime).toBeLessThan(5000); // 5 seconds
  
  // Check mobile-specific metrics
  const mobileMetrics = await page.evaluate(() => {
    return {
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      layoutShifts: performance.getEntriesByType('layout-shift').length
    };
  });
  
  expect(mobileMetrics.domContentLoaded).toBeLessThan(3000);
  expect(mobileMetrics.firstPaint).toBeLessThan(2000);
  expect(mobileMetrics.layoutShifts).toBeLessThan(5);
});
```

## 🤖 Automated Testing

### Continuous Integration Setup

# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps

    - name: Build project
      run: npm run build

    - name: Start preview server
      run: npm run preview &

    - name: Wait for server to be ready
      shell: bash
      run: |
        for i in {1..60}; do
          if curl -sSf http://localhost:4321 >/dev/null; then
            echo "Server is up"
            exit 0
          fi
          sleep 1
        done
        echo "Server did not become ready in time" >&2
        exit 1

    - name: Run unit tests
      run: npm run test

    - name: Run accessibility tests
      run: npm run test:a11y:ci    - name: Run cross-browser tests
      run: npm run test:cross-browser:ci

    - name: Run security tests
      run: npm run test:security:ci

    - name: Upload test reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-reports
        path: |
          accessibility-reports/
          cross-browser-reports/
          security-reports/
### Test Scripts Configuration

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:a11y": "node scripts/accessibility-test.js",
    "test:a11y:ci": "node scripts/accessibility-test.js --baseUrl http://localhost:4321 --pages /,/blog,/events --outputDir ./accessibility-reports",
    "test:cross-browser": "node scripts/cross-browser-test.js",
    "test:cross-browser:ci": "node scripts/cross-browser-test.js --baseUrl http://localhost:4321 --pages /,/blog,/events --browsers chrome,firefox --devices 'iPhone 12','Pixel 5','iPad Air' --outputDir ./cross-browser-reports",
    "test:security": "node scripts/security-test.js",
    "test:security:ci": "node scripts/security-test.js --baseUrl http://localhost:4321 --pages /,/blog,/events --testSuites headers,xss,csrf,input-validation,content-security --outputDir ./security-reports"
  }
}
```

## 🧪 Manual Testing

### Manual Testing Checklist

#### Visual Testing
- [ ] Layout appears correctly on different screen sizes
- [ ] Images load and display properly
- [ ] Fonts render correctly
- [ ] Colors and contrast are appropriate
- [ ] Animations are smooth and purposeful
- [ ] Dark/light theme switching works

#### Functional Testing
- [ ] All links navigate to correct destinations
- [ ] Forms submit successfully
- [ ] Interactive elements respond to user input
- [ ] Search functionality works
- [ ] Navigation menus function properly
- [ ] Error states display appropriately

#### Usability Testing
- [ ] Content is easy to read and understand
- [ ] Navigation is intuitive
- [ ] Call-to-action buttons are clear
- [ ] Loading states provide feedback
- [ ] Error messages are helpful
- [ ] Overall user experience is smooth

### Testing Documentation

```markdown
# Test Case: Newsletter Signup

## Objective
Verify that users can successfully sign up for the newsletter

## Preconditions
- User is on the homepage
- Newsletter section is visible

## Test Steps
1. Scroll to newsletter section
2. Enter valid email address
3. Click "Subscribe" button
4. Verify success message appears
5. Check that form is reset

## Expected Results
- Success message: "Thank you for subscribing!"
- Form fields are cleared
- User receives confirmation email (if applicable)

## Test Data
- Valid email: test@example.com
- Invalid email: invalid-email

## Browser/Device Coverage
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Mobile)
- Chrome (Mobile)
```

## 📊 Test Reporting

### Test Report Generation

```javascript
// test-reporter.js
class CustomReporter {
  onTestComplete(test, result) {
    const report = {
      name: test.title,
      status: result.status,
      duration: result.duration,
      errors: result.errors,
      screenshots: result.attachments?.filter(a => a.contentType.includes('image'))
    };
    
    this.generateHTMLReport(report);
  }
  
  generateHTMLReport(report) {
    const html = `
      <div class="test-result ${report.status}">
        <h3>${report.name}</h3>
        <p>Status: ${report.status}</p>
        <p>Duration: ${report.duration}ms</p>
        ${report.errors.length > 0 ? `<pre>${report.errors.join('\n')}</pre>` : ''}
        ${report.screenshots?.map(s => `<img src="${s.path}" alt="Screenshot" />`).join('') || ''}
      </div>
    `;
    
    // Append to report file
    fs.appendFileSync('test-report.html', html);
  }
}
```

### Metrics Tracking

```javascript
// Track testing metrics
const testMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  coverage: 0,
  performance: {
    averageLoadTime: 0,
    coreWebVitals: {}
  },
  accessibility: {
    violations: 0,
    wcagLevel: 'AA'
  }
};

// Generate metrics dashboard
function generateMetricsDashboard(metrics) {
  return `
    <div class="metrics-dashboard">
      <div class="metric">
        <h3>Test Success Rate</h3>
        <div class="value">${(metrics.passedTests / metrics.totalTests * 100).toFixed(1)}%</div>
      </div>
      <div class="metric">
        <h3>Code Coverage</h3>
        <div class="value">${metrics.coverage}%</div>
      </div>
      <div class="metric">
        <h3>Accessibility Violations</h3>
        <div class="value">${metrics.accessibility.violations}</div>
      </div>
    </div>
  `;
}
```

## 🔧 Testing Tools

### Recommended Testing Tools

#### Automated Testing
- **Playwright**: Cross-browser testing framework
- **Vitest**: Fast unit testing framework
- **axe-core**: Accessibility testing engine
- **Lighthouse**: Performance and quality auditing

#### Manual Testing
- **Browser DevTools**: Built-in debugging and testing
- **WAVE**: Web accessibility evaluation
- **Stark**: Design accessibility plugin
- **BrowserStack**: Cross-browser testing platform

#### Performance Testing
- **WebPageTest**: Performance analysis
- **GTmetrix**: Performance monitoring
- **Core Web Vitals**: Google's performance metrics
- **Lighthouse CI**: Continuous performance monitoring

#### Security Testing
- **OWASP ZAP**: Security vulnerability scanner
- **Snyk**: Dependency vulnerability scanning
- **Security Headers**: HTTP security headers analysis

---

Remember: Testing is not just about finding bugs—it's about ensuring a great user experience for everyone who visits our website.