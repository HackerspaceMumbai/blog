# Production Deployment Guide

This guide covers the complete production deployment process for the Hackerspace Mumbai newsletter integration.

## Prerequisites

### 1. Kit (ConvertKit) Setup
1. Create a Kit account at [kit.com](https://kit.com)
2. Create a new form for newsletter subscriptions
3. Get your **v4 API key** from Account Settings > API
   - ⚠️ **Important**: Use the **Secret API Key** (starts with `sk_`) for server-side operations
   - ❌ **Don't use**: Public API Key (client-side only, limited permissions)
4. Get your Form ID:
   - **Method 1**: Go to Forms → Select your form → URL shows ID (e.g., `/forms/123456`)
   - **Method 2**: Forms → Settings → Form ID is displayed
   - **Method 3**: API call to `/v4/forms` lists all forms with IDs
5. **Verify v4 compatibility**: Test the API key with a curl request to `https://api.kit.com/v4/account`

### 2. Netlify Setup
1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

## Environment Variables

Configure these environment variables in Netlify:

### Required Variables
```bash
# Kit Configuration (v4 API)
KIT_API_KEY=sk_your_secret_api_key_here  # Must be Secret API Key (starts with sk_)
KIT_FORM_ID=your_kit_form_id_here

# Site Configuration
SITE_URL=https://hackmum.in
NODE_ENV=production
CORS_ORIGIN=https://hackmum.in
```

### Optional Variables
```bash
# Kit API URL (defaults to v4, recommended for production)
KIT_API_URL=https://api.kit.com/v4

# Logging Level (debug, info, warn, error)
LOG_LEVEL=error

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
MAX_ATTEMPTS_PER_WINDOW=5

# Alternative Email Services (if not using Kit)
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
```

## Deployment Process

You have two main options for deployment: using the deployment script (recommended for production) or direct Netlify CLI commands.

### 1. Deployment Script (Recommended for Production)

The deployment script provides comprehensive safety checks and verification:

```bash
# Deploy to preview with full checks
./scripts/deploy.sh preview

# Deploy to production with full checks
./scripts/deploy.sh production
```

**Benefits of using the script:**
- ✅ Validates environment variables are configured
- ✅ Runs all tests before deployment
- ✅ Ensures build succeeds before deploying
- ✅ Post-deployment verification (site accessibility, API health)
- ✅ Colored output and progress indicators
- ✅ Prevents deploying broken code or missing configuration

### 2. Direct Netlify CLI (Quick Deployments)

For faster deployments when you're confident everything is configured:

```bash
# Quick preview deployment
netlify deploy --dir=dist --functions=netlify/functions

# Quick production deployment
netlify deploy --prod --dir=dist --functions=netlify/functions
```

**When to use direct CLI:**
- Quick iterations during development
- You've already run tests manually
- You're confident configuration is correct
- Maximum speed is needed

### 3. Hybrid Approach (Best of Both)

You can also use the npm scripts for different scenarios:

```bash
# Safe deployment with all checks (uses script)
npm run deploy:script:prod

# Quick deployment (direct CLI)
npm run deploy:prod

# Preview deployment
npm run deploy:preview
```

### Deployment Method Comparison

| Feature | Deployment Script | Direct CLI |
|---------|------------------|------------|
| **Speed** | Slower (due to safety checks) | ⚡ Fastest |
| **Safety** | ✅ Comprehensive checks | ⚠️ Manual verification needed |
| **Error Prevention** | ✅ Prevents broken deployments | ❌ No built-in checks |
| **Post-Deploy Verification** | ✅ Automated health checks | ❌ Manual verification |
| **Team Consistency** | ✅ Standardized process | ❌ Varies by developer |
| **Best For** | Production deployments | Development/testing |

### Recommended Workflow

1. **Development**: Use direct CLI for speed
   ```bash
   netlify deploy --dir=dist --functions=netlify/functions
   ```

2. **Staging/Preview**: Use script for verification
   ```bash
   ./scripts/deploy.sh preview
   ```

3. **Production**: Always use script for safety
   ```bash
   ./scripts/deploy.sh production
   ```

## Post-Deployment Verification

### 1. Health Check
Visit `https://hackmum.in/.netlify/functions/health` to verify:
- Overall service health
- Kit API connectivity
- Response times

### 2. Kit v4 API Verification
```bash
# Test Kit v4 API key (replace with your actual key)
curl -H "X-Kit-Api-Key: your_api_key_here" \
  https://api.kit.com/v4/account

# Expected response: Account information (confirms v4 API key works)
```

### 3. Newsletter API Test
```bash
# Test OPTIONS request (CORS preflight)
curl -X OPTIONS https://hackmum.in/.netlify/functions/newsletter

# Test newsletter subscription
curl -X POST https://hackmum.in/.netlify/functions/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"website_newsletter"}'
```

### 3. Frontend Integration Test
1. Visit your website
2. Navigate to the newsletter section
3. Test form submission with:
   - Valid email address
   - Invalid email address
   - Already subscribed email
   - Rate limiting (multiple rapid submissions)

## Monitoring and Maintenance

### 1. Netlify Analytics
- Monitor function invocations
- Check error rates
- Review performance metrics

### 2. Kit Dashboard
- Monitor subscription rates
- Check for failed subscriptions
- Review subscriber engagement

### 3. Error Monitoring
Check Netlify function logs for:
- API errors
- Rate limiting events
- Validation failures
- Kit API connectivity issues

## Security Considerations

### 1. Environment Variables
- Never commit API keys to version control
- Use Netlify's environment variable encryption
- Rotate API keys regularly

### 2. CORS Configuration
- Restrict CORS origins to your domain in production
- Use wildcard (*) only for development/preview

### 3. Rate Limiting
- Monitor for abuse patterns
- Adjust rate limits based on usage
- Consider implementing IP-based blocking for persistent abuse

### 4. Input Validation
- All email validation happens server-side
- Input sanitization prevents injection attacks
- Error messages don't leak sensitive information

## Troubleshooting

### Common Issues

#### 1. Kit API Authentication Errors
```
Error: Kit API authentication failed
```
**Solution:** Verify your `KIT_API_KEY` is correct and has proper permissions.

#### 2. CORS Errors
```
Error: Access to fetch blocked by CORS policy
```
**Solution:** Check `CORS_ORIGIN` environment variable matches your domain.

#### 3. Function Timeout
```
Error: Function execution timed out
```
**Solution:** Kit API might be slow. Check health endpoint and consider increasing timeout.

#### 4. Rate Limiting Issues
```
Error: Too many attempts
```
**Solution:** Normal behavior. Users should wait before retrying.

### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting.

## Performance Optimization

### 1. Function Cold Starts
- Functions warm up automatically with traffic
- Consider implementing a ping service for high-traffic sites

### 2. Caching
- API responses are not cached (intentional for real-time data)
- Static assets are cached via Netlify CDN

### 3. Bundle Size
- Newsletter function is optimized for minimal bundle size
- Dependencies are tree-shaken automatically

## Backup and Recovery

### 1. Subscription Data
- Primary data is stored in Kit
- Fallback storage is in-memory (not persistent)
- Consider implementing database backup for high-volume sites

### 2. Configuration Backup
- Environment variables should be documented
- Keep a secure backup of API keys
- Version control all configuration files

## Scaling Considerations

### 1. High Volume Sites
For sites expecting >1000 subscriptions/day:
- Consider implementing persistent storage (PostgreSQL, MongoDB)
- Add queue system for processing (Redis, AWS SQS)
- Implement more sophisticated rate limiting

### 2. Multiple Environments
- Use different Kit forms for staging/production
- Separate environment variable sets
- Consider branch-based deployments

## Quick Reference: Deployment Commands

### For Different Scenarios

```bash
# 🚀 Quick development deployment
npm run deploy:quick

# 🔍 Quick preview with verification
npm run deploy:safe

# ⚡ Quick production (use with caution)
npm run deploy:quick:prod

# 🛡️ Safe production deployment (recommended)
npm run deploy:safe:prod

# 🔧 Custom deployment with script
./scripts/deploy.sh production

# 📦 Direct Netlify CLI
netlify deploy --prod --dir=dist --functions=netlify/functions
```

### Decision Tree

```
Need to deploy? 
├── Development/Testing?
│   └── Use: npm run deploy:quick
├── Preview/Staging?
│   └── Use: npm run deploy:safe
└── Production?
    ├── In a hurry & confident?
    │   └── Use: npm run deploy:quick:prod
    └── Want safety checks?
        └── Use: npm run deploy:safe:prod (RECOMMENDED)
```

## Support and Maintenance

### 1. Regular Tasks
- Monitor subscription rates weekly
- Check error logs monthly
- Update dependencies quarterly
- Review security settings annually

### 2. Kit Integration Updates
- Monitor Kit API changelog
- Test API changes in staging first
- Update integration as needed

### 3. Performance Reviews
- Review function performance monthly
- Optimize based on usage patterns
- Consider architectural changes for scale

## Emergency Procedures

### 1. Service Outage
If newsletter service is down:
1. Check health endpoint
2. Verify Kit API status
3. Check Netlify function logs
4. Consider enabling fallback storage

### 2. Security Incident
If security breach suspected:
1. Rotate all API keys immediately
2. Review access logs
3. Check for unauthorized subscriptions
4. Update security configurations

### 3. Data Loss
If subscription data is lost:
1. Check Kit dashboard for data integrity
2. Review function logs for errors
3. Contact Kit support if needed
4. Implement additional backup measures