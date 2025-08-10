import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Health check endpoint for newsletter service monitoring
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    kit_api: 'healthy' | 'degraded' | 'unhealthy';
    environment: 'healthy' | 'unhealthy';
    memory: 'healthy' | 'degraded' | 'unhealthy';
  };
  uptime: number;
  memory_usage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

const startTime = Date.now();

// Environment variables
const KIT_API_KEY = process.env.KIT_API_KEY;
const KIT_API_URL = process.env.KIT_API_URL || 'https://api.kit.com/v4';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Check Kit API connectivity
 */
async function checkKitAPI(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  if (!KIT_API_KEY) {
    return 'degraded'; // Service can work with fallback
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${KIT_API_URL}/subscribers?per_page=1`, {
      method: 'GET',
      headers: {
        'X-Kit-Api-Key': KIT_API_KEY,
        'User-Agent': 'Hackerspace Mumbai Newsletter Health Check/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return 'healthy';
    } else if (response.status >= 500) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return 'unhealthy'; // Timeout
    }
    return 'degraded'; // Network error, but service can still work with fallback
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): 'healthy' | 'unhealthy' {
  const requiredEnvVars = ['NODE_ENV'];
  const optionalEnvVars = ['KIT_API_KEY', 'KIT_FORM_ID', 'CORS_ORIGIN'];

  // Check if we have basic environment setup
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return 'unhealthy';
    }
  }

  // Warn about missing optional vars but don't fail health check
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  if (missingOptional.length > 0) {
    console.warn('Missing optional environment variables:', missingOptional);
  }

  return 'healthy';
}

/**
 * Check memory usage
 */
function checkMemory(): { status: 'healthy' | 'degraded' | 'unhealthy'; usage?: any } {
  try {
    const memoryUsage = process.memoryUsage();
    // Netlify Functions default memory limit is 1024 MB (1 GB)
    const memoryLimitMB = 1024;
    const memoryLimitBytes = memoryLimitMB * 1024 * 1024;

    const usedPercentage = (memoryUsage.heapUsed / memoryLimitBytes) * 100;

    const usage = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: memoryLimitMB,
      percentage: Math.round(usedPercentage)
    };

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (usedPercentage > 90) {
      status = 'unhealthy';
    } else if (usedPercentage > 75) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, usage };
  } catch (error) {
    return { status: 'degraded' };
  }
}
/**
 * Health check handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': NODE_ENV === 'production' ? 'https://hackmum.in' : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Method not allowed. Use GET.'
        })
      };
    }

    // Perform health checks
    const [kitApiStatus, environmentStatus, memoryCheck] = await Promise.all([
      checkKitAPI(),
      Promise.resolve(checkEnvironment()),
      Promise.resolve(checkMemory())
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (environmentStatus === 'unhealthy' || memoryCheck.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (kitApiStatus === 'unhealthy') {
      overallStatus = 'degraded'; // Can still work with fallback
    } else if (kitApiStatus === 'degraded' || memoryCheck.status === 'degraded') {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        kit_api: kitApiStatus,
        environment: environmentStatus,
        memory: memoryCheck.status
      },
      uptime: Date.now() - startTime,
      ...(memoryCheck.usage && { memory_usage: memoryCheck.usage })
    };

    // Determine HTTP status code
    let statusCode: number;
    switch (overallStatus) {
      case 'healthy':
        statusCode = 200;
        break;
      case 'degraded':
        statusCode = 200; // Still operational
        break;
      case 'unhealthy':
        statusCode = 503;
        break;
      default:
        statusCode = 500;
    }

    return {
      statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(healthResponse, null, 2)
    };

  } catch (error) {
    console.error('Health check error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: Date.now() - startTime
      })
    };
  }
};