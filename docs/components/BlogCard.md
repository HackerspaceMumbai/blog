# BlogCard Component Documentation

## Overview

The `BlogCard` component is a responsive card component that displays blog post information including cover images, titles, descriptions, metadata, and tags. It features robust image handling with automatic fallback to placeholder images and accessibility optimizations.

## Props

```typescript
interface Props {
  post: CollectionEntry<'posts'>;  // Blog post data from Astro content collection
  featured?: boolean;              // Whether to show featured badge (default: false)
}
```

## Usage

```astro
---
import BlogCard from '../components/BlogCard.astro';
import { getCollection } from 'astro:content';

const posts = await getCollection('posts');
---

<!-- Basic usage -->
<BlogCard post={posts[0]} />

<!-- Featured post -->
<BlogCard post={posts[0]} featured={true} />

<!-- In a grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {posts.map((post) => (
    <BlogCard post={post} />
  ))}
</div>
```

## Image Handling

### Robust Image Resolution

The BlogCard component implements a sophisticated image resolution system that handles various image scenarios:

```javascript
const getBlogCoverImage = (post) => {
  try {
    const cover = post?.data?.cover;
    
    if (!cover) {
      return placeholderImage;
    }
    
    // Handle ImageMetadata objects (from Astro content collections)
    if (typeof cover === 'object' && cover.src) {
      return cover;
    }
    
    // Handle string paths (legacy support)
    if (typeof cover === 'string' && cover.length > 0) {
      return cover;
    }
    
    // Fallback to placeholder
    return placeholderImage;
  } catch (error) {
    console.warn('Error resolving blog cover image:', error);
    return placeholderImage;
  }
};
```

### Image Types Supported

1. **Astro Content Collection Images** (Recommended)
   - ImageMetadata objects from `image()` schema
   - Automatic optimization and format conversion
   - Type-safe imports

2. **String Paths** (Legacy Support)
   - Relative or absolute paths to images
   - Maintained for backward compatibility

3. **Placeholder Fallback**
   - Automatic fallback when no cover image is provided
   - Uses `src/assets/images/gallery/pinnedpic-1.jpg`
   - Ensures no broken images are displayed

### Accessibility Features

- **Dynamic Alt Text Generation**:
  ```javascript
  const getImageAltText = (post, coverImage) => {
    if (coverImage === placeholderImage) {
      return ''; // Empty alt for decorative placeholder
    }
    return `${post.data.title} article thumbnail`;
  };
  ```

- **Semantic HTML Structure**
- **Proper ARIA Labels**
- **Keyboard Navigation Support**

## Features

### Visual Design
- **Responsive Layout**: Mobile-first design with proper breakpoints
- **Hover Effects**: Scale and shadow animations on hover
- **Aspect Ratio**: Consistent 3:2 aspect ratio for all cover images
- **Featured Badge**: Optional featured post indicator

### Content Display
- **Title**: Post title with line clamping (max 2 lines)
- **Description**: Post description with line clamping (max 3 lines)
- **Metadata**: Publication date and author information
- **Tags**: Up to 3 tags displayed with overflow indicator
- **Read More Button**: Call-to-action with accessibility labels

### Performance Optimizations
- **Lazy Loading**: Images load only when needed
- **Image Optimization**: Automatic WebP/AVIF conversion via Astro
- **Efficient Rendering**: Optimized for large lists of blog posts

## Styling

The component uses Tailwind CSS with DaisyUI components:

```css
/* Key classes used */
.card                    /* DaisyUI card component */
.aspect-[3/2]           /* Consistent image aspect ratio */
.line-clamp-2           /* Title text clamping */
.line-clamp-3           /* Description text clamping */
.group                  /* Hover effect grouping */
.transition-all         /* Smooth animations */
```

## Error Handling

The component includes comprehensive error handling:

1. **Graceful Degradation**: Falls back to placeholder image on any error
2. **Console Warnings**: Logs issues for debugging without breaking the UI
3. **Type Safety**: Handles undefined/null post data safely
4. **Network Resilience**: Works even if cover images fail to load

## Testing

The BlogCard component has extensive test coverage:

- **Unit Tests**: Component logic and prop handling
- **Image Display Tests**: Cover image resolution and fallback behavior
- **Edge Case Tests**: Null/undefined data handling
- **Visual Regression Tests**: Ensures consistent appearance
- **Accessibility Tests**: ARIA labels and keyboard navigation

### Running Tests

```bash
# Run all BlogCard tests
pnpm test:blog-images

# Run specific test suites
pnpm test src/components/__tests__/BlogCard.test.js
pnpm test src/components/__tests__/BlogCard.image-display.test.js
pnpm test src/components/__tests__/BlogCard.edge-cases.test.js
```

## Best Practices

### When Using BlogCard

1. **Always provide post data** from Astro content collections
2. **Use proper cover images** in blog post frontmatter
3. **Test with and without cover images** to ensure fallback works
4. **Consider performance** when rendering many cards

### Content Collection Setup

Ensure your blog posts have proper frontmatter:

```yaml
---
title: "Your Blog Post Title"
date: 2024-01-15
description: "SEO-friendly description"
cover: ./cover.png  # Relative path to cover image
author: "Author Name"
tags: ["javascript", "tutorial"]
---
```

### Image Requirements

- **Format**: PNG, JPG, or WebP
- **Dimensions**: 800x450px (16:9 aspect ratio) recommended
- **File Size**: Under 500KB for optimal performance
- **Location**: In the same directory as the blog post

## Troubleshooting

### Common Issues

1. **Images Not Displaying**
   - Check that cover image files exist in post directories
   - Verify frontmatter paths use `./` prefix
   - Ensure file extensions match actual files

2. **Placeholder Always Showing**
   - Verify content collection schema includes `image().optional()`
   - Check that `getCollection('posts')` returns proper data
   - Test image imports in isolation

3. **Performance Issues**
   - Optimize cover images before adding to repository
   - Use appropriate image formats (WebP for modern browsers)
   - Consider lazy loading for large lists

### Debug Mode

Enable debug logging by checking browser console for warnings from the `getBlogCoverImage` function.

## Related Components

- **BlogSection**: Uses BlogCard in grid layouts
- **BlogIndexPage**: Displays multiple BlogCards
- **LazyImage**: Alternative image component for other use cases

## Migration Guide

### From Legacy String Paths

If migrating from string-based image paths:

1. Move images to post directories
2. Update frontmatter to use relative paths
3. Update content collection schema to use `image()`
4. Test thoroughly with the new system

### From Other Card Components

When replacing other card components:

1. Update prop structure to match BlogCard interface
2. Ensure post data comes from content collections
3. Update styling to match design system
4. Test responsive behavior

---

For more information about the blog image system, see the [Content Creation Guide](../content-creation.md).