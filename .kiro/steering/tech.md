# Technology Stack & Build System

## Development Environment
- **WSL Ubuntu** - Development environment running in Windows Subsystem for Linux
- **Module vs Script Considerations** - Avoid shebangs in files that need to be imported as ES modules for testing, as they cause parsing errors
- **Linux file permissions** - Executable scripts may need execute permissions (`chmod +x`)

## Core Framework
- **Astro 5.12.2** - Static site generator with modern web standards
- **TypeScript** - Type-safe JavaScript with strict configuration
- **Node.js** with ES modules (`"type": "module"`)

## Styling & UI
- **Tailwind CSS 4.1.4** - Utility-first CSS framework
- **DaisyUI 5.0.46** - Component library built on Tailwind
- **@tailwindcss/typography** - Beautiful typographic defaults
- **Prettier** with Tailwind plugin for consistent formatting

## Content Management
- **Astro Content Collections** - Type-safe content management
- **MDX** - Markdown with JSX components
- **Sharp** - High-performance image optimization

## Testing & Quality
- **Vitest** - Fast unit testing framework with jsdom environment
- **@testing-library/dom** - Simple and complete testing utilities
- **Axe-core** - Accessibility testing
- **Playwright** - Cross-browser testing and visual regression testing
- **Custom test suites** for accessibility, cross-browser, and security

### Critical Testing Requirements
- **Blog Image Display Tests** - MANDATORY: All blog-related components must have automated tests verifying cover images display correctly
- **Visual Regression Prevention** - Any changes to BlogCard, BlogSection, or blog index page must include image display verification
- **Content Collection Image Handling** - Tests must verify Astro's image() schema works correctly with content collections

## Package Management
- **pnpm** - Fast, disk space efficient package manager

## Common Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build production site to ./dist/
pnpm preview          # Preview production build locally
```

### Testing
```bash
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage report
pnpm test:blog-images # Run blog image display tests (CRITICAL)
```

### Testing Best Practices
- **Always use `--run` flag** when running vitest tests to ensure they terminate properly
- **Use specific file paths** when testing individual files: `pnpm test path/to/test.js --run`
- **Vitest Configuration**: Tests are configured in `vitest.config.js` with jsdom environment
- **Test File Locations**: Follow the pattern `**/__tests__/**/*.test.js` for proper test discovery

### Quality Assurance
```bash
pnpm test:a11y        # Run accessibility tests
pnpm a11y:audit       # Full accessibility audit (build + test)
pnpm test:cross-browser    # Cross-browser compatibility tests
pnpm cross-browser:audit  # Full cross-browser audit
pnpm test:security    # Security vulnerability tests
pnpm security:audit   # Full security audit
```

## Build Configuration
- **Static output** mode for optimal performance and compatibility
- **CSS code splitting** enabled for better loading performance
- **Image optimization** with AVIF/WebP formats and quality settings
- **HTML compression** enabled
- **Prefetching** enabled for faster navigation
- **Asset inlining** for files under 4KB

## Performance Optimizations
- Modern image formats (AVIF, WebP) with fallbacks
- Automatic image optimization via Sharp
- CSS code splitting and minification
- HTML compression
- Asset inlining for small files
- Prefetch configuration for faster navigation

## Critical Development Guidelines

### Performance & Security Requirements
When adding any new feature or function, ensure it meets these strict requirements:

1. **Performance Standards**
   - Must not block critical rendering path
   - Scripts should be deferred or loaded after page load
   - Use `fetchpriority="high"` only for LCP elements
   - Inline critical CSS and small scripts to avoid network requests
   - All images must have proper `loading` attributes (`eager` for above-fold, `lazy` for below-fold)

2. **Lighthouse Compliance**
   - Must not introduce console errors or warnings
   - Should not negatively impact Core Web Vitals (LCP, FID, CLS)
   - External resources must be properly optimized and non-blocking
   - Accessibility standards must be maintained (WCAG 2.1 AA)

3. **Content Security Policy (CSP) Compliance**
   - **NO inline event handlers** (`onclick`, `onload`, `onerror`, etc.)
   - **NO inline scripts** without proper CSP directives
   - Use `is:inline` directive for Astro inline scripts when necessary
   - External scripts must be from approved domains in CSP
   - Use `define:vars` for passing server-side data to client scripts

4. **Implementation Best Practices**
   - Prefer progressive enhancement over JavaScript-dependent features
   - Use error handling for all external resources (analytics, fonts, etc.)
   - Respect user privacy preferences (Do Not Track, Global Privacy Control)
   - Load non-essential scripts after page load event
   - Minimize and compress all assets

### Code Review Checklist
Before merging any changes, verify:
- [ ] No blocking scripts in `<head>`
- [ ] No inline event handlers
- [ ] Proper image optimization and loading attributes
- [ ] CSP compliance verified
- [ ] Lighthouse audit passes without regressions
- [ ] Error handling for external dependencies
- [ ] Privacy-respecting implementation