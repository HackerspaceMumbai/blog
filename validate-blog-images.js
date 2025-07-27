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

// Results object
const results = {
  valid: [],
  issues: [],
  summary: {
    totalPosts: 0,
    postsWithIssues: 0,
    totalImages: 0,
    imagesUsingCentralizedAssets: 0,
    missingColocatedImages: 0
  }
};

function getAllBlogPosts() {
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

function extractImageImports(content) {
  // Regular expression to match Image component imports
  const imageImportRegex = /<Image\s+src=\{import\(['"`]([^'"`]+)['"`]\)\}/g;
  const imports = [];
  let match;
  
  while ((match = imageImportRegex.exec(content)) !== null) {
    imports.push({
      fullMatch: match[0],
      imagePath: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return imports;
}

function checkImageExists(imagePath, blogPostDir) {
  return fs.existsSync(path.join(blogPostDir, imagePath));
}

function checkCentralizedImageExists(imagePath) {
  // Convert relative path to centralized path
  const centralizedPath = imagePath.replace(/^\.\.\/\.\.\/assets\/images\//, '');
  return fs.existsSync(path.join(assetsDir, centralizedPath));
}

function getColocatedImagePath(centralizedPath) {
  // Extract just the filename from centralized path
  return centralizedPath.replace(/^\.\.\/\.\.\/assets\/images\//, './');
}

function validateBlogPost(blogPostName) {
  const blogPostDir = path.join(postsDir, blogPostName);
  const indexFile = path.join(blogPostDir, 'index.mdx');
  
  if (!fs.existsSync(indexFile)) {
    return {
      blogPost: blogPostName,
      error: 'No index.mdx file found',
      images: []
    };
  }
  
  const content = fs.readFileSync(indexFile, 'utf8');
  const imageImports = extractImageImports(content);
  
  const validation = {
    blogPost: blogPostName,
    totalImages: imageImports.length,
    issues: [],
    validImages: []
  };
  
  imageImports.forEach(imageImport => {
    const { imagePath, line, fullMatch } = imageImport;
    results.summary.totalImages++;
    
    if (imagePath.startsWith('../../assets/images/')) {
      // Using centralized assets - this is an issue
      results.summary.imagesUsingCentralizedAssets++;
      
      const colocatedPath = getColocatedImagePath(imagePath);
      const colocatedExists = checkImageExists(colocatedPath, blogPostDir);
      const centralizedExists = checkCentralizedImageExists(imagePath);
      
      validation.issues.push({
        line,
        currentPath: imagePath,
        issue: 'Using centralized assets instead of colocated images',
        colocatedPath,
        colocatedExists,
        centralizedExists,
        recommendation: colocatedExists 
          ? `Change to: <Image src={import('${colocatedPath}')} ...` 
          : `Move image from centralized assets to blog folder and use: <Image src={import('${colocatedPath}')} ...`
      });
      
      if (!colocatedExists) {
        results.summary.missingColocatedImages++;
      }
    } else if (imagePath.startsWith('./')) {
      // Using colocated images - check if they exist
      const imageExists = checkImageExists(imagePath, blogPostDir);
      
      if (imageExists) {
        validation.validImages.push({
          line,
          path: imagePath,
          status: 'Valid colocated image'
        });
      } else {
        validation.issues.push({
          line,
          currentPath: imagePath,
          issue: 'Colocated image file not found',
          recommendation: 'Ensure the image file exists in the blog post folder'
        });
      }
    } else {
      // Other path patterns
      validation.issues.push({
        line,
        currentPath: imagePath,
        issue: 'Unexpected image path pattern',
        recommendation: 'Use colocated images with ./ prefix'
      });
    }
  });
  
  return validation;
}

function generateReport() {
  console.log('\n🔍 BLOG IMAGE VALIDATION REPORT');
  console.log('=====================================\n');
  
  const blogPosts = getAllBlogPosts();
  results.summary.totalPosts = blogPosts.length;
  
  blogPosts.forEach(blogPost => {
    const validation = validateBlogPost(blogPost);
    
    if (validation.error) {
      console.log(`❌ ${blogPost}: ${validation.error}`);
      results.issues.push(validation);
      return;
    }
    
    if (validation.issues.length > 0) {
      results.summary.postsWithIssues++;
      results.issues.push(validation);
      
      console.log(`⚠️  ${blogPost}`);
      console.log(`   Total images: ${validation.totalImages}`);
      console.log(`   Issues found: ${validation.issues.length}`);
      console.log(`   Valid images: ${validation.validImages.length}\n`);
      
      validation.issues.forEach((issue, index) => {
        console.log(`   Issue ${index + 1} (Line ${issue.line}):`);
        console.log(`     🔸 ${issue.issue}`);
        console.log(`     🔸 Current: ${issue.currentPath}`);
        if (issue.colocatedPath) {
          console.log(`     🔸 Colocated exists: ${issue.colocatedExists ? '✅' : '❌'}`);
          console.log(`     🔸 Centralized exists: ${issue.centralizedExists ? '✅' : '❌'}`);
        }
        console.log(`     🔸 Recommendation: ${issue.recommendation}\n`);
      });
    } else {
      results.valid.push(validation);
      console.log(`✅ ${blogPost} - All ${validation.totalImages} images properly colocated`);
    }
  });
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Total blog posts: ${results.summary.totalPosts}`);
  console.log(`Posts with issues: ${results.summary.postsWithIssues}`);
  console.log(`Posts valid: ${results.valid.length}`);
  console.log(`Total images: ${results.summary.totalImages}`);
  console.log(`Images using centralized assets: ${results.summary.imagesUsingCentralizedAssets}`);
  console.log(`Missing colocated images: ${results.summary.missingColocatedImages}`);
  
  if (results.summary.postsWithIssues === 0) {
    console.log('\n🎉 All blog posts are using properly colocated images!');
  } else {
    console.log('\n⚠️  Issues found. Please review and fix the problems above.');
  }
}

// Run the validation
generateReport();
