import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../../middleware';

describe('middleware route rewrites', () => {
  it('preserves query parameters and no-store headers on API aliases', async () => {
    const rewrite = vi.fn(async () => new Response('ok'));
    const next = vi.fn();
    const context = {
      url: new URL('https://example.test/subscribe?source=header'),
      rewrite,
    };

    const response = await onRequest(context, next);

    expect(rewrite.mock.calls[0][0].href).toBe('https://example.test/api/newsletter?source=header');
    expect(next).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
