# Netlify Deployment Configuration

This directory contains the configuration for deploying the Hackerspace Mumbai site to Netlify with serverless functions support.

## Files Overview

- `netlify.toml` - Main Netlify configuration file
- `netlify/functions/newsletter.ts` - Newsletter subscription API endpoint
- `.env.example` - Environment variables template

## Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `KIT_API_KEY` - Your ConvertKit API key
- `KIT_FORM_ID` - Your ConvertKit form ID
- `SITE_URL` - Your site URL

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Local Development

Run the site with Netlify Dev (includes functions):

```bash
pnpm run dev:netlify
```

Or run Astro dev server separately:

```bash
pnpm run dev
```

## Netlify Functions

### Newsletter API (`/api/newsletter`)

**Endpoint:** `POST /api/newsletter`

**Request Body:**
```json
{
  "email": "user@example.com",
  "source": "website_newsletter",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter!",
  "data": {
    "email": "user@example.com",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "This email is already subscribed to our newsletter"
}
```

### Features

- ✅ Email validation
- ✅ Rate limiting (5 attempts per 15 minutes per IP)
- ✅ CORS support
- ✅ ConvertKit integration
- ✅ Fallback local storage
- ✅ Security headers
- ✅ TypeScript support

## Configuration Details

### Build Settings

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Functions Directory:** `netlify/functions`
- **Node Version:** 18

### Headers & Security

The configuration includes comprehensive security headers:

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- CORS headers for API endpoints

### Caching Strategy

- Static assets: 1 year cache
- HTML files: 1 hour cache
- API endpoints: No cache

### Redirects

- `/newsletter` → `/api/newsletter`
- `/subscribe` → `/api/newsletter`
- `/posts/*` → `/blog/:splat` (for migrations)

## ConvertKit Integration

### Setup

1. Get your API key from ConvertKit Dashboard → Account → API Keys
2. Create a form in ConvertKit and get the Form ID
3. Add these to your environment variables

### Features

- Automatic subscriber management
- Tag assignment (`website-signup`)
- Duplicate prevention
- Custom fields (source, signup_date)

### Fallback

If ConvertKit credentials are not configured, the function will:
- Use in-memory storage (for development)
- Log subscriptions to console
- Still validate and process requests

## Performance Optimizations

### Build Optimizations

- CSS/JS bundling and minification
- Image compression
- HTML prettification
- Asset compression

### Plugins

- **Lighthouse Plugin:** Automatic performance audits
- **Sitemap Plugin:** Auto-submit sitemap to search engines

## Deployment

### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Using Git Integration

1. Push to your main branch
2. Netlify will automatically deploy
3. Preview deployments for pull requests

## Environment Variables

Set these in your Netlify dashboard under Site Settings → Environment variables:

### Required
- `KIT_API_KEY`
- `KIT_FORM_ID`
- `SITE_URL`

### Optional
- `NODE_ENV` (automatically set)
- `CORS_ORIGIN` (defaults to SITE_URL)
- `RATE_LIMIT_WINDOW_MS` (defaults to 900000)
- `MAX_ATTEMPTS_PER_WINDOW` (defaults to 5)

## Monitoring & Analytics

### Function Logs

View function logs in Netlify Dashboard:
1. Go to your site dashboard
2. Click on "Functions"
3. Click on "newsletter"
4. View logs in real-time

### Performance Monitoring

The Lighthouse plugin will automatically audit your site on each deploy and provide performance reports.

## Troubleshooting

### Common Issues

**Functions not working locally:**
- Make sure you're using `netlify dev` instead of `astro dev`
- Check that functions directory is correctly set in `netlify.toml`

**CORS errors:**
- Verify `CORS_ORIGIN` environment variable
- Check that your domain matches the configured origin

**Newsletter subscriptions failing:**
- Verify ConvertKit API credentials
- Check function logs for detailed error messages
- Test with a different email address

**Build failures:**
- Check Node version compatibility
- Verify all dependencies are installed
- Review build logs in Netlify dashboard

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=netlify*
```

## Security Considerations

- Rate limiting prevents abuse
- Email validation prevents malformed data
- CORS restrictions limit cross-origin requests
- CSP headers prevent XSS attacks
- All user inputs are sanitized

## Best Practices

1. **Always test locally** with `netlify dev` before deploying
2. **Use environment variables** for sensitive data
3. **Monitor function logs** for errors and performance
4. **Set up alerts** for function failures
5. **Regular security audits** using the included tools

## Support

For issues specific to this configuration:
1. Check the troubleshooting section above
2. Review Netlify function logs
3. Test API endpoints directly using curl or Postman
4. Check ConvertKit API status and rate limits
