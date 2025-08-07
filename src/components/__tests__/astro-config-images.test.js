import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Astro Configuration for Image Optimization', () => {
  let astroConfig;

  beforeAll(async () => {
    try {
      const configPath = path.resolve(process.cwd(), 'astro.config.mjs');
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Parse the config content to check for image settings
      astroConfig = {
        hasImageConfig: configContent.includes('image:'),
        hasSharpService: configContent.includes('sharp'),
        hasCompression: configContent.includes('compressHTML'),
        hasPrefetch: configContent.includes('prefetch'),
        content: configContent
      };
    } catch (error) {
      console.error('Could not read Astro config:', error);
    }
  });

  it('should have image optimization configured', () => {
    expect(astroConfig.hasImageConfig).toBe(true);
  });

  it('should use Sharp service for image processing', () => {
    expect(astroConfig.hasSharpService).toBe(true);
  });

  it('should have HTML compression enabled', () => {
    expect(astroConfig.hasCompression).toBe(true);
  });

  it('should have prefetch enabled for performance', () => {
    expect(astroConfig.hasPrefetch).toBe(true);
  });

  it('should have static output mode for optimal image handling', () => {
    expect(astroConfig.content).toContain("output: 'static'");
  });
});

describe('Content Collection Schema', () => {
  let contentConfig;

  beforeAll(async () => {
    try {
      const configPath = path.resolve(process.cwd(), 'src/content/config.ts');
      const configContent = await fs.readFile(configPath, 'utf-8');
      contentConfig = configContent;
    } catch (error) {
      console.error('Could not read content config:', error);
    }
  });

  it('should have image schema for cover images', () => {
    expect(contentConfig).toContain('image()');
    expect(contentConfig).toContain('cover:');
  });

  it('should make cover images optional', () => {
    expect(contentConfig).toContain('cover: image().optional()');
  });

  it('should import image from astro:content', () => {
    expect(contentConfig).toContain('import { defineCollection, z } from "astro:content"');
    expect(contentConfig).toContain('schema: ({ image })');
  });
});