import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock fetch globally
global.fetch = vi.fn();

// Import the handler after mocking fetch
const { handler, __testing__ } = await import('../newsletter');

describe('Newsletter Function', () => {
  let mockEvent: HandlerEvent;
  let mockContext: HandlerContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear rate limiting store and subscriptions between tests
    __testing__.clearRateLimitStore();
    __testing__.clearSubscriptions();
    
    // Setup mock event
    mockEvent = {
      httpMethod: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'Test',
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

    // Setup mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'newsletter',
      functionVersion: '1.0',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:newsletter',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/newsletter',
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
    process.env.CORS_ORIGIN = '*';
    process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
    process.env.KIT_API_KEY = 'test-api-key';
    process.env.KIT_FORM_ID = 'test-form-id';
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

    it('should reject non-POST requests', async () => {
      mockEvent.httpMethod = 'GET';
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Method not allowed');
    });

    it('should set correct CORS headers', async () => {
      const response = await handler(mockEvent, mockContext);
      
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Headers');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid JSON', async () => {
      mockEvent.body = 'invalid json';
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid JSON');
    });

    it('should reject missing email', async () => {
      mockEvent.body = JSON.stringify({
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Email is required');
    });

    it('should reject invalid email format', async () => {
      mockEvent.body = JSON.stringify({
        email: 'invalid-email',
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('valid email address');
    });

    it('should reject emails that are too long', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      mockEvent.body = JSON.stringify({
        email: longEmail,
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('too long');
    });

    it('should reject emails that are too short', async () => {
      mockEvent.body = JSON.stringify({
        email: 'a@b',
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('too short');
    });

    it('should reject blocked domains', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@10minutemail.com',
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Temporary email addresses are not allowed');
    });

    it('should reject suspicious patterns in email', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test<script>@example.com',
        firstName: 'Test',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('valid email address');
    });

    it('should reject invalid first name with suspicious patterns', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        firstName: '<script>alert("xss")</script>',
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid characters in name');
    });

    it('should reject first name that is too long', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        firstName: 'a'.repeat(101),
        source: 'website_newsletter'
      });
      
      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('too long');
    });

    it('should accept valid input', async () => {
      // Mock successful Kit API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            id: 123,
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            source: 'website_newsletter',
            referrer: '',
            subscribable_id: 456,
            subscribable_type: 'Form',
            subscriber: {
              id: 789,
              first_name: 'Test',
              email_address: 'test@example.com',
              state: 'active',
              created_at: '2023-01-01T00:00:00Z'
            }
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Successfully subscribed');
      expect(body.data).toHaveProperty('email', 'test@example.com');
      expect(body.data).toHaveProperty('firstName', 'Test');
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting', async () => {
      // Mock successful responses for first few requests
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          subscription: {
            id: 123,
            state: 'active',
            subscriber: { id: 789, email_address: 'test@example.com' }
          }
        })
      });

      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 6; i++) {
        const testEvent = {
          ...mockEvent,
          body: JSON.stringify({
            email: `test${i}@example.com`,
            firstName: 'Test',
            source: 'website_newsletter'
          })
        };
        requests.push(handler(testEvent, mockContext));
      }

      const responses = await Promise.all(requests);
      
      // Should have at least one rate limited response
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      const rateLimitedBody = JSON.parse(rateLimitedResponses[0].body);
      expect(rateLimitedBody.success).toBe(false);
      expect(rateLimitedBody.error).toContain('Too many attempts');
    });
  });

  describe('Kit API Integration', () => {
    it('should handle Kit API success', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            id: 123,
            state: 'active',
            subscriber: {
              id: 789,
              first_name: 'Test',
              email_address: 'test@example.com'
            }
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should handle Kit API already subscribed error', async () => {
      // Ensure Kit API credentials are set for this test
      process.env.KIT_API_KEY = 'test-api-key';
      process.env.KIT_FORM_ID = 'test-form-id';
      
      // Mock first call to checkExistingSubscription (should return false - not already subscribed)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscribers: [] // Empty array means not already subscribed
        })
      });
      
      // Mock second call to subscribeToKit (should return 422 already subscribed error)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          message: 'Email already subscribed',
          errors: {
            email: ['has already been taken']
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('already subscribed');
      
      // Verify that fetch was called twice (checkExistingSubscription + subscribeToKit)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle Kit API server errors with retry', async () => {
      // Ensure Kit API credentials are set for this test
      process.env.KIT_API_KEY = 'test-api-key';
      process.env.KIT_FORM_ID = 'test-form-id';
      
      // Mock first call to checkExistingSubscription (should return false - not already subscribed)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscribers: [] // Empty array means not already subscribed
        })
      });
      
      // Mock server error responses for subscribeToKit (3 attempts with retries)
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Server error' })
        });

      const response = await handler(mockEvent, mockContext);
      
      // Should return service unavailable error (503 status)
      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('temporarily unavailable');
      
      // Should have made 4 attempts total (1 checkExistingSubscription + 3 subscribeToKit attempts)
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle Kit API timeout', async () => {
      // Ensure Kit API credentials are set for this test
      process.env.KIT_API_KEY = 'test-api-key';
      process.env.KIT_FORM_ID = 'test-form-id';
      
      // Mock first call to checkExistingSubscription (should return false - not already subscribed)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscribers: [] // Empty array means not already subscribed
        })
      });
      
      // Mock timeout error for subscribeToKit calls
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      (global.fetch as any)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError);
      
      const response = await handler(mockEvent, mockContext);
      
      // Should return timeout error (503 status)
      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('timeout');
    });

    it('should fallback to local storage when Kit API is unavailable', async () => {
      // Remove Kit API credentials
      delete process.env.KIT_API_KEY;
      delete process.env.KIT_FORM_ID;

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Successfully subscribed');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Ensure Kit API credentials are set for this test
      process.env.KIT_API_KEY = 'test-api-key';
      process.env.KIT_FORM_ID = 'test-form-id';
      
      // Mock an unexpected error
      (global.fetch as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await handler(mockEvent, mockContext);
      
      // Should fall back to local storage and succeed
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should include request ID in error responses', async () => {
      mockEvent.body = 'invalid json';
      
      const response = await handler(mockEvent, mockContext);
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('requestId');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize email input', async () => {
      mockEvent.body = JSON.stringify({
        email: '  TEST@EXAMPLE.COM  ',
        firstName: 'Test',
        source: 'website_newsletter'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            subscriber: { email_address: 'test@example.com' }
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('test@example.com');
    });

    it('should sanitize first name input', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        firstName: '  Test User  ',
        source: 'website_newsletter'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            subscriber: { email_address: 'test@example.com' }
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.firstName).toBe('Test User');
    });

    it('should handle missing optional fields', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com'
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            subscriber: { email_address: 'test@example.com' }
          }
        })
      });

      const response = await handler(mockEvent, mockContext);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.firstName).toBe('');
      expect(body.data.source).toBe('website_newsletter');
    });
  });
});