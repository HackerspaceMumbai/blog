import { defineMiddleware } from 'astro:middleware';
import { SecurityUtils, securityConfig } from './utils/security-config';

export const onRequest = defineMiddleware(async (context, next) => {
  // Get the response from the next middleware/page
  const response = await next();
  
  // Clone the response to modify headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });

  // Add security headers
  addSecurityHeaders(newResponse.headers);
  return newResponse;
});

function addSecurityHeaders(headers: Headers): void {
  // Content Security Policy - moved from meta tags to HTTP headers
  const cspHeader = generateCSPHeader();
  headers.set('Content-Security-Policy', cspHeader);

  // X-Frame-Options - only works as HTTP header
  headers.set('X-Frame-Options', securityConfig.headers.xFrameOptions);

  // Other security headers
  headers.set('X-Content-Type-Options', securityConfig.headers.xContentTypeOptions);
  headers.set('X-XSS-Protection', securityConfig.headers.xXSSProtection);
  headers.set('Referrer-Policy', securityConfig.headers.referrerPolicy);
  headers.set('Permissions-Policy', securityConfig.headers.permissionsPolicy);

  // HSTS for HTTPS connections
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Additional security headers
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
}

function generateCSPHeader(): string {
  // Updated CSP configuration with Google Fonts support
  const cspConfig = {
    ...securityConfig.csp,
    // Ensure Google Fonts is properly included in both style-src and font-src
    styleSrc: [
      ...securityConfig.csp.styleSrc,
      'https://fonts.googleapis.com'
    ],
    fontSrc: [
      ...securityConfig.csp.fontSrc,
      'https://fonts.googleapis.com'
    ],
    // Ensure unpkg.com is included for external scripts
    scriptSrc: [
      ...securityConfig.csp.scriptSrc,
      'https://unpkg.com'
    ]
  };

  const directives = [
    `default-src ${cspConfig.defaultSrc.join(' ')}`,
    `script-src ${cspConfig.scriptSrc.join(' ')}`,
    `style-src ${cspConfig.styleSrc.join(' ')}`,
    `img-src ${cspConfig.imgSrc.join(' ')}`,
    `font-src ${cspConfig.fontSrc.join(' ')}`,
    `connect-src ${cspConfig.connectSrc.join(' ')}`,
    `media-src ${cspConfig.mediaSrc.join(' ')}`,
    `object-src ${cspConfig.objectSrc.join(' ')}`,
    `base-uri ${cspConfig.baseUri.join(' ')}`,
    `form-action ${cspConfig.formAction.join(' ')}`,
    `frame-ancestors ${cspConfig.frameAncestors.join(' ')}`
  ];

  if (cspConfig.frameSrc.length > 0) {
    directives.push(`frame-src ${cspConfig.frameSrc.join(' ')}`);
  }

  if (cspConfig.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}