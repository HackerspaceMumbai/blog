import { describe, it, expect } from 'vitest';
import { render } from '@astrojs/astro/test';
import EventsSection from '../EventsSection.astro';

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

describe('EventsSection', () => {
  it('renders with valid events', async () => {
    const { getByText } = await render(EventsSection, { props: { events: sampleEvents } });
    expect(getByText('Test Event')).toBeTruthy();
    expect(getByText('Another Event')).toBeTruthy();
  });

  it('renders empty state when no events', async () => {
    const { getByText } = await render(EventsSection, { props: { events: [] } });
    expect(getByText('No upcoming events')).toBeTruthy();
  });

  it('renders section header and CTA', async () => {
    const { getByText } = await render(EventsSection, { props: { events: sampleEvents, title: 'Custom Title', ctaText: 'Custom CTA' } });
    expect(getByText('Custom Title')).toBeTruthy();
    expect(getByText('Custom CTA')).toBeTruthy();
  });

  it('has correct ARIA roles and labels', async () => {
    const { container } = await render(EventsSection, { props: { events: sampleEvents } });
    const section = container.querySelector('section[role="region"]');
    expect(section).toBeTruthy();
    expect(section?.getAttribute('aria-labelledby')).toBe('events-section-title');
    const list = container.querySelector('[role="list"]');
    expect(list).toBeTruthy();
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(sampleEvents.length);
  });

  it('handles invalid events prop gracefully', async () => {
    // @ts-expect-error
    const { getByText } = await render(EventsSection, { props: { events: null } });
    expect(getByText('No upcoming events')).toBeTruthy();
  });
});
