# Content Creation Guide

This guide provides comprehensive instructions for creating blog content using Astro content collections with colocated images.

## 🏗️ Content Architecture

### Colocated Image System

Our blog uses a **colocated image system** where each blog post has its own directory containing:
- The main content file (`index.mdx`)
- Cover image (`cover.png/jpg/webp`)
- All inline images referenced in the post

**Benefits:**
- ✅ Easy content management - everything in one place
- ✅ No need to maintain centralized image mappings
- ✅ Automatic image optimization via Astro
- ✅ Better organization and scalability
- ✅ Simplified content creation workflow

### Directory Structure

```
src/content/posts/
├── azure-authentication-guide/
│   ├── index.mdx                    # Main content
│   ├── cover.png                    # Cover image (required)
│   ├── setup-diagram.png            # Inline images
│   ├── auth-flow.jpg               
│   └── final-result.webp
├── javascript-fundamentals/
│   ├── index.mdx
│   ├── cover.jpg
│   ├── variable-scope.png
│   └── closure-example.png
└── config.ts                       # Content collection schema
```

## 📝 Content Creation Workflow

### Step 1: Plan Your Content

Before creating your post:
1. **Choose a descriptive slug** (URL-friendly name)
2. **Prepare your images** (cover + inline images)
3. **Outline your content structure**

### Step 2: Create Post Directory

```bash
# Create directory with your chosen slug
mkdir src/content/posts/your-post-slug

# Navigate to the directory
cd src/content/posts/your-post-slug
```

### Step 3: Add Cover Image

Every post requires a cover image:

**Requirements:**
- **Dimensions:** 800x450px (16:9 aspect ratio) recommended
- **Format:** PNG, JPG, or WebP
- **File size:** Under 500KB for optimal performance
- **Naming:** `cover.png`, `cover.jpg`, or `cover.webp`

```bash
# Copy your cover image to the post directory
cp ~/path/to/your/cover-image.png ./cover.png
```

### Step 4: Create Content File

Create `index.mdx` with proper frontmatter:

```mdx
---
title: "Your Compelling Blog Post Title"
date: 2024-01-15
description: "A clear, SEO-friendly description that will appear in search results and social media previews. Keep it under 160 characters."
cover: ./cover.png
author: "Your Name"
tags:
  - javascript
  - tutorial
  - beginner
categories: ["Web Development", "Tutorials"]
---

import { Image } from 'astro:assets';
import setupDiagram from './setup-diagram.png';
import authFlow from './auth-flow.jpg';

# Your Blog Post Title

Your engaging introduction goes here...

## Section with Image

Here's how to include images in your content:

<Image 
  src={setupDiagram} 
  alt="Detailed description of what the image shows for accessibility" 
  width={600}
  height={400}
/>

## Another Section

Continue with your content...

<Image 
  src={authFlow} 
  alt="Authentication flow diagram showing user login process" 
  width={800}
  height={450}
/>
```

### Step 5: Add Inline Images

For any images referenced in your content:

1. **Add images to post directory**
2. **Use descriptive filenames** (kebab-case recommended)
3. **Import at the top of your MDX file**
4. **Use Astro's Image component for display**

## 🖼️ Image Best Practices

### Cover Images

**Specifications:**
- **Aspect Ratio:** 16:9 (800x450px recommended)
- **File Size:** Under 500KB
- **Format:** PNG for graphics/screenshots, JPG for photos
- **Content:** Should represent your post topic visually

**Example cover images:**
- Screenshots of the final result
- Relevant diagrams or infographics
- Professional photos related to the topic
- Custom graphics with your post title

### Inline Images

**Guidelines:**
- **Descriptive filenames:** `user-dashboard-screenshot.png` vs `image1.png`
- **Appropriate sizing:** Don't use massive images for small details
- **Meaningful alt text:** Describe what the image shows, not just "image" or "screenshot"
- **Consistent quality:** Maintain similar visual quality across images

**Image sizing recommendations:**
- **Screenshots:** 800-1200px width max
- **Diagrams:** 600-800px width typically
- **Small UI elements:** 300-500px width
- **Full-width images:** Up to 1200px width

### Accessibility Requirements

**Always include meaningful alt text:**

```mdx
<!-- ❌ Poor alt text -->
<Image src={screenshot} alt="screenshot" />

<!-- ✅ Good alt text -->
<Image src={screenshot} alt="User dashboard showing three completed tasks and two pending items" />

<!-- ✅ Decorative images -->
<Image src={decorative} alt="" />  <!-- Empty alt for decorative images -->
```

## 📋 Frontmatter Reference

### Required Fields

```yaml
---
title: "Your Post Title"           # Required - appears in page title and cards
date: 2024-01-15                  # Required - publication date (YYYY-MM-DD)
description: "Post description"    # Required - for SEO and social media
cover: ./cover.png                # Required - relative path to cover image
author: "Author Name"             # Required - post author
---
```

### Optional Fields

```yaml
---
# ... required fields above ...
tags:                             # Optional - for filtering and SEO
  - javascript
  - tutorial
  - beginner
categories:                       # Optional - broader topic groupings
  - "Web Development"
  - "Tutorials"
---
```

### Field Guidelines

**Title:**
- Keep under 60 characters for SEO
- Make it descriptive and engaging
- Use title case

**Description:**
- 120-160 characters for optimal SEO
- Summarize the post's value proposition
- Include relevant keywords naturally

**Tags:**
- Use lowercase, kebab-case
- 3-8 tags per post
- Include technology names, concepts, and difficulty level

**Categories:**
- Use title case
- Broader topics than tags
- 1-3 categories per post

## 🔧 Development and Testing

### Local Development

```bash
# Start development server
pnpm dev

# Your site will be available at http://localhost:4321
```

**Testing checklist:**
- [ ] Post appears in blog list
- [ ] Cover image displays correctly
- [ ] All inline images load properly
- [ ] No console errors
- [ ] Responsive design works on mobile

### Build Testing

```bash
# Test production build
pnpm build
pnpm preview
```

**Production checklist:**
- [ ] Build completes without errors
- [ ] Images are optimized (WebP conversion)
- [ ] All images load in preview mode
- [ ] Performance is acceptable

### Accessibility Testing

```bash
# Run accessibility tests
pnpm test:a11y
```

**Accessibility checklist:**
- [ ] All images have meaningful alt text
- [ ] Heading structure is logical (h1 → h2 → h3)
- [ ] Color contrast is sufficient
- [ ] Content is keyboard navigable

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Images Not Loading

**Symptoms:**
- Broken image icons in browser
- Console errors about missing files
- Images work in development but not in build

**Solutions:**

**Check import paths:**
```mdx
<!-- ✅ Correct - relative path with ./ -->
import diagram from './my-diagram.png';

<!-- ❌ Incorrect - missing ./ -->
import diagram from 'my-diagram.png';
```

**Verify file names match:**
```mdx
<!-- File: setup-process.png -->
import setup from './setup-process.png';  ✅ Correct
import setup from './setup_process.png';  ❌ Wrong filename
```

**Check file extensions:**
```yaml
# File: cover.jpg
cover: ./cover.jpg  ✅ Correct
cover: ./cover.png  ❌ Wrong extension
```

#### 2. Cover Image Not Displaying

**Symptoms:**
- Default placeholder shows instead of your cover
- Cover works in development but not production

**Solutions:**

**Verify frontmatter path:**
```yaml
cover: ./cover.png    ✅ Correct relative path
cover: cover.png      ❌ Missing ./
cover: /cover.png     ❌ Wrong path format
```

**Check file exists in post directory:**
```bash
ls src/content/posts/your-post-slug/
# Should show: index.mdx, cover.png, ...
```

#### 3. Build Errors

**Common error messages and fixes:**

**"Cannot resolve image":**
```bash
# Check that all imported images exist
# Verify import statements match actual filenames
```

**"Invalid image format":**
```bash
# Ensure you're using supported formats: PNG, JPG, WebP, SVG
# Convert unsupported formats (BMP, TIFF, etc.)
```

**"Image too large":**
```bash
# Optimize large images before adding to repository
# Use tools like ImageOptim, TinyPNG, or similar
```

#### 4. TypeScript Errors

**"Cannot find module './image.png'":**

This usually means TypeScript doesn't recognize the image import. Ensure your `astro.config.mjs` is properly configured:

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [
    // ... other integrations
  ],
  // Image integration should be included by default
});
```

#### 5. Performance Issues

**Large bundle sizes:**
- Optimize images before adding them
- Use appropriate image formats (WebP for modern browsers)
- Let Astro handle optimization automatically

**Slow loading:**
- Check image file sizes (keep under recommended limits)
- Ensure lazy loading is working (Astro handles this automatically)

### Getting Help

If you encounter issues not covered here:

1. **Check the console** for specific error messages
2. **Search existing issues** on GitHub
3. **Ask in community channels** (Discord/Telegram)
4. **Create a GitHub issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Error messages (if any)
   - Your environment details

## 📚 Examples and Templates

### Minimal Blog Post Template

```mdx
---
title: "Getting Started with [Technology]"
date: 2024-01-15
description: "Learn the basics of [technology] with this beginner-friendly guide"
cover: ./cover.png
author: "Your Name"
tags: ["beginner", "tutorial"]
categories: ["Tutorials"]
---

import { Image } from 'astro:assets';
import exampleImage from './example.png';

# Getting Started with [Technology]

Brief introduction to what readers will learn...

## What You'll Need

- Prerequisite 1
- Prerequisite 2
- Prerequisite 3

## Step 1: Setup

Detailed setup instructions...

<Image 
  src={exampleImage} 
  alt="Screenshot showing the setup process with highlighted important areas" 
  width={800}
  height={450}
/>

## Step 2: Implementation

Implementation details...

## Conclusion

Summary of what was covered and next steps...
```

### Tutorial Blog Post Template

```mdx
---
title: "Building a [Project] with [Technology]: Complete Guide"
date: 2024-01-15
description: "Step-by-step tutorial for building a [project] using [technology] with practical examples"
cover: ./cover.png
author: "Your Name"
tags: ["tutorial", "project", "intermediate"]
categories: ["Web Development", "Tutorials"]
---

import { Image } from 'astro:assets';
import projectStructure from './project-structure.png';
import finalResult from './final-result.png';
import stepOne from './step-1-setup.png';
import stepTwo from './step-2-implementation.png';

# Building a [Project] with [Technology]

In this comprehensive tutorial, you'll learn how to build a [project description] from scratch...

## What We're Building

<Image 
  src={finalResult} 
  alt="Final project showing [describe what the image shows]" 
  width={800}
  height={450}
/>

## Prerequisites

- Knowledge of [prerequisite 1]
- Familiarity with [prerequisite 2]
- [Tool/software] installed

## Project Setup

Let's start by setting up our project structure:

<Image 
  src={projectStructure} 
  alt="File explorer showing the project directory structure with src, public, and config folders" 
  width={600}
  height={400}
/>

### Step 1: Initial Setup

Detailed setup instructions...

<Image 
  src={stepOne} 
  alt="Terminal showing the setup commands being executed successfully" 
  width={700}
  height={300}
/>

### Step 2: Implementation

Implementation details...

<Image 
  src={stepTwo} 
  alt="Code editor showing the implementation with syntax highlighting" 
  width={800}
  height={500}
/>

## Testing and Deployment

How to test and deploy your project...

## Next Steps

- Enhancement idea 1
- Enhancement idea 2
- Related tutorials to explore

## Resources

- [Official Documentation](https://example.com)
- [GitHub Repository](https://github.com/example)
- [Community Forum](https://example.com)
```

This comprehensive guide should help content creators successfully create blog posts with the new colocated image system. The troubleshooting section addresses common issues, and the templates provide starting points for different types of content.