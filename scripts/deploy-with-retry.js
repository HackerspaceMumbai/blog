
import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * Deployment retry wrapper with exponential backoff for network failures
 * Implements structured error logging with credential sanitization
 */

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds

/**
 * Sanitizes error messages by removing NETLIFY_AUTH_TOKEN
 * @param {string} message - Error message to sanitize
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return message;
  }
  
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (token) {
    // Replace the token with [REDACTED] in error messages
    const tokenRegex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    message = message.replace(tokenRegex, '[REDACTED]');
  }
  
  return message;
}

/**
 * Structured logging with timestamp and sanitization
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function log(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const sanitizedMessage = sanitizeErrorMessage(message);
  const sanitizedContext = JSON.parse(JSON.stringify(context, (key, value) => {
    if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
      return '[REDACTED]';
    }
    return typeof value === 'string' ? sanitizeErrorMessage(value) : value;
  }));
  
  const logEntry = {
    timestamp,
    level,
    message: sanitizedMessage,
    ...sanitizedContext
  };
  
  console.log(JSON.stringify(logEntry));
}

/**
 * Calculates delay for exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt) {
  const delay = BASE_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_DELAY);
}

/**
 * Sleeps for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a command with retry logic
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {Object} options - Spawn options
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Checks if error is retryable (network-related)
 * @param {string} errorMessage - Error message to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(errorMessage) {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /econnreset/i,
    /enotfound/i,
    /econnrefused/i,
    /socket hang up/i,
    /request failed/i,
    /502 bad gateway/i,
    /503 service unavailable/i,
    /504 gateway timeout/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Deploys with retry logic and exponential backoff
 * @param {string[]} deployArgs - Netlify deploy command arguments
 * @returns {Promise<Object>} Deployment result
 */
async function deployWithRetry(deployArgs) {
  let lastError;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      log('info', `Starting deployment attempt ${attempt + 1}/${MAX_RETRIES + 1}`, {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES + 1,
        args: deployArgs.filter(arg => !arg.includes('token'))
      });
      
      const result = await executeCommand('netlify', ['deploy', ...deployArgs]);
      
      if (result.code === 0) {
        log('info', 'Deployment completed successfully', {
          attempt: attempt + 1,
          stdout: sanitizeErrorMessage(result.stdout)
        });
        
        // Parse JSON output if available
        try {
          const deploymentInfo = JSON.parse(result.stdout);
          return {
            success: true,
            attempt: attempt + 1,
            deploymentInfo,
            stdout: result.stdout,
            stderr: result.stderr
          };
        } catch (parseError) {
          // If not JSON, return raw output
          return {
            success: true,
            attempt: attempt + 1,
            stdout: result.stdout,
            stderr: result.stderr
          };
        }
      } else {
        const errorMessage = result.stderr || result.stdout || 'Unknown deployment error';
        const sanitizedErrorMessage = sanitizeErrorMessage(errorMessage);
        lastError = new Error(`Deployment failed with code ${result.code}: ${sanitizedErrorMessage}`);
        
        log('warn', 'Deployment attempt failed', {
          attempt: attempt + 1,
          exitCode: result.code,
          error: sanitizeErrorMessage(errorMessage)
        });
        
        // Check if error is retryable
        if (!isRetryableError(errorMessage) || attempt === MAX_RETRIES) {
          throw lastError;
        }
      }
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || error.toString();
      
      log('warn', 'Deployment attempt failed with exception', {
        attempt: attempt + 1,
        error: sanitizeErrorMessage(errorMessage)
      });
      
      // Check if error is retryable
      if (!isRetryableError(errorMessage) || attempt === MAX_RETRIES) {
        throw lastError;
      }
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < MAX_RETRIES) {
      const delay = calculateDelay(attempt);
      log('info', `Waiting ${delay}ms before retry`, {
        attempt: attempt + 1,
        delay,
        nextAttempt: attempt + 2
      });
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Verifies deployment status using Netlify API
 * @param {string} siteId - Netlify site ID
 * @returns {Promise<Object>} Deployment status
 */
async function verifyDeploymentStatus(siteId) {
  try {
    log('info', 'Verifying deployment status', { siteId });
    
    const result = await executeCommand('netlify', [
      'api',
      'listSiteDeploys',
      '--data',
      JSON.stringify({ site_id: siteId })
    ]);
    
    if (result.code !== 0) {
      const sanitizedError = sanitizeErrorMessage(result.stderr);
      throw new Error(`Failed to get deployment status: ${sanitizedError}`);
    }
    
    const deployments = JSON.parse(result.stdout);
    const latestDeployment = deployments[0];
    
    if (!latestDeployment) {
      throw new Error('No deployments found for site');
    }
    
    log('info', 'Deployment status verified', {
      deploymentId: latestDeployment.id,
      state: latestDeployment.state,
      url: latestDeployment.deploy_ssl_url || latestDeployment.deploy_url
    });
    
    return {
      success: true,
      deployment: latestDeployment
    };
  } catch (error) {
    const sanitizedError = sanitizeErrorMessage(error.message);
    log('error', 'Failed to verify deployment status', {
      error: sanitizedError
    });
    return {
      success: false,
      error: sanitizedError
    };
  }
}

/**
 * Runs post-deployment health check and verification
 * @param {string} deploymentUrl - URL of the deployed site
 * @returns {Promise<Object>} Health check results
 */
async function runPostDeploymentHealthCheck(deploymentUrl) {
  try {
    log('info', 'Running post-deployment health check', { deploymentUrl });
    
    const result = await executeCommand('node', [
      'scripts/post-deployment-verify.js',
      deploymentUrl,
      '--json-output',
      'deployment-verification.json'
    ]);
    
    if (result.code === 0) {
      log('info', 'Post-deployment health check passed', {
        deploymentUrl,
        stdout: sanitizeErrorMessage(result.stdout)
      });
      return { success: true, output: result.stdout };
    } else {
      log('warn', 'Post-deployment health check failed', {
        deploymentUrl,
        exitCode: result.code,
        stderr: sanitizeErrorMessage(result.stderr)
      });
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    log('error', 'Post-deployment health check error', {
      deploymentUrl,
      error: sanitizeErrorMessage(error.message)
    });
    return { success: false, error: error.message };
  }
}

/**
 * Main deployment function with retry logic and verification
 * @param {string[]} args - Command line arguments
 */
async function main(args) {
  try {
    // Parse environment argument (preview/production)
    const environment = args[0] || 'preview';
    const isProduction = environment === 'production';
    
    // Validate required environment variables
    if (!process.env.NETLIFY_AUTH_TOKEN) {
      throw new Error('NETLIFY_AUTH_TOKEN environment variable is required');
    }
    
    if (!process.env.NETLIFY_SITE_ID) {
      throw new Error('NETLIFY_SITE_ID environment variable is required');
    }
    
    log('info', 'Starting deployment with retry logic', {
      environment,
      maxRetries: MAX_RETRIES,
      baseDelay: BASE_DELAY,
      maxDelay: MAX_DELAY
    });
    
    // Prepare deployment arguments
    const deployArgs = [
      '--site', process.env.NETLIFY_SITE_ID,
      '--dir', 'dist',
      '--functions', 'netlify/functions',
      '--json'
    ];
    
    if (isProduction) {
      deployArgs.push('--prod');
    }
    
    // Deploy with retry logic
    const deployResult = await deployWithRetry(deployArgs);
    
    // Extract deployment URL from result
    let deploymentUrl = null;
    if (deployResult.deploymentInfo) {
      deploymentUrl = deployResult.deploymentInfo.deploy_url || deployResult.deploymentInfo.url;
    }
    
    if (!deploymentUrl) {
      log('warn', 'Could not extract deployment URL from deploy result');
    }
    
    // Verify deployment status
    const verificationResult = await verifyDeploymentStatus(process.env.NETLIFY_SITE_ID);
    
    if (verificationResult.success) {
      const finalUrl = deploymentUrl || verificationResult.deployment.deploy_ssl_url || verificationResult.deployment.deploy_url;
      
      log('info', 'Deployment completed and verified successfully', {
        deploymentUrl: finalUrl,
        deploymentState: verificationResult.deployment.state
      });
      
      // Run post-deployment health check if we have a URL
      if (finalUrl) {
        const healthCheckResult = await runPostDeploymentHealthCheck(finalUrl);
        
        if (healthCheckResult.success) {
          log('info', 'Post-deployment verification completed successfully');
        } else {
          log('warn', 'Post-deployment verification failed but deployment succeeded', {
            healthCheckError: healthCheckResult.error
          });
        }
      }
      
      process.exit(0);
    } else {
      log('warn', 'Deployment completed but verification failed', {
        verificationError: verificationResult.error
      });
      
      // Exit successfully since deployment itself succeeded
      process.exit(0);
    }
  } catch (error) {
    log('error', 'Deployment failed', {
      error: sanitizeErrorMessage(error.message)
    });
    
    process.exit(1);
  }
}

// Export functions for testing
export {
  deployWithRetry,
  verifyDeploymentStatus,
  runPostDeploymentHealthCheck,
  sanitizeErrorMessage,
  calculateDelay,
  isRetryableError,
  main
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  main(args);
}