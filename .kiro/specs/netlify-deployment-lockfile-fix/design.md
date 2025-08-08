# Design Document

## Overview

This design addresses two critical CI/CD pipeline issues affecting the Hackerspace Mumbai website: (1) pnpm lockfile synchronization problems causing Netlify deployment failures, and (2) GitHub Actions test failures in visual regression tests that require a dev server. The solution involves updating the lockfile, improving CI/CD resilience, and making tests environment-aware.

## Architecture

### Current State Analysis
- **Netlify Configuration**: Uses pnpm with frozen lockfile installation (default in CI)
- **Package Management**: pnpm with lockfileVersion 9.0
- **Missing Dependency**: `sanitize-html@^2.17.0` exists in package.json but not in pnpm-lock.yaml
- **Test Environment**: Visual regression tests expect localhost:4321 dev server
- **CI Environment**: GitHub Actions and Netlify build environments don't run dev servers

### Solution Architecture
The solution follows a multi-layered approach:

1. **Immediate Fix Layer**: Synchronize lockfile and fix current deployment
2. **Resilience Layer**: Make CI/CD processes more robust to dependency issues
3. **Test Environment Layer**: Make tests environment-aware and CI-friendly
4. **Documentation Layer**: Provide clear processes for future maintenance

## Components and Interfaces

### 1. Dependency Management Component

**Purpose**: Ensure package.json and pnpm-lock.yaml remain synchronized

**Key Functions**:
- Lockfile regeneration with version preservation
- Dependency validation
- CI-friendly installation strategies

**Interface**:
```bash
# Primary commands
pnpm install --frozen-lockfile  # CI mode (current)
pnpm install --no-frozen-lockfile  # Recovery mode
pnpm install  # Development mode
```

### 2. Netlify Build Configuration Component

**Purpose**: Handle lockfile issues gracefully during deployment

**Current Configuration** (netlify.toml):
- Build command: `npm run build`
- Node version: 18
- Functions: netlify/functions

**Enhanced Configuration Strategy**:
- Add fallback build commands for lockfile issues
- Environment-specific dependency handling
- Clear error reporting and recovery instructions

### 3. Visual Regression Test Component

**Purpose**: Make tests work reliably across different environments

**Current Issues**:
- Tests throw errors when dev server unavailable
- Hard dependency on localhost:4321
- No environment detection

**Enhanced Design**:
```javascript
// Environment detection pattern
const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
const devServerAvailable = await checkDevServer();

if (!devServerAvailable && isCI) {
  // Skip or use alternative testing strategy
  console.log('Skipping visual regression in CI - dev server not available');
  return;
}
```

### 4. GitHub Actions Workflow Component

**Purpose**: Ensure tests run appropriately in CI environment

**Design Strategy**:
- Environment-aware test execution
- Conditional test running based on server availability
- Clear failure reporting with actionable messages

## Data Models

### Dependency State Model
```typescript
interface DependencyState {
  packageJson: Record<string, string>;
  lockfile: LockfileEntry[];
  syncStatus: 'synced' | 'out-of-sync' | 'missing-entries';
  missingDependencies: string[];
}

interface LockfileEntry {
  name: string;
  version: string;
  specifier: string;
  resolved: string;
}
```

### Test Environment Model
```typescript
interface TestEnvironment {
  isCI: boolean;
  devServerAvailable: boolean;
  baseUrl: string;
  testMode: 'full' | 'ci-safe' | 'skip';
}
```

### Build Configuration Model
```typescript
interface BuildConfig {
  command: string;
  fallbackCommand?: string;
  environment: Record<string, string>;
  lockfileStrategy: 'frozen' | 'flexible' | 'regenerate';
}
```

## Error Handling

### 1. Lockfile Sync Errors

**Detection**: Compare package.json dependencies with lockfile entries
**Recovery**: 
- Primary: Regenerate lockfile with `pnpm install`
- Fallback: Use `--no-frozen-lockfile` in CI if safe
- Validation: Ensure no breaking version changes

**Error Messages**:
```
❌ Lockfile out of sync: sanitize-html@^2.17.0 missing from pnpm-lock.yaml
✅ Fix: Run 'pnpm install' to update lockfile
⚠️  CI Fix: Add '--no-frozen-lockfile' flag if needed
```

### 2. Visual Regression Test Errors

**Detection**: Check dev server availability before running tests
**Recovery**:
- Skip tests gracefully in CI environments
- Provide clear logging about why tests were skipped
- Offer alternative validation methods

**Error Messages**:
```
⚠️  Dev server not available at localhost:4321
ℹ️  Skipping visual regression tests in CI environment
✅ Alternative: Run 'npm run dev' locally for full test suite
```

### 3. CI/CD Pipeline Errors

**Detection**: Monitor build logs for specific error patterns
**Recovery**:
- Provide clear documentation for common issues
- Implement retry mechanisms where appropriate
- Offer manual override options for emergency deployments

## Testing Strategy

### 1. Lockfile Validation Tests
```javascript
describe('Dependency Management', () => {
  it('should have synchronized lockfile', () => {
    const packageJson = readPackageJson();
    const lockfile = readLockfile();
    validateSync(packageJson, lockfile);
  });
  
  it('should install sanitize-html correctly', () => {
    expect(lockfile.dependencies['sanitize-html']).toBeDefined();
    expect(lockfile.dependencies['sanitize-html'].version).toMatch(/^2\.17\./);
  });
});
```

### 2. Environment-Aware Visual Tests
```javascript
describe('Visual Regression (Environment Aware)', () => {
  beforeAll(async () => {
    const devServerAvailable = await checkDevServer();
    if (!devServerAvailable && process.env.CI) {
      console.log('Skipping visual tests in CI - no dev server');
      return;
    }
  });
  
  it('should capture screenshots when dev server available', async () => {
    // Test implementation with proper environment handling
  });
});
```

### 3. CI/CD Integration Tests
```javascript
describe('Build Process', () => {
  it('should handle lockfile issues gracefully', () => {
    // Test build process with various lockfile states
  });
  
  it('should provide clear error messages', () => {
    // Test error reporting and recovery instructions
  });
});
```

### 4. Deployment Validation Tests
```javascript
describe('Deployment Health', () => {
  it('should verify sanitize-html functionality', () => {
    // Test that sanitize-html works as expected
  });
  
  it('should validate build output', () => {
    // Test that build completes successfully
  });
});
```

## Implementation Phases

### Phase 1: Immediate Fixes
1. Regenerate pnpm-lock.yaml with sanitize-html
2. Update visual regression tests to be CI-friendly
3. Verify deployment works

### Phase 2: Resilience Improvements
1. Add fallback strategies to Netlify configuration
2. Implement environment detection in tests
3. Add comprehensive error handling

### Phase 3: Documentation and Processes
1. Create dependency management guidelines
2. Document CI/CD troubleshooting procedures
3. Add automated validation checks

## Security Considerations

### Dependency Security
- Verify sanitize-html version for known vulnerabilities
- Ensure lockfile integrity prevents supply chain attacks
- Validate all dependency updates

### CI/CD Security
- Avoid exposing sensitive information in error messages
- Ensure fallback strategies don't compromise security
- Maintain proper access controls for deployment processes

## Performance Impact

### Build Performance
- Lockfile regeneration: ~30-60 seconds one-time cost
- CI builds: Minimal impact with proper caching
- Test execution: Reduced time in CI with smart skipping

### Runtime Performance
- sanitize-html: Minimal impact on bundle size (~50KB)
- No impact on existing functionality
- Improved reliability reduces deployment delays