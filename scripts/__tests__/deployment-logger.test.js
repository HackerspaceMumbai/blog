/**
 * Tests for deployment-logger.js
 * Verifies structured logging, credential sanitization, and metrics collection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import DeploymentLogger from '../deployment-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DeploymentLogger', () => {
  let logger;
  let testLogDir;
  let originalEnv;
  let consoleSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Setup test log directory
    testLogDir = join(__dirname, '../test-logs');
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
    mkdirSync(testLogDir, { recursive: true });

    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };

    // Create logger with test configuration
    logger = new DeploymentLogger({
      logFile: join(testLogDir, 'deployment.log'),
      metricsFile: join(testLogDir, 'deployment-metrics.json'),
      logLevel: 'debug'
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    
    // Clean up test files
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Environment Detection', () => {
    it('should detect GitHub Actions environment', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      
      const testLogger = new DeploymentLogger({
        logFile: join(testLogDir, 'test.log'),
        metricsFile: join(testLogDir, 'test-metrics.json')
      });
      
      expect(testLogger.environment).toBe('github_actions');
    });

    it('should detect generic CI environment', () => {
      process.env.CI = 'true';
      delete process.env.GITHUB_ACTIONS;
      
      const testLogger = new DeploymentLogger({
        logFile: join(testLogDir, 'test.log'),
        metricsFile: join(testLogDir, 'test-metrics.json')
      });
      
      expect(testLogger.environment).toBe('ci');
    });

    it('should detect local environment', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      
      const testLogger = new DeploymentLogger({
        logFile: join(testLogDir, 'test.log'),
        metricsFile: join(testLogDir, 'test-metrics.json')
      });
      
      expect(testLogger.environment).toBe('local');
    });
  });

  describe('Credential Sanitization', () => {
    it('should sanitize NETLIFY_AUTH_TOKEN from strings', () => {
      const input = 'NETLIFY_AUTH_TOKEN=abc123def456';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('NETLIFY_AUTH_TOKEN=***REDACTED***');
    });

    it('should sanitize NETLIFY_AUTH_TOKEN with colon separator', () => {
      const input = 'NETLIFY_AUTH_TOKEN: abc123def456';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('NETLIFY_AUTH_TOKEN: ***REDACTED***');
    });

    it('should sanitize token patterns in JSON', () => {
      const input = '{"token": "abc123def456", "other": "value"}';
      const result = logger.sanitizeCredentials(input);
      expect(result).toContain('"token": "***REDACTED***"');
      expect(result).toContain('"other": "value"');
    });

    it('should sanitize auth patterns', () => {
      const input = '"auth": "secret123"';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('"auth": "***REDACTED***"');
    });

    it('should sanitize authorization patterns', () => {
      const input = '"authorization": "Basic dXNlcjpwYXNz"';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('"authorization": "***REDACTED***"');
    });

    it('should sanitize Bearer tokens in JSON', () => {
      const input = '"authorization": "Bearer abc123def456ghi789"';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('"authorization": "Bearer ***REDACTED***"');
    });

    it('should sanitize Bearer tokens', () => {
      const input = 'Authorization: Bearer abc123def456ghi789';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('Authorization: Bearer ***REDACTED***');
    });

    it('should sanitize long alphanumeric strings (potential tokens)', () => {
      const input = 'Token: abcdef1234567890abcdef1234567890abcdef12';
      const result = logger.sanitizeCredentials(input);
      expect(result).toBe('Token: ***REDACTED***');
    });

    it('should handle objects by converting to JSON first', () => {
      const input = {
        NETLIFY_AUTH_TOKEN: 'secret123',
        normalField: 'value'
      };
      const result = logger.sanitizeCredentials(input);
      expect(result).toContain('***REDACTED***');
      expect(result).toContain('normalField');
      expect(result).not.toContain('secret123');
    });

    it('should handle nested credential patterns', () => {
      const input = {
        config: {
          auth: {
            token: 'abc123def456',
            NETLIFY_AUTH_TOKEN: 'xyz789'
          }
        }
      };
      const result = logger.sanitizeCredentials(input);
      expect(result).toContain('***REDACTED***');
      expect(result).not.toContain('abc123def456');
      expect(result).not.toContain('xyz789');
    });
  });

  describe('Structured Logging', () => {
    it('should create structured log entries', () => {
      logger.info('Test message', { key: 'value' });
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('sessionId');
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.data).toEqual({ key: 'value' });
      expect(logEntry.environment).toBe('local');
    });

    it('should sanitize credentials in log entries', () => {
      logger.info('Deployment config', {
        NETLIFY_AUTH_TOKEN: 'secret123',
        site: 'mysite'
      });
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      const dataString = JSON.stringify(logEntry.data);
      
      expect(dataString).toContain('***REDACTED***');
      expect(dataString).toContain('mysite');
      expect(dataString).not.toContain('secret123');
    });

    it('should handle different log levels', () => {
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.debug('Debug message');
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logLines = logContent.trim().split('\n');
      
      expect(logLines).toHaveLength(4);
      expect(JSON.parse(logLines[0]).level).toBe('INFO');
      expect(JSON.parse(logLines[1]).level).toBe('WARN');
      expect(JSON.parse(logLines[2]).level).toBe('ERROR');
      expect(JSON.parse(logLines[3]).level).toBe('DEBUG');
    });
  });

  describe('Metrics Collection', () => {
    it('should initialize metrics correctly', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics).toHaveProperty('sessionId');
      expect(metrics).toHaveProperty('startTime');
      expect(metrics.environment).toBe('local');
      expect(metrics.status).toBe('in_progress');
      expect(metrics.events).toEqual([]);
    });

    it('should track events in metrics', () => {
      logger.info('Test event', { data: 'value' });
      logger.warn('Warning event');
      logger.error('Error event');
      
      const metrics = logger.getMetrics();
      expect(metrics.events).toHaveLength(3);
      expect(metrics.events[0].level).toBe('info');
      expect(metrics.events[1].level).toBe('warn');
      expect(metrics.events[2].level).toBe('error');
    });

    it('should categorize errors correctly', () => {
      logger.error('Authentication failed: invalid token');
      expect(logger.getMetrics().errorCategory).toBe('authentication');
      
      logger.error('Network timeout occurred');
      expect(logger.getMetrics().errorCategory).toBe('network');
      
      logger.error('Build compilation failed');
      expect(logger.getMetrics().errorCategory).toBe('build');
      
      logger.error('Deployment upload failed');
      expect(logger.getMetrics().errorCategory).toBe('deployment');
      
      logger.error('Something unexpected happened');
      expect(logger.getMetrics().errorCategory).toBe('unknown');
    });

    it('should sanitize credentials in metrics', () => {
      logger.info('Config loaded', {
        NETLIFY_AUTH_TOKEN: 'secret123',
        config: 'value'
      });
      
      const metrics = logger.getMetrics();
      const event = metrics.events[0];
      
      expect(event.data).toContain('***REDACTED***');
      expect(event.data).not.toContain('secret123');
    });
  });

  describe('Deployment Tracking', () => {
    it('should track deployment start', () => {
      logger.startDeployment('preview', {
        site: 'mysite',
        NETLIFY_AUTH_TOKEN: 'secret123'
      });
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.message).toBe('Starting deployment');
      expect(logEntry.data.type).toBe('preview');
      expect(JSON.stringify(logEntry.data.config)).toContain('***REDACTED***');
      expect(JSON.stringify(logEntry.data.config)).not.toContain('secret123');
    });

    it('should track deployment success', () => {
      logger.deploymentSuccess('https://deploy-url.netlify.app', 5000);
      
      const metrics = logger.getMetrics();
      expect(metrics.status).toBe('success');
      expect(metrics.deploymentUrl).toBe('https://deploy-url.netlify.app');
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.message).toBe('Deployment completed successfully');
    });

    it('should track deployment failure', () => {
      const error = new Error('Deployment failed');
      logger.deploymentFailure(error, 3000);
      
      const metrics = logger.getMetrics();
      expect(metrics.status).toBe('failed');
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Deployment failed');
    });
  });

  describe('GitHub Actions Integration', () => {
    beforeEach(() => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      
      logger = new DeploymentLogger({
        logFile: join(testLogDir, 'deployment.log'),
        metricsFile: join(testLogDir, 'deployment-metrics.json')
      });
    });

    it('should output GitHub Actions annotations for errors', () => {
      logger.error('Test error message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('::error::Test error message');
    });

    it('should output GitHub Actions annotations for warnings', () => {
      logger.warn('Test warning message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('::warning::Test warning message');
    });

    it('should output GitHub Actions annotations for info', () => {
      logger.info('Test info message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('::notice::Test info message');
    });

    it('should output GitHub Actions job summary', () => {
      logger.deploymentSuccess('https://test-url.netlify.app', 5000);
      logger.finalize();
      
      const summaryCall = consoleSpy.log.mock.calls.find(call => 
        call[0] && call[0].includes('::notice title=Deployment Summary::')
      );
      
      expect(summaryCall).toBeDefined();
      expect(summaryCall[0]).toContain('✅ Success');
      expect(summaryCall[0]).toContain('https://test-url.netlify.app');
    });
  });

  describe('File Operations', () => {
    it('should create log directory if it does not exist', () => {
      const newLogDir = join(testLogDir, 'nested', 'logs');
      const testLogger = new DeploymentLogger({
        logFile: join(newLogDir, 'test.log'),
        metricsFile: join(newLogDir, 'test-metrics.json')
      });
      
      testLogger.info('Test message');
      
      expect(existsSync(newLogDir)).toBe(true);
      expect(existsSync(testLogger.logFile)).toBe(true);
    });

    it('should write metrics to file on finalize', () => {
      logger.info('Test event');
      logger.finalize();
      
      expect(existsSync(logger.metricsFile)).toBe(true);
      
      const metricsContent = readFileSync(logger.metricsFile, 'utf8');
      const metrics = JSON.parse(metricsContent);
      
      expect(metrics).toHaveProperty('sessionId');
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('endTime');
      expect(metrics.events.length).toBeGreaterThanOrEqual(1); // At least the info event
    });

    it('should handle file write errors gracefully', () => {
      // Should not throw error when creating logger with invalid path
      expect(() => {
        const invalidLogger = new DeploymentLogger({
          logFile: '/invalid/path/deployment.log',
          metricsFile: '/invalid/path/metrics.json'
        });
        invalidLogger.info('Test message');
        invalidLogger.finalize();
      }).not.toThrow();
      
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Security - No Credential Exposure', () => {
    const sensitiveData = {
      NETLIFY_AUTH_TOKEN: 'nfp_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      token: 'secret_token_123',
      auth: 'bearer_token_456',
      authorization: 'Bearer abc123def456',
      apiKey: 'api_key_789012345678901234567890123456789012'
    };

    it('should never expose credentials in log files', () => {
      logger.info('Deployment config', sensitiveData);
      logger.error('Authentication failed', sensitiveData);
      logger.warn('Token validation', sensitiveData);
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      
      // Check that no sensitive values appear in logs
      Object.values(sensitiveData).forEach(sensitiveValue => {
        expect(logContent).not.toContain(sensitiveValue);
      });
      
      // Check that redacted markers are present
      expect(logContent).toContain('***REDACTED***');
    });

    it('should never expose credentials in metrics files', () => {
      logger.info('Config with secrets', sensitiveData);
      logger.finalize();
      
      const metricsContent = readFileSync(logger.metricsFile, 'utf8');
      
      // Check that no sensitive values appear in metrics
      Object.values(sensitiveData).forEach(sensitiveValue => {
        expect(metricsContent).not.toContain(sensitiveValue);
      });
      
      // Check that redacted markers are present
      expect(metricsContent).toContain('***REDACTED***');
    });

    it('should never expose credentials in console output', () => {
      logger.info('Sensitive data test', sensitiveData);
      
      const consoleOutput = consoleSpy.log.mock.calls
        .map(call => call.join(' '))
        .join(' ');
      
      // Check that no sensitive values appear in console
      Object.values(sensitiveData).forEach(sensitiveValue => {
        expect(consoleOutput).not.toContain(sensitiveValue);
      });
    });

    it('should handle error objects with sensitive data', () => {
      const error = new Error('Auth failed');
      error.config = sensitiveData;
      error.response = { data: sensitiveData };
      
      logger.error('Deployment error', { error });
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      
      Object.values(sensitiveData).forEach(sensitiveValue => {
        expect(logContent).not.toContain(sensitiveValue);
      });
    });

    it('should sanitize credentials in nested objects', () => {
      const nestedData = {
        deployment: {
          config: {
            auth: {
              NETLIFY_AUTH_TOKEN: 'secret123',
              token: 'token456'
            }
          }
        }
      };
      
      logger.info('Nested config', nestedData);
      
      const logContent = readFileSync(logger.logFile, 'utf8');
      expect(logContent).not.toContain('secret123');
      expect(logContent).not.toContain('token456');
      expect(logContent).toContain('***REDACTED***');
    });
  });
});