# Developer Onboarding Guide

Welcome to the Hackerspace Mumbai website development team! This guide will help you set up your local development environment and understand our deployment workflows.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended package manager)
- **Git** (for version control)
- **Netlify CLI** (for deployment testing)

### Installation Commands

```bash
# Install Node.js (using nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm

# Install Netlify CLI
npm install -g netlify-cli

# Verify installations
node --version
pnpm --version
netlify --version
```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/HackerspaceMumbai/blog.git
cd blog
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a local environment file for development:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your values
# Note: This file should NOT be committed to git
```

### 4. Verify Setup

```bash
# Start the development server
pnpm dev

# Open http://localhost:4321 in your browser
# You should see the Hackerspace Mumbai website
```

## Deployment Setup

### Understanding Our Deployment Workflows

We have two main deployment environments:

1. **CI/CD (GitHub Actions)**: Automated deployments for pull requests and production
2. **Local Development**: Manual deployments for testing and development

### Local Development Deployment Setup

#### Step 1: Get Netlify Credentials

You'll need access to our Netlify account to set up local deployment. Contact a maintainer to:

1. **Get added to the Netlify team** for the Hackerspace Mumbai site
2. **Generate a personal access token**:
   - Go to [Netlify User Settings > Applications](https://app.netlify.com/user/applications)
   - Click "New access token"
   - Name it "Local Development - [Your Name]"
   - Copy the generated token

3. **Get the site ID**:
   - Go to the Netlify dashboard
   - Select the Hackerspace Mumbai site
   - Navigate to Site Settings > General
   - Copy the "Site ID" from Site Information

#### Step 2: Configure Local Environment

Add your Netlify credentials to your local environment:

```bash
# Option 1: Add to .env file (recommended)
echo "NETLIFY_AUTH_TOKEN=your_token_here" >> .env
echo "NETLIFY_SITE_ID=your_site_id_here" >> .env

# Option 2: Export directly in your shell
export NETLIFY_AUTH_TOKEN="your_token_here"
export NETLIFY_SITE_ID="your_site_id_here"

# Add to your shell profile for persistence (.bashrc, .zshrc, etc.)
echo 'export NETLIFY_AUTH_TOKEN="your_token_here"' >> ~/.bashrc
echo 'export NETLIFY_SITE_ID="your_site_id_here"' >> ~/.bashrc
```

#### Step 3: Verify Authentication

```bash
# Test Netlify authentication
netlify status

# You should see output like:
# ──────────────────────────────────────────────
#  Current Netlify User
# ──────────────────────────────────────────────
#  Name:  Your Name
#  Email: your.email@example.com
```

#### Step 4: Test Local Deployment

```bash
# Build the site
pnpm build

# Deploy a preview (safe for testing)
pnpm deploy:preview

# You'll get a preview URL like:
# https://deploy-preview-123--your-site.netlify.app
```

### Development Workflow

#### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Make your changes
# 5. Test locally at http://localhost:4321
```

#### Testing Changes

```bash
# Run tests
pnpm test --run

# Run accessibility tests
pnpm test:a11y --run

# Run blog image tests (critical for blog changes)
pnpm test:blog-images --run

# Build and preview production version
pnpm build
pnpm preview
```

#### Deployment Testing

```bash
# Test deployment locally before pushing
pnpm build
pnpm deploy:preview

# Check the preview URL to ensure everything works
# Only then push your changes
```

## Understanding CI vs Local Deployment

### CI/CD Deployment (GitHub Actions)

**When it runs:**
- Automatically on pull requests (preview deployment)
- Automatically on main branch pushes (production deployment)

**How it works:**
- Uses repository secrets for authentication
- Runs in a clean, isolated environment
- Uses CI-optimized commands with `--json` output
- Includes automated health checks and verification

**Key differences:**
- Non-interactive (no prompts)
- Uses structured JSON output for parsing
- Includes comprehensive error handling
- Runs post-deployment verification

**Example CI commands:**
```bash
# CI uses these commands (you don't run these locally)
pnpm deploy:preview:ci  # Outputs JSON for parsing
pnpm deploy:prod:ci     # Production with JSON output
```

### Local Development Deployment

**When to use:**
- Testing changes before creating a pull request
- Debugging deployment issues
- Quick iteration on deployment-related changes

**How it works:**
- Uses your personal Netlify credentials
- Interactive (can prompt for confirmation)
- Uses human-readable output
- Manual verification of results

**Key differences:**
- Interactive prompts allowed
- Human-readable output
- Manual health checking
- Personal authentication tokens

**Example local commands:**
```bash
# Local development uses these commands
pnpm deploy:preview     # Human-readable output
pnpm deploy:prod        # Production deployment (be careful!)
```

### When to Use Each Method

| Scenario | Method | Command |
|----------|--------|---------|
| Testing PR changes | CI/CD | Automatic on PR creation |
| Quick local testing | Local | `pnpm deploy:preview` |
| Production release | CI/CD | Automatic on main branch |
| Debugging deployment | Local | `pnpm deploy:preview` |
| Emergency hotfix | Local | `pnpm deploy:prod` (with caution) |

## Common Development Tasks

### Creating a Blog Post

```bash
# 1. Create new post directory
mkdir src/content/posts/my-new-post

# 2. Add cover image
cp cover-image.png src/content/posts/my-new-post/cover.png

# 3. Create content file
touch src/content/posts/my-new-post/index.mdx

# 4. Test blog image display
pnpm test:blog-images --run

# 5. Preview locally
pnpm dev
```

### Making Component Changes

```bash
# 1. Make your changes to components
# 2. Test the changes
pnpm dev

# 3. Run relevant tests
pnpm test --run

# 4. Test accessibility
pnpm test:a11y --run

# 5. Build and test production version
pnpm build
pnpm preview
```

### Deployment-Related Changes

```bash
# 1. Make changes to deployment scripts
# 2. Test locally first
pnpm build
pnpm deploy:preview

# 3. Verify the preview works
# 4. Create PR for review
# 5. CI will test the changes automatically
```

## Troubleshooting

### Common Issues

#### "Command not found: pnpm"
```bash
# Install pnpm globally
npm install -g pnpm
```

#### "Authentication required" during deployment
```bash
# Check your environment variables
echo $NETLIFY_AUTH_TOKEN
echo $NETLIFY_SITE_ID

# Re-authenticate if needed
netlify login
```

#### "Site not found" error
```bash
# Verify your site ID is correct
netlify sites:list

# Check if you have access to the site
netlify api getSite --data='{"site_id":"YOUR_SITE_ID"}'
```

#### Tests failing
```bash
# Make sure you're using the --run flag
pnpm test --run

# For specific test files
pnpm test path/to/test.js --run

# Clear test cache if needed
rm -rf node_modules/.vitest
```

### Getting Help

1. **Check the troubleshooting guide**: [docs/deployment-troubleshooting.md](deployment-troubleshooting.md)
2. **Review project documentation**: README.md and CONTRIBUTING.md
3. **Ask in team chat**: Mention deployment issues in our communication channel
4. **Create a GitHub issue**: For persistent problems or bugs

## Best Practices

### Security

- **Never commit credentials**: Keep `.env` files out of git
- **Use personal tokens**: Don't share authentication tokens
- **Rotate tokens regularly**: Generate new tokens periodically
- **Limit token scope**: Use tokens with minimal required permissions

### Development

- **Test locally first**: Always test changes locally before pushing
- **Run tests**: Use `--run` flag to ensure tests complete
- **Check accessibility**: Run a11y tests for UI changes
- **Verify blog images**: Run blog image tests for content changes

### Deployment

- **Use preview deployments**: Test with `deploy:preview` before production
- **Verify URLs**: Check preview URLs work correctly
- **Monitor CI/CD**: Watch GitHub Actions for deployment status
- **Document changes**: Update docs when changing deployment process

## Next Steps

After completing this setup:

1. **Read the contributing guide**: [CONTRIBUTING.md](../CONTRIBUTING.md)
2. **Explore the codebase**: Familiarize yourself with the project structure
3. **Make a test change**: Try creating a small blog post or component update
4. **Join team communications**: Get added to relevant chat channels
5. **Review open issues**: Look for "good first issue" labels on GitHub

Welcome to the team! 🚀