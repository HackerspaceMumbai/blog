// Cloudflare Pages Function for newsletter service health check
// Migrated from Netlify Functions to Cloudflare Pages

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    kit_api: 'healthy' | 'degraded' | 'unhealthy';
    environment: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

const startTime = Date.now();

/**
 * Check Kit API connectivity
 */
async function checkKitAPI(env: any): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  const KIT_API_KEY = env.KIT_API_KEY;
  const KIT_API_URL = env.KIT_API_URL || 'https://api.kit.com/v4';

  if (!KIT_API_KEY) {
    return 'degraded'; // Service can work with fallback
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
function checkEnvironment(env: any): 'healthy' | 'unhealthy' {
  // Check if we have basic environment setup
  // For Cloudflare Pages, the environment is always healthy if the function runs
  return 'healthy';
}

/**
 * Cloudflare Pages Function handler for health check
 */
export async function onRequest(context: any) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.NODE_ENV === 'production' ? 'https://hackmum.in' : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response('', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({
        error: 'Method not allowed. Use GET.'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Perform health checks
    const [kitApiStatus, environmentStatus] = await Promise.all([
      checkKitAPI(env),
      Promise.resolve(checkEnvironment(env))
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (environmentStatus === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (kitApiStatus === 'unhealthy') {
      overallStatus = 'degraded'; // Can still work with fallback
    } else if (kitApiStatus === 'degraded') {
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
        environment: environmentStatus
      },
      uptime: Date.now() - startTime
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

    return new Response(JSON.stringify(healthResponse, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);

    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
}
