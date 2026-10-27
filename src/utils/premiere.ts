export type PremiereLifecycleState = 'upcoming' | 'live' | 'post';

export interface PremiereWindow {
  enabled: boolean;
  startAt: string;
  endAt: string;
}

export interface PremiereHeroConfig extends PremiereWindow {
  title: string;
  subtitle?: string;
  watchUrl: string;
  notifyUrl?: string;
  upcomingBadgeText?: string;
  liveBadgeText?: string;
  watchButtonText?: string;
  notifyButtonText?: string;
  liveButtonText?: string;
}

/**
 * A single session premiere promoted site-wide, with the event page (not YouTube)
 * as the canonical destination for every announcement link.
 */
export interface FeaturedSessionPremiere extends PremiereWindow {
  eventSlug: string;
  eventUrl: string;
  sessionTitle: string;
  /**
   * Extra titles the archive may use for this session (the events repo stores its
   * own `sessionTitle`, which can differ from the promotional title above).
   * Used as a fallback when speaker matching cannot resolve the card.
   */
  sessionTitleAliases?: string[];
  /**
   * Primary match key for the session card. This is the `name` field from the
   * speaker's `speaker.md` in the events archive, which is far more stable than
   * the session title.
   */
  speakerName: string;
  speakerTitle?: string;
  description: string;
  watchUrl: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  announcementPrefix?: string;
  announcementLivePrefix?: string;
  announcementCtaText?: string;
}

export interface YouTubePremiereSnapshot {
  title: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  watchUrl: string;
}

export function mapYouTubePremiereToHeroConfig(
  snapshot: YouTubePremiereSnapshot,
  overrides: Partial<Omit<PremiereHeroConfig, 'enabled' | 'title' | 'startAt' | 'endAt' | 'watchUrl'>> = {}
): PremiereHeroConfig {
  return {
    enabled: true,
    title: snapshot.title,
    startAt: snapshot.scheduledStartTime,
    endAt: snapshot.scheduledEndTime,
    watchUrl: snapshot.watchUrl,
    ...overrides,
  };
}

export function getPremiereTimeBounds(config?: PremiereWindow | null): { startMs: number; endMs: number } | null {
  if (!config || !config.enabled) {
    return null;
  }

  const startMs = Date.parse(config.startAt);
  const endMs = Date.parse(config.endAt);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }

  return { startMs, endMs };
}

export function resolvePremiereState(config?: PremiereWindow | null, nowMs: number = Date.now()): PremiereLifecycleState {
  const bounds = getPremiereTimeBounds(config);
  if (!bounds) {
    return 'post';
  }

  if (nowMs < bounds.startMs) {
    return 'upcoming';
  }

  if (nowMs < bounds.endMs) {
    return 'live';
  }

  return 'post';
}

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = parsed.pathname.slice(1);
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      candidate = parsed.searchParams.get('v');
    } else {
      const match = parsed.pathname.match(/^\/(?:embed|live|shorts|v)\/([^/]+)/);
      candidate = match ? match[1] : null;
    }
  }

  return candidate && /^[\w-]{11}$/.test(candidate) ? candidate : null;
}

export function getYouTubeThumbnailUrl(url?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null;
}

/** Premieres and recordings share one URL, so only the call-to-action label changes. */
export function getPremiereWatchLabel(state: PremiereLifecycleState): string {
  return state === 'post' ? 'Watch Recording' : 'Watch Premiere';
}

function normalizeSessionTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** The parts of a grouped session card used to bind the premiere. */
export interface PremiereSessionMatchInput {
  title?: string;
  speakers?: string[];
}

/**
 * Decide whether a session card belongs to the promoted premiere.
 *
 * Matching is speaker-first: the archive's speaker `name` is a stable key, while
 * `sessionTitle` is free text that upstream can reword at any time. Titles are
 * only a fallback for archives that list the session without the speaker name.
 */
export function isPremiereSession(
  session: PremiereSessionMatchInput | string,
  premiere?: FeaturedSessionPremiere | null
): boolean {
  if (!premiere?.enabled) {
    return false;
  }

  const input: PremiereSessionMatchInput =
    typeof session === 'string' ? { title: session } : session ?? {};

  const normalizedSpeaker = normalizeSessionTitle(premiere.speakerName ?? '');
  if (
    normalizedSpeaker &&
    (input.speakers ?? []).some((name) => normalizeSessionTitle(name ?? '') === normalizedSpeaker)
  ) {
    return true;
  }

  const normalizedTitle = normalizeSessionTitle(input.title ?? '');
  if (!normalizedTitle) {
    return false;
  }

  return [premiere.sessionTitle, ...(premiere.sessionTitleAliases ?? [])]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeSessionTitle(value) === normalizedTitle);
}

/** Returns the premiere only when it belongs to the given past event. */
export function getPremiereForEvent(
  slug: string | undefined,
  premiere?: FeaturedSessionPremiere | null
): FeaturedSessionPremiere | null {
  if (!premiere?.enabled || !slug || premiere.eventSlug !== slug) {
    return null;
  }

  return getPremiereTimeBounds(premiere) ? premiere : null;
}
