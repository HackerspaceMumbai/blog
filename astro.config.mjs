// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hackmum.in',
  integrations: [mdx()],

  // Image optimization
  image: {
    // Enable image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },

  // Prefetch configuration
  prefetch: true,

  // Output configuration - hybrid mode for API endpoints
  output: 'static',
  
  // Compression and optimization
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()]
  },

  // View transitions are now stable in Astro 3.0+
  // No experimental features needed
});