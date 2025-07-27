#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blog posts directory
const postsDir = path.join(__dirname, 'src', 'content', 'posts');
// Centralized assets directory  
const assetsDir = path.join(__dirname, 'src', 'assets', 'images');

const results = {
  fixed: [],
  moved: [],
  errors: []
};

function extractImageImports(content) {
  const imageImportRegex = /<Image\s+src=\{import\(['"`]([^'"`]+)['"`]\)\}/g;
  const imports = [];
  let match;
  
  while ((match = imageImportRegex.exec(content)) !== null) {
    imports.push({
      fullMatch: match[0],
      imagePath: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return imports;
}

function copyImageIfMissing(imagePath, blogPostDir, assetsDir) {
  const colocatedPath = imagePath.replace(/^\.\.\/\.\.\/assets\/images\//, './');
  const colocatedFullPath = path.join(blogPostDir, colocatedPath.replace('./', ''));
  const centralizedImageName = imagePath.replace(/^\.\.\/\.\.\/assets\/images\//, '');
  const centralizedFullPath = path.join(assetsDir, centralizedImageName);
  
  // Check if colocated image exists
  if (!fs.existsSync(colocatedFullPath)) {
    // Check if centralized image exists
    if (fs.existsSync(centralizedFullPath)) {
      try {
        // Copy the image from centralized to colocated location
        fs.copyFileSync(centralizedFullPath, colocatedFullPath);
        console.log(`✅ Copied ${centralizedImageName} to blog folder`);
        results.moved.push({
          from: centralizedFullPath,
          to: colocatedFullPath,
          image: centralizedImageName
        });
        return true;
      } catch (error) {
        console.error(`❌ Failed to copy ${centralizedImageName}: ${error.message}`);
        results.errors.push({
          image: centralizedImageName,
          error: error.message
        });
        return false;
      }
    } else {
      console.error(`❌ Image not found in centralized assets: ${centralizedImageName}`);
      results.errors.push({
        image: centralizedImageName,
        error: 'Image not found in centralized assets'
      });
      return false;
    }
  }
  return true; // Already exists
}

function fixBlogPost(blogPostName) {
  const blogPostDir = path.join(postsDir, blogPostName);
  const indexFile = path.join(blogPostDir, 'index.mdx');
  
  if (!fs.existsSync(indexFile)) {
    console.log(`⏭️  Skipping ${blogPostName}: No index.mdx file found`);
    return;
  }
  
  let content = fs.readFileSync(indexFile, 'utf8');
  const imageImports = extractImageImports(content);
  
  let hasChanges = false;
  let fixedCount = 0;
  let movedCount = 0;
  
  console.log(`\n🔧 Processing ${blogPostName}...`);
  
  // Process imports in reverse order to maintain correct indices
  const sortedImports = imageImports.sort((a, b) => b.startIndex - a.startIndex);
  
  for (const imageImport of sortedImports) {
    const { imagePath, fullMatch, startIndex, endIndex } = imageImport;
    
    if (imagePath.startsWith('../../assets/images/')) {
      // This needs to be fixed
      const colocatedPath = imagePath.replace(/^\.\.\/\.\.\/assets\/images\//, './');
      
      // Copy image if missing
      const imageCopied = copyImageIfMissing(imagePath, blogPostDir, assetsDir);
      if (imageCopied) {
        // Update the import path in content
        const newImport = fullMatch.replace(imagePath, colocatedPath);
        content = content.substring(0, startIndex) + newImport + content.substring(endIndex);
        hasChanges = true;
        fixedCount++;
        
        console.log(`  🔄 Fixed: ${imagePath} → ${colocatedPath}`);
      } else {
        console.log(`  ⚠️  Skipped: ${imagePath} (image copy failed)`);
      }
    }
  }
  
  if (hasChanges) {
    try {
      fs.writeFileSync(indexFile, content, 'utf8');
      console.log(`✅ Updated ${blogPostName}: ${fixedCount} imports fixed`);
      results.fixed.push({
        blogPost: blogPostName,
        fixedImports: fixedCount
      });
    } catch (error) {
      console.error(`❌ Failed to write ${blogPostName}: ${error.message}`);
      results.errors.push({
        blogPost: blogPostName,
        error: error.message
      });
    }
  } else {
    console.log(`✅ ${blogPostName}: No changes needed`);
  }
}

function getAllBlogPosts() {
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

function fixAllBlogPosts() {
  console.log('🚀 Starting blog image colocation fixes...\n');
  
  const blogPosts = getAllBlogPosts();
  
  // Focus on the posts that have issues
  const problematicPosts = ['azure-swa-authentication-part1', 'azure-swa-authentication-part2'];
  
  for (const blogPost of problematicPosts) {
    if (blogPosts.includes(blogPost)) {
      fixBlogPost(blogPost);
    }
  }
  
  // Generate summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Blog posts fixed: ${results.fixed.length}`);
  console.log(`Images moved: ${results.moved.length}`);
  console.log(`Errors encountered: ${results.errors.length}`);
  
  if (results.fixed.length > 0) {
    console.log('\n✅ Fixed blog posts:');
    results.fixed.forEach(fix => {
      console.log(`  - ${fix.blogPost}: ${fix.fixedImports} imports`);
    });
  }
  
  if (results.moved.length > 0) {
    console.log('\n📁 Images moved to colocated folders:');
    results.moved.forEach(move => {
      console.log(`  - ${move.image}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => {
      console.log(`  - ${error.image || error.blogPost}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Image colocation fixes completed!');
}

// Run the fixes
fixAllBlogPosts();
