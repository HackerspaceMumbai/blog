import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../newsletter.js';

function request(body: string, ip = '192.0.2.1') {
  return new Request('https://hackmum.in/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body,
  });
}

function environment(check = vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 })) {
  return {
    NODE_ENV: 'production',
    KIT_API_KEY: 'test-key',
    NEWSLETTER_RATE_LIMITER: { getByName: vi.fn().mockReturnValue({ check }) },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Cloudflare newsletter handler', () => {
  it('subscribes valid requests using the configured limiter and Kit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      subscription: { state: 'active', subscriber: { id: 1 } },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const env = environment();

    const response = await onRequest({
      request: request(JSON.stringify({ email: ' Person@example.com ', firstName: 'Alex' })),
      env,
    });

    expect(response.status).toBe(200);
    expect(env.NEWSLETTER_RATE_LIMITER.getByName).toHaveBeenCalledWith('192.0.2.1');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).email_address).toBe('person@example.com');
    expect(await response.json()).toMatchObject({ success: true });
  });

  it('returns 429 without calling Kit when the limiter denies a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const env = environment(vi.fn().mockResolvedValue({ allowed: false, retryAfter: 42 }));

    const response = await onRequest({ request: request('{"email":"person@example.com"}'), env });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('42');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['missing binding', 'limiter error', 'missing client IP'])(
    'fails closed when %s prevents rate limiting',
    async (failure) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const env = environment(vi.fn().mockRejectedValue(new Error('unavailable')));
      if (failure === 'missing binding') {
        delete (env as Partial<typeof env>).NEWSLETTER_RATE_LIMITER;
      }
      const req = failure === 'missing client IP'
        ? new Request('https://hackmum.in/subscribe', {
            method: 'POST',
            headers: { 'X-Forwarded-For': '192.0.2.1' },
            body: '{"email":"person@example.com"}',
          })
        : request('{"email":"person@example.com"}');

      const response = await onRequest({ request: req, env });

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('rejects invalid input and propagates Kit authentication failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const env = environment();

    const invalid = await onRequest({ request: request('{"email":"invalid"}'), env });
    expect(invalid.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();

    const rejected = await onRequest({ request: request('{"email":"person@example.com"}'), env });
    expect(rejected.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
