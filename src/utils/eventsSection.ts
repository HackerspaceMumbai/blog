export interface UpcomingEventPreview {
  title: string;
  date: string;
  location: string;
  description: string;
  rsvpLink: string;
}

export function validateUpcomingEvents<T extends UpcomingEventPreview>(events: unknown): T[] {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .filter((event): event is T => {
      if (!event || typeof event !== 'object') return false;
      const candidate = event as Record<string, unknown>;
      return (
        typeof candidate.title === 'string' &&
        typeof candidate.date === 'string' &&
        typeof candidate.location === 'string' &&
        typeof candidate.description === 'string' &&
        typeof candidate.rsvpLink === 'string'
      );
    })
    .slice(0, 8);
}

export function getGridClasses(eventCount: number): string {
  if (eventCount === 0) return '';
  if (eventCount === 1) return 'grid-cols-1 max-w-4xl mx-auto';
  if (eventCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto';
  return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-7xl mx-auto';
}

export function formatHostedEventsStat(totalEventsHosted?: number): string | null {
  return totalEventsHosted != null ? `${totalEventsHosted}+ events hosted` : null;
}

export function getSortedRecentEvents<T extends { data: { date: Date } }>(recentEvents: T[]): T[] {
  return [...recentEvents]
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, 3);
}

export function shouldShowRecentFallback(upcomingCount: number, recentCount: number): boolean {
  return upcomingCount === 0 && recentCount > 0;
}
