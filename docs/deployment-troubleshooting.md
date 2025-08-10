# Deployment Authentication Troubleshooting Guide

This guide helps resolve common authentication issues when deploying the Hackerspace Mumbai site to Netlify through GitHub Actions or local development.

## Common Authentication Issues

### 1. "Timed out waiting for authorization" Error

**Symptoms:**
- GitHub Actions deploy-preview job fails
- Error message: "Timed out waiting for authorization"
- Netlify CLI attempts interactive authentication in CI

**Root Cause:**
The Netlify CLI is trying to use browser-based authentication instead of the provided `NETLIFY_AUTH_TOKEN`.

**Solutions:**

#### Check Environment Variables
```bash
# In GitHub Actions, verify secrets are set:
# Go to Repository Settings > Secrets and variables > Actions
# Ensure these secrets exist:
# - NETLIFY_AUTH_TOKEN
# - NETLIFY_SITE_ID
```

#### Verify Token Format
```bash
# Test your token locally:
export NETLIFY_AUTH_TOKEN="your_token_here"
netlify status --json
```

#### Update Deployment Commands
Ensure your `package.json` scripts use explicit site ID:
```json
{
  "deploy:preview": "netlify deploy --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions",
  "deploy:preview:ci": "netlify deploy --site=$NETLIFY_SITE_ID --dir=dist --functions=netlify/functions --json"
}
```

### 2. Missing or Invalid NETLIFY_AUTH_TOKEN

**Symptoms:**
- "Authentication required" error
- "Invalid token" error
- 401 Unauthorized responses

**Solutions:**

#### Generate New Token
1. Go to [Netlify User Settings > Applications](https://app.netlify.com/user/applications)
2. Click "New access token"
3. Give it a descriptive name (e.g., "GitHub Actions Deploy")
4. Copy the generated token
5. Update GitHub repository secret

#### Verify Token Permissions
```bash
# Test token validity:
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.netlify.com/api/v1/user
```

#### Check Token Expiration
- Netlify tokens don't expire, but they can be revoked
- If token was revoked, generate a new one
- Update all environments using the old token

### 3. Missing or Invalid NETLIFY_SITE_ID

**Symptoms:**
- "Site not found" error
- Interactive site selection prompt in CI
- Deployment to wrong site

**Solutions:**

#### Find Correct Site ID
1. Go to Netlify dashboard
2. Select your site
3. Navigate to Site Settings > General
4. Copy "Site ID" from Site Information section

#### Verify Site ID Format
```bash
# Site ID should be a UUID-like string:
# Example: 12345678-1234-1234-1234-123456789abc
echo $NETLIFY_SITE_ID
```

#### Test Site Access
```bash
# Verify you can access the site:
export NETLIFY_AUTH_TOKEN="your_token"
export NETLIFY_SITE_ID="your_site_id"
netlify api getSite --data='{"site_id":"'$NETLIFY_SITE_ID'"}'
```

### 4. GitHub Actions Workflow Issues

**Symptoms:**
- Secrets not available in workflow
- Environment variables not set
- Workflow fails at credential verification step

**Solutions:**

#### Check Secret Configuration
```yaml
# Ensure secrets are properly referenced in workflow:
env:
  NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
  NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Verify Secret Names
- Secret names are case-sensitive
- No spaces or special characters allowed
- Must match exactly in workflow file

#### Test Credential Verification
Add this step to your workflow for debugging:
```yaml
- name: Debug Netlify credentials
  run: |
    echo "Token length: ${#NETLIFY_AUTH_TOKEN}"
    echo "Site ID: $NETLIFY_SITE_ID"
    netlify status --json
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 5. Local Development Authentication

**Symptoms:**
- Local deployment fails
- Interactive login prompts
- Different behavior between local and CI

**Solutions:**

#### Set Up Local Environment
```bash
# Create .env file (don't commit this):
echo "NETLIFY_AUTH_TOKEN=your_token_here" >> .env
echo "NETLIFY_SITE_ID=your_site_id_here" >> .env

# Or export directly:
export NETLIFY_AUTH_TOKEN="your_token_here"
export NETLIFY_SITE_ID="your_site_id_here"
```

#### Test Local Authentication
```bash
# Verify authentication works:
netlify status

# Test deployment:
pnpm build
pnpm deploy:preview
```

#### Use Netlify Dev for Local Testing
```bash
# Run with Netlify dev server:
netlify dev

# This automatically handles authentication
```

## Environment-Specific Solutions

### CI Environment (GitHub Actions)

**Best Practices:**
- Always use `--json` flag for structured output
- Include credential verification step before deployment
- Use GitHub Actions error annotations for better visibility
- Implement retry logic for network issues

**Example Workflow Step:**
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
```

### Local Development Environment

**Best Practices:**
- Use environment variables instead of interactive login
- Test authentication before attempting deployment
- Keep local and CI authentication methods consistent
- Use `.env` files for local development (add to `.gitignore`)

**Setup Script:**
```bash
#!/bin/bash
# setup-local-deploy.sh

echo "Setting up local Netlify deployment..."

if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
  echo "Please set NETLIFY_AUTH_TOKEN environment variable"
  exit 1
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
  echo "Please set NETLIFY_SITE_ID environment variable"
  exit 1
fi

echo "Testing authentication..."
netlify status

echo "Local deployment setup complete!"
```

## Debugging Commands

### Check Authentication Status
```bash
# Basic status check:
netlify status

# Detailed JSON output:
netlify status --json

# Check specific site:
netlify api getSite --data='{"site_id":"YOUR_SITE_ID"}'
```

### Test Deployment Process
```bash
# Dry run deployment:
netlify deploy --dir=dist --dry-run

# Deploy with debug output:
DEBUG=netlify* netlify deploy --dir=dist
```

### Validate Configuration
```bash
# Check current configuration:
netlify env:list

# Validate site access:
netlify sites:list

# Test API connectivity:
curl -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
     https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID
```

## Prevention Strategies

### 1. Automated Validation
- Add credential validation to deployment scripts
- Implement pre-deployment checks in CI/CD
- Use structured logging for better debugging

### 2. Documentation
- Keep deployment documentation up to date
- Document environment-specific requirements
- Provide troubleshooting examples

### 3. Monitoring
- Monitor deployment success rates
- Set up alerts for authentication failures
- Track deployment duration and error patterns

### 4. Security
- Rotate tokens regularly
- Use least-privilege access
- Audit token usage and permissions

## Getting Help

### Internal Resources
1. Check this troubleshooting guide
2. Review [Netlify Deployment Configuration](netlify-deployment.md)
3. Check project README.md deployment section

### External Resources
1. [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
2. [Netlify API Documentation](https://docs.netlify.com/api/get-started/)
3. [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Support Channels
1. Create GitHub issue with deployment logs
2. Check Netlify status page for service issues
3. Review GitHub Actions workflow logs

## Quick Reference

### Essential Commands
```bash
# Check authentication
netlify status

# List available sites
netlify sites:list

# Deploy preview
netlify deploy --dir=dist

# Deploy production
netlify deploy --prod --dir=dist

# Get deployment info
netlify api listSiteDeploys --data='{"site_id":"YOUR_SITE_ID"}'
```

### Environment Variables
```bash
# Required for deployment
NETLIFY_AUTH_TOKEN=your_personal_access_token
NETLIFY_SITE_ID=your_site_uuid

# Optional for debugging
DEBUG=netlify*
NODE_ENV=production
```

### Common Error Codes
- **401 Unauthorized**: Invalid or missing auth token
- **404 Not Found**: Invalid site ID or insufficient permissions
- **422 Unprocessable Entity**: Invalid deployment parameters
- **429 Too Many Requests**: Rate limiting (wait and retry)