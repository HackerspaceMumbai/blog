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
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Inline small assets
    assetsInlineLimit: 4096,
  },

  // Image optimization
  image: {
    // Enable image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    // Configure image formats
    formats: ['avif', 'webp', 'svg'],
    // Configure image quality
    quality: {
      avif: 70,
      webp: 80,
      jpeg: 85,
      png: 90
    }
  },

  // Prefetch configuration
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },

  // Output configuration
  output: 'static',
  
  // Compression and optimization
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()],
    
    // Build optimizations
    build: {
      // Enable CSS minification
      cssMinify: true,
      // Enable JS minification
      minify: 'terser',
      // Configure terser options
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          safari10: true
        },
        format: {
          safari10: true
        }
      },
      // Enable rollup optimizations
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['lodash', 'date-fns']
          }
        }
      },
      // Target modern browsers for smaller bundles
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1']
    },
    
    // CSS optimizations
    css: {
      // Enable CSS modules
      modules: {
        localsConvention: 'camelCase'
      },
      // PostCSS optimizations
      postcss: {
        plugins: [
          // Add autoprefixer for better browser support
          require('autoprefixer'),
          // Add cssnano for CSS minification
          require('cssnano')({
            preset: ['default', {
              discardComments: {
                removeAll: true
              },
              normalizeWhitespace: true,
              colormin: true,
              convertValues: true,
              discardDuplicates: true,
              discardEmpty: true,
              mergeRules: true,
              minifyFontValues: true,
              minifyParams: true,
              minifySelectors: true,
              reduceIdents: true,
              reduceTransforms: true,
              svgo: true,
              uniqueSelectors: true
            }]
          })
        ]
      }
    },
    
    // Server optimizations for development
    server: {
      // Enable HTTP/2
      https: false,
      // Enable compression
      compress: true,
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['@astrojs/mdx']
      }
    },
    
    // Define global constants for optimization
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
    }
  },

  // Experimental features for performance
  experimental: {
    // Enable view transitions
    viewTransitions: true,
    // Enable content collections caching
    contentCollectionCache: true
  }
});