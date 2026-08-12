import { describe, it, expect } from 'vitest';
import {
  formatHostedEventsStat,
  getGridClasses,
  getSortedRecentEvents,
  shouldShowRecentFallback,
  validateUpcomingEvents,
} from '../../utils/eventsSection';

const sampleEvents = [
  {
    title: 'Test Event',
    date: '2025-08-01',
    location: 'Mumbai',
    description: 'A test event for the community.',
    rsvpLink: 'https://example.com/rsvp',
    coverImage: '/images/test.jpg',
  },
  {
    title: 'Another Event',
    date: '2025-09-01',
    location: 'Pune',
    description: 'Another test event.',
    rsvpLink: 'https://example.com/rsvp2',
  },
];

const sampleRecentEvents = [
  {
    slug: 'june-2026-build-localhost-mumbai',
    data: {
      title: 'Build //localhost : Mumbai',
      date: new Date('2026-06-20'),
      location: 'Microsoft Corporation India Private Limited, Mumbai',
      description: 'Community event recap',
      eventType: 'conference',
      coverImage: undefined,
    },
  },
];

describe('EventsSection', () => {
  it('validates and keeps only structurally valid upcoming events', () => {
    const validated = validateUpcomingEvents([
      ...sampleEvents,
      { title: 'Bad Event', date: '2025-10-01' },
      null,
    ]);
    expect(validated).toHaveLength(2);
    expect(validated[0].title).toBe('Test Event');
    expect(validated[1].title).toBe('Another Event');
  });

  it('returns empty array for invalid upcoming events input', () => {
    expect(validateUpcomingEvents(null)).toEqual([]);
    expect(validateUpcomingEvents(undefined)).toEqual([]);
    expect(validateUpcomingEvents({})).toEqual([]);
  });

  it('computes responsive grid classes from upcoming events count', () => {
    expect(getGridClasses(0)).toBe('');
    expect(getGridClasses(1)).toContain('max-w-4xl');
    expect(getGridClasses(2)).toContain('md:grid-cols-2');
    expect(getGridClasses(3)).toContain('lg:grid-cols-3');
  });

  it('sorts and limits recent events fallback to the 3 most recent items', () => {
    const recent = [
      ...sampleRecentEvents,
      { slug: 'older', data: { ...sampleRecentEvents[0].data, title: 'Older', date: new Date('2026-04-18') } },
      { slug: 'newest', data: { ...sampleRecentEvents[0].data, title: 'Newest', date: new Date('2026-07-01') } },
      { slug: 'middle', data: { ...sampleRecentEvents[0].data, title: 'Middle', date: new Date('2026-05-01') } },
    ];
    const sorted = getSortedRecentEvents(recent);
    expect(sorted).toHaveLength(3);
    expect(sorted[0].data.title).toBe('Newest');
    expect(sorted[1].data.title).toBe('Build //localhost : Mumbai');
    expect(sorted[2].data.title).toBe('Middle');
  });

  it('uses recent-events fallback only when no upcoming events are present', () => {
    expect(shouldShowRecentFallback(0, 1)).toBe(true);
    expect(shouldShowRecentFallback(1, 1)).toBe(false);
    expect(shouldShowRecentFallback(0, 0)).toBe(false);
  });

  it('formats hosted-events stat badge text when provided', () => {
    expect(formatHostedEventsStat(110)).toBe('110+ events hosted');
    expect(formatHostedEventsStat(undefined)).toBeNull();
  });
});
