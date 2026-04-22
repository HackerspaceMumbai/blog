# Migration Guide: Netlify to Cloudflare Pages

This document outlines the migration from Netlify to Cloudflare Pages for the Hackerspace Mumbai blog.

## Overview

Following Cloudflare's acquisition of Astro in January 2026, we're migrating from Netlify to Cloudflare Pages to:
- Achieve dev-to-prod parity (Astro 6 uses `workerd` for local development)
- Consolidate infrastructure (DNS and security already on Cloudflare)
- Improve performance and reduce costs

## Migration Checklist

### ✅ Completed Steps

1. **Removed Netlify Dependencies**
   - Removed `@netlify/functions` package
   - Removed `netlify-cli` package

2. **Installed Cloudflare Adapter**
   - Added `@astrojs/cloudflare` package
   - Configured `astro.config.mjs` with `output: 'server'` and `platformProxy: true`

3. **Refactored Functions**
   - Converted `netlify/functions/newsletter.ts` → `functions/newsletter.ts`
   - Converted `netlify/functions/newsletter-health.ts` → `functions/newsletter-health.ts`
   - Updated function signatures from Netlify's `handler` to Cloudflare's `onRequest`
   - Replaced Netlify's `HandlerEvent/HandlerContext` with Cloudflare's `context` object

4. **Updated Package Scripts**
   - Replaced `dev:netlify` with Astro's built-in dev server
   - Removed Netlify deployment scripts
   - Added `pages:dev` and `pages:deploy` for Cloudflare Pages

5. **Created Configuration Files**
   - Created `wrangler.toml` for Cloudflare Pages configuration
   - Created `public/_redirects` for URL rewrites

## Function Signature Changes

### Before (Netlify)
```typescript
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Access headers: event.headers
  // Access body: event.body
  // Access IP: event.headers['x-forwarded-for']
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  };
};
```

### After (Cloudflare)
```typescript
export async function onRequest(context: any) {
  const { request, env } = context;
  
  // Access headers: request.headers.get('header-name')
  // Access body: await request.json()
  // Access IP: request.headers.get('CF-Connecting-IP')
  // Access environment variables: env.VAR_NAME
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Environment Variables

Environment variables need to be migrated from Netlify to Cloudflare Pages.

### Required Variables
1. `KIT_API_KEY` - ConvertKit API key
2. `KIT_FORM_ID` - ConvertKit form ID (optional, not used in v4 API)
3. `NODE_ENV` - Environment (production/development)
4. `CORS_ORIGIN` - CORS origin setting
5. `LOG_LEVEL` - Logging level (info/debug/error)

### How to Set in Cloudflare
1. Go to Cloudflare Dashboard
2. Navigate to Pages → Your Project → Settings → Environment Variables
3. Add variables for both Production and Preview environments

## Custom Domain Setup

1. In Cloudflare Dashboard, navigate to Pages → Your Project → Custom Domains
2. Add `hackmum.in` as a custom domain
3. Cloudflare will automatically configure DNS if the domain is in your account
4. If DNS is elsewhere, follow Cloudflare's instructions to update nameservers

## Rate Limiting

### Current Implementation
- Uses in-memory storage (resets on isolate restart)
- Limited to single isolate lifetime

### Production Recommendation
For production, consider using Cloudflare KV for persistent rate limiting:

1. Create a KV namespace in Cloudflare Dashboard
2. Uncomment the KV binding in `wrangler.toml`
3. The functions are already set up to use KV if available

## CPU Time Limit Awareness

⚠️ **Important**: Cloudflare Pages Functions (Free Tier) have a **10ms CPU time limit**.

- This is *processing time*, not wall time
- Waiting for external APIs (like Kit/ConvertKit) doesn't count
- Our newsletter function is designed to be lightweight (parsing + API call)
- Health check function is minimal

### Best Practices
- Avoid heavy computation or complex loops
- Keep processing logic minimal before making `fetch` calls
- Use async operations for I/O (network requests)

## Testing Locally

### Start Development Server
```bash
pnpm dev
```

The Astro dev server now uses Cloudflare's `workerd` runtime (Astro 6), providing dev-to-prod parity.

### Test Newsletter Function
```bash
curl -X POST http://localhost:4321/api/newsletter \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","source":"test","firstName":"Test"}'
```

### Test Health Check
```bash
curl http://localhost:4321/api/newsletter-health
```

## Deployment

### Build the Project
```bash
pnpm build
```

### Deploy to Cloudflare Pages

#### Option 1: Using Wrangler CLI
```bash
pnpm pages:deploy
```

#### Option 2: Using Git Integration
1. Connect your Git repository to Cloudflare Pages
2. Set build command: `pnpm build`
3. Set build output directory: `dist`
4. Cloudflare will auto-deploy on push to main branch

## Migration Timeline

1. **Phase 1: Testing** (Current)
   - Test functions locally with Cloudflare runtime
   - Verify all newsletter submissions work
   - Test health checks

2. **Phase 2: Preview Deployment**
   - Deploy to Cloudflare Pages preview environment
   - Test with real API keys in preview
   - Verify custom domain configuration

3. **Phase 3: Production Cutover**
   - Update DNS to point to Cloudflare Pages
   - Migrate environment variables
   - Monitor for errors
   - Keep Netlify as backup for 30 days

4. **Phase 4: Cleanup**
   - Remove old Netlify configuration files
   - Archive Netlify deployment
   - Update documentation

## Files Changed

### Added
- `functions/newsletter.ts` - Cloudflare newsletter function
- `functions/newsletter-health.ts` - Cloudflare health check function
- `wrangler.toml` - Cloudflare Pages configuration
- `public/_redirects` - URL rewrites
- `CLOUDFLARE_MIGRATION.md` - This document

### Modified
- `astro.config.mjs` - Added Cloudflare adapter
- `package.json` - Updated dependencies and scripts

### To be Removed (Post-Migration)
- `netlify/` - Entire directory
- `netlify.toml` - Netlify configuration
- Netlify-specific test files

## Rollback Plan

If issues arise, rollback is simple:
1. Revert DNS changes to point back to Netlify
2. Netlify deployment remains active during transition
3. All old functions still exist in `netlify/` directory

## Support & Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Integration](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Astro 6 Release Notes](https://astro.build/blog/)

## Questions & Issues

For questions or issues during migration:
1. Check Cloudflare dashboard logs
2. Review Wrangler CLI output
3. Consult Astro Discord #deployment channel
4. Open an issue in the repository
