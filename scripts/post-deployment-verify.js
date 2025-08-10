/**
 * Post-deployment verification script for Hackerspace Mumbai Blog
 * Verifies deployment URL accessibility and basic functionality
 */

// No additional imports needed for this script

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

/**
 * Extract deployment URL from netlify deploy JSON output
 * @param {string} deployOutput - JSON output from netlify deploy --json
 * @returns {string|null} - Deployment URL or null if not found
 */
function extractDeploymentUrl(deployOutput) {
  try {
    const deployData = JSON.parse(deployOutput);
    return deployData.deploy_url || deployData.url || null;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to parse deployment output:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Verify URL accessibility with retries
 * @param {string} url - URL to verify
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<boolean>} - True if accessible, false otherwise
 */
async function verifyUrlAccessibility(url, maxRetries = 3, retryDelay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${colors.blue}🔍 Checking URL accessibility (attempt ${attempt}/${maxRetries}): ${url}${colors.reset}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Hackerspace Mumbai Post-Deployment Verification/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        console.log(`${colors.green}✅ URL is accessible (${response.status})${colors.reset}`);
        return true;
      } else {
        console.log(`${colors.yellow}⚠️  URL returned status ${response.status}${colors.reset}`);
        if (attempt < maxRetries) {
          console.log(`${colors.blue}⏳ Waiting ${retryDelay/1000}s before retry...${colors.reset}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️  URL check failed: ${error.message}${colors.reset}`);
      if (attempt < maxRetries) {
        console.log(`${colors.blue}⏳ Waiting ${retryDelay/1000}s before retry...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.log(`${colors.red}❌ URL is not accessible after ${maxRetries} attempts${colors.reset}`);
  return false;
}

/**
 * Run health check against deployment URL
 * @param {string} baseUrl - Base URL of the deployment
 * @returns {Promise<boolean>} - True if health check passes, false otherwise
 */
async function runHealthCheck(baseUrl) {
  const healthUrl = `${baseUrl}/.netlify/functions/health`;
  
  try {
    console.log(`${colors.blue}🏥 Running health check: ${healthUrl}${colors.reset}`);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Hackerspace Mumbai Post-Deployment Verification/1.0'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout for health check
    });

    if (response.ok) {
      const healthData = await response.json();
      console.log(`${colors.green}✅ Health check passed${colors.reset}`);
      console.log(`${colors.blue}📊 Health status: ${healthData.status}${colors.reset}`);
      
      // Log service statuses
      if (healthData.services) {
        console.log(`${colors.blue}🔧 Kit API: ${healthData.services.kit?.status || 'unknown'}${colors.reset}`);
        console.log(`${colors.blue}💾 Database: ${healthData.services.database?.status || 'unknown'}${colors.reset}`);
      }
      
      return healthData.status === 'healthy' || healthData.status === 'degraded';
    } else {
      console.log(`${colors.red}❌ Health check failed with status ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Health check failed: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Run basic functionality tests
 * @param {string} baseUrl - Base URL of the deployment
 * @returns {Promise<boolean>} - True if basic tests pass, false otherwise
 */
async function runBasicFunctionalityTests(baseUrl) {
  console.log(`${colors.blue}🧪 Running basic functionality tests...${colors.reset}`);
  
  const testUrls = [
    { path: '/', name: 'Home page' },
    { path: '/blog', name: 'Blog page' },
    { path: '/events', name: 'Events page' }
  ];
  
  let allTestsPassed = true;
  
  for (const test of testUrls) {
    const testUrl = `${baseUrl}${test.path}`;
    try {
      console.log(`${colors.blue}🔍 Testing ${test.name}: ${testUrl}${colors.reset}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Hackerspace Mumbai Post-Deployment Verification/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        console.log(`${colors.green}✅ ${test.name} is accessible${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ ${test.name} returned status ${response.status}${colors.reset}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${test.name} test failed: ${error.message}${colors.reset}`);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Main verification function
 * @param {string} deploymentUrl - URL to verify
 * @param {number} maxRetries - Maximum number of retries for URL accessibility
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<{success: boolean, results: object}>} - Verification results
 */
async function verifyDeployment(deploymentUrl, maxRetries = 3, retryDelay = 5000) {
  console.log(`${colors.blue}🚀 Starting post-deployment verification for: ${deploymentUrl}${colors.reset}`);
  
  const results = {
    url: deploymentUrl,
    accessibility: false,
    healthCheck: false,
    basicFunctionality: false,
    timestamp: new Date().toISOString()
  };
  
  // Step 1: Verify URL accessibility
  results.accessibility = await verifyUrlAccessibility(deploymentUrl, maxRetries, retryDelay);
  
  if (!results.accessibility) {
    console.log(`${colors.red}❌ Deployment verification failed: URL not accessible${colors.reset}`);
    return { success: false, results };
  }
  
  // Step 2: Run health check
  results.healthCheck = await runHealthCheck(deploymentUrl);
  
  // Step 3: Run basic functionality tests
  results.basicFunctionality = await runBasicFunctionalityTests(deploymentUrl);
  
  const success = results.accessibility && results.healthCheck && results.basicFunctionality;
  
  if (success) {
    console.log(`${colors.green}🎉 Deployment verification completed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Deployment verification failed${colors.reset}`);
  }
  
  return { success, results };
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.red}❌ Usage: node post-deployment-verify.js <deployment-url> [--json-output <file>]${colors.reset}`);
    console.log(`${colors.blue}💡 Example: node post-deployment-verify.js https://deploy-preview-123--hackmum.netlify.app${colors.reset}`);
    process.exit(1);
  }
  
  const deploymentUrl = args[0];
  const jsonOutputIndex = args.indexOf('--json-output');
  const jsonOutputFile = jsonOutputIndex !== -1 ? args[jsonOutputIndex + 1] : null;
  
  try {
    const { success, results } = await verifyDeployment(deploymentUrl);
    
    // Output results as JSON if requested
    if (jsonOutputFile) {
      const fs = await import('fs');
      fs.writeFileSync(jsonOutputFile, JSON.stringify(results, null, 2));
      console.log(`${colors.blue}📄 Results written to: ${jsonOutputFile}${colors.reset}`);
    }
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}❌ Verification failed with error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Export functions for testing
export {
  extractDeploymentUrl,
  verifyUrlAccessibility,
  runHealthCheck,
  runBasicFunctionalityTests,
  verifyDeployment
};

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}