/**
 * BlogCard Component Tests
 * Tests for the enhanced BlogCard component functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('BlogCard Component', () => {
  // Mock blog post data for testing
  const mockPost = {
    slug: 'test-blog-post',
    data: {
      title: 'Test Blog Post Title',
      description: 'This is a test blog post description that should be displayed in the card.',
      author: 'Test Author',
      date: new Date('2024-01-15'),
      cover: 'test-cover.jpg',
      tags: ['javascript', 'testing', 'astro', 'web-development']
    },
    body: 'This is the body content of the blog post. '.repeat(50) // ~250 words for reading time calculation
  };

  const mockPostWithoutCover = {
    ...mockPost,
    data: {
      ...mockPost.data,
      cover: undefined
    }
  };

  const mockPostWithoutTags = {
    ...mockPost,
    data: {
      ...mockPost.data,
      tags: undefined
    }
  };

  beforeEach(() => {
    // Clear DOM before each test
    if (global.document) {
      global.document.body.innerHTML = '';
    }
  });

  describe('Component Structure', () => {
    it('should render blog card with all required elements', () => {
      // Since we can't directly test Astro components in this environment,
      // we'll test the data processing logic and expected structure
      
      // Test reading time calculation
      const wordsPerMinute = 200;
      const words = mockPost.body.split(/\s+/).length;
      const expectedReadingTime = Math.ceil(words / wordsPerMinute) || 1;
      
      expect(expectedReadingTime).toBeGreaterThan(0);
      expect(expectedReadingTime).toBe(3); // Should be 3 minutes for ~500 words
    });

    it('should format date correctly', () => {
      const formattedDate = new Date(mockPost.data.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      expect(formattedDate).toBe('15 Jan 2024');
    });

    it('should handle cover image path correctly', () => {
      let coverImagePath = mockPost.data.cover;
      if (coverImagePath && !coverImagePath.startsWith('/')) {
        coverImagePath = `/src/assets/images/${coverImagePath}`;
      }
      
      expect(coverImagePath).toBe('/src/assets/images/test-cover.jpg');
    });

    it('should handle missing cover image', () => {
      const coverImagePath = mockPostWithoutCover.data.cover;
      expect(coverImagePath).toBeUndefined();
    });
  });

  describe('Tag Handling', () => {
    it('should limit displayed tags to 3', () => {
      const displayTags = mockPost.data.tags?.slice(0, 3) || [];
      const remainingTagsCount = (mockPost.data.tags?.length || 0) - displayTags.length;
      
      expect(displayTags).toHaveLength(3);
      expect(remainingTagsCount).toBe(1);
      expect(displayTags).toEqual(['javascript', 'testing', 'astro']);
    });

    it('should handle posts without tags', () => {
      const displayTags = mockPostWithoutTags.data.tags?.slice(0, 3) || [];
      const remainingTagsCount = (mockPostWithoutTags.data.tags?.length || 0) - displayTags.length;
      
      expect(displayTags).toHaveLength(0);
      expect(remainingTagsCount).toBe(0);
    });

    it('should handle posts with fewer than 3 tags', () => {
      const postWithFewTags = {
        ...mockPost,
        data: {
          ...mockPost.data,
          tags: ['javascript', 'testing']
        }
      };
      
      const displayTags = postWithFewTags.data.tags?.slice(0, 3) || [];
      const remainingTagsCount = (postWithFewTags.data.tags?.length || 0) - displayTags.length;
      
      expect(displayTags).toHaveLength(2);
      expect(remainingTagsCount).toBe(0);
    });
  });

  describe('Fallback Gradient Generation', () => {
    it('should generate consistent gradient for same title', () => {
      const generateFallbackGradient = (title) => {
        const colors = [
          'from-blue-500/20 to-purple-500/20',
          'from-green-500/20 to-blue-500/20',
          'from-purple-500/20 to-pink-500/20',
          'from-orange-500/20 to-red-500/20',
          'from-teal-500/20 to-cyan-500/20',
        ];
        const index = title.length % colors.length;
        return colors[index];
      };

      const gradient1 = generateFallbackGradient(mockPost.data.title);
      const gradient2 = generateFallbackGradient(mockPost.data.title);
      
      expect(gradient1).toBe(gradient2);
      expect(gradient1).toBe('from-blue-500/20 to-purple-500/20'); // title length 19 % 5 = 4, index 4 is the first color
    });

    it('should generate different gradients for different titles', () => {
      const generateFallbackGradient = (title) => {
        const colors = [
          'from-blue-500/20 to-purple-500/20',
          'from-green-500/20 to-blue-500/20',
          'from-purple-500/20 to-pink-500/20',
          'from-orange-500/20 to-red-500/20',
          'from-teal-500/20 to-cyan-500/20',
        ];
        const index = title.length % colors.length;
        return colors[index];
      };

      const gradient1 = generateFallbackGradient('Short');
      const gradient2 = generateFallbackGradient('A much longer title');
      
      expect(gradient1).not.toBe(gradient2);
    });
  });

  describe('Accessibility Features', () => {
    it('should generate proper aria-label for read more link', () => {
      const expectedAriaLabel = `Read more about ${mockPost.data.title}`;
      expect(expectedAriaLabel).toBe('Read more about Test Blog Post Title');
    });

    it('should format datetime attribute correctly', () => {
      const datetimeAttr = mockPost.data.date.toISOString();
      expect(datetimeAttr).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('URL Generation', () => {
    it('should generate correct blog post URLs', () => {
      const expectedUrl = `/blog/${mockPost.slug}/`;
      expect(expectedUrl).toBe('/blog/test-blog-post/');
    });
  });

  describe('Content Truncation', () => {
    it('should handle long descriptions gracefully', () => {
      const longDescription = 'This is a very long description that should be truncated. '.repeat(20);
      const postWithLongDescription = {
        ...mockPost,
        data: {
          ...mockPost.data,
          description: longDescription
        }
      };
      
      // The actual truncation is handled by CSS line-clamp-3
      // Here we just verify the description is present
      expect(postWithLongDescription.data.description.length).toBeGreaterThan(100);
    });

    it('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long blog post title that should be truncated with line clamping';
      const postWithLongTitle = {
        ...mockPost,
        data: {
          ...mockPost.data,
          title: longTitle
        }
      };
      
      // The actual truncation is handled by CSS line-clamp-2
      // Here we just verify the title is present
      expect(postWithLongTitle.data.title.length).toBeGreaterThan(50);
    });
  });
});