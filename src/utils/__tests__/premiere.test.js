import { describe, it, expect } from 'vitest';
import {
  getPremiereForEvent,
  getPremiereTimeBounds,
  getPremiereWatchLabel,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  isPremiereSession,
  resolvePremiereState,
} from '../premiere.ts';
import {
  groupResourcesBySession,
  speakerResourcesFromFrontmatter,
} from '../pastEventArchive.ts';
import { FEATURED_SESSION_PREMIERE } from '../../data/featuredSessionPremiere.ts';

const premiere = {
  enabled: true,
  eventSlug: 'september-2026-github-copilot-dev-days-mumbai',
  eventUrl: '/past-events/september-2026-github-copilot-dev-days-mumbai/',
  sessionTitle: 'Stop Prompting Copilot. Make the System Prompt Itself',
  sessionTitleAliases: [
    "You Shouldn't Prompt GitHub Copilot Agent, You Should Make a System to Prompt Itself",
  ],
  speakerName: 'Pratik Pathak',
  description: 'Context Engineering and Closed-Loop Agentic Architecture.',
  watchUrl: 'https://www.youtube.com/watch?v=HrT1gLgB0ro',
  startAt: '2026-10-13T21:00:00+05:30',
  endAt: '2026-10-13T22:00:00+05:30',
};

const startMs = Date.parse(premiere.startAt);
const endMs = Date.parse(premiere.endAt);

describe('getYouTubeVideoId', () => {
  it('extracts ids from watch, short, embed and live URLs', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/watch?v=HrT1gLgB0ro')).toBe('HrT1gLgB0ro');
    expect(getYouTubeVideoId('https://youtu.be/HrT1gLgB0ro')).toBe('HrT1gLgB0ro');
    expect(getYouTubeVideoId('https://www.youtube.com/embed/HrT1gLgB0ro')).toBe('HrT1gLgB0ro');
    expect(getYouTubeVideoId('https://www.youtube.com/live/HrT1gLgB0ro')).toBe('HrT1gLgB0ro');
  });

  it('rejects non-YouTube and malformed URLs', () => {
    expect(getYouTubeVideoId('https://vimeo.com/12345')).toBeNull();
    expect(getYouTubeVideoId('not a url')).toBeNull();
    expect(getYouTubeVideoId(undefined)).toBeNull();
  });
});

describe('getYouTubeThumbnailUrl', () => {
  it('builds the maxres thumbnail URL', () => {
    expect(getYouTubeThumbnailUrl(premiere.watchUrl)).toBe(
      'https://i.ytimg.com/vi/HrT1gLgB0ro/maxresdefault.jpg'
    );
  });

  it('returns null when no video id can be resolved', () => {
    expect(getYouTubeThumbnailUrl('https://example.com/video')).toBeNull();
  });
});

describe('resolvePremiereState', () => {
  it('moves through upcoming, live and post states', () => {
    expect(resolvePremiereState(premiere, startMs - 1000)).toBe('upcoming');
    expect(resolvePremiereState(premiere, startMs + 1000)).toBe('live');
    expect(resolvePremiereState(premiere, endMs + 1000)).toBe('post');
  });

  it('treats a disabled premiere as post', () => {
    expect(resolvePremiereState({ ...premiere, enabled: false }, startMs - 1000)).toBe('post');
  });
});

describe('getPremiereWatchLabel', () => {
  it('shows Watch Premiere before and during, Watch Recording after', () => {
    expect(getPremiereWatchLabel('upcoming')).toBe('Watch Premiere');
    expect(getPremiereWatchLabel('live')).toBe('Watch Premiere');
    expect(getPremiereWatchLabel('post')).toBe('Watch Recording');
  });
});

describe('isPremiereSession', () => {
  it('matches on speaker name even when the archive reworded the session title', () => {
    expect(
      isPremiereSession(
        {
          title: 'A Completely Different Title The Archive Decided To Use',
          speakers: ['Pratik Pathak'],
        },
        premiere
      )
    ).toBe(true);
  });

  it('matches the speaker regardless of case, spacing and co-speakers', () => {
    expect(
      isPremiereSession({ title: 'Anything', speakers: ['Ahlam Shakeel', '  pratik   pathak '] }, premiere)
    ).toBe(true);
  });

  it('falls back to the archive session title when no speaker is listed', () => {
    expect(
      isPremiereSession(
        {
          title: 'You Shouldn’t Prompt GitHub Copilot Agent, You Should Make a System to Prompt Itself',
          speakers: [],
        },
        premiere
      )
    ).toBe(true);
  });

  it('falls back to the promotional session title', () => {
    expect(isPremiereSession('stop prompting copilot make the system prompt itself', premiere)).toBe(true);
  });

  it('does not match other sessions or a disabled premiere', () => {
    expect(isPremiereSession({ title: 'Shipping with GitHub Actions', speakers: ['Anshul'] }, premiere)).toBe(
      false
    );
    expect(isPremiereSession('Shipping with GitHub Actions', premiere)).toBe(false);
    expect(
      isPremiereSession({ title: premiere.sessionTitle, speakers: [premiere.speakerName] }, {
        ...premiere,
        enabled: false,
      })
    ).toBe(false);
    expect(isPremiereSession('', premiere)).toBe(false);
    expect(isPremiereSession({}, premiere)).toBe(false);
  });
});

describe('getPremiereForEvent', () => {
  it('returns the premiere only for its own event slug', () => {
    expect(getPremiereForEvent(premiere.eventSlug, premiere)).toBe(premiere);
    expect(getPremiereForEvent('april-2026-github-copilot-dev-days', premiere)).toBeNull();
    expect(getPremiereForEvent(undefined, premiere)).toBeNull();
  });

  it('returns null for disabled or invalid time windows', () => {
    expect(getPremiereForEvent(premiere.eventSlug, { ...premiere, enabled: false })).toBeNull();
    expect(
      getPremiereForEvent(premiere.eventSlug, { ...premiere, endAt: premiere.startAt })
    ).toBeNull();
  });
});

describe('getPremiereTimeBounds', () => {
  it('returns parsed millisecond bounds', () => {
    expect(getPremiereTimeBounds(premiere)).toEqual({ startMs, endMs });
  });

  it('rejects unparsable timestamps', () => {
    expect(getPremiereTimeBounds({ ...premiere, startAt: 'nope' })).toBeNull();
  });
});

describe('shipped premiere config binds to the real archive session card', () => {
  it('matches Anshul’s card built from anshul2209/speaker.md frontmatter', () => {
    // Frontmatter copied verbatim from
    // HackerspaceMumbai/events .../speakers/anshul2209/speaker.md
    const sessions = groupResourcesBySession(
      speakerResourcesFromFrontmatter({
        name: 'Anshul Bansal',
        sessionTitle: "Your Server-Rendered App Doesn't Know Who It's Talking To",
        github: 'anshul2209',
        slides:
          'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/2026-09-05-github-copilot-dev-days-mumbai/speakers/anshul2209/assets/dev-days-mumbai-deck.pdf',
      })
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].resources.map((r) => r.resourceType)).toEqual(['slides']);
    expect(isPremiereSession(sessions[0], FEATURED_SESSION_PREMIERE)).toBe(true);
    expect(FEATURED_SESSION_PREMIERE?.watchUrl).toBe('https://youtu.be/APOA5Qz-zig');
    expect(FEATURED_SESSION_PREMIERE?.speakerName).toBe('Anshul Bansal');
    expect(FEATURED_SESSION_PREMIERE?.startAt).toBe('2026-10-15T21:00:00+05:30');
  });

  it('still matches if the archive renames Anshul’s session title', () => {
    const sessions = groupResourcesBySession(
      speakerResourcesFromFrontmatter({
        name: 'Anshul Bansal',
        sessionTitle: 'Traffic-Aware Server Rendering',
        slides: 'https://example.com/slides.pdf',
      })
    );

    expect(isPremiereSession(sessions[0], FEATURED_SESSION_PREMIERE)).toBe(true);
  });
});
