import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

const script = readFileSync('public/scripts/premiere-promo.js', 'utf8');

afterEach(() => {
  vi.useRealTimers();
  delete window.__hmPremierePromoInitialized;
});

describe('premiere promotion', () => {
  it('updates visible and accessible names as the premiere changes state', () => {
    vi.useFakeTimers();
    const now = Date.parse('2026-10-15T15:29:59Z');
    vi.setSystemTime(now);
    document.body.innerHTML = `
      <div data-premiere-promo data-start-at="${now + 1000}" data-end-at="${now + 2000}">
        <a aria-label="Upcoming session" data-premiere-aria-upcoming="Upcoming session"
          data-premiere-aria-live="Live session">
          <span data-premiere-label data-label-upcoming="Upcoming" data-label-live="Live"></span>
        </a>
      </div>
      <a data-premiere-promo data-start-at="${now + 1000}" data-end-at="${now + 2000}"
        aria-label="Watch Premiere for Session (opens in new window)"
        data-premiere-aria-upcoming="Watch Premiere for Session (opens in new window)"
        data-premiere-aria-live="Watch Premiere for Session (opens in new window)"
        data-premiere-aria-post="Watch Recording for Session (opens in new window)">
        <span data-premiere-label data-label-upcoming="Watch Premiere"
          data-label-live="Watch Premiere" data-label-post="Watch Recording"></span>
      </a>`;
    window.eval(script);

    vi.advanceTimersByTime(1000);
    const links = document.querySelectorAll('a');
    expect(links[0].getAttribute('aria-label')).toBe('Live session');
    expect(links[0].textContent.trim()).toBe('Live');

    vi.advanceTimersByTime(1000);
    expect(links[1].getAttribute('aria-label')).toBe('Watch Recording for Session (opens in new window)');
    expect(links[1].textContent.trim()).toBe('Watch Recording');
  });
});
