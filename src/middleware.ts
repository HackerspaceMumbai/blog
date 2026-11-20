import type { MiddlewareHandler } from 'astro';
import { SECURITY_HEADERS } from './config/responseHeaders.js';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url } = context;
  const rewritePaths: Record<string, string> = {
    '/subscribe': '/api/newsletter',
    '/api/newsletter/health': '/api/newsletter-health',
    '/health/newsletter': '/api/newsletter-health',
  };
  const rewritePath = rewritePaths[url.pathname];

  let response: Response;
  if (rewritePath) {
    const rewrittenUrl = new URL(url);
    rewrittenUrl.pathname = rewritePath;
    response = await context.rewrite(rewrittenUrl);
  } else {
    response = await next();
  }

  const headers = new Headers(response.headers);

  if (!import.meta.env.DEV) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value);
    }
  }

  if (url.pathname.startsWith('/api/') || rewritePath?.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
