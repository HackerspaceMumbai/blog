export type PremiereLifecycleState = 'upcoming' | 'live' | 'post';

export interface PremiereHeroConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  watchUrl: string;
  notifyUrl?: string;
  startAt: string;
  endAt: string;
  upcomingBadgeText?: string;
  liveBadgeText?: string;
  watchButtonText?: string;
  notifyButtonText?: string;
  liveButtonText?: string;
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

export function getPremiereTimeBounds(config?: PremiereHeroConfig | null): { startMs: number; endMs: number } | null {
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

export function resolvePremiereState(config?: PremiereHeroConfig | null, nowMs: number = Date.now()): PremiereLifecycleState {
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
