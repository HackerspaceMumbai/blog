// Diagnostic script to understand the image display issue
import { getCollection } from 'astro:content';

console.log('=== Blog Cover Image Diagnostic ===\n');

try {
  // Get all posts
  const posts = await getCollection('posts');
  console.log(`Found ${posts.length} blog posts\n`);
  
  // Analyze each post's cover image
  posts.forEach((post, index) => {
    console.log(`--- Post ${index + 1}: ${post.data.title} ---`);
    console.log(`Slug: ${post.slug}`);
    console.log(`Cover field: ${post.data.cover}`);
    console.log(`Cover type: ${typeof post.data.cover}`);
    
    if (post.data.cover) {
      console.log(`Cover defined: YES`);
      console.log(`Cover constructor: ${post.data.cover.constructor.name}`);
      
      // Check if it's an Astro ImageMetadata object
      if (typeof post.data.cover === 'object' && post.data.cover.src) {
        console.log(`✓ ImageMetadata object detected`);
        console.log(`  - src: ${post.data.cover.src}`);
        console.log(`  - width: ${post.data.cover.width}`);
        console.log(`  - height: ${post.data.cover.height}`);
        console.log(`  - format: ${post.data.cover.format}`);
      } else if (typeof post.data.cover === 'string') {
        console.log(`✗ String path detected (potential issue): ${post.data.cover}`);
      } else {
        console.log(`✗ Unknown cover type: ${typeof post.data.cover}`);
        console.log(`  - Value: ${JSON.stringify(post.data.cover)}`);
      }
    } else {
      console.log(`Cover defined: NO (will use placeholder)`);
    }
    
    console.log(''); // Empty line for readability
  });
  
  // Test the current BlogCard logic
  console.log('=== Testing Current BlogCard Logic ===\n');
  
  // Import placeholder image (simulating BlogCard import)
  const placeholderPath = '../src/assets/images/gallery/pinnedpic-1.jpg';
  console.log(`Placeholder image path: ${placeholderPath}`);
  
  // Test the current fallback logic for each post
  posts.slice(0, 3).forEach((post, index) => {
    console.log(`Testing post ${index + 1}: ${post.data.title}`);
    
    // Current BlogCard logic: const coverImage = post.data.cover || placeholderImage;
    const coverImage = post.data.cover || 'PLACEHOLDER_IMAGE';
    
    console.log(`Result: ${coverImage === 'PLACEHOLDER_IMAGE' ? 'Using placeholder' : 'Using cover image'}`);
    
    if (coverImage !== 'PLACEHOLDER_IMAGE') {
      console.log(`Cover image details:`);
      console.log(`  - Type: ${typeof coverImage}`);
      if (typeof coverImage === 'object' && coverImage.src) {
        console.log(`  - Src: ${coverImage.src}`);
        console.log(`  - This should work with Astro's Image component`);
      } else {
        console.log(`  - Value: ${coverImage}`);
        console.log(`  - ⚠️  This might cause issues with Astro's Image component`);
      }
    }
    console.log('');
  });
  
} catch (error) {
  console.error('Error during diagnosis:', error);
  console.error('Stack trace:', error.stack);
}