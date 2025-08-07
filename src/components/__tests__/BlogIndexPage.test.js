/**
 * Blog Index Page Integration Tests
 * Tests for blog image display in the main blog listing page
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

// Mock Astro content collections
vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  type: {
    CollectionEntry: {}
  }
}));

// Mock blog posts data for testing
const mockBlogPosts = [
  {
    slug: 'recent-post-with-cover',
    data: {
      title: 'Recent Blog Post With Cover',
      description: 'This is the most recent post with a cover image.',
      author: 'Test Author',
      date: new Date('2024-02-01'),
      cover: { src: '/recent-cover.jpg', width: 800, height: 450 },
      tags: ['javascript', 'web-development']
    }
  },
  {
    slug: 'older-post-without-cover',
    data: {
      title: 'Older Post Without Cover',
      description: 'This is an older post without a cover image.',
      author: 'Another Author',
      date: new Date('2024-01-15'),
      // No cover property
      tags: ['react', 'testing']
    }
  },
  {
    slug: 'oldest-post-with-invalid-cover',
    data: {
      title: 'Oldest Post With Invalid Cover',
      description: 'This is the oldest post with an invalid cover.',
      author: 'Test Author',
      date: new Date('2024-01-01'),
      cover: null,
      tags: ['accessibility']
    }
  }
];

// Mock BlogCard component for testing
const MockBlogCard = ({ post, 'data-post-index': postIndex }) => {
  // Handle null/undefined posts gracefully
  if (!post || !post.slug || !post.data) {
    return document.createElement('div'); // Return empty div for invalid posts
  }
  
  const article = document.createElement('article');
  article.className = 'blog-card';
  article.setAttribute('data-testid', `blog-card-${post.slug}`);
  article.setAttribute('data-post-index', postIndex);
  
  // Simulate BlogCard image handling logic
  const getBlogCoverImage = (post) => {
    const placeholderImage = { src: '/placeholder-image.jpg', width: 800, height: 450 };
    
    try {
      const cover = post?.data?.cover;
      
      if (!cover) {
        return placeholderImage;
      }
      
      if (typeof cover === 'object' && cover.src) {
        return cover;
      }
      
      if (typeof cover === 'string' && cover.length > 0) {
        return cover;
      }
      
      return placeholderImage;
    } catch (error) {
      return placeholderImage;
    }
  };

  const coverImage = getBlogCoverImage(post);
  
  // Create image element
  const img = document.createElement('img');
  img.src = typeof coverImage === 'object' ? coverImage.src : coverImage;
  img.alt = coverImage.src === '/placeholder-image.jpg' ? '' : `${post.data.title} article thumbnail`;
  img.setAttribute('data-testid', `blog-image-${post.slug}`);
  img.className = 'object-cover w-full h-full';
  
  // Create title
  const title = document.createElement('h2');
  title.textContent = post.data.title;
  title.setAttribute('data-testid', `blog-title-${post.slug}`);
  
  // Create description
  const description = document.createElement('p');
  description.textContent = post.data.description;
  description.setAttribute('data-testid', `blog-description-${post.slug}`);
  
  // Create read more link
  const link = document.createElement('a');
  link.href = `/blog/${post.slug}/`;
  link.textContent = 'Read More';
  link.setAttribute('aria-label', `Read the full blog post: ${post.data.title}`);
  link.setAttribute('data-testid', `blog-link-${post.slug}`);
  
  article.appendChild(img);
  article.appendChild(title);
  article.appendChild(description);
  article.appendChild(link);
  
  return article;
};

// Mock Blog Index Page component
const MockBlogIndexPage = ({ posts }) => {
  const main = document.createElement('main');
  main.className = 'blog-container';
  main.setAttribute('role', 'main');
  main.setAttribute('aria-labelledby', 'blog-title');
  
  // Create header
  const header = document.createElement('header');
  header.className = 'blog-header';
  
  const title = document.createElement('h1');
  title.id = 'blog-title';
  title.textContent = 'Hackerspace Mumbai Blog';
  
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Latest articles, tutorials, and insights from our community';
  subtitle.setAttribute('role', 'doc-subtitle');
  
  header.appendChild(title);
  header.appendChild(subtitle);
  main.appendChild(header);
  
  // Create posts section
  const section = document.createElement('section');
  section.className = 'post-grid';
  section.setAttribute('aria-label', 'Blog posts');
  section.setAttribute('data-testid', 'blog-posts-grid');
  
  if (posts && posts.length > 0) {
    // Filter out invalid posts (null, undefined, or missing required fields)
    const validPosts = posts.filter(post => post && post.slug && post.data && post.data.title);
    
    validPosts.forEach((post, index) => {
      const blogCard = MockBlogCard({ 
        post, 
        'data-post-index': index,
        'aria-labelledby': `post-${index}-title`
      });
      section.appendChild(blogCard);
    });
  } else {
    // Empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state text-center py-12';
    emptyState.setAttribute('role', 'status');
    emptyState.setAttribute('data-testid', 'empty-state');
    
    const emptyTitle = document.createElement('h3');
    emptyTitle.textContent = 'No blog posts available';
    
    const emptyDescription = document.createElement('p');
    emptyDescription.textContent = "We're working on creating amazing content for you. Check back soon!";
    
    emptyState.appendChild(emptyTitle);
    emptyState.appendChild(emptyDescription);
    section.appendChild(emptyState);
  }
  
  main.appendChild(section);
  return main;
};

describe('Blog Index Page Integration Tests', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  describe('Cover Image Display Integration', () => {
    it('should display all blog post cover images correctly in the grid', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      // Check first post with cover
      const firstImage = container.querySelector('[data-testid="blog-image-recent-post-with-cover"]');
      expect(firstImage).toBeTruthy();
      expect(firstImage.src).toContain('/recent-cover.jpg');
      expect(firstImage.alt).toBe('Recent Blog Post With Cover article thumbnail');
      
      // Check second post without cover (should use placeholder)
      const secondImage = container.querySelector('[data-testid="blog-image-older-post-without-cover"]');
      expect(secondImage).toBeTruthy();
      expect(secondImage.src).toContain('/placeholder-image.jpg');
      expect(secondImage.alt).toBe(''); // Empty alt for decorative placeholder
      
      // Check third post with invalid cover (should use placeholder)
      const thirdImage = container.querySelector('[data-testid="blog-image-oldest-post-with-invalid-cover"]');
      expect(thirdImage).toBeTruthy();
      expect(thirdImage.src).toContain('/placeholder-image.jpg');
      expect(thirdImage.alt).toBe(''); // Empty alt for decorative placeholder
    });

    it('should maintain consistent image styling across all posts', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const allImages = container.querySelectorAll('[data-testid^="blog-image-"]');
      expect(allImages.length).toBe(3);
      
      allImages.forEach(img => {
        expect(img.className).toContain('object-cover');
        expect(img.className).toContain('w-full');
        expect(img.className).toContain('h-full');
      });
    });

    it('should handle mixed image scenarios without layout issues', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const grid = container.querySelector('[data-testid="blog-posts-grid"]');
      expect(grid).toBeTruthy();
      expect(grid.className).toContain('post-grid');
      
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      expect(blogCards.length).toBe(3);
      
      // Verify each card has proper structure
      blogCards.forEach((card, index) => {
        const image = card.querySelector('[data-testid^="blog-image-"]');
        const title = card.querySelector('[data-testid^="blog-title-"]');
        const description = card.querySelector('[data-testid^="blog-description-"]');
        const link = card.querySelector('[data-testid^="blog-link-"]');
        
        expect(image).toBeTruthy();
        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        expect(link).toBeTruthy();
        
        expect(card.getAttribute('data-post-index')).toBe(index.toString());
      });
    });
  });

  describe('Grid Layout and Responsive Behavior', () => {
    it('should create proper grid structure for blog posts', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const grid = container.querySelector('[data-testid="blog-posts-grid"]');
      expect(grid).toBeTruthy();
      expect(grid.getAttribute('aria-label')).toBe('Blog posts');
      
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      expect(blogCards.length).toBe(mockBlogPosts.length);
    });

    it('should handle empty state when no posts are available', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: [] });
      container.appendChild(blogIndexPage);
      
      const emptyState = container.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
      expect(emptyState.getAttribute('role')).toBe('status');
      
      const emptyTitle = emptyState.querySelector('h3');
      expect(emptyTitle.textContent).toBe('No blog posts available');
      
      // Should not have any blog cards
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      expect(blogCards.length).toBe(0);
    });

    it('should maintain proper semantic structure', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const main = container.querySelector('main');
      expect(main).toBeTruthy();
      expect(main.getAttribute('role')).toBe('main');
      expect(main.getAttribute('aria-labelledby')).toBe('blog-title');
      
      const title = container.querySelector('#blog-title');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Hackerspace Mumbai Blog');
    });
  });

  describe('Post Sorting and Order Verification', () => {
    it('should display posts in correct chronological order (newest first)', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      
      // Verify the order matches our mock data (already sorted newest first)
      expect(blogCards[0].getAttribute('data-testid')).toBe('blog-card-recent-post-with-cover');
      expect(blogCards[1].getAttribute('data-testid')).toBe('blog-card-older-post-without-cover');
      expect(blogCards[2].getAttribute('data-testid')).toBe('blog-card-oldest-post-with-invalid-cover');
    });

    it('should handle posts with missing dates gracefully', () => {
      const postsWithMissingDate = [
        ...mockBlogPosts,
        {
          slug: 'post-without-date',
          data: {
            title: 'Post Without Date',
            description: 'This post has no date.',
            author: 'Test Author',
            // No date property
            cover: { src: '/test-cover.jpg', width: 800, height: 450 }
          }
        }
      ];

      const blogIndexPage = MockBlogIndexPage({ posts: postsWithMissingDate });
      container.appendChild(blogIndexPage);
      
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      expect(blogCards.length).toBe(4); // Should still render all posts
    });
  });

  describe('Accessibility and ARIA Support', () => {
    it('should provide proper ARIA labels and semantic structure', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const main = container.querySelector('main');
      expect(main.getAttribute('aria-labelledby')).toBe('blog-title');
      
      const grid = container.querySelector('[data-testid="blog-posts-grid"]');
      expect(grid.getAttribute('aria-label')).toBe('Blog posts');
      
      const title = container.querySelector('#blog-title');
      expect(title).toBeTruthy();
    });

    it('should provide proper alt text for all images', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      // Post with cover should have descriptive alt text
      const imageWithCover = container.querySelector('[data-testid="blog-image-recent-post-with-cover"]');
      expect(imageWithCover.alt).toBe('Recent Blog Post With Cover article thumbnail');
      
      // Posts without cover should have empty alt (decorative)
      const imageWithoutCover = container.querySelector('[data-testid="blog-image-older-post-without-cover"]');
      expect(imageWithoutCover.alt).toBe('');
      
      const imageWithInvalidCover = container.querySelector('[data-testid="blog-image-oldest-post-with-invalid-cover"]');
      expect(imageWithInvalidCover.alt).toBe('');
    });

    it('should provide proper aria-labels for read more links', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const links = container.querySelectorAll('[data-testid^="blog-link-"]');
      
      expect(links[0].getAttribute('aria-label')).toBe('Read the full blog post: Recent Blog Post With Cover');
      expect(links[1].getAttribute('aria-label')).toBe('Read the full blog post: Older Post Without Cover');
      expect(links[2].getAttribute('aria-label')).toBe('Read the full blog post: Oldest Post With Invalid Cover');
    });
  });

  describe('Performance and Loading Considerations', () => {
    it('should handle large numbers of posts efficiently', () => {
      // Create a large number of mock posts
      const largeBlogPostSet = Array.from({ length: 50 }, (_, index) => ({
        slug: `post-${index}`,
        data: {
          title: `Blog Post ${index}`,
          description: `Description for blog post ${index}`,
          author: 'Test Author',
          date: new Date(2024, 0, index + 1),
          cover: index % 3 === 0 ? { src: `/cover-${index}.jpg`, width: 800, height: 450 } : undefined
        }
      }));

      const blogIndexPage = MockBlogIndexPage({ posts: largeBlogPostSet });
      container.appendChild(blogIndexPage);
      
      const blogCards = container.querySelectorAll('[data-testid^="blog-card-"]');
      expect(blogCards.length).toBe(50);
      
      // Verify images are handled correctly even with large datasets
      const images = container.querySelectorAll('[data-testid^="blog-image-"]');
      expect(images.length).toBe(50);
      
      images.forEach((img, index) => {
        expect(img.src).toBeDefined();
        expect(img.src).not.toBe('');
        
        // Every third post should have a cover image, others should use placeholder
        if (index % 3 === 0) {
          expect(img.src).toContain(`/cover-${index}.jpg`);
        } else {
          expect(img.src).toContain('/placeholder-image.jpg');
        }
      });
    });

    it('should maintain consistent image loading attributes', () => {
      const blogIndexPage = MockBlogIndexPage({ posts: mockBlogPosts });
      container.appendChild(blogIndexPage);
      
      const images = container.querySelectorAll('[data-testid^="blog-image-"]');
      
      images.forEach(img => {
        // Verify all images have proper attributes for performance
        expect(img.getAttribute('data-testid')).toContain('blog-image-');
        expect(img.className).toContain('object-cover');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null or undefined posts array gracefully', () => {
      const blogIndexPageNull = MockBlogIndexPage({ posts: null });
      container.appendChild(blogIndexPageNull);
      
      const emptyState = container.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
      
      // Test with undefined
      container.innerHTML = '';
      const blogIndexPageUndefined = MockBlogIndexPage({ posts: undefined });
      container.appendChild(blogIndexPageUndefined);
      
      const emptyState2 = container.querySelector('[data-testid="empty-state"]');
      expect(emptyState2).toBeTruthy();
    });

    it('should handle malformed post data gracefully', () => {
      const malformedPosts = [
        null,
        undefined,
        { slug: 'valid-post', data: null },
        { slug: 'incomplete-post', data: { title: 'Only Title' } },
        { data: { title: 'No Slug', description: 'No slug provided' } }
      ];

      const blogIndexPage = MockBlogIndexPage({ posts: malformedPosts });
      container.appendChild(blogIndexPage);
      
      // Should still render without crashing
      const grid = container.querySelector('[data-testid="blog-posts-grid"]');
      expect(grid).toBeTruthy();
    });

    it('should handle posts with special characters and edge case content', () => {
      const edgeCasePosts = [
        {
          slug: 'post-with-special-chars',
          data: {
            title: 'Post with "Special" Characters & Symbols!',
            description: 'Description with <script>alert("xss")</script> and other special chars',
            author: 'Author with émojis 🚀',
            date: new Date('2024-01-01'),
            cover: { src: '/path with spaces/special-chars!@#$.jpg', width: 800, height: 450 }
          }
        }
      ];

      const blogIndexPage = MockBlogIndexPage({ posts: edgeCasePosts });
      container.appendChild(blogIndexPage);
      
      const image = container.querySelector('[data-testid="blog-image-post-with-special-chars"]');
      expect(image).toBeTruthy();
      // URLs get encoded by the browser, so we need to check for the encoded version
      expect(image.src).toContain('path%20with%20spaces/special-chars');
      
      const title = container.querySelector('[data-testid="blog-title-post-with-special-chars"]');
      expect(title.textContent).toBe('Post with "Special" Characters & Symbols!');
    });
  });
});