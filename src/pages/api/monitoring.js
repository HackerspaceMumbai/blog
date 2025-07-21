// API endpoint for receiving monitoring data
// This is a simple endpoint that can be extended to store monitoring data

// Disable prerendering for this API endpoint to enable server-side functionality
export const prerender = false;

export async function POST({ request }) {
  try {
    // Check if request has content
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No data provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const monitoringData = await request.json();
    
    // Log the monitoring data (in production, you might want to store this in a database)
    console.log('📊 Monitoring Data Received:', {
      timestamp: monitoringData.timestamp,
      url: monitoringData.url,
      errorCount: monitoringData.errors?.count || 0,
      performanceScore: monitoringData.performance?.score || 0,
      healthStatus: monitoringData.health?.status || 'unknown'
    });
    
    // In a real implementation, you might:
    // 1. Store data in a database (PostgreSQL, MongoDB, etc.)
    // 2. Send alerts for critical issues
    // 3. Aggregate data for dashboards
    // 4. Forward to external monitoring services
    
    // Example of what you might do:
    /*
    if (monitoringData.health?.status === 'critical') {
      // Send alert to monitoring service
      await sendAlert({
        type: 'critical',
        message: `Critical health status on ${monitoringData.url}`,
        issues: monitoringData.health.issues,
        timestamp: monitoringData.timestamp
      });
    }
    
    // Store in database
    await db.monitoring.insert({
      url: monitoringData.url,
      timestamp: monitoringData.timestamp,
      data: monitoringData
    });
    */
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Monitoring data received' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Error processing monitoring data:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process monitoring data' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}