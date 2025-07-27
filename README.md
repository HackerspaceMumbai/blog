
# Hackerspace Mumbai Community Site (Astro)

Welcome to the official repository for [hackmum.in](http://hackmum.in), the home of Hackerspace Mumbai — the largest open source community in Mumbai and host of the city’s longest-running tech meetup (#meetup).

## 🚀 Migration Notice

This site has been migrated from [Eleventy High Performance Blog](https://github.com/HackerspaceMumbai/eleventy-high-performance-blog) to [Astro](https://astro.build/) for a modern, high-performance, and maintainable experience.

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
