# Blog Post Template

Copy this template to quickly create new blog posts with proper structure.

## Directory Setup

```bash
# 1. Create your post directory (replace 'your-post-slug' with your actual slug)
mkdir src/content/posts/your-post-slug

# 2. Navigate to the directory
cd src/content/posts/your-post-slug

# 3. Copy your cover image (rename to cover.png/jpg/webp)
cp ~/path/to/your/cover-image.png ./cover.png

# 4. Create the content file
touch index.mdx
```

## Template: index.mdx

Copy and paste this template into your `index.mdx` file:

```mdx
---
title: "Your Compelling Blog Post Title"
date: 2024-01-15
description: "A clear, engaging description that will appear in search results and social media previews. Keep it under 160 characters for best SEO results."
cover: ./cover.png
author: "Your Name"
tags:
  - javascript
  - tutorial
  - beginner
categories: ["Web Development"]
---

import { Image } from 'astro:assets';
// Import your images here (add more as needed)
// import exampleImage from './example-screenshot.png';
// import diagramImage from './architecture-diagram.png';

# Your Blog Post Title

Write an engaging introduction that hooks your readers and clearly explains what they'll learn or gain from reading your post.

## What You'll Learn

- Key point 1
- Key point 2  
- Key point 3

## Prerequisites (if applicable)

- Prerequisite 1
- Prerequisite 2
- Tool or knowledge requirement

## Main Content Section

Your main content goes here. Break it into logical sections with clear headings.

### Subsection Example

When you need to include an image, use this pattern:

<!-- Uncomment and modify when you add images:
<Image 
  src={exampleImage} 
  alt="Detailed description of what the image shows for accessibility" 
  width={800}
  height={450}
/>
-->

## Code Examples (if applicable)

```javascript
// Your code examples here
function example() {
  console.log("Hello, Hackerspace Mumbai!");
}
```

## Another Main Section

Continue with your content, using clear headings and subheadings to organize information.

## Conclusion

Summarize the key takeaways and provide next steps or additional resources for readers who want to learn more.

## Resources and Further Reading

- [Link to relevant documentation](https://example.com)
- [Related tutorial or article](https://example.com)
- [Community resource](https://example.com)
```

## Customization Guide

### 1. Replace Placeholders

- `your-post-slug` → Your actual URL-friendly post name
- `Your Name` → Your actual name
- `2024-01-15` → Your post's publication date
- Update title, description, tags, and categories

### 2. Add Your Images

1. **Add image files** to your post directory
2. **Import them** at the top of your MDX file:
   ```mdx
   import myScreenshot from './my-screenshot.png';
   import myDiagram from './architecture-diagram.png';
   ```
3. **Use them** in your content:
   ```mdx
   <Image 
     src={myScreenshot} 
     alt="Description of the screenshot" 
     width={800}
     height={450}
   />
   ```

### 3. Customize Structure

Adapt the template sections to match your content:

**For tutorials:**
- Add "Prerequisites" section
- Include step-by-step instructions
- Add "Testing" or "Verification" sections

**For technical deep-dives:**
- Add "Background" or "Context" section
- Include detailed explanations
- Add "Performance" or "Best Practices" sections

**For opinion pieces:**
- Start with your thesis
- Include supporting arguments
- Add counterpoints and responses

## Quick Reference

### Image Guidelines
- **Cover:** 800x450px, under 500KB
- **Inline:** Descriptive filenames, meaningful alt text
- **Format:** PNG for screenshots, JPG for photos

### SEO Tips
- **Title:** Under 60 characters, descriptive
- **Description:** 120-160 characters, include keywords
- **Tags:** 3-8 relevant tags, lowercase
- **Categories:** 1-3 broader topic areas

### Testing Checklist
- [ ] `pnpm dev` - post displays correctly
- [ ] `pnpm build` - builds without errors  
- [ ] `pnpm preview` - production version works
- [ ] All images load properly
- [ ] Alt text provided for accessibility

## Need Help?

- **Full Guide:** [docs/content-creation.md](./content-creation.md)
- **Troubleshooting:** [docs/troubleshooting-quick-reference.md](./troubleshooting-quick-reference.md)
- **Contributing:** [CONTRIBUTING.md](../CONTRIBUTING.md)