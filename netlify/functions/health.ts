// Health check endpoint for monitoring newsletter service
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    kit: {
      status: 'available' | 'unavailable' | 'unknown';
      responseTime?: number;
    };
    database: {
      status: 'available' | 'unavailable' | 'unknown';
    };
  };
  environment: string;
}

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string>;
  path: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

const VERSION = '1.0.0';
const KIT_API_KEY = process.env.KIT_API_KEY;
const KIT_API_URL = process.env.KIT_API_URL || 'https://api.kit.com/v4';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Check Kit API availability
 */
async function checkKitService(): Promise<{ status: 'available' | 'unavailable' | 'unknown'; responseTime?: number }> {
  if (!KIT_API_KEY) {
    return { status: 'unknown' };
  }

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${KIT_API_URL}/account`, {
      method: 'GET',
      headers: {
        'X-Kit-Api-Key': KIT_API_KEY,
        'User-Agent': 'Hackerspace Mumbai Newsletter Health Check/1.0'
      },
      // Set a timeout for health checks
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { status: 'available', responseTime };
    } else {
      return { status: 'unavailable', responseTime };
    }
  } catch (error) {
    return { status: 'unavailable' };
  }
}

/**
 * Check database/storage availability
 */
async function checkDatabaseService(): Promise<{ status: 'available' | 'unavailable' | 'unknown' }> {
  try {
    // For now, we're using in-memory storage, so it's always available
    // In production with a real database, you'd check the connection here
    return { status: 'available' };
  } catch (error) {
    return { status: 'unavailable' };
  }
}

/**
 * Main health check handler
 */
export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': NODE_ENV === 'production' ? 'https://hackmum.in' : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
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
    const [kitStatus, databaseStatus] = await Promise.all([
      checkKitService(),
      checkDatabaseService()
    ]);

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (kitStatus.status === 'unavailable' && databaseStatus.status === 'unavailable') {
      overallStatus = 'unhealthy';
    } else if (kitStatus.status === 'unavailable' || databaseStatus.status === 'unavailable') {
      overallStatus = 'degraded';
    }

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: VERSION,
      services: {
        kit: kitStatus,
        database: databaseStatus
      },
      environment: NODE_ENV
    };

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return {
      statusCode: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
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
        version: VERSION,
        error: 'Health check failed',
        environment: NODE_ENV
      } as Partial<HealthCheckResponse>)
    };
  }
};