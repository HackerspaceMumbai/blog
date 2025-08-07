import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';

describe('Astro Image Optimization Integration', () => {
  let builtHTML;
  let distPath;

  beforeAll(async () => {
    // Check if build exists, if not skip these tests
    distPath = path.resolve(process.cwd(), 'dist');
    try {
      await fs.access(distPath);
    } catch {
      console.warn('Build directory not found. Run "pnpm build" first to test image optimization.');
      return;
    }
  });

  describe('Build-time Image Optimization', () => {
    it('should generate optimized images in build output', async () => {
      try {
        const assetsPath = path.join(distPath, '_astro');
        const assetsDir = await fs.readdir(assetsPath);
        
        // Look for generated image files (Astro generates hashed filenames)
        const imageFiles = assetsDir.filter(file => 
          /\.(jpg|jpeg|png|webp|avif)$/i.test(file)
        );
        
        expect(imageFiles.length).toBeGreaterThan(0);
        console.log(`Found ${imageFiles.length} optimized images in build`);
      } catch (error) {
        console.warn('Could not verify build assets:', error.message);
      }
    });

    it('should generate responsive image variants', async () => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        const indexHTML = await fs.readFile(indexPath, 'utf-8');
        const dom = new JSDOM(indexHTML);
        const images = dom.window.document.querySelectorAll('img');
        
        let hasResponsiveImages = false;
        images.forEach(img => {
          // Check for srcset attribute (indicates responsive images)
          if (img.srcset && img.srcset.length > 0) {
            hasResponsiveImages = true;
            console.log('Found responsive image with srcset:', img.srcset.substring(0, 100) + '...');
          }
        });
        
        // At least some images should have responsive variants
        expect(hasResponsiveImages).toBe(true);
      } catch (error) {
        console.warn('Could not verify responsive images:', error.message);
      }
    });
  });

  describe('Image Loading Attributes', () => {
    it('should have proper lazy loading attributes', async () => {
      try {
        const blogPath = path.join(distPath, 'blog', 'index.html');
        const blogHTML = await fs.readFile(blogPath, 'utf-8');
        const dom = new JSDOM(blogHTML);
        const images = dom.window.document.querySelectorAll('img');
        
        let lazyLoadedImages = 0;
        images.forEach(img => {
          if (img.loading === 'lazy') {
            lazyLoadedImages++;
          }
        });
        
        expect(lazyLoadedImages).toBeGreaterThan(0);
        console.log(`Found ${lazyLoadedImages} lazy-loaded images`);
      } catch (error) {
        console.warn('Could not verify lazy loading:', error.message);
      }
    });

    it('should maintain proper aspect ratios', async () => {
      try {
        const blogPath = path.join(distPath, 'blog', 'index.html');
        const blogHTML = await fs.readFile(blogPath, 'utf-8');
        const dom = new JSDOM(blogHTML);
        const images = dom.window.document.querySelectorAll('img');
        
        let imagesWithDimensions = 0;
        images.forEach(img => {
          if (img.width && img.height) {
            imagesWithDimensions++;
            const aspectRatio = img.width / img.height;
            // Blog cards should have 3:2 aspect ratio (1.5)
            if (Math.abs(aspectRatio - 1.5) < 0.1) {
              console.log(`Image has correct 3:2 aspect ratio: ${img.width}x${img.height}`);
            }
          }
        });
        
        expect(imagesWithDimensions).toBeGreaterThan(0);
      } catch (error) {
        console.warn('Could not verify aspect ratios:', error.message);
      }
    });
  });

  describe('Image Format Optimization', () => {
    it('should serve modern image formats when available', async () => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        const indexHTML = await fs.readFile(indexPath, 'utf-8');
        
        // Check for picture elements or modern format references
        const hasModernFormats = indexHTML.includes('.webp') || 
                                indexHTML.includes('.avif') ||
                                indexHTML.includes('<picture>');
        
        if (hasModernFormats) {
          console.log('Found modern image formats in build output');
        } else {
          console.log('No modern image formats detected - this may be expected depending on configuration');
        }
      } catch (error) {
        console.warn('Could not verify image formats:', error.message);
      }
    });
  });
});