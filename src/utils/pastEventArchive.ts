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

const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'hackmum-blog-build',
} as const;

export type ArchiveSpeakerResourceType =
  | 'slides'
  | 'video'
  | 'recording'
  | 'documentation'
  | 'blog'
  | 'github'
  | 'other';

export interface ArchiveSpeakerResource {
  speakerName: string;
  resourceTitle: string;
  resourceUrl: string;
  resourceType: ArchiveSpeakerResourceType;
  description?: string;
}

export interface ArchiveEventMetadata {
  title?: string;
  date?: Date;
  location?: string;
  description?: string;
  status?: string;
}

export interface LocalPastEventFields {
  title: string;
  date: Date;
  location: string;
  description: string;
  speakerResources?: ArchiveSpeakerResource[];
}

export interface EnrichedPastEventFields extends LocalPastEventFields {
  speakerResources: ArchiveSpeakerResource[];
}

/** Build a raw.githubusercontent.com URL for a file under an events tree URL. */
export function getArchiveRawFileUrl(
  archiveTreeUrl: string | undefined,
  relativePath = ''
): string | null {
  if (!isSafeArchiveUrl(archiveTreeUrl)) {
    return null;
  }

  const match = archiveTreeUrl.match(
    /^https:\/\/github\.com\/HackerspaceMumbai\/events\/tree\/([^/]+)\/(.+)$/
  );
  if (!match) {
    return null;
  }

  const [, ref, path] = match;
  const fullPath = relativePath ? `${path.replace(/\/$/, '')}/${relativePath}` : path;
  const encodedPath = fullPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `https://raw.githubusercontent.com/HackerspaceMumbai/events/${encodeURIComponent(ref)}/${encodedPath}`;
}

/** Parse simple scalar YAML / frontmatter key-value pairs (no nested structures). */
export function parseSimpleYamlMapping(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const body = text.replace(/^\uFEFF/, '');
  const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const yamlText = frontmatter ? frontmatter[1] : body;

  for (const rawLine of yamlText.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line || line.trimStart().startsWith('#') || line.startsWith(' ') || line.startsWith('-')) {
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) {
      continue;
    }

    let value = kv[2].trim();
    if (value.startsWith('#')) {
      continue;
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) {
      continue;
    }

    result[kv[1]] = value;
  }

  return result;
}

export function parseSpeakerFrontmatter(markdown: string): Record<string, string> {
  return parseSimpleYamlMapping(markdown);
}

function isHttpUrl(value: string | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/** Map speaker.md frontmatter resource fields to PastEventCard speakerResources. */
export function speakerResourcesFromFrontmatter(
  fields: Record<string, string>
): ArchiveSpeakerResource[] {
  const speakerName = fields.name?.trim() || fields.github?.trim() || 'Speaker';
  const sessionTitle = fields.sessionTitle?.trim() || 'Session resources';
  const resources: ArchiveSpeakerResource[] = [];

  const candidates: Array<[keyof typeof fields | string, ArchiveSpeakerResourceType, string]> = [
    ['slides', 'slides', 'Slides'],
    ['repository', 'github', 'Repository'],
    ['recording', 'recording', 'Recording'],
  ];

  for (const [key, resourceType, label] of candidates) {
    const resourceUrl = fields[key as string];
    if (!isHttpUrl(resourceUrl)) {
      continue;
    }
    resources.push({
      speakerName,
      resourceTitle: `${sessionTitle} — ${label}`,
      resourceUrl,
      resourceType,
      description: sessionTitle,
    });
  }

  return resources;
}

export function mergeSpeakerResources(
  fromArchive: ArchiveSpeakerResource[] = [],
  local: ArchiveSpeakerResource[] = []
): ArchiveSpeakerResource[] {
  const seen = new Set<string>();
  const merged: ArchiveSpeakerResource[] = [];

  for (const resource of [...fromArchive, ...local]) {
    const key = `${resource.resourceType}|${resource.resourceUrl}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(resource);
  }

  return merged;
}

async function fetchText(
  url: string,
  fetchImpl: typeof fetch
): Promise<string | null> {
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'hackmum-blog-build',
      },
    });
    if (!response.ok) {
      console.warn(`Unable to load archive file from ${url}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.warn(`Unable to load archive file from ${url}`, error);
    return null;
  }
}

async function fetchGitHubJson(
  apiUrl: string,
  fetchImpl: typeof fetch
): Promise<unknown | null> {
  try {
    const response = await fetchImpl(apiUrl, { headers: GITHUB_API_HEADERS });
    if (!response.ok) {
      console.warn(`Unable to load GitHub API ${apiUrl}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`Unable to load GitHub API ${apiUrl}`, error);
    return null;
  }
}

export async function getArchiveEventMetadata(
  archiveUrl: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<ArchiveEventMetadata | null> {
  const rawUrl = getArchiveRawFileUrl(archiveUrl, 'event.yml');
  if (!rawUrl || !isSafeRawArchiveUrl(rawUrl)) {
    return null;
  }

  const text = await fetchText(rawUrl, fetchImpl);
  if (!text) {
    return null;
  }

  const fields = parseSimpleYamlMapping(text);
  const metadata: ArchiveEventMetadata = {};

  if (fields.title) {
    metadata.title = fields.title;
  }
  if (fields.description) {
    metadata.description = fields.description;
  }
  if (fields.status) {
    metadata.status = fields.status;
  }

  if (fields.date) {
    const parsed = new Date(`${fields.date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      metadata.date = parsed;
    }
  }

  const venue = fields.venue?.trim();
  const city = fields.city?.trim();
  if (venue && city) {
    metadata.location = `${venue}, ${city}`;
  } else if (venue) {
    metadata.location = venue;
  } else if (city) {
    metadata.location = city;
  }

  return metadata;
}

export async function getArchiveSpeakerResources(
  speakersUrl: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<ArchiveSpeakerResource[]> {
  const apiUrl = getGitHubContentsApiUrl(speakersUrl);
  if (!apiUrl) {
    return [];
  }

  const items = await fetchGitHubJson(apiUrl, fetchImpl);
  if (!Array.isArray(items)) {
    return [];
  }

  const speakerDirs = items
    .filter((item): item is GitHubContentItem => (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as GitHubContentItem).name === 'string' &&
      typeof (item as GitHubContentItem).type === 'string'
    ))
    .filter((item) => item.type === 'dir')
    .sort((a, b) => a.name.localeCompare(b.name));

  const resources: ArchiveSpeakerResource[] = [];

  for (const dir of speakerDirs) {
    const speakerMdUrl = getArchiveRawFileUrl(speakersUrl, `${dir.name}/speaker.md`);
    if (!speakerMdUrl || !isSafeRawArchiveUrl(speakerMdUrl)) {
      continue;
    }

    const markdown = await fetchText(speakerMdUrl, fetchImpl);
    if (!markdown) {
      continue;
    }

    resources.push(...speakerResourcesFromFrontmatter(parseSpeakerFrontmatter(markdown)));
  }

  return resources;
}

/**
 * Enrich local past-event frontmatter with canonical archive event.yml + speaker.md resources.
 * Local fields remain the fallback when archive fetch fails. Community paths are never fetched.
 */
export async function enrichPastEventFromArchive(
  archiveLinks: PastEventArchiveLinks | undefined,
  local: LocalPastEventFields,
  fetchImpl: typeof fetch = fetch
): Promise<EnrichedPastEventFields> {
  if (!archiveLinks?.archiveUrl && !archiveLinks?.speakersUrl) {
    return {
      ...local,
      speakerResources: local.speakerResources ?? [],
    };
  }

  const [metadata, archiveResources] = await Promise.all([
    archiveLinks.archiveUrl
      ? getArchiveEventMetadata(archiveLinks.archiveUrl, fetchImpl)
      : Promise.resolve(null),
    getArchiveSpeakerResources(
      archiveLinks.speakersUrl ??
        (archiveLinks.archiveUrl ? `${archiveLinks.archiveUrl.replace(/\/$/, '')}/speakers` : undefined),
      fetchImpl
    ),
  ]);

  return {
    title: metadata?.title || local.title,
    date: metadata?.date || local.date,
    location: metadata?.location || local.location,
    description: metadata?.description || local.description,
    speakerResources: mergeSpeakerResources(archiveResources, local.speakerResources ?? []),
  };
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

  const items = await fetchGitHubJson(apiUrl, fetchImpl);
  if (!Array.isArray(items)) {
    console.warn(`Unexpected canonical archive photos response from ${apiUrl}`);
    return [];
  }

  return items
    .filter((item): item is GitHubContentItem => (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as GitHubContentItem).name === 'string' &&
      typeof (item as GitHubContentItem).type === 'string'
    ))
    .filter((item) => item.type === 'file')
    .filter((item) => isSupportedPhotoFile(item.name))
    .filter((item) => isSafeRawArchiveUrl(item.download_url))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      src: item.download_url as string,
      alt: `${eventTitle} - ${item.name}`,
    }));
}
