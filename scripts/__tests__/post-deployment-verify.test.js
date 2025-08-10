/**
 * Tests for post-deployment verification functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractDeploymentUrl,
  verifyUrlAccessibility,
  runHealthCheck,
  runBasicFunctionalityTests,
  verifyDeployment
} from '../post-deployment-verify.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Post-Deployment Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractDeploymentUrl', () => {
    it('should extract deploy_url from JSON output', () => {
      const deployOutput = JSON.stringify({
        deploy_url: 'https://deploy-preview-123--hackmum.netlify.app',
        id: 'abc123'
      });

      const result = extractDeploymentUrl(deployOutput);
      expect(result).toBe('https://deploy-preview-123--hackmum.netlify.app');
    });

    it('should extract url if deploy_url is not available', () => {
      const deployOutput = JSON.stringify({
        url: 'https://hackmum.netlify.app',
        id: 'abc123'
      });

      const result = extractDeploymentUrl(deployOutput);
      expect(result).toBe('https://hackmum.netlify.app');
    });

    it('should return null for invalid JSON', () => {
      const deployOutput = 'invalid json';
      const result = extractDeploymentUrl(deployOutput);
      expect(result).toBeNull();
    });

    it('should return null if no URL found in JSON', () => {
      const deployOutput = JSON.stringify({
        id: 'abc123',
        status: 'ready'
      });

      const result = extractDeploymentUrl(deployOutput);
      expect(result).toBeNull();
    });
  });

  describe('verifyUrlAccessibility', () => {
    it('should return true for accessible URL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await verifyUrlAccessibility('https://example.com', 1, 100);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'User-Agent': 'Hackerspace Mumbai Post-Deployment Verification/1.0'
        })
      }));
    });

    it('should retry on failure and eventually succeed', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      const result = await verifyUrlAccessibility('https://example.com', 2, 100);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return false after max retries', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await verifyUrlAccessibility('https://example.com', 2, 100);
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return false for non-ok responses after retries', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await verifyUrlAccessibility('https://example.com', 2, 100);
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('runHealthCheck', () => {
    it('should return true for healthy status', async () => {
      const healthResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        services: {
          kit: { status: 'available' },
          database: { status: 'available' }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(healthResponse)
      });

      const result = await runHealthCheck('https://example.com');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/.netlify/functions/health',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should return true for degraded status', async () => {
      const healthResponse = {
        status: 'degraded',
        timestamp: '2024-01-01T00:00:00.000Z',
        services: {
          kit: { status: 'unavailable' },
          database: { status: 'available' }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(healthResponse)
      });

      const result = await runHealthCheck('https://example.com');
      expect(result).toBe(true);
    });

    it('should return false for unhealthy status', async () => {
      const healthResponse = {
        status: 'unhealthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        services: {
          kit: { status: 'unavailable' },
          database: { status: 'unavailable' }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(healthResponse)
      });

      const result = await runHealthCheck('https://example.com');
      expect(result).toBe(false);
    });

    it('should return false for non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      const result = await runHealthCheck('https://example.com');
      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await runHealthCheck('https://example.com');
      expect(result).toBe(false);
    });
  });

  describe('runBasicFunctionalityTests', () => {
    it('should return true when all pages are accessible', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await runBasicFunctionalityTests('https://example.com');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3); // Home, blog, events
      expect(fetch).toHaveBeenCalledWith('https://example.com/', expect.any(Object));
      expect(fetch).toHaveBeenCalledWith('https://example.com/blog', expect.any(Object));
      expect(fetch).toHaveBeenCalledWith('https://example.com/events', expect.any(Object));
    });

    it('should return false when any page is not accessible', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Home page OK
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Blog page fails
        .mockResolvedValueOnce({ ok: true, status: 200 }); // Events page OK

      const result = await runBasicFunctionalityTests('https://example.com');
      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Home page OK
        .mockRejectedValueOnce(new Error('Network error')) // Blog page fails
        .mockResolvedValueOnce({ ok: true, status: 200 }); // Events page OK

      const result = await runBasicFunctionalityTests('https://example.com');
      expect(result).toBe(false);
    });
  });

  describe('verifyDeployment', () => {
    it('should return success when all checks pass', async () => {
      // Mock URL accessibility
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // URL accessibility
        .mockResolvedValueOnce({ // Health check
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'healthy' })
        })
        .mockResolvedValue({ ok: true, status: 200 }); // Basic functionality tests

      const result = await verifyDeployment('https://example.com', 1, 100);
      
      expect(result.success).toBe(true);
      expect(result.results.accessibility).toBe(true);
      expect(result.results.healthCheck).toBe(true);
      expect(result.results.basicFunctionality).toBe(true);
      expect(result.results.url).toBe('https://example.com');
      expect(result.results.timestamp).toBeDefined();
    });

    it('should return failure when URL is not accessible', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      // Use shorter retry parameters for testing
      const result = await verifyDeployment('https://example.com', 2, 100);
      
      expect(result.success).toBe(false);
      expect(result.results.accessibility).toBe(false);
      expect(result.results.healthCheck).toBe(false);
      expect(result.results.basicFunctionality).toBe(false);
    });

    it('should continue with other checks even if health check fails', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // URL accessibility
        .mockResolvedValueOnce({ ok: false, status: 503 }) // Health check fails
        .mockResolvedValue({ ok: true, status: 200 }); // Basic functionality tests

      const result = await verifyDeployment('https://example.com', 1, 100);
      
      expect(result.success).toBe(false);
      expect(result.results.accessibility).toBe(true);
      expect(result.results.healthCheck).toBe(false);
      expect(result.results.basicFunctionality).toBe(true);
    });
  });
});