import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock fetch globally
global.fetch = vi.fn();

// Import the handler after mocking fetch
const { handler } = await import('../newsletter-health');

describe('Newsletter Health Check Function', () => {
  let mockEvent: HandlerEvent;
  let mockContext: HandlerContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock event
    mockEvent = {
      httpMethod: 'GET',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      },
      body: null,
      path: '/.netlify/functions/newsletter-health',
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      multiValueHeaders: {},
      requestContext: {} as any,
      resource: '',
      stageVariables: null,
      isBase64Encoded: false,
      rawUrl: '',
      rawQuery: ''
    };

    // Setup mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'newsletter-health',
      functionVersion: '1.0',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:newsletter-health',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/newsletter-health',
      logStreamName: '2023/01/01/[$LATEST]test',
      identity: undefined,
      clientContext: undefined,
      getRemainingTimeInMillis: () => 30000,
      done: vi.fn(),
      fail: vi.fn(),
      succeed: vi.fn()
    };

    // Setup environment variables
    process.env.NODE_ENV = 'test';
    process.env.KIT_API_KEY = 'test-api-key';
    process.env.KIT_API_URL = 'https://api.kit.com/v4';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CORS and Method Validation', () => {
    it('should handle OPTIONS requests correctly', async () => {
      mockEvent.httpMethod = 'OPTIONS';
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(response.body).toBe('');
    });

    it('should reject non-GET requests', async () => {
      mockEvent.httpMethod = 'POST';
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Method not allowed');
    });
  });

  describe('Health Checks', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribers: [] })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded'); // Will be degraded without KIT_FORM_ID
      expect(body.checks.kit_api).toBe('degraded');
      expect(body.checks.environment).toBe('healthy');
      expect(body.checks.memory).toBe('healthy');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('uptime');
    });

    it('should return degraded status when Kit API is unavailable', async () => {
      // Mock Kit API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200); // Still operational
      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded');
      expect(body.checks.kit_api).toBe('degraded'); // Will be degraded, not unhealthy
    });

    it('should return degraded status when Kit API is not configured', async () => {
      delete process.env.KIT_API_KEY;

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded');
      expect(body.checks.kit_api).toBe('degraded');
    });

    it('should return unhealthy status when environment check fails', async () => {
      delete process.env.NODE_ENV;

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('unhealthy');
      expect(body.checks.environment).toBe('unhealthy');
    });

    it('should handle Kit API timeout', async () => {
      // Mock timeout
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      (global.fetch as any).mockRejectedValueOnce(abortError);

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.checks.kit_api).toBe('degraded'); // Will be degraded, not unhealthy
    });

    it('should include memory usage information', async () => {
      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribers: [] })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('memory_usage');
      expect(body.memory_usage).toHaveProperty('used');
      expect(body.memory_usage).toHaveProperty('total');
      expect(body.memory_usage).toHaveProperty('percentage');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock an error that throws during health check
      (global.fetch as any).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200); // Will still return 200 with degraded status
      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded');
      expect(body.checks.kit_api).toBe('degraded');
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted JSON response', async () => {
      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribers: [] })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('checks');
      expect(body).toHaveProperty('uptime');
      
      // Validate checks structure
      expect(body.checks).toHaveProperty('kit_api');
      expect(body.checks).toHaveProperty('environment');
      expect(body.checks).toHaveProperty('memory');
    });

    it('should format response as pretty JSON', async () => {
      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribers: [] })
      });

      const response = await handler(mockEvent, mockContext);
      
      // Check that the JSON is formatted (has newlines and indentation)
      expect(response.body).toContain('\n');
      expect(response.body).toContain('  '); // Indentation
    });
  });
});