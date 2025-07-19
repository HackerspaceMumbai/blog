import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/components/__tests__/setup.js'],
    include: ['src/components/__tests__/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.{js,ts,astro}'],
      exclude: ['src/components/__tests__/**']
    }
  }
});