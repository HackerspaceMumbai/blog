import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECURITY_HEADERS } from '../../config/responseHeaders.ts';
import { onRequest } from '../../middleware.ts';

describe('Cloudflare response protections', () => {
  beforeEach(() => vi.stubEnv('DEV', false));
  afterEach(() => vi.unstubAllEnvs());

  it('keeps static and dynamic response policies identical', () => {
    const file = readFileSync('public/_headers', 'utf8').replace(/\r\n/g, '\n');
    const commonBlock = file.split('/*\n')[1].split('\n/_astro/')[0];
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(commonBlock).toContain(`${name}: ${value}`);
    }
    const policy = SECURITY_HEADERS['Content-Security-Policy'];
    const scripts = policy.split(';').find((directive) => directive.trim().startsWith('script-src'));
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it.each([200, 400, 404, 500])('protects dynamic responses with status %s without changing their body', async (status) => {
    const response = await onRequest(
      { url: new URL('https://hackmum.in/example') },
      async () => new Response('body', { status, headers: { 'Content-Type': 'text/plain' } }),
    );
    expect(response.status).toBe(status);
    expect(await response.text()).toBe('body');
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it('prevents API caching and preserves endpoint-specific CORS headers', async () => {
    const response = await onRequest(
      { url: new URL('https://hackmum.in/api/newsletter') },
      async () => new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://hackmum.in',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://hackmum.in');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });

  it('preserves image caching and cookies', async () => {
    const response = await onRequest(
      { url: new URL('https://hackmum.in/_image?href=example') },
      async () => new Response('image', {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Set-Cookie': 'example=value; Secure; HttpOnly; SameSite=Lax',
        },
      }),
    );
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('Set-Cookie')).toBe('example=value; Secure; HttpOnly; SameSite=Lax');
  });

  it('does not impose production CSP on the HTTP development server', async () => {
    vi.stubEnv('DEV', true);
    const response = await onRequest(
      { url: new URL('http://localhost:4321/') },
      async () => new Response('development'),
    );
    expect(response.headers.get('Content-Security-Policy')).toBeNull();
    expect(await response.text()).toBe('development');
  });
});
