/**
 * Blog Image Test Configuration
 * 
 * This file defines the test scenarios and assets for comprehensive blog image testing.
 * It's used by the blog image test suites to ensure consistent testing across all scenarios.
 */

export const TEST_BLOG_POSTS = {
  // Valid cover image scenarios
  VALID_PNG: {
    slug: 'test-valid-cover',
    title: 'Test Post with Valid Cover Image',
    coverPath: './cover.png',
    expectedImage: true,
    description: 'Tests PNG cover image display'
  },
  
  VALID_JPG: {
    slug: 'test-jpg-cover',
    title: 'Test Post with JPG Cover Image',
    coverPath: './cover.jpg',
    expectedImage: true,
    description: 'Tests JPG cover image display'
  },
  
  VALID_WEBP: {
    slug: 'test-webp-cover',
    title: 'Test Post with WebP Cover Image',
    coverPath: './cover.webp',
    expectedImage: true,
    description: 'Tests WebP cover image display'
  },
  
  // Missing/invalid cover image scenarios
  MISSING_COVER: {
    slug: 'test-missing-cover',
    title: 'Test Post with Missing Cover Image',
    coverPath: './missing-cover.png',
    expectedImage: false,
    description: 'Tests fallback when cover image file is missing'
  },
  
  NO_COVER_FIELD: {
    slug: 'test-no-cover',
    title: 'Test Post without Cover Field',
    coverPath: undefined,
    expectedImage: false,
    description: 'Tests fallback when no cover field is defined'
  },
  
  INVALID_PATH: {
    slug: 'test-invalid-path',
    title: 'Test Post with Invalid Image Path',
    coverPath: './nonexistent-cover.png',
    expectedImage: false,
    description: 'Tests fallback when cover path is invalid'
  }
};

export const TEST_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];

export const PLACEHOLDER_IMAGE_PATH = 'src/assets/images/gallery/pinnedpic-1.jpg';

/**
 * Helper function to get all test post slugs
 */
export function getAllTestPostSlugs() {
  return Object.values(TEST_BLOG_POSTS).map(post => post.slug);
}

/**
 * Helper function to get test posts that should show cover images
 */
export function getValidCoverTestPosts() {
  return Object.values(TEST_BLOG_POSTS).filter(post => post.expectedImage);
}

/**
 * Helper function to get test posts that should show placeholder images
 */
export function getFallbackTestPosts() {
  return Object.values(TEST_BLOG_POSTS).filter(post => !post.expectedImage);
}