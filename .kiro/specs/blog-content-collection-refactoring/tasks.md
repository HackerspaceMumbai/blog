# Implementation Plan

- [x] 1. Update content collection schema for image support






  - Modify `src/content/config.ts` to use Astro's `image()` helper for the cover field
  - Update TypeScript types to support ImageMetadata for cover images
  - Add proper validation for image fields in the schema
  - _Requirements: 2.1, 2.2, 4.2_

- [x] 2. Create new directory structure for blog posts






  - Create individual directories for each existing blog post in `src/content/posts/`
  - Move each `.mdx` file to its respective directory and rename to `index.mdx`
  - Organize posts by slug-based directory names (e.g., `azure-swa-authentication/`)
  - _Requirements: 1.1, 1.3, 4.1_

- [x] 3. Migrate blog post images to colocated structure





  - Move cover images from `src/assets/images/` to respective post directories
  - Rename cover images to consistent naming (e.g., `cover.png`, `cover.jpg`)
  - Move any inline images referenced in posts to their respective directories
  - _Requirements: 1.1, 1.3, 4.1_

- [x] 4. Update blog post frontmatter for colocated images






  - Modify frontmatter in each post to reference colocated cover images using relative paths
  - Update cover field to use `./cover.png` or similar relative path syntax
  - Validate that all frontmatter follows the new schema requirements
  - _Requirements: 1.2, 4.1, 4.4_



- [x] 5. Refactor BlogCard component for dynamic image resolution




  - Remove all static image imports from `BlogCard.astro`
  - Update component to use `post.data.cover` directly from content collection
  - Implement fallback logic for missing cover images using placeholder
  - Ensure Astro's Image component is used for all image rendering
  - _Requirements: 2.1, 2.2, 2.3, 4.2_

- [x] 6. Update inline image references in blog post content












  - Convert inline image references in MDX files to use colocated images
  - Update import statements to reference local images (e.g., `import image from './image.png'`)
  - Ensure all inline images use Astro's Image component for optimization
  - _Requirements: 1.2, 4.2, 4.4_

- [x] 7. Test development environment compatibility






  - Run `pnpm dev` and verify all blog posts display correctly with colocated images
  - Test that cover images load properly in BlogCard components
  - Validate that inline images in blog content render correctly
  - Check for any console errors or warnings related to image loading
  - _Requirements: 3.1, 5.3_
  
- [x] 8. Test production build compatibility






  - Run `pnpm build` to ensure all colocated images are processed correctly
  - Verify that optimized images are generated in the build output
  - Check that image paths resolve correctly in the production bundle
  - Validate WebP conversion and other optimizations are working
  - _Requirements: 3.2, 4.2_

- [x] 9. Test production preview environment






  - Run `pnpm preview` after successful build
  - Verify all blog post images display correctly in preview mode
  - Test image loading performance and lazy loading behavior
  - Validate that image optimization features work in production-like environment
  - _Requirements: 3.3_

- [x] 10. Clean up legacy image system






  - Remove unused images from `src/assets/images/` directory
  - Clean up any remaining static import mappings in components
  - Remove the `coverImages` object and related static imports from BlogCard
  - Update any other components that might reference the old image system
  - _Requirements: 4.3_

- [x] 11. Create documentation and examples






  - Document the new content structure in project README or contributing guide
  - Provide examples of how to create new blog posts with colocated images
  - Document how to reference images in both frontmatter and content
  - Create troubleshooting guide for common image-related issues
  - _Requirements: 5.1, 5.2, 5.4_



- [x] 12. Validate complete system functionality




  - Test all blog posts render correctly across different screen sizes
  - Verify image optimization (WebP conversion, lazy loading) works properly
  - Test fallback behavior when images are missing or fail to load
  - Run accessibility tests to ensure images have proper alt text and structure
  - Validate that the blog index page and individual post pages work correctly
  - _Requirements: 2.4, 3.1, 3.2, 3.3, 5.3_