// Security middleware for API routes and server-side security
import type { APIRoute, APIContext } from 'astro';
import { SecurityUtils, securityConfig } from '../utils/security-config';

export interface SecurityMiddlewareOptions {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  enableInputValidation?: boolean;
  enableLogging?: boolean;
  customValidation?: (context: APIContext) => Promise<boolean>;
}

export class SecurityMiddleware {
  private options: SecurityMiddlewareOptions;

  constructor(options: SecurityMiddlewareOptions = {}) {
    this.options = {
      enableCSRF: true,
      enableRateLimit: true,
      enableInputValidation: true,
      enableLogging: true,
      ...options
    };
  }

  // Main middleware function
  async handle(context: APIContext, next: () => Promise<Response>): Promise<Response> {
    try {
      // Security checks
      if (this.options.enableRateLimit && !await this.checkRateLimit(context)) {
        return this.createErrorResponse('Rate limit exceeded', 429);
      }

      if (this.options.enableCSRF && !await this.validateCSRF(context)) {
        return this.createErrorResponse('CSRF validation failed', 403);
      }

      if (this.options.enableInputValidation && !await this.validateInput(context)) {
        return this.createErrorResponse('Input validation failed', 400);
      }

      // Custom validation
      if (this.options.customValidation && !await this.options.customValidation(context)) {
        return this.createErrorResponse('Custom validation failed', 400);
      }

      // Add security headers to response
      const response = await next();
      return this.addSecurityHeaders(response);

    } catch (error) {
      if (this.options.enableLogging) {
        SecurityUtils.logSecurityEvent({
          type: 'middleware_error',
          message: `Security middleware error: ${error}`,
          severity: 'high',
          metadata: {
            url: context.url.pathname,
            method: context.request.method,
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }

      return this.createErrorResponse('Internal security error', 500);
    }
  }

  private async checkRateLimit(context: APIContext): Promise<boolean> {
    const clientIP = this.getClientIP(context);
    const identifier = `${clientIP}_${context.url.pathname}`;
    
    return !SecurityUtils.isRateLimited(identifier, securityConfig.validation.rateLimiting);
  }

  private async validateCSRF(context: APIContext): Promise<boolean> {
    // Skip CSRF validation for GET requests
    if (context.request.method === 'GET') {
      return true;
    }

    const contentType = context.request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // For JSON requests, check custom header
      const csrfToken = context.request.headers.get('X-CSRF-Token');
      return this.validateCSRFToken(csrfToken);
    } else if (contentType.includes('application/x-www-form-urlencoded') || 
               contentType.includes('multipart/form-data')) {
      // For form requests, check form data
      try {
        const formData = await context.request.clone().formData();
        const csrfToken = formData.get('csrf_token') as string;
        return this.validateCSRFToken(csrfToken);
      } catch {
        return false;
      }
    }

    return false;
  }

  private validateCSRFToken(token: string | null): boolean {
    if (!token) return false;

    // In a real implementation, you would validate against a stored token
    // For this example, we'll do basic format validation
    return token.length === securityConfig.csrf.tokenLength * 2; // hex encoding doubles length
  }

  private async validateInput(context: APIContext): Promise<boolean> {
    const contentType = context.request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await this.validateJSONInput(context);
    } else if (contentType.includes('application/x-www-form-urlencoded') || 
               contentType.includes('multipart/form-data')) {
      return await this.validateFormInput(context);
    }

    return true; // No validation needed for other content types
  }

  private async validateJSONInput(context: APIContext): Promise<boolean> {
    try {
      const body = await context.request.clone().json();
      return this.validateObjectInput(body);
    } catch {
      return false; // Invalid JSON
    }
  }

  private async validateFormInput(context: APIContext): Promise<boolean> {
    try {
      const formData = await context.request.clone().formData();
      
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          if (!this.validateStringInput(value)) {
            if (this.options.enableLogging) {
              SecurityUtils.logSecurityEvent({
                type: 'input_validation_failed',
                message: `Invalid input detected in field: ${key}`,
                severity: 'medium',
                metadata: {
                  field: key,
                  url: context.url.pathname
                }
              });
            }
            return false;
          }
        } else if (value instanceof File) {
          const validation = SecurityUtils.validateFileUpload(value, securityConfig.validation);
          if (!validation.valid) {
            if (this.options.enableLogging) {
              SecurityUtils.logSecurityEvent({
                type: 'file_validation_failed',
                message: `File validation failed: ${validation.error}`,
                severity: 'medium',
                metadata: {
                  filename: value.name,
                  filesize: value.size,
                  filetype: value.type,
                  url: context.url.pathname
                }
              });
            }
            return false;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private validateObjectInput(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return this.validateStringInput(String(obj));
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (!this.validateStringInput(value)) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (!this.validateObjectInput(value)) {
          return false;
        }
      }
    }

    return true;
  }

  private validateStringInput(input: string): boolean {
    // Check input length
    if (input.length > securityConfig.validation.maxInputLength) {
      return false;
    }

    // Check for XSS attempts
    if (SecurityUtils.containsXSS(input)) {
      return false;
    }

    // Check for SQL injection attempts
    if (SecurityUtils.containsSQLInjection(input)) {
      return false;
    }

    return true;
  }

  private addSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    // Add security headers
    headers.set('X-Content-Type-Options', securityConfig.headers.xContentTypeOptions);
    headers.set('X-Frame-Options', securityConfig.headers.xFrameOptions);
    headers.set('X-XSS-Protection', securityConfig.headers.xXSSProtection);
    headers.set('Referrer-Policy', securityConfig.headers.referrerPolicy);
    headers.set('Permissions-Policy', securityConfig.headers.permissionsPolicy);

    // Add CSP header
    const cspHeader = SecurityUtils.generateCSPHeader(securityConfig.csp);
    headers.set('Content-Security-Policy', cspHeader);

    // Add HSTS header for HTTPS
    if (headers.get('x-forwarded-proto') === 'https') {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  private getClientIP(context: APIContext): string {
    // Try to get real IP from various headers
    const headers = context.request.headers;
    
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           headers.get('x-real-ip') ||
           headers.get('cf-connecting-ip') ||
           headers.get('x-client-ip') ||
           'unknown';
  }

  private createErrorResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({
      error: message,
      status,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...this.getSecurityHeaders()
      }
    });
  }

  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': securityConfig.headers.xContentTypeOptions,
      'X-Frame-Options': securityConfig.headers.xFrameOptions,
      'X-XSS-Protection': securityConfig.headers.xXSSProtection,
      'Referrer-Policy': securityConfig.headers.referrerPolicy,
      'Permissions-Policy': securityConfig.headers.permissionsPolicy,
      'Content-Security-Policy': SecurityUtils.generateCSPHeader(securityConfig.csp)
    };
  }
}

// Helper function to create security middleware
export function createSecurityMiddleware(options?: SecurityMiddlewareOptions) {
  const middleware = new SecurityMiddleware(options);
  return (context: APIContext, next: () => Promise<Response>) => middleware.handle(context, next);
}

// Example API route with security middleware
export const secureAPIRoute: APIRoute = async (context) => {
  const securityMiddleware = createSecurityMiddleware({
    enableCSRF: true,
    enableRateLimit: true,
    enableInputValidation: true,
    enableLogging: true
  });

  return securityMiddleware(context, async () => {
    // Your API logic here
    return new Response(JSON.stringify({ message: 'Success' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  });
};

export default SecurityMiddleware;