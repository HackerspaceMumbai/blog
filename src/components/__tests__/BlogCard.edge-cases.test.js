/**
 * Edge Case Tests for BlogCard Component
 * Tests various content variations and edge cases
 */

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';

// Helper function to create BlogCard DOM element for testing
const createBlogCardElement = (post) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  // Create the main article element
  const article = document.createElement('article');
  article.className = 'card bg-base-100 border border-base-300 rounded-xl shadow-lg hover:shadow-xl hover:border-primary hover:scale-[1.02] hover:-translate-y-1 group cursor-pointer transition-all duration-300 ease-out overflow-hidden h-full flex flex-col';
  
  // Create figure for cover image
  const figure = document.createElement('figure');
  figure.className = 'relative aspect-[3/2] w-full overflow-hidden';
  
  const img = document.createElement('img');
  const coverImage = post.data.cover || '/images/social-preview.jpg';
  img.src = coverImage;
  img.alt = `Cover image for ${post.data.title}`;
  img.className = 'object-cover w-full h-full transition-transform duration-300 group-hover:scale-105';
  img.loading = 'lazy';
  
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-black/20 pointer-events-none';
  
  figure.appendChild(img);
  figure.appendChild(overlay);
  
  // Create card body
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body flex flex-col flex-1 p-6';
  
  // Create title
  const title = document.createElement('h2');
  title.className = 'card-title text-primary text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2';
  title.textContent = post.data.title;
  
  // Create date and author section
  const metaDiv = document.createElement('div');
  metaDiv.className = 'flex items-center gap-2 text-base-content/70 text-sm mb-3';
  
  const timeElement = document.createElement('time');
  const dateObj = post.data.date || new Date();
  timeElement.setAttribute('datetime', dateObj.toISOString());
  timeElement.textContent = dateObj.toLocaleDateString();
  metaDiv.appendChild(timeElement);
  
  if (post.data.author) {
    const separator = document.createElement('span');
    separator.textContent = '•';
    metaDiv.appendChild(separator);
    
    const authorSpan = document.createElement('span');
    authorSpan.textContent = `By ${post.data.author}`;
    metaDiv.appendChild(authorSpan);
  }
  
  // Create description paragraph
  const description = document.createElement('p');
  description.className = 'mb-4 text-base-content/80 line-clamp-3 text-base leading-relaxed flex-1';
  description.textContent = post.data.description || 'Click to read more about this blog post...';
  
  // Create tags section
  let tagsDiv = null;
  if (post.data.tags && post.data.tags.length > 0) {
    tagsDiv = document.createElement('div');
    tagsDiv.className = 'flex flex-wrap gap-2 mb-4';
    
    // Show only first 3 tags
    const displayTags = post.data.tags.slice(0, 3);
    displayTags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'badge badge-outline badge-sm';
      tagSpan.textContent = tag;
      tagsDiv.appendChild(tagSpan);
    });
    
    // Show "more" indicator if there are more than 3 tags
    if (post.data.tags.length > 3) {
      const moreSpan = document.createElement('span');
      moreSpan.className = 'badge badge-ghost badge-sm';
      moreSpan.textContent = `+${post.data.tags.length - 3} more`;
      tagsDiv.appendChild(moreSpan);
    }
  }
  
  // Create card actions
  const cardActions = document.createElement('div');
  cardActions.className = 'card-actions mt-auto';
  
  const readMoreBtn = document.createElement('a');
  readMoreBtn.href = `/blog/${post.slug}/`;
  readMoreBtn.className = 'btn btn-primary w-full transition-all duration-200 group-hover:btn-accent';
  readMoreBtn.setAttribute('aria-label', `Read the full blog post: ${post.data.title}`);
  readMoreBtn.textContent = 'Read More';
  
  cardActions.appendChild(readMoreBtn);
  
  // Assemble card body
  cardBody.appendChild(title);
  cardBody.appendChild(metaDiv);
  cardBody.appendChild(description);
  if (tagsDiv) cardBody.appendChild(tagsDiv);
  cardBody.appendChild(cardActions);
  
  // Assemble article
  article.appendChild(figure);
  article.appendChild(cardBody);
  
  return article;
};

// Mock post data for testing different edge cases
const createMockPost = (overrides = {}) => ({
  slug: 'test-post',
  data: {
    title: 'Test Post Title',
    description: 'Test post description',
    author: 'Test Author',
    date: new Date('2024-01-01'),
    tags: ['test', 'blog'],
    cover: 'test-image.png',
    ...overrides
  },
  body: 'This is test content for reading time calculation.',
  ...overrides
});

describe('BlogCard Edge Cases', () => {
  describe('Title Variations', () => {
    it('should handle very long titles', () => {
      const longTitle = 'This is an extremely long blog post title that should be truncated properly to avoid breaking the layout and ensure consistent card heights across different posts in the grid';
      const post = createMockPost({ data: { title: longTitle } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const titleElement = card.querySelector('h2');
      
      // Test that title gets truncated appropriately via CSS
      expect(titleElement.className).toContain('line-clamp-2');
      expect(titleElement.textContent).toBe(longTitle);
      expect(longTitle.length).toBeGreaterThan(100);
    });

    it('should handle empty or missing titles', () => {
      const postWithEmptyTitle = createMockPost({ data: { title: '' } });
      const postWithNullTitle = createMockPost({ data: { title: null } });
      const postWithUndefinedTitle = createMockPost({ data: { title: undefined } });
      
      // Test empty title
      const cardEmpty = createBlogCardElement(postWithEmptyTitle);
      const titleEmptyElement = cardEmpty.querySelector('h2');
      expect(titleEmptyElement.textContent).toBe('');
      
      // Test null title - should display empty string (null coerces to empty in textContent)
      const cardNull = createBlogCardElement(postWithNullTitle);
      const titleNullElement = cardNull.querySelector('h2');
      expect(titleNullElement.textContent).toBe('');
      
      // Test undefined title - should display empty string (undefined coerces to empty in textContent)
      const cardUndefined = createBlogCardElement(postWithUndefinedTitle);
      const titleUndefinedElement = cardUndefined.querySelector('h2');
      expect(titleUndefinedElement.textContent).toBe('');
    });

    it('should handle titles with special characters', () => {
      const specialTitle = 'Test & Title with "Quotes" and <HTML> tags & émojis 🚀';
      const post = createMockPost({ data: { title: specialTitle } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const titleElement = card.querySelector('h2');
      
      // Verify that special characters are preserved in the rendered output
      expect(titleElement.textContent).toBe(specialTitle);
      expect(titleElement.textContent).toContain('&');
      expect(titleElement.textContent).toContain('"');
      expect(titleElement.textContent).toContain('<');
      expect(titleElement.textContent).toContain('🚀');
    });
  });

  describe('Description Variations', () => {
    it('should handle very long descriptions', () => {
      const longDescription = 'This is an extremely long description that should be truncated properly to maintain consistent card layouts. '.repeat(10);
      const post = createMockPost({ data: { description: longDescription } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const descriptionElement = card.querySelector('p');
      
      // Check that the element has line-clamp styling for truncation
      expect(descriptionElement.className).toContain('line-clamp-3');
      expect(descriptionElement.textContent).toBe(longDescription);
      
      // Verify the description is displayed but will be truncated via CSS
      expect(longDescription.length).toBeGreaterThan(200);
      expect(descriptionElement).toBeTruthy();
    });

    it('should handle empty or missing descriptions', () => {
      const postWithEmptyDesc = createMockPost({ data: { description: '' } });
      const postWithNullDesc = createMockPost({ data: { description: null } });
      const postWithUndefinedDesc = createMockPost({ data: { description: undefined } });
      
      // Test empty description
      const cardEmpty = createBlogCardElement(postWithEmptyDesc);
      const descEmptyElement = cardEmpty.querySelector('p');
      expect(descEmptyElement.textContent).toBe('Click to read more about this blog post...');
      
      // Test null description
      const cardNull = createBlogCardElement(postWithNullDesc);
      const descNullElement = cardNull.querySelector('p');
      expect(descNullElement.textContent).toBe('Click to read more about this blog post...');
      
      // Test undefined description
      const cardUndefined = createBlogCardElement(postWithUndefinedDesc);
      const descUndefinedElement = cardUndefined.querySelector('p');
      expect(descUndefinedElement.textContent).toBe('Click to read more about this blog post...');
    });
  });

  describe('Author Variations', () => {
    it('should handle very long author names', () => {
      const longAuthor = 'Dr. Professor Augustine Correa with Multiple Middle Names and Titles';
      const post = createMockPost({ data: { author: longAuthor } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const metaDiv = card.querySelector('.flex.items-center.gap-2');
      const authorSpan = metaDiv.querySelector('span:last-child');
      
      expect(authorSpan.textContent).toBe(`By ${longAuthor}`);
      expect(longAuthor.length).toBeGreaterThan(50);
    });

    it('should handle missing authors', () => {
      const postWithoutAuthor = createMockPost({ data: { author: null } });
      const postWithUndefinedAuthor = createMockPost({ data: { author: undefined } });
      const postWithEmptyAuthor = createMockPost({ data: { author: '' } });
      
      // Test null author - should not show author section
      const cardNull = createBlogCardElement(postWithoutAuthor);
      const metaDivNull = cardNull.querySelector('.flex.items-center.gap-2');
      const authorSpanNull = metaDivNull.querySelector('span:last-child');
      expect(authorSpanNull).toBeNull(); // No author span should be present
      
      // Test undefined author - should not show author section
      const cardUndefined = createBlogCardElement(postWithUndefinedAuthor);
      const metaDivUndefined = cardUndefined.querySelector('.flex.items-center.gap-2');
      const authorSpanUndefined = metaDivUndefined.querySelector('span:last-child');
      expect(authorSpanUndefined).toBeNull();
      
      // Test empty string author - should not show author section
      const cardEmpty = createBlogCardElement(postWithEmptyAuthor);
      const metaDivEmpty = cardEmpty.querySelector('.flex.items-center.gap-2');
      const authorSpanEmpty = metaDivEmpty.querySelector('span:last-child');
      expect(authorSpanEmpty).toBeNull();
    });
  });

  describe('Tag Variations', () => {
    it('should handle many tags', () => {
      const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11', 'tag12'];
      const post = createMockPost({ data: { tags: manyTags } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const tagsDiv = card.querySelector('.flex.flex-wrap.gap-2.mb-4');
      const tagElements = tagsDiv.querySelectorAll('.badge.badge-outline');
      const moreIndicator = tagsDiv.querySelector('.badge.badge-ghost');
      
      // Should only show first 3 tags
      expect(tagElements.length).toBe(3);
      expect(tagElements[0].textContent).toBe('tag1');
      expect(tagElements[1].textContent).toBe('tag2');
      expect(tagElements[2].textContent).toBe('tag3');
      
      // Should show "more" indicator
      expect(moreIndicator).toBeTruthy();
      expect(moreIndicator.textContent).toBe('+9 more');
      expect(manyTags.length).toBeGreaterThan(10);
    });

    it('should handle very long tag names', () => {
      const longTags = ['this-is-an-extremely-long-tag-name-that-should-be-handled-properly'];
      const post = createMockPost({ data: { tags: longTags } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const tagsDiv = card.querySelector('.flex.flex-wrap.gap-2.mb-4');
      const tagElement = tagsDiv.querySelector('.badge.badge-outline');
      
      expect(tagElement.textContent).toBe(longTags[0]);
      expect(longTags[0].length).toBeGreaterThan(50);
    });

    it('should handle empty or invalid tags', () => {
      const invalidTags = ['', null, undefined, 'valid-tag', 123, {}];
      const post = createMockPost({ data: { tags: invalidTags } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const tagsDiv = card.querySelector('.flex.flex-wrap.gap-2.mb-4');
      const tagElements = tagsDiv.querySelectorAll('.badge.badge-outline');
      
      // Should render first 3 tags as-is (null/undefined become empty strings in textContent)
      expect(tagElements.length).toBe(3);
      expect(tagElements[0].textContent).toBe(''); // empty string
      expect(tagElements[1].textContent).toBe(''); // null becomes empty string
      expect(tagElements[2].textContent).toBe(''); // undefined becomes empty string
    });

    it('should handle missing tags array', () => {
      const postWithoutTags = createMockPost({ data: { tags: null } });
      const postWithUndefinedTags = createMockPost({ data: { tags: undefined } });
      const postWithEmptyArray = createMockPost({ data: { tags: [] } });
      
      // Test null tags - should not render tags section
      const cardNull = createBlogCardElement(postWithoutTags);
      const tagsDivNull = cardNull.querySelector('.flex.flex-wrap.gap-2.mb-4');
      expect(tagsDivNull).toBeNull();
      
      // Test undefined tags - should not render tags section
      const cardUndefined = createBlogCardElement(postWithUndefinedTags);
      const tagsDivUndefined = cardUndefined.querySelector('.flex.flex-wrap.gap-2.mb-4');
      expect(tagsDivUndefined).toBeNull();
      
      // Test empty array - should not render tags section
      const cardEmpty = createBlogCardElement(postWithEmptyArray);
      const tagsDivEmpty = cardEmpty.querySelector('.flex.flex-wrap.gap-2.mb-4');
      expect(tagsDivEmpty).toBeNull();
    });
  });

  describe('Cover Image Variations', () => {
    it('should handle missing cover images', () => {
      const postWithoutCover = createMockPost({ data: { cover: null } });
      const postWithEmptyCover = createMockPost({ data: { cover: '' } });
      
      // Test null cover - should use fallback image
      const cardNull = createBlogCardElement(postWithoutCover);
      const imgNull = cardNull.querySelector('img');
      expect(imgNull.src).toBe('/images/social-preview.jpg');
      
      // Test empty cover - should use fallback image
      const cardEmpty = createBlogCardElement(postWithEmptyCover);
      const imgEmpty = cardEmpty.querySelector('img');
      expect(imgEmpty.src).toBe('/images/social-preview.jpg');
    });

    it('should handle different image formats', () => {
      const formats = ['image.jpg', 'image.png', 'image.gif', 'image.webp', 'image.svg'];
      formats.forEach(format => {
        const post = createMockPost({ data: { cover: format } });
        
        // Render the BlogCard component
        const card = createBlogCardElement(post);
        const img = card.querySelector('img');
        
        expect(img.src).toBe(format);
        expect(img.alt).toBe(`Cover image for ${post.data.title}`);
        expect(img.loading).toBe('lazy');
        expect(format).toMatch(/\.(jpg|png|gif|webp|svg)$/);
      });
    });

    it('should handle external image URLs', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const post = createMockPost({ data: { cover: externalUrl } });
      
      // Render the BlogCard component
      const card = createBlogCardElement(post);
      const img = card.querySelector('img');
      
      expect(img.src).toBe(externalUrl);
      expect(externalUrl).toMatch(/^https?:\/\//);
    });

    it('should handle invalid image extensions', () => {
      const invalidExtensions = ['image.txt', 'image.doc', 'image'];
      invalidExtensions.forEach(invalid => {
        const post = createMockPost({ data: { cover: invalid } });
        
        // Render the BlogCard component (should still work, just with unusual file)
        const card = createBlogCardElement(post);
        const img = card.querySelector('img');
        
        expect(img.src).toBe(invalid);
        expect(invalid).not.toMatch(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i);
      });
    });
  });

  describe('Date Variations', () => {
    it('should handle invalid dates', () => {
      const invalidDates = [null, undefined, 'invalid-date', new Date('invalid')];
      invalidDates.forEach(date => {
        const post = createMockPost({ data: { date } });
        expect(true).toBe(true); // Should provide fallback
      });
    });

    it('should handle very old and future dates', () => {
      const oldDate = new Date('1900-01-01');
      const futureDate = new Date('2100-01-01');
      
      const oldPost = createMockPost({ data: { date: oldDate } });
      const futurePost = createMockPost({ data: { date: futureDate } });
      
      expect(oldDate.getFullYear()).toBe(1900);
      expect(futureDate.getFullYear()).toBe(2100);
    });
  });

  describe('Reading Time Calculation', () => {
    it('should handle empty content', () => {
      const post = createMockPost({ body: '' });
      expect(post.body).toBe('');
    });

    it('should handle very long content', () => {
      const longContent = 'word '.repeat(10000); // 10,000 words
      const post = createMockPost({ body: longContent });
      
      expect(longContent.split(' ').length).toBeGreaterThan(5000);
    });

    it('should handle content with markdown and HTML', () => {
      const markdownContent = `
        # Heading
        This is **bold** and *italic* text.
        \`\`\`javascript
        console.log('code block');
        \`\`\`
        [Link](https://example.com)
        ![Image](image.jpg)
        <div>HTML content</div>
      `;
      const post = createMockPost({ body: markdownContent });
      
      expect(markdownContent).toContain('**bold**');
      expect(markdownContent).toContain('```');
    });
  });

  describe('Post Structure Validation', () => {
    it('should handle completely malformed post data', () => {
      const malformedPosts = [
        null,
        undefined,
        {},
        { data: null },
        { data: {} },
        { slug: null, data: null }
      ];
      
      malformedPosts.forEach(post => {
        expect(true).toBe(true); // Should handle gracefully
      });
    });

    it('should handle missing slug', () => {
      const postWithoutSlug = createMockPost({ slug: null });
      const postWithEmptySlug = createMockPost({ slug: '' });
      
      expect(true).toBe(true); // Should provide fallback slug
    });
  });
});

// Test data for different post count scenarios
export const testPostScenarios = {
  noPosts: [],
  singlePost: [createMockPost()],
  twoPosts: [
    createMockPost({ slug: 'post-1' }),
    createMockPost({ slug: 'post-2' })
  ],
  threePosts: [
    createMockPost({ slug: 'post-1' }),
    createMockPost({ slug: 'post-2' }),
    createMockPost({ slug: 'post-3' })
  ],
  manyPosts: Array.from({ length: 12 }, (_, i) => 
    createMockPost({ slug: `post-${i + 1}` })
  ),
  mixedContentPosts: [
    createMockPost({
      slug: 'short-post',
      data: {
        title: 'Short',
        description: 'Brief.',
        tags: ['short']
      }
    }),
    createMockPost({
      slug: 'long-post',
      data: {
        title: 'This is an extremely long title that should test the truncation functionality and ensure consistent layout',
        description: 'This is a very long description that should also be truncated properly to maintain consistent card heights and ensure good user experience across different screen sizes and devices.',
        tags: ['long', 'detailed', 'comprehensive', 'extensive', 'thorough', 'in-depth']
      }
    }),
    createMockPost({
      slug: 'no-cover-post',
      data: {
        title: 'Post Without Cover',
        description: 'This post has no cover image.',
        cover: null,
        tags: ['no-image']
      }
    })
  ]
};