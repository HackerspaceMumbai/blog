/**
 * Test setup file for sponsor cards testing
 * Configures global test environment and mocks
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM APIs that might not be available in test environment
beforeAll(() => {
  // Mock window.open for URL testing
  global.window.open = vi.fn();
  
  // Mock console methods to reduce test noise
  global.console.warn = vi.fn();
  global.console.error = vi.fn();
  
  // Mock IntersectionObserver for lazy loading tests
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));
  
  // Mock ResizeObserver for responsive tests
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up any DOM modifications
  if (global.document) {
    global.document.body.innerHTML = '';
  }
});

afterAll(() => {
  // Restore original implementations
  vi.restoreAllMocks();
});