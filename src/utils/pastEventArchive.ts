export interface PastEventArchiveLinks {
  archiveUrl?: string;
  mediaUrl?: string;
  photosUrl?: string;
  videosUrl?: string;
  recapUrl?: string;
  speakersUrl?: string;
  resourcesUrl?: string;
  communityUrl?: string;
}

export interface ArchiveLink {
  label: string;
  href: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
}

interface GitHubContentItem {
  name: string;
  type: string;
  download_url?: string | null;
}

const ARCHIVE_LINK_LABELS: Array<[keyof PastEventArchiveLinks, string]> = [
  ['archiveUrl', 'Canonical Archive'],
  ['mediaUrl', 'Media Archive'],
  ['photosUrl', 'Photos'],
  ['videosUrl', 'Videos'],
  ['recapUrl', 'Recap'],
  ['speakersUrl', 'Speakers'],
  ['resourcesUrl', 'Resources'],
  ['communityUrl', 'Community Contributions'],
];

const SUPPORTED_PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

export function isSafeArchiveUrl(url: string | undefined): url is string {
  return typeof url === 'string' && /^https:\/\/github\.com\/HackerspaceMumbai\/events(\/|$)/.test(url);
}

export function isSafeRawArchiveUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && /^https:\/\/raw\.githubusercontent\.com\/HackerspaceMumbai\/events\//.test(url);
}

export function getArchiveLinks(archiveLinks?: PastEventArchiveLinks): ArchiveLink[] {
  if (!archiveLinks) {
    return [];
  }

  return ARCHIVE_LINK_LABELS
    .map(([key, label]) => {
      const href = archiveLinks[key];
      return isSafeArchiveUrl(href) ? { label, href } : null;
    })
    .filter((link): link is ArchiveLink => Boolean(link));
}

export function getExternalMediaLinks(archiveLinks?: PastEventArchiveLinks): ArchiveLink[] {
  const mediaLinkKeys: Array<[keyof PastEventArchiveLinks, string]> = [
    ['photosUrl', 'Browse Photos'],
    ['videosUrl', 'Browse Videos'],
    ['mediaUrl', 'Open Media Archive'],
    ['archiveUrl', 'Open Event Archive'],
  ];

  if (!archiveLinks) {
    return [];
  }

  return mediaLinkKeys
    .map(([key, label]) => {
      const href = archiveLinks[key];
      return isSafeArchiveUrl(href) ? { label, href } : null;
    })
    .filter((link): link is ArchiveLink => Boolean(link));
}

export function getGitHubContentsApiUrl(treeUrl: string | undefined): string | null {
  if (!isSafeArchiveUrl(treeUrl)) {
    return null;
  }

  const match = treeUrl.match(/^https:\/\/github\.com\/HackerspaceMumbai\/events\/tree\/([^/]+)\/(.+)$/);
  if (!match) {
    return null;
  }

  const [, ref, path] = match;
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `https://api.github.com/repos/HackerspaceMumbai/events/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
}

export function isSupportedPhotoFile(fileName: string): boolean {
  const extension = fileName.includes('.')
    ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
    : '';

  return SUPPORTED_PHOTO_EXTENSIONS.has(extension);
}

export async function getGitHubArchivePhotoImages(
  photosUrl: string | undefined,
  eventTitle: string,
  fetchImpl: typeof fetch = fetch
): Promise<GalleryImage[]> {
  const apiUrl = getGitHubContentsApiUrl(photosUrl);
  if (!apiUrl) {
    return [];
  }

  let response: Response;
  try {
    response = await fetchImpl(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'hackmum-blog-build',
      },
    });
  } catch (error) {
    console.warn(`Unable to load canonical archive photos from ${apiUrl}`, error);
    return [];
  }

  if (!response.ok) {
    console.warn(`Unable to load canonical archive photos from ${apiUrl}: ${response.status}`);
    return [];
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    console.warn(`Unexpected canonical archive photos response from ${apiUrl}`);
    return [];
  }

  return (items as GitHubContentItem[])
    .filter((item) => item.type === 'file')
    .filter((item) => isSupportedPhotoFile(item.name))
    .filter((item) => isSafeRawArchiveUrl(item.download_url))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      src: item.download_url as string,
      alt: `${eventTitle} - ${item.name}`,
    }));
}
