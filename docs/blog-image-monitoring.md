# Blog Image Monitoring and Regression Prevention

This document describes the comprehensive monitoring and regression prevention system implemented to ensure blog cover images display correctly and prevent future regressions.

## Overview

The system includes multiple layers of protection:

1. **Pre-commit Hooks** - Run tests before code is committed
2. **CI/CD Integration** - Automated testing in the build pipeline
3. **Visual Regression Testing** - Screenshot comparison to detect visual changes
4. **Production Smoke Tests** - Verify functionality after deployment
5. **Continuous Monitoring** - Ongoing production health checks

## Components

### 1. Pre-commit Hooks

**Location**: `.githooks/pre-commit`

Automatically runs before each commit:
- Blog image display tests
- Visual regression tests (if dev server is running)
- Unit tests

**Setup**: Automatically configured via `npm run setup:hooks` (runs on `postinstall`)

**Bypass**: `git commit --no-verify` (not recommended)

### 2. CI/CD Integration

**Workflows**:
- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/workflows/blog-image-tests.yml` - Dedicated blog image testing
- `.github/workflows/visual-regression.yml` - Visual regression testing

**Key Features**:
- Fails builds if blog image tests don't pass
- Runs on multiple Node.js versions
- Uploads test artifacts for debugging
- Includes post-deployment verification

### 3. Visual Regression Testing

**Test File**: `src/components/__tests__/BlogImageVisualRegression.test.js`

**Features**:
- Captures screenshots of blog components
- Compares against baseline images
- Detects visual changes in image display
- Verifies images are actually loaded (not broken)

**Scripts**:
```bash
pnpm test:visual          # Run with dev server management
pnpm test:visual:ci       # Run in CI environment
```

**Baseline Management**:
- Baselines stored in `test-screenshots/baseline/`
- Current screenshots in `test-screenshots/current/`
- Automatically creates baselines on first run

### 4. Production Smoke Tests

**Script**: `scripts/smoke-test-production.js`

**Tests**:
- Homepage blog image display
- Blog index page functionality
- Individual blog post images
- Image optimization (WebP, lazy loading)
- Performance metrics
- Health endpoint verification

**Scripts**:
```bash
pnpm smoke:test                    # Test production site
pnpm smoke:test:local             # Test local development
pnpm smoke:test:preview           # Test preview build
pnpm smoke:test:production        # Test production site
```

### 5. Continuous Monitoring

**Script**: `scripts/monitor-blog-images.js`

**Features**:
- Periodic checks of blog image functionality
- Failure tracking and alerting
- Performance monitoring
- Detailed reporting

**Scripts**:
```bash
pnpm monitor:blog-images                    # Start continuous monitoring
pnpm monitor:blog-images:once              # Single check
pnpm monitor:blog-images:production        # Monitor production with 5min interval
```

**Configuration Options**:
```bash
node scripts/monitor-blog-images.js \
  --url https://hackmum.in \
  --interval 300 \
  --max-failures 3 \
  --report-dir ./monitoring-reports
```

## Usage Guide

### For Developers

**Before Committing**:
1. Ensure dev server is running (`pnpm dev`)
2. Run `git commit` - hooks will automatically test
3. Fix any failures before proceeding

**Manual Testing**:
```bash
# Test blog images specifically
pnpm test:blog-images

# Run visual regression tests
pnpm test:visual

# Test production build locally
pnpm build && pnpm preview
pnpm smoke:test:preview
```

### For CI/CD

**Required Environment**:
- Node.js 18.x or 20.x
- pnpm package manager
- Playwright browsers (automatically installed)

**Workflow Integration**:
```yaml
- name: Run blog image tests (Critical)
  run: pnpm test:blog-images

- name: Run visual regression tests
  run: pnpm test:visual:ci
  
- name: Run production smoke tests
  run: pnpm smoke:test:production
```

### For Production Monitoring

**Setup Continuous Monitoring**:
```bash
# Start monitoring (runs indefinitely)
pnpm monitor:blog-images:production

# Or run as a service/cron job
node scripts/monitor-blog-images.js --url https://hackmum.in --interval 300
```

**One-time Health Check**:
```bash
pnpm monitor:blog-images:once
```

## Reports and Artifacts

### Test Reports

**Locations**:
- `accessibility-reports/` - Accessibility test results
- `security-reports/` - Security test results
- `test-screenshots/` - Visual regression screenshots
- `smoke-test-reports/` - Smoke test results
- `monitoring-reports/` - Continuous monitoring reports

### CI/CD Artifacts

**Uploaded on Failure**:
- Test coverage reports
- Visual regression screenshots
- Accessibility reports
- Security reports

**Retention**: 7-30 days depending on artifact type

## Troubleshooting

### Pre-commit Hook Issues

**Problem**: Pre-commit hook fails
**Solution**: 
1. Check if dev server is running for visual tests
2. Run tests manually: `pnpm test:blog-images`
3. Fix failing tests before committing

### Visual Regression Failures

**Problem**: Visual regression test fails
**Solutions**:
1. Review screenshots in `test-screenshots/current/`
2. If changes are intentional, update baselines
3. Check for unintended layout/styling changes

### CI/CD Failures

**Problem**: Build fails on blog image tests
**Solutions**:
1. Check CI logs for specific test failures
2. Download test artifacts for debugging
3. Ensure all blog posts have valid cover images

### Production Issues

**Problem**: Monitoring detects failures
**Solutions**:
1. Check monitoring reports in `monitoring-reports/`
2. Run smoke tests manually: `pnpm smoke:test:production`
3. Verify CDN/image optimization services
4. Check for broken image links in blog posts

## Configuration

### Updating Test Thresholds

**Visual Regression**: Modify comparison logic in `BlogImageVisualRegression.test.js`

**Performance**: Update thresholds in `smoke-test-production.js`:
```javascript
// Performance thresholds for production
if (loadTime > 5000) {
  console.log('⚠️  Slow page load time detected');
  this.results.warnings++;
}
```

**Monitoring**: Configure failure thresholds:
```javascript
const monitor = new BlogImageMonitor({
  maxFailures: 3,        // Alert after 3 consecutive failures
  interval: 300000,      // Check every 5 minutes
});
```

### Adding New Test Scenarios

1. **Unit Tests**: Add to `src/components/__tests__/`
2. **Visual Tests**: Extend `BlogImageVisualRegression.test.js`
3. **Smoke Tests**: Add scenarios to `smoke-test-production.js`
4. **Monitoring**: Extend checks in `monitor-blog-images.js`

## Best Practices

### For Development

1. **Always run with dev server** for complete pre-commit testing
2. **Update baselines** when making intentional visual changes
3. **Test with real blog posts** that have various image scenarios
4. **Monitor CI/CD results** and fix failures promptly

### For Content Creation

1. **Use consistent image formats** (PNG, JPG, WebP)
2. **Optimize image sizes** before adding to blog posts
3. **Test new posts locally** before publishing
4. **Include alt text** for accessibility

### For Production

1. **Monitor regularly** using the continuous monitoring script
2. **Set up alerts** for production failures (webhook/email)
3. **Review reports** periodically for performance trends
4. **Update baselines** when deploying visual changes

## Integration with External Services

### Webhook Notifications

Extend `monitor-blog-images.js` to send alerts:

```javascript
async sendAlert(report) {
  // Slack webhook
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Blog image monitoring alert: ${report.errors[0]}`
    })
  });
}
```

### Performance Monitoring

Integrate with services like:
- New Relic
- DataDog
- Lighthouse CI
- WebPageTest

### Visual Regression Services

Consider upgrading to:
- Percy
- Chromatic
- Applitools
- Playwright's built-in visual comparisons

## Maintenance

### Regular Tasks

1. **Clean up old reports** (automated via CI retention policies)
2. **Update baseline screenshots** when making intentional changes
3. **Review monitoring alerts** and adjust thresholds
4. **Update dependencies** (Playwright, testing libraries)

### Quarterly Reviews

1. **Analyze failure patterns** from monitoring reports
2. **Update performance thresholds** based on site evolution
3. **Review test coverage** and add new scenarios
4. **Optimize monitoring frequency** based on usage patterns

This comprehensive system ensures that blog image display issues are caught early and prevented from reaching production, maintaining a high-quality user experience for the Hackerspace Mumbai community website.