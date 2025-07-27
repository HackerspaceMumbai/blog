// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hackmum.in',
  integrations: [mdx()],

  // Performance optimizations
  build: {
    // Build configuration
  },

  // Image optimization
  image: {
    // Enable image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },

  // Prefetch configuration
  prefetch: true,

  // Output configuration - static mode for better compatibility
  output: 'static',
  
  // Compression and optimization
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()]
  },

  // View transitions are now stable in Astro 3.0+
  // No experimental features needed
});