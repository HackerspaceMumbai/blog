import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/components/__tests__/setup.js'],
    include: [
      'src/components/__tests__/**/*.test.js',
      'src/utils/__tests__/**/*.test.js',
      'netlify/functions/__tests__/**/*.test.ts'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/**/*.{js,ts,astro}',
        'src/utils/**/*.{js,ts}',
        'netlify/functions/**/*.ts'
      ],
      exclude: [
        'src/components/__tests__/**',
        'src/utils/__tests__/**',
        'netlify/functions/__tests__/**'
      ]
    }
  }
});