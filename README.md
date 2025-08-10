
# Hackerspace Mumbai Community Site (Astro)

Welcome to the official repository for [hackmum.in](http://hackmum.in), the home of Hackerspace Mumbai — the largest open-source community in Mumbai and host of the city’s longest-running tech meetup (#meetup).

## 🚀 Migration Notice

This site has been migrated from [Eleventy High-Performance Blog](https://github.com/HackerspaceMumbai/eleventy-high-performance-blog) to [Astro](https://astro.build/) for a modern, high-performance, and maintainable experience.

## 🌟 Home Page Features

- **Hero Section:** Community branding, mission, and social links
- **Upcoming Events & Meetups:** List of upcoming events, RSVP links, and highlights
- **Community Blog & News:** Latest posts, tags, and author info
- **About the Community:** History, stats, and testimonials
- **Get Involved:** Join links, contribution info, and GitHub projects
- **Sponsors & Partners:** Logos and links
- **Media Gallery:** Photos and videos from past events
- **Accessibility & SEO:** Best practices, metadata, sitemap
- **Security & Privacy:** Strong CSP, privacy policy
- **Footer:** Quick links, copyright, and social

See the [Product Requirements Document](#product-requirements-document) below for full details.

## 📁 Project Structure

```
/public         # Static assets (images, favicon, etc.)
/src
	/assets       # Images and static content
	/components   # Astro components (Header, Footer, etc.)
	/content      # Blog posts and content config
	/pages        # Astro pages (index.astro, blog, etc.)
	/styles       # Global and component CSS
astro.config.mjs
package.json
tsconfig.json
```

## �‍💻 Getting Started

All commands are run from the root of the project:

| Command         | Action                                    |
|-----------------|-------------------------------------------|
| `pnpm install`  | Install dependencies                      |
| `pnpm dev`      | Start local dev server at `localhost:4321`|
| `pnpm build`    | Build your production site to `./dist/`   |
| `pnpm preview`  | Preview your build locally                |

## 🚀 Deployment

### Netlify Deployment Setup

This project is configured for automated deployment to Netlify through GitHub Actions. The deployment process requires proper authentication setup for both CI/CD and local development.

#### Required Environment Variables

For successful deployment, you need to configure the following environment variables:

- **`NETLIFY_AUTH_TOKEN`**: Personal access token for Netlify API authentication
- **`NETLIFY_SITE_ID`**: Unique identifier for your Netlify site

#### GitHub Repository Secrets Setup

1. **Generate Netlify Auth Token:**
   - Go to [Netlify User Settings > Applications](https://app.netlify.com/user/applications)
   - Click "New access token"
   - Give it a descriptive name (e.g., "GitHub Actions Deploy")
   - Copy the generated token

2. **Find Your Site ID:**
   - Go to your site in Netlify dashboard
   - Navigate to Site Settings > General
   - Copy the "Site ID" from the Site Information section

3. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add the following repository secrets:
     - `NETLIFY_AUTH_TOKEN`: Your Netlify access token
     - `NETLIFY_SITE_ID`: Your Netlify site ID

#### Deployment Commands

| Command                | Action                                           |
|------------------------|--------------------------------------------------|
| `pnpm deploy:preview`  | Deploy preview build (requires auth setup)      |
| `pnpm deploy:prod`     | Deploy to production (requires auth setup)      |
| `pnpm deploy:preview:ci` | CI-optimized preview deploy with JSON output  |
| `pnpm deploy:prod:ci`  | CI-optimized production deploy with JSON output |

#### Local Development Deployment

For local deployment testing:

1. **Set up environment variables:**
   ```bash
   export NETLIFY_AUTH_TOKEN="your_token_here"
   export NETLIFY_SITE_ID="your_site_id_here"
   ```

2. **Verify authentication:**
   ```bash
   netlify status
   ```

3. **Deploy preview:**
   ```bash
   pnpm build
   pnpm deploy:preview
   ```

#### CI/CD Workflow

The GitHub Actions workflow automatically:
- Verifies Netlify credentials are properly configured
- Builds the site with production optimizations
- Deploys to Netlify using token-based authentication
- Runs post-deployment health checks
- Reports deployment status and URLs

#### Additional Documentation

- **[Deployment Troubleshooting Guide](docs/deployment-troubleshooting.md)** - Resolve common authentication and deployment issues
- **[Developer Onboarding Guide](docs/developer-onboarding.md)** - Complete setup guide for new developers
- **[Deployment Workflows](docs/deployment-workflows.md)** - Detailed comparison of CI/CD vs local deployment workflows

## ✍️ Creating Blog Content

### Quick Start for Content Creators

Our blog uses Astro content collections with **colocated images** - each blog post has its own directory containing both content and images.

**Basic Structure:**
```
src/content/posts/your-post-slug/
├── index.mdx        # Your blog post
├── cover.png        # Cover image (required)
└── diagram.png      # Any inline images
```

**Creating a New Post:**

1. **Create directory:** `mkdir src/content/posts/your-post-slug`
2. **Add cover image:** Place `cover.png` (800x450px recommended) in the directory
3. **Create content:** Add `index.mdx` with proper frontmatter:

```yaml
---
title: "Your Post Title"
date: 2024-01-15
description: "SEO-friendly description"
cover: ./cover.png
author: "Your Name"
tags: ["javascript", "tutorial"]
categories: ["Web Development"]
---
```

4. **Reference images in content:**
```mdx
import { Image } from 'astro:assets';
import diagram from './diagram.png';

<Image src={diagram} alt="Helpful description" width={600} height={400} />
```

**See [CONTRIBUTING.md](CONTRIBUTING.md) for complete documentation, examples, and troubleshooting.**

## 🤝 Community & Contribution

- Join our [Discord](#) / [Telegram](#) / [Mailing List](#) (links TBD)
- Contribute via [GitHub Issues](https://github.com/HackerspaceMumbai/blog/issues) or pull requests
- See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed content creation guidelines

## 📄 Product Requirements Document

### Purpose
Create a modern, engaging, and high-performance home page for Hackerspace Mumbai, showcasing the community, events, and content, and fostering engagement and growth.

### Core Features
- Hero section with branding, mission, and social links
- Upcoming events & meetups with RSVP
- Community blog & news
- About the community (history, stats, testimonials)
- Get involved (join, contribute, GitHub projects)
- Sponsors & partners
- Media gallery
- Accessibility & SEO best practices
- Security & privacy (CSP, policy)
- Footer with quick links

### Technical Requirements (Astro-specific)

- Integration with external event platforms (e.g., Meetup.com API)
- Custom analytics integration (if not using Astro integrations)
- Automated build, test, and deployment workflows (CI/CD)
- Custom share buttons and social integrations
- Community member directory or profiles (if implemented)
- Newsletter signup integration

See the full PRD in the project documentation for more details.


## 👀 Want to learn more about Astro?

Check out the [Astro documentation](https://docs.astro.build) or join the [Astro Discord](https://astro.build/chat).
