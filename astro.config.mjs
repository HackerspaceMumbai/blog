// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.hackerspacemumbai.org',
  
  integrations: [mdx()],

  vite: {
    plugins: [tailwindcss()]
  },

  markdown: {
    shikiConfig: {
      // Add language aliases for better syntax highlighting
      langs: [],
      // Use a theme that works for the blog
      theme: 'github-light',
      // Don't show line numbers by default
      wrap: true,
    }
  },

  // Enable static output for better performance
  output: 'static',
  
  // Optimize build
  build: {
    // Inline small assets
    inlineStylesheets: 'auto',
  }
});