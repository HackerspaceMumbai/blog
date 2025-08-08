/**
 * Unit tests for test environment detection utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isCI,
  getCIPlatform,
  checkDevServerAvailability,
  checkDevServerWithRetry,
  getTestEnvironmentConfig,
  logEnvironmentInfo,
  createTestSkipHelper,
  waitForDevServer,
  getEnvironmentSpecificConfig
} from '../test-environment.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Environment Detection Utilities', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear all CI-related environment variables
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.NETLIFY;
    delete process.env.NETLIFY_BUILD_BASE;
    delete process.env.VERCEL;
    delete process.env.TRAVIS;
    delete process.env.CIRCLECI;
    delete process.env.JENKINS_URL;
    delete process.env.BUILDKITE;
    delete process.env.DRONE;
    delete process.env.GITLAB_CI;
    delete process.env.NODE_ENV;
    
    // Reset fetch mock
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('isCI()', () => {
    it('should return false in local environment', () => {
      expect(isCI()).toBe(false);
    });

    it('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect Netlify CI', () => {
      process.env.NETLIFY = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect Netlify build base', () => {
      process.env.NETLIFY_BUILD_BASE = '/opt/build';
      expect(isCI()).toBe(true);
    });

    it('should detect Vercel', () => {
      process.env.VERCEL = '1';
      expect(isCI()).toBe(true);
    });

    it('should detect Travis CI', () => {
      process.env.TRAVIS = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect CircleCI', () => {
      process.env.CIRCLECI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect Jenkins', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      expect(isCI()).toBe(true);
    });

    it('should detect generic CI environment', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect multiple CI indicators', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCI()).toBe(true);
    });
  });

  describe('getCIPlatform()', () => {
    it('should return "local" for local environment', () => {
      expect(getCIPlatform()).toBe('local');
    });

    it('should detect GitHub Actions platform', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(getCIPlatform()).toBe('github-actions');
    });

    it('should detect Netlify platform', () => {
      process.env.NETLIFY = 'true';
      expect(getCIPlatform()).toBe('netlify');
    });

    it('should detect Netlify via build base', () => {
      process.env.NETLIFY_BUILD_BASE = '/opt/build';
      expect(getCIPlatform()).toBe('netlify');
    });

    it('should detect Vercel platform', () => {
      process.env.VERCEL = '1';
      expect(getCIPlatform()).toBe('vercel');
    });

    it('should detect Travis platform', () => {
      process.env.TRAVIS = 'true';
      expect(getCIPlatform()).toBe('travis');
    });

    it('should detect CircleCI platform', () => {
      process.env.CIRCLECI = 'true';
      expect(getCIPlatform()).toBe('circleci');
    });

    it('should detect Jenkins platform', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      expect(getCIPlatform()).toBe('jenkins');
    });

    it('should detect unknown CI platform', () => {
      process.env.CI = 'true';
      expect(getCIPlatform()).toBe('unknown-ci');
    });

    it('should prioritize specific platforms over generic CI', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      expect(getCIPlatform()).toBe('github-actions');
    });
  });

  describe('checkDevServerAvailability()', () => {
    it('should return true when server responds with ok status', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await checkDevServerAvailability();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:4321', {
        signal: expect.any(AbortSignal),
        method: 'GET',
        headers: {
          'User-Agent': 'test-environment-checker'
        }
      });
    });

    it('should return false when server responds with error status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await checkDevServerAvailability();
      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkDevServerAvailability();
      expect(result).toBe(false);
    });

    it('should use custom URL when provided', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await checkDevServerAvailability('http://localhost:3000');
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });

    it('should handle timeout correctly', async () => {
      // Mock fetch to simulate timeout by throwing AbortError
      fetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      const result = await checkDevServerAvailability('http://localhost:4321', 100);
      expect(result).toBe(false);
    });

    it('should abort request on timeout', async () => {
      // Mock fetch to simulate a request that gets aborted due to timeout
      fetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      const result = await checkDevServerAvailability('http://localhost:4321', 100);
      expect(result).toBe(false);
    });
  });

  describe('checkDevServerWithRetry()', () => {
    it('should return true on first successful attempt', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const result = await checkDevServerWithRetry();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      fetch
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true });

      const result = await checkDevServerWithRetry('http://localhost:4321', 2, 10);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return false after max retries', async () => {
      fetch
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false });

      const result = await checkDevServerWithRetry('http://localhost:4321', 3, 10);
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should use custom retry parameters', async () => {
      fetch.mockResolvedValue({ ok: false });

      const result = await checkDevServerWithRetry('http://localhost:3000', 2, 50);
      
      // Verify the function was called the correct number of times
      expect(fetch).toHaveBeenCalledTimes(2);
      // Verify the result is false (all retries failed)
      expect(result).toBe(false);
      // Verify the URL was used correctly
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });

    it('should respect retry delay (timing test)', async () => {
      // Skip timing test in CI environments to avoid flakiness
      if (process.env.CI) {
        return;
      }

      fetch.mockResolvedValue({ ok: false });

      const startTime = Date.now();
      await checkDevServerWithRetry('http://localhost:3000', 2, 100); // Use longer delay for more reliable timing
      const endTime = Date.now();

      expect(fetch).toHaveBeenCalledTimes(2);
      // Allow for some timing variance in local environments
      expect(endTime - startTime).toBeGreaterThanOrEqual(80); // Allow 20ms variance
    });
  });

  describe('getTestEnvironmentConfig()', () => {
    it('should return correct config for local environment with dev server', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const config = await getTestEnvironmentConfig();

      expect(config).toEqual({
        isCI: false,
        ciPlatform: 'local',
        devServerAvailable: true,
        devServerUrl: 'http://localhost:4321',
        nodeEnv: 'development',
        shouldSkipVisualTests: false,
        shouldSkipServerDependentTests: false,
        testMode: 'full'
      });
    });

    it('should return correct config for CI environment without dev server', async () => {
      process.env.GITHUB_ACTIONS = 'true';
      fetch.mockResolvedValueOnce({ ok: false });

      const config = await getTestEnvironmentConfig();

      expect(config).toEqual({
        isCI: true,
        ciPlatform: 'github-actions',
        devServerAvailable: false,
        devServerUrl: 'http://localhost:4321',
        nodeEnv: 'development',
        shouldSkipVisualTests: true,
        shouldSkipServerDependentTests: true,
        testMode: 'ci-safe'
      });
    });

    it('should return correct config for local environment without dev server', async () => {
      fetch.mockResolvedValueOnce({ ok: false });

      const config = await getTestEnvironmentConfig();

      expect(config).toEqual({
        isCI: false,
        ciPlatform: 'local',
        devServerAvailable: false,
        devServerUrl: 'http://localhost:4321',
        nodeEnv: 'development',
        shouldSkipVisualTests: false,
        shouldSkipServerDependentTests: true,
        testMode: 'skip'
      });
    });

    it('should use custom options', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const config = await getTestEnvironmentConfig({
        devServerUrl: 'http://localhost:3000',
        timeout: 10000
      });

      expect(config.devServerUrl).toBe('http://localhost:3000');
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });

    it('should handle NODE_ENV correctly', async () => {
      process.env.NODE_ENV = 'production';
      fetch.mockResolvedValueOnce({ ok: true });

      const config = await getTestEnvironmentConfig();
      expect(config.nodeEnv).toBe('production');
    });
  });

  describe('logEnvironmentInfo()', () => {
    it('should log environment information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const config = {
        isCI: true,
        ciPlatform: 'github-actions',
        nodeEnv: 'test',
        devServerAvailable: false,
        devServerUrl: 'http://localhost:4321',
        testMode: 'ci-safe',
        shouldSkipVisualTests: true,
        shouldSkipServerDependentTests: true
      };

      logEnvironmentInfo(config);

      expect(consoleSpy).toHaveBeenCalledWith('🔍 Test Environment Detection:');
      expect(consoleSpy).toHaveBeenCalledWith('   CI Environment: Yes');
      expect(consoleSpy).toHaveBeenCalledWith('   CI Platform: github-actions');
      expect(consoleSpy).toHaveBeenCalledWith('   Node Environment: test');
      expect(consoleSpy).toHaveBeenCalledWith('   Dev Server Available: No');
      expect(consoleSpy).toHaveBeenCalledWith('   Dev Server URL: http://localhost:4321');
      expect(consoleSpy).toHaveBeenCalledWith('   Test Mode: ci-safe');
      expect(consoleSpy).toHaveBeenCalledWith('   Skip Visual Tests: Yes');
      expect(consoleSpy).toHaveBeenCalledWith('   Skip Server Tests: Yes');

      consoleSpy.mockRestore();
    });
  });

  describe('createTestSkipHelper()', () => {
    it('should return skip info for CI environment without server', () => {
      const config = {
        isCI: true,
        shouldSkipVisualTests: true,
        shouldSkipServerDependentTests: true
      };

      const skipInfo = createTestSkipHelper(config, 'visual regression test');

      expect(skipInfo).toEqual({
        shouldSkip: true,
        message: '⏭️  Skipping visual regression test - dev server not available in CI environment',
        reason: 'ci-no-server'
      });
    });

    it('should return skip info for local environment without server', () => {
      const config = {
        isCI: false,
        shouldSkipVisualTests: false,
        shouldSkipServerDependentTests: true
      };

      const skipInfo = createTestSkipHelper(config, 'server test');

      expect(skipInfo).toEqual({
        shouldSkip: true,
        message: '⏭️  Skipping server test - dev server not available. Please start dev server: npm run dev',
        reason: 'local-no-server'
      });
    });

    it('should return ready info when environment is ready', () => {
      const config = {
        isCI: false,
        shouldSkipVisualTests: false,
        shouldSkipServerDependentTests: false
      };

      const skipInfo = createTestSkipHelper(config, 'full test');

      expect(skipInfo).toEqual({
        shouldSkip: false,
        message: '✅ Running full test - environment ready',
        reason: 'ready'
      });
    });
  });

  describe('waitForDevServer()', () => {
    it('should return true when server becomes available immediately', async () => {
      fetch.mockResolvedValue({ ok: true });

      const result = await waitForDevServer();
      expect(result).toBe(true);
    });

    it('should return true when server becomes available after delay', async () => {
      let callCount = 0;
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true });
      });

      const result = await waitForDevServer('http://localhost:4321', 5000, 100);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return false when server never becomes available', async () => {
      fetch.mockResolvedValue({ ok: false });

      const result = await waitForDevServer('http://localhost:4321', 200, 50);
      expect(result).toBe(false);
    });

    it('should use custom parameters', async () => {
      fetch.mockResolvedValue({ ok: true });

      const result = await waitForDevServer('http://localhost:3000', 1000, 100);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });
  });

  describe('getEnvironmentSpecificConfig()', () => {
    it('should return GitHub Actions config', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const config = getEnvironmentSpecificConfig();

      expect(config).toEqual({
        timeout: 10000,
        retries: 2,
        headless: true,
        slowMo: 0
      });
    });

    it('should return Netlify config', () => {
      process.env.NETLIFY = 'true';

      const config = getEnvironmentSpecificConfig();

      expect(config).toEqual({
        timeout: 15000,
        retries: 1,
        headless: true,
        slowMo: 0
      });
    });

    it('should return local config by default', () => {
      const config = getEnvironmentSpecificConfig();

      expect(config).toEqual({
        timeout: 5000,
        retries: 3,
        headless: false,
        slowMo: 100
      });
    });

    it('should return local config for unknown CI platform', () => {
      process.env.CI = 'true';
      process.env.SOME_UNKNOWN_CI = 'true';

      const config = getEnvironmentSpecificConfig();

      expect(config).toEqual({
        timeout: 5000,
        retries: 3,
        headless: false,
        slowMo: 100
      });
    });
  });
});