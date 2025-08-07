# Blog Image Testing Infrastructure

## Overview

This document describes the comprehensive testing infrastructure for blog cover image functionality. The testing suite ensures that blog post cover images display correctly across all contexts and handles various edge cases gracefully.

## Test Coverage

### Test Files
- `BlogCard.test.js` - Core BlogCard component functionality (28 tests)
- `BlogSection.test.js` - BlogSection integration tests (22 tests)
- `BlogIndexPage.test.js` - Blog index page integration tests (16 tests)
- `BlogImageVisualRegression.test.js` - Visual regression prevention (16 tests)
- `BlogCard.image-display.test.js` - Image display diagnosis and verification (6 tests)
- `BlogCard.edge-cases.test.js` - Edge case handling (22 tests)

**Total: 110 tests**

### Test Scenarios

#### Valid Cover Image Scenarios
- **PNG Images**: `test-valid-cover` - Tests PNG cover image display
- **JPG Images**: `test-jpg-cover` - Tests JPG cover image display  
- **WebP Images**: `test-webp-cover` - Tests WebP cover image display

#### Fallback Scenarios
- **Missing Files**: `test-missing-cover` - Tests fallback when image file doesn't exist
- **No Cover Field**: `test-no-cover` - Tests fallback when no cover field is defined
- **Invalid Paths**: `test-invalid-path` - Tests fallback when cover path is invalid

## Test Blog Posts

The following test blog posts are maintained in `src/content/posts/` for comprehensive testing:

```
src/content/posts/
├── test-valid-cover/          # PNG cover image test
│   ├── index.mdx
│   └── cover.png
├── test-jpg-cover/            # JPG cover image test
│   ├── index.mdx
│   └── cover.jpg
├── test-webp-cover/           # WebP cover image test
│   ├── index.mdx
│   └── cover.webp
├── test-missing-cover/        # Missing image file test
│   └── index.mdx              # (references ./missing-cover.png)
├── test-no-cover/             # No cover field test
│   └── index.mdx              # (no cover field in frontmatter)
└── test-invalid-path/         # Invalid path test
    └── index.mdx              # (references ./invalid/path/to/image.png)
```

## Test Assets

Additional test assets are maintained in `src/assets/images/test-blog-covers/`:
- `test-cover-1.png` - PNG format test image
- `test-cover-2.jpg` - JPG format test image  
- `test-cover-3.webp` - WebP format test image

## Running Tests

### Basic Commands
```bash
# Run all blog image tests
pnpm test:blog-images

# Run with watch mode
pnpm test:blog-images:watch

# Run with coverage
pnpm test:blog-images:coverage

# Run with comprehensive test runner
pnpm test:blog-images:runner
```

### Advanced Test Runner
The `scripts/run-blog-image-tests.js` provides additional functionality:
```bash
# Run with coverage
pnpm test:blog-images:runner:coverage

# Run in watch mode
pnpm test:blog-images:runner:watch

# Skip prerequisite checks
node scripts/run-blog-image-tests.js --skip-prereqs
```

## CI/CD Integration

### GitHub Actions Workflows

#### Blog Image Tests Workflow (`.github/workflows/blog-image-tests.yml`)
- Triggers on changes to components, content, or assets
- Runs on Node.js 18.x and 20.x
- Uploads test results on failure

#### Main CI/CD Pipeline (`.github/workflows/ci.yml`)
- Includes blog image tests as a critical step
- Fails the build if blog image tests don't pass
- Runs accessibility and security audits
- Handles deployment to Netlify

### Critical Test Requirements
- **Mandatory**: All blog image tests must pass for deployment
- **Regression Prevention**: Tests specifically cover the original image display bug
- **Visual Verification**: Automated checks ensure no broken image icons appear

## Test Configuration

### Test Configuration File
`src/components/__tests__/blog-image-test-config.js` defines:
- Test blog post scenarios
- Expected image formats
- Helper functions for test data

### Vitest Configuration
Tests run with:
- **Environment**: jsdom
- **Setup**: `src/components/__tests__/setup.js`
- **Coverage**: Text, JSON, and HTML reports
- **Include**: Component and function tests

## Monitoring and Maintenance

### Regular Checks
1. **Test Post Integrity**: Ensure test blog posts remain valid
2. **Image Asset Availability**: Verify test images exist and are accessible
3. **Test Coverage**: Monitor that all scenarios are covered
4. **Performance**: Ensure tests run efficiently in CI/CD

### Adding New Test Scenarios
1. Create new test blog post in `src/content/posts/test-*`
2. Add corresponding test image if needed
3. Update `blog-image-test-config.js` with new scenario
4. Add test cases to relevant test files
5. Update this documentation

## Troubleshooting

### Common Issues
- **UNC Path Errors**: Use PowerShell or WSL for running tests on Windows
- **Missing Test Assets**: Run prerequisite check with test runner
- **Vitest Not Found**: Ensure dependencies are installed with `pnpm install`

### Debug Commands
```bash
# Check test prerequisites
node scripts/run-blog-image-tests.js --skip-prereqs

# Run single test file
npx vitest run src/components/__tests__/BlogCard.test.js

# Run with verbose output
npx vitest run --reporter=verbose
```

## Success Metrics

The blog image testing infrastructure ensures:
- ✅ **110 tests passing** - Comprehensive coverage of all scenarios
- ✅ **Multiple image formats** - PNG, JPG, WebP support verified
- ✅ **Robust fallback logic** - Graceful handling of missing/invalid images
- ✅ **CI/CD integration** - Automated testing prevents regressions
- ✅ **Visual regression prevention** - No broken image icons in production
- ✅ **Performance monitoring** - Fast test execution (< 2 seconds)

This testing infrastructure provides confidence that blog cover images will display correctly across all contexts and prevents regression of the original image display issue.