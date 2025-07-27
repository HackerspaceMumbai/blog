# Design Document

## Overview

This design document outlines the refactoring of the blog system from static image imports to Astro content collections with colocated images. The current system uses a centralized `src/assets/images/` directory with static imports in `BlogCard.astro`, which creates maintenance overhead and scalability issues. The new design will leverage Astro's content collection capabilities to store images alongside blog posts and dynamically resolve them using Astro's Image component.

## Architecture

### Current Architecture Issues

**Current Structure:**
```
src/
├── assets/images/           # Centralized image storage
│   ├── Visage_Architecture.png
│   ├── Auth0_custom_action.png
│   └── ... (60+ images)
├── components/
│   └── BlogCard.astro       # Static imports for all images
└── content/posts/           # Blog posts only
    ├── post1.mdx
    ├── post2.mdx
    └── Visage_Architecture.png  # Some images already here
```

**Problems:**
- Static import mapping requires manual maintenance for every image
- Centralized image storage makes content management difficult
- No clear association between posts and their images
- Scaling issues as content grows

### Target Architecture

**New Structure:**
```
src/content/posts/
├── azure-swa-authentication/
│   ├── index.mdx
│   ├── cover.png
│   ├── auth0-setup.png
│   └── deployment-flow.png
├── event-modeling/
│   ├── index.mdx
│   ├── cover.png
│   └── event-storming.png
└── config.ts               # Updated schema
```

**Benefits:**
- Colocated content and assets
- Dynamic image resolution
- Improved content organization
- Scalable architecture
- Better developer experience

## Components and Interfaces

### Updated Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    cover: image().optional(), // Now uses Astro's image() helper
    author: z.string(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
```

### Enhanced BlogCard Component

```astro
---
// src/components/BlogCard.astro
import type { CollectionEntry } from 'astro:content';
import { Image } from 'astro:assets';
import { formatDate } from '../utils/formatting';
import placeholderImage from '../assets/images/gallery/pinnedpic-1.jpg';

export interface Props {
  post: CollectionEntry<'posts'>;
  featured?: boolean;
  className?: string;
  body?: string;
  'aria-labelledby'?: string;
  'data-post-index'?: number;
}

const { post, featured = false, className = '', body, ...props } = Astro.props;

// Dynamic image resolution
const coverImage = post.data.cover || placeholderImage;
const readingTime = calculateReadingTime(body || post.data.description || '');
const formattedDate = formatDate(post.data.date.toString());
---

<article class={`blog-card ${featured ? 'featured' : ''} ${className}`}>
  <a href={`/blog/${post.slug}/`}>
    <div class="image-container">
      <Image
        src={coverImage}
        alt={`Cover image for ${post.data.title}`}
        width={800}
        height={450}
        format="webp"
        loading="lazy"
        class="cover-image"
      />
    </div>
    <!-- Rest of component remains similar -->
  </a>
</article>
```

### Content Directory Structure

Each blog post will be organized in its own directory:

```
src/content/posts/
├── azure-swa-authentication/
│   ├── index.mdx              # Main content file
│   ├── cover.png              # Cover image
│   ├── auth0-setup.png        # Inline images
│   └── deployment-flow.png
├── event-modeling/
│   ├── index.mdx
│   ├── cover.png
│   └── event-storming.png
└── strategic-ddd/
    ├── index.mdx
    ├── cover.png
    ├── bounded-context.png
    └── domain-chart.png
```

### Image Reference Patterns

**In Frontmatter:**
```yaml
---
title: "My Blog Post"
cover: ./cover.png           # Relative to post directory
date: 2024-01-15
---
```

**In Content:**
```mdx
import { Image } from 'astro:assets';
import setupImage from './auth0-setup.png';
import flowImage from './deployment-flow.png';

## Authentication Setup

<Image src={setupImage} alt="Auth0 setup process" />

## Deployment Flow

<Image src={flowImage} alt="Deployment workflow" />
```

## Data Models

### Post Collection Entry

```typescript
type PostEntry = {
  id: string;
  slug: string;
  body: string;
  collection: 'posts';
  data: {
    title: string;
    date: Date;
    description: string;
    cover?: ImageMetadata;  // Astro's image type
    author: string;
    tags?: string[];
    categories?: string[];
  };
};
```

### Image Metadata

Astro automatically provides `ImageMetadata` for imported images:

```typescript
type ImageMetadata = {
  src: string;
  width: number;
  height: number;
  format: string;
};
```

## Error Handling

### Missing Images

```astro
---
const coverImage = post.data.cover || placeholderImage;
---

<Image
  src={coverImage}
  alt={post.data.cover ? `Cover for ${post.data.title}` : 'Default cover image'}
  onerror="this.src='/images/fallback.jpg'"
/>
```

### Build-time Validation

```typescript
// Content collection schema validation
const posts = defineCollection({
  schema: ({ image }) => z.object({
    cover: image().optional().refine(
      (img) => img !== undefined || process.env.NODE_ENV === 'development',
      { message: "Cover image is required for production builds" }
    ),
  }),
});
```

### Runtime Error Handling

```astro
---
try {
  const coverImage = post.data.cover || placeholderImage;
} catch (error) {
  console.warn(`Failed to load cover image for ${post.slug}:`, error);
  const coverImage = placeholderImage;
}
---
```

## Testing Strategy

### Development Testing

1. **Image Resolution Testing**
   - Verify all colocated images load correctly in `pnpm dev`
   - Test relative path resolution from post directories
   - Validate fallback behavior for missing images

2. **Content Collection Validation**
   - Ensure schema validation works for image fields
   - Test frontmatter parsing with image references
   - Verify TypeScript types are correctly inferred

### Build Testing

1. **Production Build Validation**
   - Run `pnpm build` to ensure all images are processed
   - Verify optimized images are generated correctly
   - Test that image paths resolve in production bundle

2. **Preview Testing**
   - Use `pnpm preview` to test production-like environment
   - Validate image loading and optimization
   - Check for any path resolution issues

### Cross-Environment Testing

1. **Development vs Production Parity**
   - Ensure images work identically in dev and prod
   - Test image optimization consistency
   - Validate lazy loading behavior

2. **Performance Testing**
   - Measure image loading performance
   - Test WebP conversion effectiveness
   - Validate lazy loading implementation

## Migration Strategy

### Phase 1: Content Restructuring

1. Create new directory structure for each blog post
2. Move existing posts to individual directories
3. Relocate associated images to post directories
4. Update frontmatter to use relative image paths

### Phase 2: Schema and Component Updates

1. Update content collection schema to use `image()` helper
2. Refactor BlogCard component to use dynamic image resolution
3. Remove static image imports from BlogCard
4. Update image handling to use Astro's Image component

### Phase 3: Content Migration

1. Update all blog post frontmatter to reference colocated images
2. Update inline image references in MDX content
3. Test each migrated post individually
4. Validate image optimization and loading

### Phase 4: Cleanup and Validation

1. Remove unused centralized images from `src/assets/images/`
2. Clean up static import mappings in BlogCard
3. Run comprehensive testing across all environments
4. Update documentation and examples

## Performance Considerations

### Image Optimization

- Astro's Image component automatically optimizes images
- WebP conversion for modern browsers
- Responsive image generation
- Lazy loading implementation

### Build Performance

- Images are processed at build time
- Optimized images are cached between builds
- Only referenced images are included in final bundle

### Runtime Performance

- Dynamic image resolution has minimal runtime overhead
- Images are served from optimized build output
- Proper caching headers for static assets