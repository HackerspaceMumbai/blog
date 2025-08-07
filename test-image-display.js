// Simple test to check image display behavior
import { getCollection } from 'astro:content';

async function testImageDisplay() {
  try {
    console.log('Testing blog image display...');
    
    // Get all posts
    const posts = await getCollection('posts');
    console.log(`Found ${posts.length} posts`);
    
    // Check each post's cover image
    posts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}: ${post.data.title}`);
      console.log(`Slug: ${post.slug}`);
      console.log(`Cover: ${post.data.cover}`);
      console.log(`Cover type: ${typeof post.data.cover}`);
      
      if (post.data.cover) {
        console.log(`Cover is defined: ${post.data.cover}`);
        console.log(`Cover constructor: ${post.data.cover.constructor.name}`);
        
        // Check if it's an ImageMetadata object
        if (post.data.cover.src) {
          console.log(`Image src: ${post.data.cover.src}`);
          console.log(`Image width: ${post.data.cover.width}`);
          console.log(`Image height: ${post.data.cover.height}`);
        }
      } else {
        console.log('Cover is undefined/null');
      }
    });
    
  } catch (error) {
    console.error('Error testing image display:', error);
  }
}

testImageDisplay();