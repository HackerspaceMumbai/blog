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
    // Enable image optimization with Sharp
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
  
  // Build optimizations
  build: {
    // Inline small assets to reduce HTTP requests
    inlineStylesheets: 'always',
    // Split CSS for better caching
    split: true
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Inline CSS for files smaller than 8KB to reduce HTTP requests
      assetsInlineLimit: 8192,
      // Enable CSS code splitting for better caching
      cssCodeSplit: false, // Disable to inline more CSS
      // Minify CSS aggressively
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          // Optimize chunk splitting
          manualChunks: {
            // Keep vendor code separate for better caching
            vendor: ['astro/runtime/client/idle.js', 'astro/runtime/client/load.js']
          },
          // Inline small CSS files
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/[name].[hash][extname]';
            }
            return 'assets/[name].[hash][extname]';
          }
        }
      }
    }
  },

  // View transitions are now stable in Astro 3.0+
  // No experimental features needed
});