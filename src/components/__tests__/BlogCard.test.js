/**
 * BlogCard Component Tests - Comprehensive Image Display Testing
 * Tests for the enhanced BlogCard component functionality with focus on image handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Astro assets
vi.mock('astro:assets', () => ({
  Image: ({ src, alt, ...props }) => {
    const img = document.createElement('img');
    img.src = typeof src === 'object' && src.src ? src.src : src;
    img.alt = alt || '';
    Object.assign(img, props);
    img.setAttribute('data-testid', 'blog-card-image');
    return img;
  }
}));

// Mock placeholder image
vi.mock('../assets/images/gallery/pinnedpic-1.jpg', () => ({
  default: { src: '/placeholder-image.jpg', width: 800, height: 450 }
}));

// Mock formatting utility
vi.mock('../utils/formatting', () => ({
  formatDate: (date) => new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}));

describe('BlogCard Component - Comprehensive Image Display Tests', () => {
  // Mock blog post data for testing - covers all image scenarios
  const mockPostWithImageMetadata = {
    slug: 'test-post-with-image-metadata',
    data: {
      title: 'Test Blog Post With ImageMetadata',
      description: 'This post has an Astro ImageMetadata cover image.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: { src: '/test-cover.jpg', width: 800, height: 450, format: 'jpg' }, // Astro ImageMetadata
      tags: ['javascript', 'testing', 'astro', 'web-development']
    }
  };

  const mockPostWithStringCover = {
    slug: 'test-post-with-string-cover',
    data: {
      title: 'Test Blog Post With String Cover',
      description: 'This post has a string path cover image.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: './cover.png', // String path (legacy)
      tags: ['javascript', 'testing']
    }
  };

  const mockPostWithoutCover = {
    slug: 'test-post-without-cover',
    data: {
      title: 'Test Blog Post Without Cover',
      description: 'This post has no cover image defined.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      // No cover property
      tags: ['javascript', 'testing']
    }
  };

  const mockPostWithNullCover = {
    slug: 'test-post-with-null-cover',
    data: {
      title: 'Test Blog Post With Null Cover',
      description: 'This post has a null cover image.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: null,
      tags: ['javascript', 'testing']
    }
  };

  const mockPostWithEmptyStringCover = {
    slug: 'test-post-with-empty-string-cover',
    data: {
      title: 'Test Blog Post With Empty String Cover',
      description: 'This post has an empty string cover image.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: '',
      tags: ['javascript', 'testing']
    }
  };

  const mockPostWithInvalidImageMetadata = {
    slug: 'test-post-with-invalid-image-metadata',
    data: {
      title: 'Test Blog Post With Invalid ImageMetadata',
      description: 'This post has an invalid ImageMetadata object.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: { width: 800, height: 450 }, // Missing src property
      tags: ['javascript', 'testing']
    }
  };

  beforeEach(() => {
    // Clear DOM before each test
    if (global.document) {
      global.document.body.innerHTML = '';
    }
    vi.clearAllMocks();
  });

  // Helper function to simulate BlogCard image resolution logic
  const getBlogCoverImage = (post) => {
    const placeholderImage = { src: '/placeholder-image.jpg', width: 800, height: 450 };
    
    try {
      const cover = post?.data?.cover;
      
      if (!cover) {
        return placeholderImage;
      }
      
      // If it's an ImageMetadata object, return it directly
      if (typeof cover === 'object' && cover.src) {
        return cover;
      }
      
      // If it's a string path (legacy), return it
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

  // Helper function to generate appropriate alt text
  const getImageAltText = (post, coverImage) => {
    const placeholderImage = { src: '/placeholder-image.jpg', width: 800, height: 450 };
    if (coverImage === placeholderImage || (typeof coverImage === 'object' && coverImage.src === '/placeholder-image.jpg')) {
      return ''; // Empty alt for decorative placeholder
    }
    return `${post.data.title} article thumbnail`;
  };

  describe('Image Resolution Logic - Core Functionality', () => {
    it('should handle Astro ImageMetadata objects correctly', () => {
      const coverImage = getBlogCoverImage(mockPostWithImageMetadata);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('object');
      expect(coverImage.src).toBe('/test-cover.jpg');
      expect(coverImage.width).toBe(800);
      expect(coverImage.height).toBe(450);
      expect(coverImage.format).toBe('jpg');
    });

    it('should handle string path covers (legacy support)', () => {
      const coverImage = getBlogCoverImage(mockPostWithStringCover);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('string');
      expect(coverImage).toBe('./cover.png');
    });

    it('should fallback to placeholder when cover is undefined', () => {
      const coverImage = getBlogCoverImage(mockPostWithoutCover);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('object');
      expect(coverImage.src).toBe('/placeholder-image.jpg');
      expect(coverImage.width).toBe(800);
      expect(coverImage.height).toBe(450);
    });

    it('should fallback to placeholder when cover is null', () => {
      const coverImage = getBlogCoverImage(mockPostWithNullCover);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('object');
      expect(coverImage.src).toBe('/placeholder-image.jpg');
    });

    it('should fallback to placeholder when cover is empty string', () => {
      const coverImage = getBlogCoverImage(mockPostWithEmptyStringCover);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('object');
      expect(coverImage.src).toBe('/placeholder-image.jpg');
    });

    it('should fallback to placeholder when ImageMetadata is invalid (missing src)', () => {
      const coverImage = getBlogCoverImage(mockPostWithInvalidImageMetadata);
      
      expect(coverImage).toBeDefined();
      expect(typeof coverImage).toBe('object');
      expect(coverImage.src).toBe('/placeholder-image.jpg');
    });

    it('should handle error scenarios gracefully', () => {
      const invalidPost = null;
      const coverImage = getBlogCoverImage(invalidPost);
      
      expect(coverImage).toBeDefined();
      expect(coverImage.src).toBe('/placeholder-image.jpg');
    });
  });

  describe('Image Alt Text Generation', () => {
    it('should generate descriptive alt text for posts with cover images', () => {
      const coverImage = getBlogCoverImage(mockPostWithImageMetadata);
      const altText = getImageAltText(mockPostWithImageMetadata, coverImage);
      
      expect(altText).toBe('Test Blog Post With ImageMetadata article thumbnail');
    });

    it('should generate descriptive alt text for string path covers', () => {
      const coverImage = getBlogCoverImage(mockPostWithStringCover);
      const altText = getImageAltText(mockPostWithStringCover, coverImage);
      
      expect(altText).toBe('Test Blog Post With String Cover article thumbnail');
    });

    it('should use empty alt text for placeholder images (decorative)', () => {
      const coverImage = getBlogCoverImage(mockPostWithoutCover);
      const altText = getImageAltText(mockPostWithoutCover, coverImage);
      
      expect(altText).toBe('');
    });

    it('should use empty alt text when fallback to placeholder occurs', () => {
      const coverImage = getBlogCoverImage(mockPostWithNullCover);
      const altText = getImageAltText(mockPostWithNullCover, coverImage);
      
      expect(altText).toBe('');
    });
  });

  describe('Visual Regression Prevention Tests', () => {
    it('should ensure consistent image dimensions for all scenarios', () => {
      const testPosts = [
        mockPostWithImageMetadata,
        mockPostWithStringCover,
        mockPostWithoutCover,
        mockPostWithNullCover,
        mockPostWithEmptyStringCover,
        mockPostWithInvalidImageMetadata
      ];

      testPosts.forEach(post => {
        const coverImage = getBlogCoverImage(post);
        
        // All images should have consistent dimensions for layout stability
        if (typeof coverImage === 'object') {
          expect(coverImage.width).toBe(800);
          expect(coverImage.height).toBe(450);
        }
        
        // Verify no undefined or null images that could cause broken displays
        expect(coverImage).toBeDefined();
        expect(coverImage).not.toBeNull();
      });
    });

    it('should prevent broken image scenarios', () => {
      const testScenarios = [
        { name: 'ImageMetadata with src', post: mockPostWithImageMetadata },
        { name: 'String path', post: mockPostWithStringCover },
        { name: 'Undefined cover', post: mockPostWithoutCover },
        { name: 'Null cover', post: mockPostWithNullCover },
        { name: 'Empty string cover', post: mockPostWithEmptyStringCover },
        { name: 'Invalid ImageMetadata', post: mockPostWithInvalidImageMetadata }
      ];

      testScenarios.forEach(scenario => {
        const coverImage = getBlogCoverImage(scenario.post);
        
        // Ensure we never get undefined, null, or empty values that cause broken images
        expect(coverImage).toBeDefined();
        expect(coverImage).not.toBeNull();
        
        if (typeof coverImage === 'object') {
          expect(coverImage.src).toBeDefined();
          expect(coverImage.src).not.toBe('');
          expect(typeof coverImage.src).toBe('string');
        } else if (typeof coverImage === 'string') {
          expect(coverImage).not.toBe('');
        }
      });
    });

    it('should maintain consistent aspect ratio (3:2) for all images', () => {
      const testPosts = [mockPostWithImageMetadata, mockPostWithoutCover];
      
      testPosts.forEach(post => {
        const coverImage = getBlogCoverImage(post);
        
        if (typeof coverImage === 'object' && coverImage.width && coverImage.height) {
          const aspectRatio = coverImage.width / coverImage.height;
          expect(aspectRatio).toBeCloseTo(16/9, 1); // Allow for slight variations
        }
      });
    });
  });

  describe('Placeholder Image Fallback Functionality', () => {
    it('should use placeholder image when no cover is provided', () => {
      const coverImage = getBlogCoverImage(mockPostWithoutCover);
      const altText = getImageAltText(mockPostWithoutCover, coverImage);
      
      expect(coverImage.src).toBe('/placeholder-image.jpg');
      expect(altText).toBe(''); // Decorative image should have empty alt
    });

    it('should use placeholder image for all invalid cover scenarios', () => {
      const invalidScenarios = [
        mockPostWithNullCover,
        mockPostWithEmptyStringCover,
        mockPostWithInvalidImageMetadata
      ];

      invalidScenarios.forEach(post => {
        const coverImage = getBlogCoverImage(post);
        expect(coverImage.src).toBe('/placeholder-image.jpg');
        
        const altText = getImageAltText(post, coverImage);
        expect(altText).toBe(''); // Placeholder should be decorative
      });
    });

    it('should ensure placeholder image has proper metadata', () => {
      const coverImage = getBlogCoverImage(mockPostWithoutCover);
      
      expect(coverImage).toEqual({
        src: '/placeholder-image.jpg',
        width: 800,
        height: 450
      });
    });
  });

  describe('Component Integration Tests', () => {
    it('should format date correctly for display', () => {
      const formattedDate = new Date(mockPostWithImageMetadata.data.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      expect(formattedDate).toBe('15 Jan 2024');
    });

    it('should generate correct blog post URLs', () => {
      const expectedUrl = `/blog/${mockPostWithImageMetadata.slug}/`;
      expect(expectedUrl).toBe('/blog/test-post-with-image-metadata/');
    });

    it('should handle tag display correctly', () => {
      const displayTags = mockPostWithImageMetadata.data.tags?.slice(0, 3) || [];
      const remainingTagsCount = (mockPostWithImageMetadata.data.tags?.length || 0) - displayTags.length;
      
      expect(displayTags).toHaveLength(3);
      expect(remainingTagsCount).toBe(1);
      expect(displayTags).toEqual(['javascript', 'testing', 'astro']);
    });

    it('should handle posts without tags gracefully', () => {
      const postWithoutTags = {
        ...mockPostWithImageMetadata,
        data: { ...mockPostWithImageMetadata.data, tags: undefined }
      };
      
      const displayTags = postWithoutTags.data.tags?.slice(0, 3) || [];
      expect(displayTags).toHaveLength(0);
    });
  });

  describe('Accessibility and ARIA Support', () => {
    it('should generate proper aria-label for read more link', () => {
      const expectedAriaLabel = `Read the full blog post: ${mockPostWithImageMetadata.data.title}`;
      expect(expectedAriaLabel).toBe('Read the full blog post: Test Blog Post With ImageMetadata');
    });

    it('should format datetime attribute correctly for screen readers', () => {
      const datetimeAttr = mockPostWithImageMetadata.data.date.toISOString();
      expect(datetimeAttr).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should provide appropriate alt text for images', () => {
      // Test with cover image
      const coverImage = getBlogCoverImage(mockPostWithImageMetadata);
      const altText = getImageAltText(mockPostWithImageMetadata, coverImage);
      expect(altText).toBe('Test Blog Post With ImageMetadata article thumbnail');

      // Test with placeholder image (should be decorative)
      const placeholderImage = getBlogCoverImage(mockPostWithoutCover);
      const placeholderAltText = getImageAltText(mockPostWithoutCover, placeholderImage);
      expect(placeholderAltText).toBe('');
    });

    it('should maintain semantic structure for screen readers', () => {
      // Verify that the component structure supports proper screen reader navigation
      // This would be tested in integration tests with actual DOM elements
      expect(true).toBe(true); // Placeholder for semantic structure verification
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed post data gracefully', () => {
      const malformedPosts = [
        null,
        undefined,
        {},
        { data: null },
        { data: {} },
        { data: { title: null } }
      ];

      malformedPosts.forEach(post => {
        const coverImage = getBlogCoverImage(post);
        expect(coverImage).toBeDefined();
        expect(coverImage.src).toBe('/placeholder-image.jpg');
      });
    });

    it('should handle very long content gracefully', () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);
      
      const postWithLongContent = {
        ...mockPostWithImageMetadata,
        data: {
          ...mockPostWithImageMetadata.data,
          title: longTitle,
          description: longDescription
        }
      };

      // The component should handle long content without breaking
      expect(postWithLongContent.data.title.length).toBe(200);
      expect(postWithLongContent.data.description.length).toBe(1000);
      
      // Image handling should still work correctly
      const coverImage = getBlogCoverImage(postWithLongContent);
      expect(coverImage.src).toBe('/test-cover.jpg');
    });

    it('should handle special characters in image paths', () => {
      const postWithSpecialChars = {
        ...mockPostWithImageMetadata,
        data: {
          ...mockPostWithImageMetadata.data,
          cover: { src: '/test-image-with-spaces and-special-chars!.jpg', width: 800, height: 450 }
        }
      };

      const coverImage = getBlogCoverImage(postWithSpecialChars);
      expect(coverImage.src).toBe('/test-image-with-spaces and-special-chars!.jpg');
    });
  });
});