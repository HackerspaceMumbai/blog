import { describe, expect, it } from 'vitest';
import {
  getArchiveLinks,
  getExternalMediaLinks,
  getGitHubArchivePhotoImages,
  getGitHubContentsApiUrl,
  isSafeArchiveUrl,
  isSafeRawArchiveUrl,
  isSupportedPhotoFile,
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
});
