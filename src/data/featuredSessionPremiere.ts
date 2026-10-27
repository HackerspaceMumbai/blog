import type { FeaturedSessionPremiere } from '../utils/premiere';
import { getYouTubeThumbnailUrl } from '../utils/premiere';

const WATCH_URL = 'https://youtu.be/APOA5Qz-zig';

/**
 * Site-wide promoted session premiere. Every announcement links to `eventUrl`
 * (the canonical Dev Days page) so traffic, SEO value, and session discovery
 * stay on hackmum.in instead of going straight to YouTube.
 *
 * Set `enabled: false` (or replace the object with `null`) to retire the promotion.
 */
export const FEATURED_SESSION_PREMIERE: FeaturedSessionPremiere | null = {
  enabled: true,
  eventSlug: 'september-2026-github-copilot-dev-days-mumbai',
  eventUrl: '/past-events/september-2026-github-copilot-dev-days-mumbai/',
  sessionTitle: "Your Server-Rendered App Doesn't Know Who It's Talking To",
  // Verified against events/2026/2026-09-05-github-copilot-dev-days-mumbai/speakers/anshul2209/speaker.md
  speakerName: 'Anshul Bansal',
  description:
    "A production Node SSR fleet serving 35 million monthly users was scaling independently of human traffic, with bots and crawlers driving most expensive rendering. Anshul Bansal shares traffic-aware SSR patterns—including edge offload, bot and human classification, and differential caching—that cut OLX India's origin footprint by around 80%.",
  watchUrl: WATCH_URL,
  thumbnailUrl: getYouTubeThumbnailUrl(WATCH_URL) ?? undefined,
  thumbnailAlt:
    "Your Server-Rendered App Doesn't Know Who It's Talking To — session premiere with Anshul Bansal",
  startAt: '2026-10-15T21:00:00+05:30',
  endAt: '2026-10-15T22:00:00+05:30',
  announcementPrefix: 'PREMIERING TONIGHT AT 9:00 PM IST',
  announcementLivePrefix: 'PREMIERING NOW',
  announcementCtaText: 'Watch Now',
};
