# Quick Troubleshooting Reference

## 🚨 Common Image Issues - Quick Fixes

### Images Not Loading

| Problem | Quick Fix |
|---------|-----------|
| Broken images in development | Check import path uses `./` prefix: `import img from './image.png'` |
| Images work in dev, fail in build | Verify all imported images exist in post directory |
| Wrong image displays | Check filename matches import exactly (case-sensitive) |

### Cover Image Issues

| Problem | Quick Fix |
|---------|-----------|
| Default placeholder shows | Check frontmatter: `cover: ./cover.png` (needs `./`) |
| Cover missing in production | Ensure cover image file exists in post directory |
| Cover not optimized | Let Astro handle optimization automatically |

### Build Errors

| Error Message | Solution |
|---------------|----------|
| "Cannot resolve image" | Check all image imports match actual filenames |
| "Invalid image format" | Use PNG, JPG, WebP, or SVG only |
| "Image too large" | Optimize images before adding (keep under 500KB for covers) |

### TypeScript Errors

| Error | Fix |
|-------|-----|
| "Cannot find module './image.png'" | Ensure astro.config.mjs includes image integration |
| Type errors on Image component | Import: `import { Image } from 'astro:assets'` |

## ✅ Quick Checklist

Before submitting your blog post:

- [ ] Cover image exists and is named `cover.png/jpg/webp`
- [ ] All image imports use `./` prefix
- [ ] All imported images exist in post directory
- [ ] Alt text provided for all images
- [ ] `pnpm dev` shows post correctly
- [ ] `pnpm build` completes without errors
- [ ] `pnpm preview` displays all images

## 🔧 Quick Commands

```bash
# Test your post
pnpm dev                    # Development server
pnpm build && pnpm preview  # Production test
pnpm test:a11y             # Accessibility check

# Debug images
ls src/content/posts/your-post-slug/  # List files in post directory
```

## 📞 Need More Help?

- **Detailed Guide:** [docs/content-creation.md](./content-creation.md)
- **Contributing Guide:** [CONTRIBUTING.md](../CONTRIBUTING.md)
- **GitHub Issues:** Create an issue with error details
- **Community:** Ask in Discord/Telegram channels