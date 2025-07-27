# Contributing to Hackerspace Mumbai Blog

Thank you for your interest in contributing to the Hackerspace Mumbai Blog! This document provides guidelines and information for contributors.

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/blog.git
   cd blog
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Writing Blog Posts

### Blog Post Structure

Create new blog posts in `src/content/posts/` as MDX files:

```text
src/content/posts/
├── your-post-slug.mdx
```

### Frontmatter Requirements

Every blog post must include this frontmatter:

```yaml
---
title: "Your Compelling Title"
date: 2025-01-27
description: "A brief, engaging description (150-160 characters ideal for SEO)"
author: "Your Name"
cover: "cover-image.png"  # Optional - store in src/assets/images/
tags: ["javascript", "webdev"]  # Optional but recommended
categories: ["tutorials"]  # Optional
---
```

### Content Guidelines

1. **Use clear, descriptive headings** with proper hierarchy (H1 for title, H2 for main sections, etc.)
2. **Include code examples** with proper syntax highlighting:
   ```javascript
   console.log("Hello, Hackerspace Mumbai!");
   ```
3. **Add images** with descriptive alt text:
   ```mdx
   <Image src={myImage} alt="Descriptive text for screen readers" />
   ```
4. **Write for your audience** - assume readers have basic technical knowledge
5. **Keep paragraphs short** and scannable
6. **Use bullet points** and numbered lists for better readability

### Images

- Store images in `src/assets/images/`
- Use descriptive filenames (e.g., `react-component-diagram.png`)
- Optimize images before adding (prefer PNG for diagrams, JPG for photos)
- Include proper alt text for accessibility
- Use Astro's `<Image>` component for automatic optimization

## 🛠️ Code Contributions

### Component Development

When creating new components:

1. **Follow TypeScript best practices**:
   ```typescript
   export interface Props {
     title: string;
     description?: string;
   }
   ```

2. **Include accessibility features**:
   ```astro
   <button aria-label="Close dialog" role="button">
   ```

3. **Use semantic HTML**:
   ```astro
   <article role="article">
     <header>
       <h1>{title}</h1>
     </header>
   </article>
   ```

### Styling Guidelines

- Use TailwindCSS utility classes
- Follow mobile-first responsive design
- Ensure proper color contrast ratios
- Test with screen readers when possible

## 🧪 Testing

Before submitting your contribution:

1. **Build the site**:
   ```bash
   npm run build
   ```

2. **Check for TypeScript errors**:
   ```bash
   npm run lint
   ```

3. **Test locally**:
   ```bash
   npm run preview
   ```

4. **Verify accessibility** using browser dev tools
5. **Test on mobile devices** or browser emulation

## 📋 Pull Request Process

1. **Create a descriptive branch name**:
   ```bash
   git checkout -b feature/add-react-tutorial
   git checkout -b fix/mobile-navigation
   ```

2. **Write clear commit messages**:
   ```bash
   git commit -m "Add React hooks tutorial with code examples"
   ```

3. **Update documentation** if needed

4. **Submit your PR** with:
   - Clear title and description
   - Screenshots for UI changes
   - Reference to any related issues

5. **Respond to feedback** promptly and constructively

## 📐 Style Guide

### Writing Style

- Use active voice
- Write in present tense
- Be conversational but professional
- Use "we" instead of "I" 
- Avoid jargon without explanation

### Technical Writing

- **Code snippets**: Include context and explanation
- **Commands**: Show the full command, not just fragments
- **Links**: Use descriptive link text, not "click here"
- **Lists**: Use parallel structure in bullet points

## 🚨 Issue Reporting

When reporting bugs or requesting features:

1. **Check existing issues** first
2. **Use issue templates** when available
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or recordings
   - Browser/OS information

## 🎉 Recognition

Contributors are recognized in:
- Git commit history
- Annual contributor acknowledgments
- Community Discord (when applicable)

## 📞 Getting Help

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Community Discord**: For real-time help
- **Maintainer Email**: For sensitive issues

## 📜 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

---

Thank you for contributing to the Hackerspace Mumbai community! 🚀