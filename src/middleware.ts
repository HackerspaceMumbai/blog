import type { MiddlewareHandler } from 'astro';
import { SECURITY_HEADERS } from './config/responseHeaders.js';

export const onRequest: MiddlewareHandler = async ({ url }, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  if (!import.meta.env.DEV) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value);
    }
  }

  if (url.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
