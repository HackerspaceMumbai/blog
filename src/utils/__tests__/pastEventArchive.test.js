import { describe, expect, it } from 'vitest';
import {
  enrichPastEventFromArchive,
  getArchiveLinks,
  getArchiveRawFileUrl,
  getExternalMediaLinks,
  getGitHubArchivePhotoImages,
  getGitHubContentsApiUrl,
  isSafeArchiveUrl,
  isSafeRawArchiveUrl,
  isSupportedPhotoFile,
  mergeSpeakerResources,
  parseSpeakerFrontmatter,
  speakerResourcesFromFrontmatter,
} from '../pastEventArchive';

const archiveUrl =
  'https://github.com/HackerspaceMumbai/events/tree/main/events/2026/2026-09-05-github-copilot-dev-days-mumbai';

describe('pastEventArchive', () => {
  it('allows only canonical HackerspaceMumbai events GitHub URLs', () => {
    expect(isSafeArchiveUrl(archiveUrl)).toBe(true);
    expect(isSafeArchiveUrl('https://github.com/HackerspaceMumbai/events')).toBe(true);
    expect(isSafeArchiveUrl('https://github.com/HackerspaceMumbai/blog')).toBe(false);
    expect(isSafeArchiveUrl('http://github.com/HackerspaceMumbai/events')).toBe(false);
    expect(isSafeArchiveUrl('javascript:alert(1)')).toBe(false);
  });

  it('allows only canonical raw GitHub image URLs', () => {
    expect(
      isSafeRawArchiveUrl(
        'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/photo.jpg'
      )
    ).toBe(true);
    expect(
      isSafeRawArchiveUrl(
        'https://raw.githubusercontent.com/HackerspaceMumbai/blog/main/events/2026/photo.jpg'
      )
    ).toBe(false);
  });

  it('returns labeled archive links in display order', () => {
    expect(
      getArchiveLinks({
        archiveUrl,
        photosUrl: `${archiveUrl}/media/photos`,
        recapUrl: `${archiveUrl}/recap.md`,
        communityUrl: `${archiveUrl}/community`,
      })
    ).toEqual([
      { label: 'Canonical Archive', href: archiveUrl },
      { label: 'Photos', href: `${archiveUrl}/media/photos` },
      { label: 'Recap', href: `${archiveUrl}/recap.md` },
      { label: 'Community Contributions', href: `${archiveUrl}/community` },
    ]);
  });

  it('prioritizes direct photos and videos links for external gallery fallback', () => {
    expect(
      getExternalMediaLinks({
        archiveUrl,
        mediaUrl: `${archiveUrl}/media`,
        photosUrl: `${archiveUrl}/media/photos`,
        videosUrl: `${archiveUrl}/media/videos`,
      })
    ).toEqual([
      { label: 'Browse Photos', href: `${archiveUrl}/media/photos` },
      { label: 'Browse Videos', href: `${archiveUrl}/media/videos` },
      { label: 'Open Media Archive', href: `${archiveUrl}/media` },
      { label: 'Open Event Archive', href: archiveUrl },
    ]);
  });

  it('converts a canonical GitHub tree URL to a contents API URL', () => {
    expect(getGitHubContentsApiUrl(`${archiveUrl}/media/photos`)).toBe(
      'https://api.github.com/repos/HackerspaceMumbai/events/contents/events/2026/2026-09-05-github-copilot-dev-days-mumbai/media/photos?ref=main'
    );
    expect(getGitHubContentsApiUrl('https://github.com/HackerspaceMumbai/blog/tree/main/events')).toBeNull();
  });

  it('recognizes supported web photo formats', () => {
    expect(isSupportedPhotoFile('photo.JPG')).toBe(true);
    expect(isSupportedPhotoFile('photo.avif')).toBe(true);
    expect(isSupportedPhotoFile('notes.md')).toBe(false);
    expect(isSupportedPhotoFile('photo.heic')).toBe(false);
  });

  it('builds gallery images from canonical GitHub archive contents', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => [
        {
          name: 'b-photo.jpg',
          type: 'file',
          download_url:
            'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/b-photo.jpg',
        },
        {
          name: 'a-photo.png',
          type: 'file',
          download_url:
            'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/a-photo.png',
        },
        {
          name: 'notes.md',
          type: 'file',
          download_url:
            'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/notes.md',
        },
      ],
    });

    await expect(
      getGitHubArchivePhotoImages(`${archiveUrl}/media/photos`, 'Dev Days', fetchImpl)
    ).resolves.toEqual([
      {
        src: 'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/a-photo.png',
        alt: 'Dev Days - a-photo.png',
      },
      {
        src: 'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/b-photo.jpg',
        alt: 'Dev Days - b-photo.jpg',
      },
    ]);
  });

  it('falls back to an empty gallery when GitHub archive photo discovery fails', async () => {
    const fetchImpl = async () => {
      throw new Error('Network unavailable');
    };

    await expect(
      getGitHubArchivePhotoImages(`${archiveUrl}/media/photos`, 'Dev Days', fetchImpl)
    ).resolves.toEqual([]);
  });

  it('falls back to an empty gallery when the archive response has invalid JSON', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(
      getGitHubArchivePhotoImages(`${archiveUrl}/media/photos`, 'Dev Days', fetchImpl)
    ).resolves.toEqual([]);
  });

  it('ignores malformed entries in a successful archive response', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => [
        null,
        { name: 'missing-type.jpg', download_url: 'https://example.com/photo.jpg' },
        { type: 'file', download_url: 'https://example.com/photo.jpg' },
        {
          name: 'valid.jpg',
          type: 'file',
          download_url:
            'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/valid.jpg',
        },
      ],
    });

    await expect(
      getGitHubArchivePhotoImages(`${archiveUrl}/media/photos`, 'Dev Days', fetchImpl)
    ).resolves.toEqual([
      {
        src: 'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/valid.jpg',
        alt: 'Dev Days - valid.jpg',
      },
    ]);
  });

  it('builds raw archive file URLs for event.yml and speaker.md', () => {
    expect(getArchiveRawFileUrl(archiveUrl, 'event.yml')).toBe(
      'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/2026-09-05-github-copilot-dev-days-mumbai/event.yml'
    );
    expect(getArchiveRawFileUrl(`${archiveUrl}/speakers`, 'anxkhn/speaker.md')).toBe(
      'https://raw.githubusercontent.com/HackerspaceMumbai/events/main/events/2026/2026-09-05-github-copilot-dev-days-mumbai/speakers/anxkhn/speaker.md'
    );
    expect(getArchiveRawFileUrl('https://github.com/HackerspaceMumbai/blog/tree/main/x', 'a.yml')).toBeNull();
  });

  it('parses speaker frontmatter and maps resource URLs', () => {
    const fields = parseSpeakerFrontmatter(`---
name: Anas Khan
sessionTitle: One Interface, Infinite Agents
github: anxkhn
slides: https://speakerdeck.com/example/deck
repository: https://github.com/example/session
recording: https://youtube.com/watch?v=example
---

# Body
`);

    expect(fields.name).toBe('Anas Khan');
    expect(speakerResourcesFromFrontmatter(fields)).toEqual([
      {
        speakerName: 'Anas Khan',
        resourceTitle: 'One Interface, Infinite Agents — Slides',
        resourceUrl: 'https://speakerdeck.com/example/deck',
        resourceType: 'slides',
        description: 'One Interface, Infinite Agents',
      },
      {
        speakerName: 'Anas Khan',
        resourceTitle: 'One Interface, Infinite Agents — Repository',
        resourceUrl: 'https://github.com/example/session',
        resourceType: 'github',
        description: 'One Interface, Infinite Agents',
      },
      {
        speakerName: 'Anas Khan',
        resourceTitle: 'One Interface, Infinite Agents — Recording',
        resourceUrl: 'https://youtube.com/watch?v=example',
        resourceType: 'recording',
        description: 'One Interface, Infinite Agents',
      },
    ]);
  });

  it('merges archive speaker resources ahead of local duplicates', () => {
    expect(
      mergeSpeakerResources(
        [
          {
            speakerName: 'A',
            resourceTitle: 'Archive slides',
            resourceUrl: 'https://example.com/slides',
            resourceType: 'slides',
          },
        ],
        [
          {
            speakerName: 'A',
            resourceTitle: 'Local slides',
            resourceUrl: 'https://example.com/slides',
            resourceType: 'slides',
          },
          {
            speakerName: 'Local',
            resourceTitle: 'Archive root',
            resourceUrl: 'https://github.com/HackerspaceMumbai/events',
            resourceType: 'github',
          },
        ]
      )
    ).toEqual([
      {
        speakerName: 'A',
        resourceTitle: 'Archive slides',
        resourceUrl: 'https://example.com/slides',
        resourceType: 'slides',
      },
      {
        speakerName: 'Local',
        resourceTitle: 'Archive root',
        resourceUrl: 'https://github.com/HackerspaceMumbai/events',
        resourceType: 'github',
      },
    ]);
  });

  it('enriches past events from archive event.yml and speaker.md at build time', async () => {
    const fetchImpl = async (url) => {
      if (String(url).includes('/contents/') && String(url).includes('/speakers')) {
        return {
          ok: true,
          json: async () => [{ name: 'anxkhn', type: 'dir' }],
        };
      }
      if (String(url).endsWith('/event.yml')) {
        return {
          ok: true,
          text: async () => `title: Archive Title
date: 2026-09-05
venue: Paytm Office
city: Mumbai
description: From event.yml
`,
        };
      }
      if (String(url).endsWith('/speaker.md')) {
        return {
          ok: true,
          text: async () => `---
name: Anas Khan
sessionTitle: Omnigent
slides: https://speakerdeck.com/example/deck
---
`,
        };
      }
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
    };

    await expect(
      enrichPastEventFromArchive(
        {
          archiveUrl,
          speakersUrl: `${archiveUrl}/speakers`,
        },
        {
          title: 'Local Title',
          date: new Date('2026-01-01T00:00:00'),
          location: 'Local Venue',
          description: 'Local description',
          speakerResources: [
            {
              speakerName: 'Local',
              resourceTitle: 'Local only',
              resourceUrl: 'https://example.com/local',
              resourceType: 'other',
            },
          ],
        },
        fetchImpl
      )
    ).resolves.toMatchObject({
      title: 'Archive Title',
      location: 'Paytm Office, Mumbai',
      description: 'From event.yml',
      speakerResources: [
        {
          speakerName: 'Anas Khan',
          resourceUrl: 'https://speakerdeck.com/example/deck',
          resourceType: 'slides',
        },
        {
          speakerName: 'Local',
          resourceUrl: 'https://example.com/local',
          resourceType: 'other',
        },
      ],
    });
  });

  it('falls back to local past-event fields when archive enrichment fails', async () => {
    const fetchImpl = async () => {
      throw new Error('offline');
    };

    await expect(
      enrichPastEventFromArchive(
        { archiveUrl, speakersUrl: `${archiveUrl}/speakers` },
        {
          title: 'Local Title',
          date: new Date('2026-01-01T00:00:00'),
          location: 'Local Venue',
          description: 'Local description',
          speakerResources: [],
        },
        fetchImpl
      )
    ).resolves.toMatchObject({
      title: 'Local Title',
      location: 'Local Venue',
      description: 'Local description',
      speakerResources: [],
    });
  });
});
