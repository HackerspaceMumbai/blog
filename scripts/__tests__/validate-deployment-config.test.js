import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import { DeploymentConfigValidator } from '../validate-deployment-config.js';

// Mock child_process
vi.mock('child_process');

describe('DeploymentConfigValidator', () => {
  let validator;
  let originalEnv;

  beforeEach(() => {
    validator = new DeploymentConfigValidator();
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectCIEnvironment', () => {
    it('should return true when CI environment variable is set', () => {
      process.env.CI = 'true';
      expect(validator.detectCIEnvironment()).toBe(true);
    });

    it('should return true when GITHUB_ACTIONS environment variable is set', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(validator.detectCIEnvironment()).toBe(true);
    });

    it('should return true when both CI and GITHUB_ACTIONS are set', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';
      expect(validator.detectCIEnvironment()).toBe(true);
    });

    it('should return false when neither CI nor GITHUB_ACTIONS are set', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      expect(validator.detectCIEnvironment()).toBe(false);
    });

    it('should return false when CI and GITHUB_ACTIONS are empty strings', () => {
      process.env.CI = '';
      process.env.GITHUB_ACTIONS = '';
      expect(validator.detectCIEnvironment()).toBe(false);
    });
  });

  describe('validateEnvironmentVariables', () => {
    it('should return true when all required variables are present', () => {
      process.env.NETLIFY_AUTH_TOKEN = 'valid-token-with-sufficient-length';
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(true);
      expect(validator.errors).toHaveLength(0);
    });

    it('should return false when NETLIFY_AUTH_TOKEN is missing', () => {
      delete process.env.NETLIFY_AUTH_TOKEN;
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_AUTH_TOKEN');
    });

    it('should return false when NETLIFY_SITE_ID is missing', () => {
      process.env.NETLIFY_AUTH_TOKEN = 'valid-token-with-sufficient-length';
      delete process.env.NETLIFY_SITE_ID;
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_SITE_ID');
    });

    it('should return false when both variables are missing', () => {
      delete process.env.NETLIFY_AUTH_TOKEN;
      delete process.env.NETLIFY_SITE_ID;
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_AUTH_TOKEN');
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_SITE_ID');
    });

    it('should return false when variables are empty strings', () => {
      process.env.NETLIFY_AUTH_TOKEN = '';
      process.env.NETLIFY_SITE_ID = '   ';
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_AUTH_TOKEN');
      expect(validator.errors).toContain('Missing required environment variable: NETLIFY_SITE_ID');
    });

    it('should add warning when NETLIFY_AUTH_TOKEN is too short', () => {
      process.env.NETLIFY_AUTH_TOKEN = 'short';
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      
      const result = validator.validateEnvironmentVariables();
      
      expect(result).toBe(true);
      expect(validator.warnings).toContain('NETLIFY_AUTH_TOKEN appears to be too short (expected at least 20 characters)');
    });
  });

  describe('validateNetlifyAuthentication', () => {
    it('should return true when netlify status returns valid account info', async () => {
      const mockStatus = {
        account: {
          email: 'test@example.com',
          name: 'Test User'
        }
      };
      
      execSync.mockReturnValue(JSON.stringify(mockStatus));
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('netlify status --json', {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      expect(validator.errors).toHaveLength(0);
    });

    it('should return false when netlify status returns no account info', async () => {
      const mockStatus = {};
      
      execSync.mockReturnValue(JSON.stringify(mockStatus));
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Netlify authentication failed: No account information returned');
    });

    it('should add warning when account email is missing', async () => {
      const mockStatus = {
        account: {
          name: 'Test User'
        }
      };
      
      execSync.mockReturnValue(JSON.stringify(mockStatus));
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(true);
      expect(validator.warnings).toContain('Netlify account email not available in status response');
    });

    it('should handle netlify CLI not found error', async () => {
      const error = new Error('Command not found');
      error.status = 127;
      execSync.mockImplementation(() => {
        throw error;
      });
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Netlify CLI not found. Please install it with: npm install -g netlify-cli');
    });

    it('should handle not logged in error', async () => {
      const error = new Error('Not logged in');
      execSync.mockImplementation(() => {
        throw error;
      });
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Netlify authentication failed: Not logged in. Check NETLIFY_AUTH_TOKEN');
    });

    it('should handle timeout error', async () => {
      const error = new Error('Command timeout');
      execSync.mockImplementation(() => {
        throw error;
      });
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Netlify authentication timeout. Check network connection');
    });

    it('should handle generic errors', async () => {
      const error = new Error('Generic error message');
      execSync.mockImplementation(() => {
        throw error;
      });
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toContain('Netlify authentication failed: Generic error message');
    });

    it('should handle invalid JSON response', async () => {
      execSync.mockReturnValue('invalid json');
      
      const result = await validator.validateNetlifyAuthentication();
      
      expect(result).toBe(false);
      expect(validator.errors).toHaveLength(1);
      expect(validator.errors[0]).toMatch(/Netlify authentication failed:/);
    });
  });

  describe('validate', () => {
    it('should return valid result when all checks pass', async () => {
      process.env.NETLIFY_AUTH_TOKEN = 'valid-token-with-sufficient-length';
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      process.env.CI = 'true';
      
      const mockStatus = {
        account: {
          email: 'test@example.com'
        }
      };
      execSync.mockReturnValue(JSON.stringify(mockStatus));
      
      const result = await validator.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.isCIEnvironment).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return invalid result when environment variables are missing', async () => {
      delete process.env.NETLIFY_AUTH_TOKEN;
      delete process.env.NETLIFY_SITE_ID;
      
      const result = await validator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Missing required environment variable: NETLIFY_AUTH_TOKEN');
      expect(result.errors).toContain('Missing required environment variable: NETLIFY_SITE_ID');
    });

    it('should not validate netlify auth when env vars are missing', async () => {
      delete process.env.NETLIFY_AUTH_TOKEN;
      delete process.env.NETLIFY_SITE_ID;
      
      await validator.validate();
      
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should return invalid result when netlify auth fails', async () => {
      process.env.NETLIFY_AUTH_TOKEN = 'valid-token-with-sufficient-length';
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      
      const error = new Error('Not logged in');
      execSync.mockImplementation(() => {
        throw error;
      });
      
      const result = await validator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Netlify authentication failed: Not logged in. Check NETLIFY_AUTH_TOKEN');
    });

    it('should include warnings in results', async () => {
      process.env.NETLIFY_AUTH_TOKEN = 'short';
      process.env.NETLIFY_SITE_ID = 'site-id-123';
      
      const mockStatus = {
        account: {
          name: 'Test User'
        }
      };
      execSync.mockReturnValue(JSON.stringify(mockStatus));
      
      const result = await validator.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('NETLIFY_AUTH_TOKEN appears to be too short (expected at least 20 characters)');
      expect(result.warnings).toContain('Netlify account email not available in status response');
    });
  });

  describe('formatResults', () => {
    it('should format valid results correctly', () => {
      const results = {
        isValid: true,
        isCIEnvironment: true,
        errors: [],
        warnings: []
      };
      
      const output = validator.formatResults(results);
      
      expect(output).toContain('Environment: CI');
      expect(output).toContain('Status: ✅ Valid');
      expect(output).toContain('✅ Deployment configuration is valid and ready for use.');
    });

    it('should format invalid results with errors correctly', () => {
      const results = {
        isValid: false,
        isCIEnvironment: true,
        errors: ['Missing NETLIFY_AUTH_TOKEN'],
        warnings: []
      };
      
      const output = validator.formatResults(results);
      
      expect(output).toContain('Environment: CI');
      expect(output).toContain('Status: ❌ Invalid');
      expect(output).toContain('Errors:');
      expect(output).toContain('❌ Missing NETLIFY_AUTH_TOKEN');
      expect(output).toContain('❌ Deployment configuration has issues that must be resolved.');
      expect(output).toContain('CI Environment Setup:');
    });

    it('should format results with warnings correctly', () => {
      const results = {
        isValid: true,
        isCIEnvironment: false,
        errors: [],
        warnings: ['Token might be too short']
      };
      
      const output = validator.formatResults(results);
      
      expect(output).toContain('Environment: Local');
      expect(output).toContain('Warnings:');
      expect(output).toContain('⚠️  Token might be too short');
    });

    it('should show local development setup for non-CI environments', () => {
      const results = {
        isValid: false,
        isCIEnvironment: false,
        errors: ['Missing token'],
        warnings: []
      };
      
      const output = validator.formatResults(results);
      
      expect(output).toContain('Local Development Setup:');
      expect(output).toContain('netlify login');
      expect(output).toContain('NETLIFY_AUTH_TOKEN environment variable');
    });
  });
});