// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hackmum.in',
  integrations: [mdx()],
  output: 'server',
  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' }
  }),

  // Image optimization
  image: {
    // Enable image optimization with Sharp
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    // Configure image formats and quality
    domains: ['secure.meetupstatic.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'secure.meetupstatic.com'
      }
    ],
    // Default responsive layouts
    layout: 'constrained',
    responsiveStyles: true
  },

  // Avoid adding speculative requests to the critical request chain.
  prefetch: false,
  
  // Compression and optimization
  compressHTML: true,
  
  build: {
    inlineStylesheets: 'auto'
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Allow Node.js built-in modules for packages like sanitize-html
      external: ['path', 'fs', 'crypto', 'stream', 'util', 'buffer']
    },
    build: {
      // Keep executable scripts external so script-src 'self' can protect every route.
      assetsInlineLimit: 0,
      cssCodeSplit: true,
      // Minify CSS aggressively
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          // Avoid asset canonicalization redirects, especially on HTTP previews with production CSP.
          sanitizeFileName: (name) => name.replace(/[^a-zA-Z0-9._/-]/g, '_'),
          // Optimize chunk splitting
          manualChunks: {
            // Keep vendor code separate for better caching
            vendor: ['astro/runtime/client/idle.js', 'astro/runtime/client/load.js']
          },
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      }
    }
  },

  // View transitions are now stable in Astro 3.0+
  // No experimental features needed
});