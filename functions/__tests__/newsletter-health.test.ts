import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../newsletter-health.js';

const request = new Request('https://hackmum.in/api/newsletter-health');
const env = { NODE_ENV: 'production', KIT_API_KEY: 'test-key' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Cloudflare newsletter health handler', () => {
  it.each([401, 403])('reports Kit authentication status %s as unhealthy', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    const response = await onRequest({ request, env });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: 'unhealthy',
      checks: { kit_api: 'unhealthy' },
    });
  });

  it.each([
    [200, 200, 'healthy'],
    [429, 200, 'degraded'],
    [500, 503, 'unhealthy'],
  ])('maps Kit status %s to HTTP %s and %s', async (kitStatus, expectedStatus, expectedHealth) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: kitStatus })));
    const response = await onRequest({ request, env });

    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toMatchObject({ status: expectedHealth });
  });

  it('reports a missing Kit key as unhealthy without contacting Kit', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await onRequest({ request, env: { NODE_ENV: 'production' } });

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
