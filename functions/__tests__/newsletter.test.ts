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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ subscribers: [] }))
      .mockResolvedValueOnce(Response.json({
        subscription: { state: 'active', subscriber: { id: 1 } },
      }));
    vi.stubGlobal('fetch', fetchMock);
    const env = environment();

    const response = await onRequest({
      request: request(JSON.stringify({ email: ' Person@example.com ', firstName: 'Alex' })),
      env,
    });

    expect(response.status).toBe(200);
    expect(env.NEWSLETTER_RATE_LIMITER.getByName).toHaveBeenCalledWith('192.0.2.1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('email_address')).toBe('person@example.com');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('status')).toBe('all');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).email_address).toBe('person@example.com');
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
      const env = failure === 'limiter error'
        ? environment(vi.fn().mockRejectedValue(new Error('unavailable')))
        : environment();
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
      if (failure === 'missing client IP') {
        expect(env.NEWSLETTER_RATE_LIMITER.getByName).not.toHaveBeenCalled();
      }
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

  it('rejects existing subscribers before issuing an upsert', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      subscribers: [{ email_address: 'person@example.com', first_name: 'Alice', state: 'active' }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await onRequest({
      request: request('{"email":"person@example.com","firstName":"Bob"}'),
      env: environment(),
    });

    expect(response.status).toBe(409);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });

  it.each([
    ['HTTP error', () => Promise.resolve(new Response('{}', { status: 503 }))],
    ['network error', () => Promise.reject(new Error('Network unavailable'))],
    ['invalid response', () => Promise.resolve(Response.json({ subscribers: null }))],
  ])('does not upsert when the subscriber lookup has an %s', async (_label, lookup) => {
    const fetchMock = vi.fn().mockImplementation(lookup);
    vi.stubGlobal('fetch', fetchMock);
    const response = await onRequest({
      request: request('{"email":"person@example.com"}'),
      env: environment(),
    });

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
