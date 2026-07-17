# Contributing to Hackerspace Mumbai Website

Welcome to the Hackerspace Mumbai website repository! We're excited to have you contribute to our community platform.

## 📝 Content Creation Guide

### Creating Blog Posts with Colocated Images

Our blog system uses Astro content collections with colocated images, meaning each blog post has its own directory containing both the content and all associated images.

#### Directory Structure

Each blog post should be organized as follows:

```
src/content/posts/
├── your-post-slug/
│   ├── index.mdx              # Main blog post content
│   ├── cover.png              # Cover image (required)
│   ├── diagram-1.png          # Inline images
│   ├── screenshot-2.jpg       # More inline images
│   └── ...                    # Any other assets
```

#### Step-by-Step: Creating a New Blog Post

1. **Create the post directory**
   ```bash
   mkdir src/content/posts/your-post-slug
   ```

2. **Add your cover image**
   - Place your cover image in the directory
   - Name it `cover.png`, `cover.jpg`, or `cover.webp`
   - Recommended size: 800x450px (16:9 aspect ratio)

3. **Create the index.mdx file**
   ```bash
   touch src/content/posts/your-post-slug/index.mdx
   ```

4. **Add frontmatter and content** (see examples below)

#### Frontmatter Example

```yaml
---
title: "Your Amazing Blog Post Title"
date: 2024-01-15
description: "A compelling description that will appear in search results and social media previews"
cover: ./cover.png                    # Relative path to your cover image
author: "Your Name"
tags:
  - javascript
  - astro
  - tutorial
categories: ["Web Development"]
---
```

#### Referencing Images in Content

**For inline images, use Astro's Image component:**

```mdx
---
title: "My Post"
# ... other frontmatter
---

import { Image } from 'astro:assets';
import setupDiagram from './setup-diagram.png';
import resultScreenshot from './result-screenshot.jpg';

## Setup Process

Here's how to set up the project:

<Image 
  src={setupDiagram} 
  alt="Setup process diagram showing the three main steps" 
  width={600}
  height={400}
/>

## Results

After following the steps, you should see:

<Image 
  src={resultScreenshot} 
  alt="Screenshot showing the successful setup with green checkmarks" 
  width={800}
  height={450}
/>
```

#### Image Guidelines

**Cover Images:**
- **Size:** 800x450px (16:9 aspect ratio) recommended
- **Format:** PNG, JPG, or WebP
- **File size:** Keep under 500KB for optimal performance
- **Naming:** Use `cover.png`, `cover.jpg`, or `cover.webp`

**Inline Images:**
- **Descriptive names:** Use kebab-case (e.g., `user-dashboard-screenshot.png`)
- **Alt text:** Always provide meaningful alt text for accessibility
- **Size:** Optimize for web (usually under 200KB per image)
- **Format:** PNG for screenshots/diagrams, JPG for photos

#### Complete Example

Here's a complete example of a blog post structure:

```
src/content/posts/getting-started-with-astro/
├── index.mdx
├── cover.png
├── astro-logo.png
├── project-structure.png
└── final-result.jpg
```

**index.mdx:**
```mdx
---
title: "Getting Started with Astro: A Beginner's Guide"
date: 2024-01-15
description: "Learn how to build fast, modern websites with Astro's island architecture and component-based approach"
cover: ./cover.png
author: "Jane Developer"
tags:
  - astro
  - javascript
  - tutorial
  - beginner
categories: ["Web Development", "Tutorials"]
---

import { Image } from 'astro:assets';
import astroLogo from './astro-logo.png';
import projectStructure from './project-structure.png';
import finalResult from './final-result.jpg';

# Getting Started with Astro

Astro is a modern web framework that delivers lightning-fast websites with a focus on content and performance.

## What is Astro?

<Image 
  src={astroLogo} 
  alt="Astro logo with rocket ship icon" 
  width={200}
  height={200}
/>

Astro is a static site generator that allows you to build websites using your favorite UI components...

## Project Structure

When you create a new Astro project, you'll see a structure like this:

<Image 
  src={projectStructure} 
  alt="File explorer showing Astro project structure with src, public, and config files" 
  width={400}
  height={600}
/>

## Final Result

Here's what your finished site will look like:

<Image 
  src={finalResult} 
  alt="Screenshot of the completed Astro website with header, content, and footer" 
  width={800}
  height={450}
/>

## Conclusion

Astro makes it easy to build fast, modern websites...
```

### Creating Past Events with Speaker Resources

Each past event can include speaker resources (slides, videos, documentation, recordings, etc.). Resources are stored in the `public/` folder and served statically, or linked remotely.

#### Directory Structure

Each past event is organized as follows:

**Content** (in `src/content/pastEvents/`):
```
src/content/pastEvents/
├── your-event-slug/
│   └── index.md               # Event metadata and speaker resources
```

**Resources** (in `public/`):
```
public/content/past-events/
└── your-event-slug/
    └── resources/             # Speaker resource files
        ├── speaker1-slides.pdf
        ├── workshop-recording.zip
        ├── agentic-workflows.md
        └── github-repo-link.txt
```

#### Step-by-Step: Creating a New Past Event

1. **Create the event content directory**
   ```bash
   mkdir src/content/pastEvents/your-event-slug
   ```

2. **Create the resources directory in public**
   ```bash
   mkdir -p public/content/past-events/your-event-slug/resources
   ```

3. **Create the index.md file**
   ```bash
   touch src/content/pastEvents/your-event-slug/index.md
   ```

4. **Add frontmatter and metadata** (see examples below)

5. **Add speaker resources** (optional)
   - PDFs, slides, recordings, etc. go in `public/content/past-events/{your-event-slug}/resources/`
   - Update frontmatter with resource links using relative paths: `./resources/filename`

#### Frontmatter Example

```yaml
---
title: "Your Event Title"
date: 2024-04-15
location: "Hackerspace Mumbai"
description: "A compelling description of your event"
speakerResources:
  - speakerName: "Speaker One"
    resourceTitle: "Presentation Slides"
    resourceUrl: "./resources/speaker1-slides.pdf"  # Local file
    resourceType: "slides"
    description: "Main presentation slides covering the key topics"
  
  - speakerName: "Speaker Two"
    resourceTitle: "Workshop Recording"
    resourceUrl: "./resources/workshop-recording.zip"  # Local file
    resourceType: "recording"
    description: "Complete recording of the live workshop session"
  
  - speakerName: "Speaker One"
    resourceTitle: "GitHub Repository"
    resourceUrl: "https://github.com/example/repo"  # Remote link
    resourceType: "github"
    description: "Code examples and sample projects from the talk"
  
  - speakerName: "Speaker Two"
    resourceTitle: "Blog Post"
    resourceUrl: "https://example.com/blog/article"  # Remote link
    resourceType: "blog"
    description: "Detailed write-up of the workshop concepts"
---
```

#### Resource URL Formats

**Local Resources:**
- Use relative paths starting with `./resources/`
- File is stored locally in the `resources/` folder
- Example: `./resources/copilot-cli-mastery-slides.pdf`
- Resolved to: `/content/past-events/your-event-slug/resources/copilot-cli-mastery-slides.pdf`

**Remote Resources:**
- Use full URLs with `http://` or `https://`
- Link to external websites, docs, videos, etc.
- Example: `https://youtube.com/watch?v=abc123`
- Kept as-is in the output

**Supported Resource Types:**
- `slides` - Presentation slides
- `video` - Video link or recording
- `recording` - Audio/video recording
- `documentation` - Written documentation
- `blog` - Blog post or article
- `github` - GitHub repository link
- `other` - Any other type of resource

#### Complete Example

Here's a complete example of a past event:

**Content structure:**
```
src/content/pastEvents/azure-conference-2024/
└── index.md
```

**Resources structure:**
```
public/content/past-events/azure-conference-2024/
└── resources/
    ├── azure-ai-fundamentals-slides.pdf
    ├── live-demo-recording.zip
    └── devops-checklist.md
```

**index.md:**
```markdown
---
title: "Azure Conference 2024 - AI & DevOps Track"
date: 2024-04-15
location: "Mumbai Convention Center"
description: "Join us for an in-depth exploration of Azure's latest AI services and DevOps best practices"
speakerResources:
  - speakerName: "Dr. Rajesh Patel"
    resourceTitle: "Azure AI Fundamentals"
    resourceUrl: "./resources/azure-ai-fundamentals-slides.pdf"
    resourceType: "slides"
    description: "Comprehensive slides covering Azure AI services, pricing, and use cases"
  
  - speakerName: "Priya Sharma"
    resourceTitle: "Live Demo Recording"
    resourceUrl: "./resources/live-demo-recording.zip"
    resourceType: "recording"
    description: "Complete recording of the live DevOps demo with setup scripts"
  
  - speakerName: "Priya Sharma"
    resourceTitle: "DevOps Checklist"
    resourceUrl: "./resources/devops-checklist.md"
    resourceType: "documentation"
    description: "Step-by-step checklist for implementing Azure DevOps pipelines"
  
  - speakerName: "Dr. Rajesh Patel"
    resourceTitle: "Official Azure Documentation"
    resourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/"
    resourceType: "documentation"
    description: "Official Microsoft Azure AI Services documentation"
---
```

#### Adding Resource Files

1. **Create resource directory in public**
   ```bash
   mkdir -p public/content/past-events/your-event-slug/resources
   ```

2. **Copy resource files to public directory**
   ```bash
   cp slides.pdf public/content/past-events/your-event-slug/resources/
   cp recording.zip public/content/past-events/your-event-slug/resources/
   ```

3. **Reference in frontmatter**
   - Use relative paths: `./resources/filename.ext`
   - Astro will serve these files automatically from the public folder

4. **Test locally**
   ```bash
   pnpm dev
   # Navigate to the event page and verify resource links work
   ```

5. **Build and test**
   ```bash
   pnpm build
   pnpm preview
   # Verify resource files are accessible in production build
   ```



## 🔧 Development Workflow

### Setting Up Your Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/HackerspaceMumbai/blog.git
   cd blog
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:4321`

### Testing Your Content

Before submitting your blog post:

1. **Test in development**
   ```bash
   pnpm dev
   ```
   - Verify your post appears in the blog list
   - Check that all images load correctly
   - Ensure the cover image displays properly

2. **Test the build**
   ```bash
   pnpm build
   pnpm preview
   ```
   - Ensure your post builds without errors
   - Verify image optimization works correctly

3. **Run accessibility tests**
   ```bash
   pnpm test:a11y
   ```

## 🚨 Troubleshooting Common Issues

### Images Not Loading

**Problem:** Images appear broken or don't load in development/production.

**Solutions:**
1. **Check file paths:** Ensure image imports use `./` for relative paths
   ```mdx
   import myImage from './my-image.png';  ✅ Correct
   import myImage from 'my-image.png';    ❌ Incorrect
   ```

2. **Verify file names:** Ensure imported names match actual filenames
   ```mdx
   import setupDiagram from './setup-diagram.png';  ✅ File exists
   import setupDiagram from './setup_diagram.png';  ❌ Wrong filename
   ```

3. **Check image formats:** Use supported formats (PNG, JPG, WebP, SVG)

### Cover Image Not Displaying

**Problem:** Cover image doesn't appear on blog cards or post headers.

**Solutions:**
1. **Check frontmatter path:**
   ```yaml
   cover: ./cover.png  ✅ Correct relative path
   cover: cover.png    ❌ Missing ./
   ```

2. **Verify file exists:** Ensure the cover image file is in the post directory

3. **Check file extension:** Make sure the extension in frontmatter matches the actual file

### Build Errors

**Problem:** Build fails with image-related errors.

**Solutions:**
1. **Check for missing images:** Ensure all imported images exist
2. **Verify import syntax:** Use proper ES6 import syntax
3. **Check file permissions:** Ensure image files are readable

### TypeScript Errors

**Problem:** TypeScript complains about image imports.

**Solutions:**
1. **Use proper typing:** Import images as shown in examples
2. **Check astro.config.mjs:** Ensure image integration is properly configured

### Performance Issues

**Problem:** Images are too large or slow to load.

**Solutions:**
1. **Optimize image sizes:** Keep images under recommended file sizes
2. **Use appropriate formats:** PNG for graphics, JPG for photos
3. **Leverage Astro's optimization:** Let Astro handle WebP conversion and sizing

## 📋 Content Guidelines

### Writing Style
- Write in a clear, conversational tone
- Use headings to structure your content
- Include code examples where relevant
- Add alt text to all images for accessibility

### Technical Content
- Test all code examples before publishing
- Include setup instructions when necessary
- Explain complex concepts step by step
- Link to relevant documentation

### SEO Best Practices
- Write descriptive titles (50-60 characters)
- Create compelling descriptions (150-160 characters)
- Use relevant tags and categories
- Include internal links where appropriate

## 🤝 Submitting Your Contribution

1. **Create a feature branch**
   ```bash
   git checkout -b add-blog-post-your-topic
   ```

2. **Add your content**
   - Create your blog post directory and files
   - Test locally to ensure everything works

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add blog post: Your Topic Title"
   ```

4. **Push and create a pull request**
   ```bash
   git push origin add-blog-post-your-topic
   ```

5. **Create a pull request** on GitHub with:
   - Clear title describing your contribution
   - Description of what you've added
   - Any special considerations or notes

## 📞 Getting Help

- **Discord/Telegram:** Join our community channels for real-time help
- **GitHub Issues:** Create an issue for bugs or feature requests
- **Documentation:** Check the `/docs` folder for detailed technical documentation

Thank you for contributing to the Hackerspace Mumbai community! 🚀