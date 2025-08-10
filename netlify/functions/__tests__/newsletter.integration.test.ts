import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock fetch globally
global.fetch = vi.fn();

// Import the handler after mocking fetch
type NewsletterModule = typeof import('../newsletter');
let handler: NewsletterModule['handler'];
let __testing__: NewsletterModule['__testing__'];
let mockContext: HandlerContext;

describe('Newsletter Function Integration Tests', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup environment variables before importing the module
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = '*';
    process.env.LOG_LEVEL = 'error';
    process.env.KIT_API_KEY = 'test-api-key';
    process.env.KIT_FORM_ID = 'test-form-id';

    // Fresh module per test so env/config and in-memory state are fresh
    vi.resetModules();
    ({ handler, __testing__ } = await import('../newsletter'));

    // Clear rate limiting store and subscriptions between tests
    __testing__.clearRateLimitStore();
    __testing__.clearSubscriptions();

    // Setup mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'newsletter',
      functionVersion: '1.0',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:newsletter',
      memoryLimitInMB: '128',
      awsRequestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      logGroupName: '/aws/lambda/newsletter',
      logStreamName: '2023/01/01/[$LATEST]test',
      identity: undefined,
      clientContext: undefined,
      getRemainingTimeInMillis: () => 30000,
      done: vi.fn(),
      fail: vi.fn(),
      succeed: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Production-like scenarios', () => {
    it('should handle successful Kit API subscription', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            id: 123,
            state: 'active',
            subscriber: { id: 789, email_address: 'test@example.com' }
          }
        })
      });

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
    });

    it('should handle Kit API rate limiting', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      // Mock Kit API rate limiting response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'Rate limited' })
      });

      const response = await handler(event, mockContext);

      // Should fall back to local storage and succeed
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
    });

    it('should fallback to local storage when Kit is unavailable', async () => {
      // Remove Kit credentials
      delete process.env.KIT_API_KEY;
      delete process.env.KIT_FORM_ID;
      // Re-import so the SUT observes missing credentials
      vi.resetModules();
      ({ handler, __testing__ } = await import('../newsletter'));

      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
      expect(JSON.parse(response.body).message).toContain('Successfully subscribed');
    });

    it('should handle duplicate subscription attempts', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'duplicate@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      // First subscription - success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: { subscriber: { email_address: 'duplicate@example.com' } }
        })
      });

      const firstResponse = await handler(event, mockContext);
      expect(firstResponse.statusCode).toBe(200);

      // Second subscription - already exists
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Email already subscribed' })
      });

      const secondResponse = await handler(event, mockContext);
      expect(secondResponse.statusCode).toBe(409);
      expect(JSON.parse(secondResponse.body).error).toContain('already subscribed');
    });

    it('should enforce rate limiting per IP', async () => {
      const createEvent = (email: string) => ({
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
        body: JSON.stringify({ email, source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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
      } as HandlerEvent);

      // Mock successful responses for first few requests
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          subscription: { subscriber: { email_address: 'test@example.com' } }
        })
      });

      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(handler(createEvent(`test${i}@example.com`), mockContext));
      }

      const responses = await Promise.all(requests);
      
      // Should have at least one rate limited response
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate email formats comprehensively', async () => {
      const invalidEmails = ['', 'invalid', '@domain.com', 'user@', 'user@domain'];
      
      for (const email of invalidEmails) {
        const event: HandlerEvent = {
          httpMethod: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
          body: JSON.stringify({ email, source: 'website_newsletter' }),
          path: '/.netlify/functions/newsletter',
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

        const response = await handler(event, mockContext);
        
        // Empty email gives 400, others give 422
        if (email === '') {
          expect(response.statusCode).toBe(400);
        } else {
          expect(response.statusCode).toBe(422);
        }
        expect(JSON.parse(response.body).success).toBe(false);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: '{"email": "test@example.com", invalid json',
        path: '/.netlify/functions/newsletter',
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

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).success).toBe(false);
      expect(JSON.parse(response.body).error).toContain('Invalid JSON');
    });

    it('should handle Kit API network errors', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const response = await handler(event, mockContext);

      // Should fallback to local storage
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
    });

    it('should set proper CORS headers for production', async () => {
      process.env.NODE_ENV = 'production';
      
      const event: HandlerEvent = {
        httpMethod: 'OPTIONS',
        headers: { 'content-type': 'application/json' },
        body: null,
        path: '/.netlify/functions/newsletter',
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

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', 'https://hackmum.in');
    });

  });

  describe('Security tests', () => {
    it('should sanitize email input', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: '<script>alert("xss")</script>@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(422);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it('should handle SQL injection attempts', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ 
          email: "test'; DROP TABLE users; --@example.com", 
          firstName: "'; DROP TABLE users; --",
          source: 'website_newsletter' 
        }),
        path: '/.netlify/functions/newsletter',
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

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(422);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it('should not leak sensitive information in error messages', async () => {
      const event: HandlerEvent = {
        httpMethod: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
        body: JSON.stringify({ email: 'test@example.com', source: 'website_newsletter' }),
        path: '/.netlify/functions/newsletter',
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

      // Mock Kit API error with sensitive information
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ 
          message: 'Internal server error: Database connection failed at server *************:5432 with credentials admin:password123' 
        })
      });

      const response = await handler(event, mockContext);

      const bodyText = response.body;
      // Ensure no sensitive information appears anywhere in the response
      expect(bodyText).not.toContain('*************');
      expect(bodyText).not.toContain('password123');
      expect(bodyText).not.toMatch(/\badmin\b/);
    });
  });
});