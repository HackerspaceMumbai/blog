/**
 * Test Environment Detection Utilities
 * 
 * Provides utilities for detecting CI environments, dev server availability,
 * and configuring test environments appropriately.
 */

/**
 * Detect if running in CI environment
 * @returns {boolean} True if running in CI environment
 */
export function isCI() {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.NETLIFY ||
    process.env.NETLIFY_BUILD_BASE ||
    process.env.VERCEL ||
    process.env.TRAVIS ||
    process.env.CIRCLECI ||
    process.env.JENKINS_URL ||
    process.env.BUILDKITE ||
    process.env.DRONE ||
    process.env.GITLAB_CI
  );
}

/**
 * Detect specific CI platform
 * @returns {string} CI platform name or 'local' if not in CI
 */
export function getCIPlatform() {
  if (process.env.GITHUB_ACTIONS) return 'github-actions';
  if (process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE) return 'netlify';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.TRAVIS) return 'travis';
  if (process.env.CIRCLECI) return 'circleci';
  if (process.env.JENKINS_URL) return 'jenkins';
  if (process.env.BUILDKITE) return 'buildkite';
  if (process.env.DRONE) return 'drone';
  if (process.env.GITLAB_CI) return 'gitlab';
  if (process.env.CI) return 'unknown-ci';
  return 'local';
}

/**
 * Check if dev server is available at specified URL
 * @param {string} url - URL to check (default: http://localhost:4321)
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if dev server is available
 */
export async function checkDevServerAvailability(url = 'http://localhost:4321', timeout = 5000) {
  try {
    // Use AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'User-Agent': 'test-environment-checker'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // If fetch fails, try a fallback approach using Playwright if available
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: timeout 
      });
      
      await browser.close();
      return true;
    } catch (playwrightError) {
      return false;
    }
  }
}

/**
 * Check if dev server is available with retry logic
 * @param {string} url - URL to check
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @param {number} timeout - Timeout per attempt in ms (default: 5000)
 * @returns {Promise<boolean>} True if dev server becomes available
 */
export async function checkDevServerWithRetry(
  url = 'http://localhost:4321',
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 5000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isAvailable = await checkDevServerAvailability(url, timeout);
    
    if (isAvailable) {
      return true;
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Get test environment configuration
 * @param {Object} options - Configuration options
 * @param {string} options.devServerUrl - Dev server URL
 * @param {number} options.timeout - Timeout for server checks
 * @returns {Promise<Object>} Test environment configuration
 */
export async function getTestEnvironmentConfig(options = {}) {
  const {
    devServerUrl = 'http://localhost:4321',
    timeout = 5000
  } = options;
  
  const ciEnvironment = isCI();
  const ciPlatform = getCIPlatform();
  const devServerAvailable = await checkDevServerAvailability(devServerUrl, timeout);
  
  return {
    isCI: ciEnvironment,
    ciPlatform,
    devServerAvailable,
    devServerUrl,
    nodeEnv: process.env.NODE_ENV || 'development',
    shouldSkipVisualTests: ciEnvironment && !devServerAvailable,
    shouldSkipServerDependentTests: !devServerAvailable,
    testMode: determineTestMode(ciEnvironment, devServerAvailable)
  };
}

/**
 * Determine appropriate test mode based on environment
 * @param {boolean} isCI - Whether running in CI
 * @param {boolean} devServerAvailable - Whether dev server is available
 * @returns {string} Test mode: 'full', 'ci-safe', or 'skip'
 */
function determineTestMode(isCI, devServerAvailable) {
  if (devServerAvailable) {
    return 'full';
  } else if (isCI) {
    return 'ci-safe';
  } else {
    return 'skip';
  }
}

/**
 * Log environment information for debugging
 * @param {Object} config - Environment configuration from getTestEnvironmentConfig
 */
export function logEnvironmentInfo(config) {
  console.log('🔍 Test Environment Detection:');
  console.log(`   CI Environment: ${config.isCI ? 'Yes' : 'No'}`);
  console.log(`   CI Platform: ${config.ciPlatform}`);
  console.log(`   Node Environment: ${config.nodeEnv}`);
  console.log(`   Dev Server Available: ${config.devServerAvailable ? 'Yes' : 'No'}`);
  console.log(`   Dev Server URL: ${config.devServerUrl}`);
  console.log(`   Test Mode: ${config.testMode}`);
  console.log(`   Skip Visual Tests: ${config.shouldSkipVisualTests ? 'Yes' : 'No'}`);
  console.log(`   Skip Server Tests: ${config.shouldSkipServerDependentTests ? 'Yes' : 'No'}`);
}

/**
 * Create a test skip helper that provides consistent messaging
 * @param {Object} config - Environment configuration
 * @param {string} testName - Name of the test being skipped
 * @returns {Object} Skip information with message and shouldSkip flag
 */
export function createTestSkipHelper(config, testName) {
  if (config.shouldSkipVisualTests) {
    return {
      shouldSkip: true,
      message: `⏭️  Skipping ${testName} - dev server not available in CI environment`,
      reason: 'ci-no-server'
    };
  }
  
  if (config.shouldSkipServerDependentTests && !config.isCI) {
    return {
      shouldSkip: true,
      message: `⏭️  Skipping ${testName} - dev server not available. Please start dev server: npm run dev`,
      reason: 'local-no-server'
    };
  }
  
  return {
    shouldSkip: false,
    message: `✅ Running ${testName} - environment ready`,
    reason: 'ready'
  };
}

/**
 * Wait for dev server to become available
 * @param {string} url - Dev server URL
 * @param {number} maxWaitTime - Maximum wait time in ms (default: 30000)
 * @param {number} checkInterval - Check interval in ms (default: 1000)
 * @returns {Promise<boolean>} True if server becomes available within timeout
 */
export async function waitForDevServer(
  url = 'http://localhost:4321',
  maxWaitTime = 30000,
  checkInterval = 1000
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const isAvailable = await checkDevServerAvailability(url, 2000);
    
    if (isAvailable) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return false;
}

/**
 * Get environment-specific test configuration
 * @returns {Object} Environment-specific settings
 */
export function getEnvironmentSpecificConfig() {
  const ciPlatform = getCIPlatform();
  
  const configs = {
    'github-actions': {
      timeout: 10000,
      retries: 2,
      headless: true,
      slowMo: 0
    },
    'netlify': {
      timeout: 15000,
      retries: 1,
      headless: true,
      slowMo: 0
    },
    'local': {
      timeout: 5000,
      retries: 3,
      headless: false,
      slowMo: 100
    }
  };
  
  return configs[ciPlatform] || configs['local'];
}