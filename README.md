# Hackerspace Mumbai Blog

A modern, high-performance blog built with Astro for Mumbai's largest open-source community.

This site has been migrated from [Eleventy High Performance Blog](https://github.com/HackerspaceMumbai/eleventy-high-performance-blog) to [Astro](https://astro.build/) for a modern, high-performance, and maintainable experience.

## 🚀 Tech Stack

- **[Astro](https://astro.build/)** - Static Site Generator
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MDX](https://mdxjs.com/)** - Markdown with JSX support
- **[Sharp](https://sharp.pixelplumbing.com/)** - High-performance image processing

## 📁 Project Structure

```text
/
├── public/
│   ├── .htaccess         # Apache security headers
│   ├── _headers          # Netlify security headers  
│   └── manifest.json     # PWA manifest
├── src/
│   ├── assets/images/    # Static image assets
│   ├── components/       # Reusable Astro components
│   ├── content/
│   │   ├── posts/        # Blog posts (MDX)
│   │   └── config.ts     # Content collection config
│   ├── pages/            # File-based routing
│   └── styles/           # Global styles
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:4321`     |
| `npm run build`        | Build your production site to `./dist/`         |
| `npm run preview`      | Preview your build locally, before deploying    |
| `npm run clean`        | Clean build artifacts                            |
| `npm run lint`         | Run Astro check for TypeScript and lint issues  |

## 📝 Creating Content

### Blog Posts

Blog posts are stored in `src/content/posts/` as MDX files. Each post should include:

```mdx
---
title: "Your Post Title"
date: 2025-01-01
description: "A brief description of your post"
author: "Your Name"
cover: "cover-image.png"  # Optional - image in src/assets/images/
tags: ["tag1", "tag2"]    # Optional
categories: ["category"]  # Optional
---

Your content here...
```

### Images

- Store images in `src/assets/images/`
- Use Astro's `<Image>` component for optimization
- Images are automatically optimized and converted to WebP format

## 🎨 Styling

The site uses TailwindCSS for styling with:
- Responsive design (mobile-first)
- Dark/light theme support via CSS variables
- Custom component classes
- Typography plugin for prose content

## 🔒 Security

The site includes security headers for:
- Content Security Policy (CSP)
- XSS Protection
- Clickjacking prevention
- MIME type sniffing prevention
- HSTS for HTTPS

## ♿ Accessibility

Built with accessibility in mind:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

## 🚀 Performance

Optimizations include:
- Static site generation
- Image optimization and WebP conversion
- CSS and JavaScript minification
- Responsive image loading
- Browser caching headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes (`npm run build`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Hackerspace Mumbai](https://hackerspacemumbai.org/)
- [Community Discord](https://discord.gg/hackerspacemumbai)
- [GitHub Organization](https://github.com/HackerspaceMumbai)

---

**Made with ❤️ by the Hackerspace Mumbai community**