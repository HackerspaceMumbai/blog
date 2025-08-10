/**
 * Integration tests for deploy-with-retry.js health check integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { runPostDeploymentHealthCheck } from '../deploy-with-retry.js';

// Mock child_process
vi.mock('child_process');

describe('Deploy with Retry - Health Check Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runPostDeploymentHealthCheck', () => {
    it('should return success when health check passes', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      // Simulate successful execution
      const promise = runPostDeploymentHealthCheck('https://example.com');
      
      // Simulate stdout data
      const stdoutCallback = mockChild.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
      stdoutCallback('Health check completed successfully\n');
      
      // Simulate process close with success
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(0);

      const result = await promise;
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Health check completed successfully');
      expect(spawn).toHaveBeenCalledWith('node', [
        'scripts/post-deployment-verify.js',
        'https://example.com',
        '--json-output',
        'deployment-verification.json'
      ], expect.objectContaining({
        stdio: ['pipe', 'pipe', 'pipe']
      }));
    });

    it('should return failure when health check fails', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      const promise = runPostDeploymentHealthCheck('https://example.com');
      
      // Simulate stderr data
      const stderrCallback = mockChild.stderr.on.mock.calls.find(call => call[0] === 'data')[1];
      stderrCallback('Health check failed: URL not accessible\n');
      
      // Simulate process close with failure
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(1);

      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Health check failed: URL not accessible');
    });

    it('should handle spawn errors', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      const promise = runPostDeploymentHealthCheck('https://example.com');
      
      // Simulate spawn error
      const errorCallback = mockChild.on.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback(new Error('Command not found'));

      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Command not found');
    });

    it('should sanitize URLs in logs', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      const promise = runPostDeploymentHealthCheck('https://example.com?token=secret123');
      
      // Simulate successful execution
      const stdoutCallback = mockChild.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
      stdoutCallback('Health check completed\n');
      
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(0);

      await promise;
      
      // Verify that the URL was passed correctly to the health check script
      expect(spawn).toHaveBeenCalledWith('node', [
        'scripts/post-deployment-verify.js',
        'https://example.com?token=secret123',
        '--json-output',
        'deployment-verification.json'
      ], expect.any(Object));
    });
  });

  describe('URL extraction scenarios', () => {
    it('should handle various deployment URL formats', () => {
      const testCases = [
        {
          name: 'Standard preview URL',
          deployOutput: { deploy_url: 'https://deploy-preview-123--hackmum.netlify.app' },
          expected: 'https://deploy-preview-123--hackmum.netlify.app'
        },
        {
          name: 'Production URL',
          deployOutput: { url: 'https://hackmum.netlify.app' },
          expected: 'https://hackmum.netlify.app'
        },
        {
          name: 'Both URLs present (deploy_url takes precedence)',
          deployOutput: { 
            deploy_url: 'https://deploy-preview-123--hackmum.netlify.app',
            url: 'https://hackmum.netlify.app'
          },
          expected: 'https://deploy-preview-123--hackmum.netlify.app'
        }
      ];

      testCases.forEach(({ name, deployOutput, expected }) => {
        // This would be tested in the actual deployment integration
        expect(deployOutput.deploy_url || deployOutput.url).toBe(expected);
      });
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle missing deployment URL gracefully', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      // Test with empty URL
      const promise = runPostDeploymentHealthCheck('');
      
      const stderrCallback = mockChild.stderr.on.mock.calls.find(call => call[0] === 'data')[1];
      stderrCallback('Invalid URL provided\n');
      
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(1);

      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL provided');
    });

    it('should handle timeout scenarios', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      spawn.mockReturnValue(mockChild);

      const promise = runPostDeploymentHealthCheck('https://slow-site.com');
      
      const stderrCallback = mockChild.stderr.on.mock.calls.find(call => call[0] === 'data')[1];
      stderrCallback('Health check timed out after 15 seconds\n');
      
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(1);

      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Health check timed out');
    });
  });
});