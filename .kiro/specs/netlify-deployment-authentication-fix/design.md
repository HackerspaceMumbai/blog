# Design Document

## Overview

The Netlify deployment authentication issue stems from the Netlify CLI attempting interactive authentication in a non-interactive CI environment. The solution involves configuring the Netlify CLI to use token-based authentication through environment variables and ensuring the deployment commands are properly structured for automated environments.

The core problem is that the current `deploy:preview` script runs `netlify deploy` without specifying the authentication method, causing the CLI to default to interactive browser-based authentication which fails in GitHub Actions.

## Architecture

### Current State
- GitHub Actions workflow passes `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` as environment variables
- `deploy:preview` script runs `netlify deploy` command
- Netlify CLI attempts interactive authentication instead of using provided token
- Deployment fails with "Timed out waiting for authorization" error

### Target State
- Netlify CLI automatically detects and uses `NETLIFY_AUTH_TOKEN` environment variable
- Deployment commands are explicitly configured for non-interactive CI environments
- Authentication method is consistent across local development and CI environments
- Clear error handling and logging for authentication issues

## Components and Interfaces

### 1. GitHub Actions Workflow Configuration
**File:** `.github/workflows/ci.yml`

**Current Implementation:**
```yaml
- name: Deploy to Netlify (Preview)
  run: pnpm deploy:preview
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Enhanced Implementation:**
```yaml
- name: Verify Netlify credentials
  run: |
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
      echo "::error::NETLIFY_AUTH_TOKEN is not set"
      exit 1
    fi
    if [ -z "$NETLIFY_SITE_ID" ]; then
      echo "::error::NETLIFY_SITE_ID is not set"
      exit 1
    fi
    netlify status --json
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

- name: Deploy to Netlify (Preview)
  run: pnpm deploy:preview:ci
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```
- Add credential verification step before deployment
- Use CI-specific deployment script with structured output
- Include GitHub Actions error annotations for better visibility
- Verify Netlify CLI can authenticate before attempting deployment

### 2. Package.json Scripts
**File:** `package.json`

**Current Implementation:**
```json
"deploy:preview": "netlify deploy"
```

**Enhanced Implementation:**
```json
{
  "deploy:preview": "netlify deploy --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions",
  "deploy:prod": "netlify deploy --prod --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions",
  "deploy:preview:ci": "netlify deploy --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions --json",
  "deploy:prod:ci": "netlify deploy --prod --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions --json"
}
```
- Explicitly specify `--site` parameter to avoid interactive site selection
- Add `--json` flag for CI environments to get structured output
- Include `--dir` and `--functions` parameters for explicit build artifact locations
- Create separate CI-specific scripts for better error handling

### 3. Netlify CLI Configuration
**Approach:** Environment-based authentication with explicit parameters

**Key Changes:**
- Use `--site=$NETLIFY_SITE_ID` parameter to avoid interactive site selection
- Add `--json` flag for CI environments to get structured, parseable output
- Leverage automatic token detection from `NETLIFY_AUTH_TOKEN` environment variable
- Implement `netlify status` verification before deployment attempts

**Authentication Flow:**
1. Netlify CLI automatically detects `NETLIFY_AUTH_TOKEN` from environment
2. Site ID is explicitly provided via `--site` parameter
3. No interactive prompts are triggered in CI environment
4. Structured JSON output enables better error parsing and logging

### 4. Deployment Script Enhancement
**File:** `scripts/deploy.sh`

**Enhancements:**
- Add CI environment detection
- Implement token-based authentication verification
- Add explicit site ID handling
- Improve error messages and logging

## Data Models

### Environment Variables
```typescript
interface DeploymentEnvironment {
  NETLIFY_AUTH_TOKEN: string;     // Required for CI authentication
  NETLIFY_SITE_ID: string;        // Required for site identification
  CI: boolean;                    // GitHub Actions sets this automatically
  NODE_ENV: string;               // Environment context
}
```

### Deployment Configuration
```typescript
interface DeploymentConfig {
  environment: 'preview' | 'production';
  authMethod: 'token' | 'interactive';
  siteId: string;
  buildDir: string;
  functionsDir: string;
  timeout: number;
}
```

## Error Handling

### Authentication Failures
1. **Missing Token:** Clear error message indicating `NETLIFY_AUTH_TOKEN` is required
2. **Invalid Token:** Verification step to test token validity before deployment
3. **Missing Site ID:** Explicit check for `NETLIFY_SITE_ID` environment variable
4. **Network Issues:** Retry logic with exponential backoff

### Deployment Failures
1. **Build Failures:** Pre-deployment build verification
2. **Upload Failures:** Retry mechanism for network-related issues
3. **Function Deployment:** Separate error handling for function deployment issues
4. **Post-deployment Verification:** Health checks to ensure successful deployment

### Error Logging
- Structured logging with deployment context
- Sanitized error messages (no credential exposure)
- Actionable error messages with resolution steps
- Integration with GitHub Actions annotations for better visibility

## Testing Strategy

### Unit Tests
- Authentication token validation
- Environment variable detection
- Deployment configuration parsing
- Error handling scenarios

### Integration Tests
- End-to-end deployment workflow testing
- Authentication flow verification
- Multi-environment deployment testing
- Error scenario simulation

### CI/CD Testing
- GitHub Actions workflow validation
- Secret management verification
- Deployment status verification
- Post-deployment health checks

### Local Development Testing
- Interactive authentication fallback
- Local deployment script testing
- Environment switching validation
- Developer experience verification

## Implementation Approach

### Phase 1: Authentication Fix
1. Update deployment scripts to use explicit authentication parameters
2. Add environment variable validation
3. Implement CI environment detection
4. Update GitHub Actions workflow with enhanced error handling

### Phase 2: Enhanced Configuration
1. Add deployment configuration validation
2. Implement retry logic for network issues
3. Add post-deployment verification
4. Enhance error messages and logging

### Phase 3: Developer Experience
1. Add local development authentication helpers
2. Create deployment troubleshooting guide
3. Implement deployment status monitoring
4. Add automated deployment health checks

## Security Considerations

### Token Management
- Tokens stored as GitHub repository secrets
- No token logging or exposure in build outputs
- Token rotation support and documentation
- Principle of least privilege for deployment tokens

### Deployment Security
- Verification of deployment target before execution
- Secure handling of environment variables
- Audit logging for deployment activities
- Protection against deployment to wrong environments

### Error Handling Security
- Sanitized error messages to prevent information disclosure
- Secure logging practices
- No credential exposure in error outputs
- Proper handling of authentication failures

## Monitoring and Observability

### Deployment Metrics
- Deployment success/failure rates
- Deployment duration tracking
- Authentication failure monitoring
- Error categorization and trending

### Alerting
- Failed deployment notifications
- Authentication issue alerts
- Performance degradation detection
- Security incident monitoring

### Logging
- Structured deployment logs
- Authentication event logging
- Error tracking and categorization
- Performance metrics collection