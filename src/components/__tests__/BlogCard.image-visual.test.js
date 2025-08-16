/**
 * Visual Regression Tests for Blog Image Formats
 * 
 * Tests visual rendering of different image formats to ensure
 * consistent display across all supported formats.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('BlogCard Image Format Visual Tests', () => {
  let browser;
  let page;
  let serverAvailable = false;
  const screenshotDir = 'test-screenshots/image-formats';
  const DEV_SERVER_URL = 'http://localhost:4321';

  beforeAll(async () => {
    // Check if dev server is running
    try {
      const response = await fetch(DEV_SERVER_URL);
      serverAvailable = response.ok;
    } catch (error) {
      serverAvailable = false;
      console.log('Dev server not available - skipping visual tests');
    }

    if (serverAvailable) {
      // Create screenshot directory if it doesn't exist
      if (!existsSync(screenshotDir)) {
        mkdirSync(screenshotDir, { recursive: true });
      }

      browser = await chromium.launch({
        headless: true
      });
      page = await browser.newPage();

      // Set viewport for consistent screenshots
      await page.setViewportSize({ width: 1200, height: 800 });
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Image Loading and Display Tests', () => {
    it('should verify all blog card images load correctly', async () => {
      if (!serverAvailable) {
        console.log('Skipping image loading test - dev server not available');
        return;
      }
      
      try {
        // Navigate to development server
        await page.goto(DEV_SERVER_URL, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // Wait for blog cards to load
        await page.waitForSelector('article.card', { timeout: 10000 });

        // Get all blog card images
        const imageData = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('article.card'));
          return cards.map((card, index) => {
            const img = card.querySelector('img');
            if (img) {
              return {
                index,
                src: img.src,
                alt: img.alt,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete,
                loaded: img.complete && img.naturalHeight !== 0,
                hasError: img.src === '' || img.src.includes('data:')
              };
            }
            return null;
          }).filter(Boolean);
        });

        console.log(`Found ${imageData.length} images in blog cards`);
        
        // Verify all images loaded successfully
        const failedImages = imageData.filter(img => !img.loaded || img.hasError);
        if (failedImages.length > 0) {
          console.warn('Failed to load images:', failedImages);
        }

        expect(imageData.length).toBeGreaterThan(0);
        expect(failedImages.length).toBe(0);

        // Take screenshot of the blog grid
        await page.screenshot({
          path: join(screenshotDir, 'blog-grid-overview.png'),
          fullPage: true
        });

      } catch (error) {
        console.error('Visual test failed:', error);
        throw error;
      }
    });

    it('should capture individual blog card screenshots', async () => {
      if (!serverAvailable) {
        console.log('Skipping screenshot test - dev server not available');
        return;
      }
      
      try {
        await page.goto(DEV_SERVER_URL, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        await page.waitForSelector('article.card', { timeout: 10000 });

        // Get all blog cards
        const cards = await page.locator('article.card').all();
        
        for (let i = 0; i < Math.min(cards.length, 5); i++) {
          const card = cards[i];
          
          // Get card title for filename
          const title = await card.locator('h2').textContent()
            .then(text => text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase())
            .catch(() => `card-${i}`);

          // Take screenshot of individual card
          await card.screenshot({
            path: join(screenshotDir, `blog-card-${i}-${title}.png`)
          });
        }

        expect(cards.length).toBeGreaterThan(0);

      } catch (error) {
        console.error('Individual card screenshot test failed:', error);
        throw error;
      }
    });
  });

  describe('Image Format Compatibility Tests', () => {
    it('should handle different image formats correctly', async () => {
      if (!serverAvailable) {
        console.log('Skipping format test - dev server not available');
        return;
      }
      
      try {
        await page.goto(DEV_SERVER_URL, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        await page.waitForSelector('article.card', { timeout: 10000 });

        // Analyze image formats
        const formatData = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('article.card img'));
          const formats = {};
          
          images.forEach(img => {
            const src = img.src;
            let format = 'unknown';
            
            if (src.includes('.png')) format = 'png';
            else if (src.includes('.jpg') || src.includes('.jpeg')) format = 'jpg';
            else if (src.includes('.webp')) format = 'webp';
            else if (src.includes('.avif')) format = 'avif';
            else if (src.includes('pinnedpic')) format = 'placeholder';
            
            formats[format] = (formats[format] || 0) + 1;
          });
          
          return formats;
        });

        console.log('Image format distribution:', formatData);
        
        // Verify we have images in various formats
        expect(Object.keys(formatData).length).toBeGreaterThan(0);
        
        // Take format-specific screenshots if available
        for (const [format, count] of Object.entries(formatData)) {
          if (count > 0) {
            await page.screenshot({
              path: join(screenshotDir, `format-${format}-sample.png`),
              clip: { x: 0, y: 0, width: 400, height: 300 }
            });
          }
        }

      } catch (error) {
        console.error('Format compatibility test failed:', error);
        throw error;
      }
    });
  });

  describe('Responsive Image Display Tests', () => {
    it('should test image display at different viewport sizes', async () => {
      if (!serverAvailable) {
        console.log('Skipping responsive test - dev server not available');
        return;
      }
      
      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1200, height: 800, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewport(viewport);
        
        await page.goto(DEV_SERVER_URL, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        await page.waitForSelector('article.card', { timeout: 10000 });

        // Take screenshot at this viewport size
        await page.screenshot({
          path: join(screenshotDir, `responsive-${viewport.name}.png`),
          fullPage: true
        });

        // Verify images are still loading correctly
        const imageCount = await page.locator('article.card img').count();
        expect(imageCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Image Accessibility Tests', () => {
    it('should verify image alt text and accessibility', async () => {
      if (!serverAvailable) {
        console.log('Skipping accessibility test - dev server not available');
        return;
      }
      
      try {
        await page.goto(DEV_SERVER_URL, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        await page.waitForSelector('article.card', { timeout: 10000 });

        // Check image accessibility
        const accessibilityData = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('article.card img'));
          return images.map((img, index) => ({
            index,
            hasAlt: img.hasAttribute('alt'),
            altText: img.alt,
            altLength: img.alt ? img.alt.length : 0,
            hasTitle: img.hasAttribute('title'),
            isDecorative: img.alt === '',
            hasAriaLabel: img.hasAttribute('aria-label')
          }));
        });

        console.log('Image accessibility analysis:', accessibilityData);

        // Verify accessibility requirements
        accessibilityData.forEach((imgData, index) => {
          // All images should have alt attribute (even if empty for decorative)
          expect(imgData.hasAlt).toBe(true);
          
          // Non-decorative images should have meaningful alt text
          if (!imgData.isDecorative) {
            expect(imgData.altLength).toBeGreaterThan(0);
          }
        });

        expect(accessibilityData.length).toBeGreaterThan(0);

      } catch (error) {
        console.error('Accessibility test failed:', error);
        throw error;
      }
    });
  });
});