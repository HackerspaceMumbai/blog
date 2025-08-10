#!/usr/bin/env node

import { execSync } from 'child_process';
import process from 'process';

/**
 * Validates deployment configuration for Netlify deployments
 * Checks environment variables and authentication status
 */
class DeploymentConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Detects if running in CI environment
   * @returns {boolean} True if in CI environment
   */
  detectCIEnvironment() {
    return !!(process.env.CI || process.env.GITHUB_ACTIONS);
  }

  /**
   * Validates required environment variables
   * @returns {boolean} True if all required variables are present
   */
  validateEnvironmentVariables() {
    const requiredVars = ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'];
    let isValid = true;

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        this.errors.push(`Missing required environment variable: ${varName}`);
        isValid = false;
      } else if (varName === 'NETLIFY_AUTH_TOKEN' && value.length < 20) {
        this.warnings.push(`${varName} appears to be too short (expected at least 20 characters)`);
      }
    }

    return isValid;
  }

  /**
   * Validates Netlify authentication by calling netlify status
   * @returns {Promise<boolean>} True if authentication is valid
   */
  async validateNetlifyAuthentication() {
    try {
      const output = execSync('netlify status --json', {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const status = JSON.parse(output);
      
      if (!status.account) {
        this.errors.push('Netlify authentication failed: No account information returned');
        return false;
      }

      if (!status.account.email) {
        this.warnings.push('Netlify account email not available in status response');
      }

      return true;
    } catch (error) {
      if (error.status === 127) {
        this.errors.push('Netlify CLI not found. Please install it with: npm install -g netlify-cli');
      } else if (error.message.includes('Not logged in')) {
        this.errors.push('Netlify authentication failed: Not logged in. Check NETLIFY_AUTH_TOKEN');
      } else if (error.message.includes('timeout')) {
        this.errors.push('Netlify authentication timeout. Check network connection');
      } else {
        this.errors.push(`Netlify authentication failed: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Runs all validation checks
   * @returns {Promise<Object>} Validation results
   */
  async validate() {
    const results = {
      isValid: true,
      isCIEnvironment: this.detectCIEnvironment(),
      errors: [],
      warnings: []
    };

    // Validate environment variables
    const envValid = this.validateEnvironmentVariables();
    
    // Only validate Netlify auth if env vars are present
    let authValid = true;
    if (envValid) {
      authValid = await this.validateNetlifyAuthentication();
    }

    results.isValid = envValid && authValid;
    results.errors = [...this.errors];
    results.warnings = [...this.warnings];

    return results;
  }

  /**
   * Formats validation results for console output
   * @param {Object} results - Validation results
   * @returns {string} Formatted output
   */
  formatResults(results) {
    let output = '';
    
    output += `Environment: ${results.isCIEnvironment ? 'CI' : 'Local'}\n`;
    output += `Status: ${results.isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;

    if (results.errors.length > 0) {
      output += 'Errors:\n';
      results.errors.forEach(error => {
        output += `  ❌ ${error}\n`;
      });
      output += '\n';
    }

    if (results.warnings.length > 0) {
      output += 'Warnings:\n';
      results.warnings.forEach(warning => {
        output += `  ⚠️  ${warning}\n`;
      });
      output += '\n';
    }

    if (results.isValid) {
      output += '✅ Deployment configuration is valid and ready for use.\n';
    } else {
      output += '❌ Deployment configuration has issues that must be resolved.\n';
      
      if (results.isCIEnvironment) {
        output += '\nCI Environment Setup:\n';
        output += '  1. Set NETLIFY_AUTH_TOKEN in GitHub repository secrets\n';
        output += '  2. Set NETLIFY_SITE_ID in GitHub repository secrets\n';
        output += '  3. Ensure Netlify CLI is available in CI environment\n';
      } else {
        output += '\nLocal Development Setup:\n';
        output += '  1. Run: netlify login (for interactive authentication)\n';
        output += '  2. Or set NETLIFY_AUTH_TOKEN environment variable\n';
        output += '  3. Set NETLIFY_SITE_ID environment variable\n';
      }
    }

    return output;
  }
}

// CLI execution
async function main() {
  const validator = new DeploymentConfigValidator();
  
  try {
    const results = await validator.validate();
    const output = validator.formatResults(results);
    
    console.log(output);
    
    // Exit with error code if validation failed
    process.exit(results.isValid ? 0 : 1);
  } catch (error) {
    console.error('Validation failed with unexpected error:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { DeploymentConfigValidator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}