# Deployment Flow

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
