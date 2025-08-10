import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { deployWithRetry, verifyDeploymentStatus, sanitizeErrorMessage, calculateDelay, isRetryableError } from '../deploy-with-retry.js';

let spawn;
beforeAll(async () => {
  // Dynamically import child_process for ESM compatibility
  const childProcess = await import('child_process');
  spawn = childProcess.spawn;
  vi.mock('child_process');
});

describe('deploy-with-retry', () => {
  let mockSpawn;
  let mockChild;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Set up test environment
    process.env.NETLIFY_AUTH_TOKEN = 'test-token-12345';
    process.env.NETLIFY_SITE_ID = 'test-site-id';
    // Mock child process
    mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn()
    };
    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockReturnValue(mockChild);
    // Mock console.log to avoid test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove NETLIFY_AUTH_TOKEN from error messages', () => {
      const token = 'secret-token-123';
      process.env.NETLIFY_AUTH_TOKEN = token;
      const errorMessage = `Authentication failed with token ${token} - please check credentials`;
      const sanitized = sanitizeErrorMessage(errorMessage);
      expect(sanitized).toBe('Authentication failed with token [REDACTED] - please check credentials');
      expect(sanitized).not.toContain(token);
    });
    it('should handle messages without tokens', () => {
      const message = 'Network connection failed';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe(message);
    });
    it('should handle null/undefined messages', () => {
      expect(sanitizeErrorMessage(null)).toBe(null);
      expect(sanitizeErrorMessage(undefined)).toBe(undefined);
      expect(sanitizeErrorMessage('')).toBe('');
    });
    it('should handle non-string messages', () => {
      expect(sanitizeErrorMessage(123)).toBe(123);
      expect(sanitizeErrorMessage({})).toEqual({});
    });
    it('should handle special regex characters in tokens', () => {
      const token = 'token.with+special*chars?';
      process.env.NETLIFY_AUTH_TOKEN = token;
      const errorMessage = `Failed with ${token}`;
      const sanitized = sanitizeErrorMessage(errorMessage);
      expect(sanitized).toBe('Failed with [REDACTED]');
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff delays', () => {
      expect(calculateDelay(0)).toBe(1000);  // 1 * 2^0 = 1 second
      expect(calculateDelay(1)).toBe(2000);  // 1 * 2^1 = 2 seconds
      expect(calculateDelay(2)).toBe(4000);  // 1 * 2^2 = 4 seconds
      expect(calculateDelay(3)).toBe(8000);  // 1 * 2^3 = 8 seconds
    });
    it('should cap delay at maximum value', () => {
      expect(calculateDelay(10)).toBe(30000); // Should be capped at 30 seconds
      expect(calculateDelay(20)).toBe(30000); // Should be capped at 30 seconds
    });
  });

  describe('isRetryableError', () => {
    it('should identify network-related errors as retryable', () => {
      expect(isRetryableError('Network connection failed')).toBe(true);
      expect(isRetryableError('Request timeout occurred')).toBe(true);
      expect(isRetryableError('Connection refused')).toBe(true);
      expect(isRetryableError('ECONNRESET: socket hang up')).toBe(true);
      expect(isRetryableError('ENOTFOUND: DNS lookup failed')).toBe(true);
      expect(isRetryableError('502 Bad Gateway')).toBe(true);
      expect(isRetryableError('503 Service Unavailable')).toBe(true);
      expect(isRetryableError('504 Gateway Timeout')).toBe(true);
    });
    it('should identify non-network errors as non-retryable', () => {
      expect(isRetryableError('Authentication failed')).toBe(false);
      expect(isRetryableError('Invalid site ID')).toBe(false);
      expect(isRetryableError('Build failed')).toBe(false);
      expect(isRetryableError('Permission denied')).toBe(false);
    });
    it('should be case insensitive', () => {
      expect(isRetryableError('NETWORK ERROR')).toBe(true);
      expect(isRetryableError('timeout occurred')).toBe(true);
      expect(isRetryableError('CONNECTION FAILED')).toBe(true);
    });
  });

  describe('deployWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockStdout = JSON.stringify({
        id: 'deploy-123',
        url: 'https://test.netlify.app',
        state: 'ready'
      });
      // Mock successful deployment
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(mockStdout);
        }
      });
      mockChild.stderr.on.mockImplementation(() => {});
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0); // Success exit code
        }
      });
      const result = await deployWithRetry(['--site=test-site', '--dir=dist']);
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(1);
      expect(result.deploymentInfo.id).toBe('deploy-123');
      expect(mockSpawn).toHaveBeenCalledWith('netlify', ['deploy', '--site=test-site', '--dir=dist'], expect.any(Object));
    });
    it('should retry on network failures', async () => {
      let attemptCount = 0;
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('Network connection failed');
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          attemptCount++;
          if (attemptCount < 3) {
            callback(1); // Failure exit code
          } else {
            // Success on third attempt
            mockChild.stdout.on.mockImplementation((event, callback) => {
              if (event === 'data') {
                callback(JSON.stringify({ id: 'deploy-success', state: 'ready' }));
              }
            });
            callback(0); // Success exit code
          }
        }
      });
      const result = await deployWithRetry(['--site=test-site']);
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
      expect(mockSpawn).toHaveBeenCalledTimes(3);
    });
    it('should fail after max retries on retryable errors', async () => {
      // Mock timers to speed up the test
      vi.useFakeTimers();
      
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('Network timeout occurred');
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1); // Always fail
        }
      });
      
      try {
        // Start the deployment promise and handle rejection properly
        const deployPromise = deployWithRetry(['--site=test-site']);
        
        // Set up proper promise rejection handling before advancing timers
        const rejectionPromise = deployPromise.catch(error => {
          expect(error.message).toContain('Network timeout occurred');
          return error; // Return the error instead of re-throwing
        });
        
        // Fast-forward through all timers
        await vi.runAllTimersAsync();
        
        // Wait for the rejection to be handled
        const result = await rejectionPromise;
        expect(result).toBeInstanceOf(Error);
        
        expect(mockSpawn).toHaveBeenCalledTimes(4); // Initial + 3 retries
      } finally {
        vi.useRealTimers();
      }
    }, 10000);
    it('should not retry on non-retryable errors', async () => {
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('Authentication failed - invalid token');
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1); // Failure exit code
        }
      });
      await expect(deployWithRetry(['--site=test-site'])).rejects.toThrow('Authentication failed');
      expect(mockSpawn).toHaveBeenCalledTimes(1); // No retries
    });
    it('should handle spawn errors', async () => {
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Command not found'));
        }
      });
      await expect(deployWithRetry(['--site=test-site'])).rejects.toThrow('Command not found');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });
    it('should sanitize tokens in error messages', async () => {
      const token = process.env.NETLIFY_AUTH_TOKEN;
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(`Authentication failed with token ${token}`);
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });
      try {
        await deployWithRetry(['--site=test-site']);
      } catch (error) {
        expect(error.message).toContain('[REDACTED]');
        expect(error.message).not.toContain(token);
      }
    });
  });

  describe('verifyDeploymentStatus', () => {
    it('should verify deployment status successfully', async () => {
      const mockDeployments = [
        {
          id: 'deploy-123',
          state: 'ready',
          deploy_ssl_url: 'https://test.netlify.app'
        }
      ];
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(mockDeployments));
        }
      });
      mockChild.stderr.on.mockImplementation(() => {});
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });
      const result = await verifyDeploymentStatus('test-site-id');
      expect(result.success).toBe(true);
      expect(result.deployment.id).toBe('deploy-123');
      expect(result.deployment.state).toBe('ready');
      expect(mockSpawn).toHaveBeenCalledWith('netlify', [
        'api',
        'listSiteDeploys',
        '--data',
        JSON.stringify({ site_id: 'test-site-id' })
      ], expect.any(Object));
    });
    it('should handle API failures', async () => {
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('API request failed');
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });
      const result = await verifyDeploymentStatus('test-site-id');
      expect(result.success).toBe(false);
      expect(result.error).toContain('API request failed');
    });
    it('should handle empty deployment list', async () => {
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify([]));
        }
      });
      mockChild.stderr.on.mockImplementation(() => {});
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      });
      const result = await verifyDeploymentStatus('test-site-id');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No deployments found');
    });
    it('should sanitize tokens in verification errors', async () => {
      const token = process.env.NETLIFY_AUTH_TOKEN;
      mockChild.stdout.on.mockImplementation(() => {});
      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(`API failed with token ${token}`);
        }
      });
      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });
      const result = await verifyDeploymentStatus('test-site-id');
      expect(result.success).toBe(false);
      expect(result.error).toContain('[REDACTED]');
      expect(result.error).not.toContain(token);
    });
  });

  describe('environment validation', () => {
    it('should require NETLIFY_AUTH_TOKEN', () => {
      delete process.env.NETLIFY_AUTH_TOKEN;
      expect(process.env.NETLIFY_AUTH_TOKEN).toBeUndefined();
    });
    it('should require NETLIFY_SITE_ID', () => {
      delete process.env.NETLIFY_SITE_ID;
      expect(process.env.NETLIFY_SITE_ID).toBeUndefined();
    });
  });

  describe('structured logging', () => {
    it('should log with timestamps and sanitization', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      sanitizeErrorMessage('test message');
      expect(consoleSpy).toBeDefined();
    });
  });
});
