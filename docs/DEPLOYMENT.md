# Deployment Flow

## Current: Cloudflare Workers

- Build and deploy: `pnpm deploy` (runs `pnpm build && wrangler deploy`).
- Local HTTPS production preview: `pnpm exec wrangler dev --local --local-protocol https`,
  after `pnpm build` (accept the local development certificate).
- Validate generated articles and image budgets: `pnpm test:cloudflare-build`.
- With a running preview, verify stylesheet delivery across routes:
  `pnpm test:cloudflare-build http://localhost:4321`.
- Deploy the generated Worker configuration, not `dist` as a Pages upload.

The Cloudflare adapter compiles images for prerendered blog articles with Sharp
at build time. Dynamic routes continue to use the Cloudflare Images binding.
The original images remain available for social metadata and dynamic pages.
Static articles do not depend on runtime image transformations.

Blog articles are rebuilt when content changes. Blog listings and other
time-sensitive pages remain dynamic, preserving publication-date filtering and
live event behavior. Newsletter endpoints remain dynamic and use `no-store`.

Static responses use `public/_headers`. Astro middleware applies matching
protections to Worker-generated responses; keep these policies synchronized
with `src/config/responseHeaders.ts` (covered by tests). Executable scripts stay
external so the CSP does not require `unsafe-inline` or `unsafe-eval` for scripts.
Small inline styles are still permitted. Only fingerprinted `/assets/` and
`/_astro/` files receive year-long immutable caching.
Generated filenames are URL-safe so Cloudflare serves stylesheets directly
without encoded-path redirects (important for HTTP previews under production CSP).

Use HTTPS for production-preview browser checks because production CSP upgrades
HTTP asset requests to HTTPS. The regular `pnpm dev` server is exempt from the
production middleware policy so local HTTP development and HMR keep working.
Workers logs and traces are sampled at 10%, with request query strings redacted.

The adapter needs the configured Cloudflare Images binding for dynamic image
requests and existing newsletter secrets for subscription requests. Do not put
secrets in source control. The default Worker variables select production
behavior, including restricted newsletter CORS. For a development-environment
build, use `CLOUDFLARE_ENV=dev pnpm build`; select the environment at build time,
not only at deploy time. No Pages-specific scripts are used.

## Legacy: Netlify

## Overview
This project uses a simplified deployment approach that leverages Netlify's built-in GitHub integration for automatic deployments.

## How It Works

### 1. GitHub Actions (CI/CD)
- **Purpose**: Testing and validation
- **Triggers**: Push to `main`/`develop` branches, Pull requests
- **What it does**:
  - ✅ Runs tests across Node.js 18.x and 20.x
  - ✅ Installs Playwright browsers
  - ✅ Executes CI test orchestrator
  - ✅ Builds the project (`pnpm build`)
  - ✅ Uploads test coverage and reports

### 2. Netlify Auto-Deployment
- **Purpose**: Automatic deployment
- **Triggers**: Push to configured branches (usually `main` for production)
- **What it does**:
  - 🚀 Automatically builds and deploys when GitHub Actions pass
  - 🌐 Creates preview deployments for pull requests
  - 📊 Handles build optimization and CDN distribution
  - 🔒 Manages environment variables and secrets

## Benefits of This Approach

1. **Simplicity**: No need to manage Netlify tokens in GitHub
2. **Security**: Netlify handles authentication automatically
3. **Reliability**: Each tool does what it does best
4. **Speed**: Faster deployments with Netlify's optimized build process
5. **Preview Deployments**: Automatic preview URLs for pull requests

## Configuration

### Netlify Configuration
- Build settings are defined in `netlify.toml`
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### GitHub Actions
- Configuration in `.github/workflows/ci.yml`
- Focuses purely on testing and validation
- No deployment steps needed

## Deployment Process

1. **Developer pushes code** to GitHub
2. **GitHub Actions run** tests and build validation
3. **If tests pass**, Netlify automatically:
   - Pulls the latest code
   - Runs the build process
   - Deploys to production or preview
4. **Site is live** with optimized assets and functions

## Troubleshooting

- **Build fails**: Check Netlify build logs in the Netlify dashboard
- **Tests fail**: Check GitHub Actions logs
- **Functions not working**: Verify `netlify/functions` directory structure

## Manual Commands (for local development)

```bash
# Local development
pnpm dev                    # Start development server
pnpm build                 # Build for production
pnpm preview               # Preview production build locally

# Testing
pnpm test                  # Run tests
pnpm test:ci-orchestrator  # Run CI test suite
```

This approach follows the principle of using each tool for its strengths - GitHub Actions for CI/CD testing, and Netlify for deployment automation.
