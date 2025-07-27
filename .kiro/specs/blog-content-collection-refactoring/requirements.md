# Requirements Document

## Introduction

This specification outlines the refactoring of the blog system to use Astro content collections with colocated images instead of the current static image import approach. The goal is to improve maintainability, scalability, and developer experience by allowing blog post images to be stored alongside their respective markdown files while ensuring compatibility with both development and production builds.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to store blog post images alongside their markdown files, so that I can easily manage related assets without hunting through a centralized image directory.

#### Acceptance Criteria

1. WHEN a blog post is created THEN its images SHALL be stored in the same directory as the .mdx file
2. WHEN referencing images in blog posts THEN the system SHALL support relative path references (e.g., ./image.png)
3. WHEN organizing content THEN each blog post directory SHALL contain both the .mdx file and its associated images
4. WHEN adding new blog posts THEN content creators SHALL NOT need to modify centralized image import files

### Requirement 2

**User Story:** As a developer, I want the BlogCard component to dynamically resolve images from content collections, so that I don't need to maintain static import mappings for every blog post image.

#### Acceptance Criteria

1. WHEN the BlogCard component renders THEN it SHALL dynamically resolve cover images from the content collection
2. WHEN a blog post specifies a cover image THEN the system SHALL locate and display the image without static imports
3. WHEN a cover image is missing THEN the system SHALL gracefully fall back to a default placeholder image
4. WHEN processing images THEN the system SHALL use Astro's Image component for optimization (webp conversion, lazy loading, responsive sizing)

### Requirement 3

**User Story:** As a developer, I want the refactored system to work consistently across development and production environments, so that there are no surprises when deploying the site.

#### Acceptance Criteria

1. WHEN running `pnpm dev` THEN all blog post images SHALL display correctly in the development server
2. WHEN running `pnpm build` THEN the build process SHALL successfully process and optimize all colocated images
3. WHEN running `pnpm preview` THEN the production preview SHALL display all images correctly
4. WHEN deploying to production THEN image paths SHALL resolve correctly without manual intervention

### Requirement 4

**User Story:** As a developer, I want all blog posts to be fully migrated to use Astro content collections with colocated images, so that the system is consistent and maintainable.

#### Acceptance Criteria

1. WHEN implementing the new system THEN ALL existing blog posts SHALL be migrated to use content collections
2. WHEN processing images THEN the system SHALL use Astro's Image component for all image optimization
3. WHEN the migration is complete THEN the old static import system SHALL be completely removed
4. WHEN referencing images THEN all blog posts SHALL use the content collection image referencing method

### Requirement 5

**User Story:** As a content creator, I want clear documentation and examples of the new content structure, so that I can easily create new blog posts with colocated images.

#### Acceptance Criteria

1. WHEN the new system is implemented THEN documentation SHALL provide clear examples of the directory structure
2. WHEN creating new content THEN examples SHALL show how to reference colocated images in markdown
3. WHEN troubleshooting THEN error messages SHALL be helpful and guide users to correct image referencing
4. WHEN onboarding new contributors THEN the content creation process SHALL be intuitive and well-documented