// Simple diagnostic test for image display issue
console.log('=== Blog Cover Image Diagnostic ===\n');

// Test the current BlogCard logic with mock data
const mockPosts = [
  {
    data: {
      title: 'Post with ImageMetadata (expected from Astro)',
      cover: {
        src: '/_astro/cover.hash123.png',
        width: 800,
        height: 450,
        format: 'png'
      }
    }
  },
  {
    data: {
      title: 'Post with string path (legacy)',
      cover: './cover.png'
    }
  },
  {
    data: {
      title: 'Post without cover',
      cover: undefined
    }
  }
];

const placeholderImage = 'PLACEHOLDER_IMAGE';

console.log('Testing current BlogCard fallback logic:\n');

mockPosts.forEach((post, index) => {
  console.log(`--- Post ${index + 1}: ${post.data.title} ---`);
  console.log(`Cover value: ${JSON.stringify(post.data.cover)}`);
  console.log(`Cover type: ${typeof post.data.cover}`);
  
  // Current BlogCard logic: const coverImage = post.data.cover || placeholderImage;
  const coverImage = post.data.cover || placeholderImage;
  
  console.log(`Fallback result: ${coverImage === placeholderImage ? 'Using placeholder' : 'Using cover'}`);
  
  if (coverImage !== placeholderImage) {
    if (typeof coverImage === 'object' && coverImage.src) {
      console.log(`✓ ImageMetadata object - this should work with Astro's Image component`);
      console.log(`  Image src: ${coverImage.src}`);
    } else if (typeof coverImage === 'string') {
      console.log(`✗ String path - this might cause issues with Astro's Image component`);
      console.log(`  String value: ${coverImage}`);
    }
  }
  console.log('');
});

console.log('=== DIAGNOSIS SUMMARY ===');
console.log('1. The fallback logic (post.data.cover || placeholderImage) works correctly');
console.log('2. ImageMetadata objects from Astro content collections should work with Image component');
console.log('3. String paths might cause issues with Astro Image component');
console.log('4. The issue is likely in how the Image component receives/processes the cover image');
console.log('\nNext steps: Check the actual BlogCard component implementation and Image component usage');