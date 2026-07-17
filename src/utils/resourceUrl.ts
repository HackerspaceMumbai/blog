// src/utils/resourceUrl.ts - URL resolution utility for past events resources

/**
 * Validates a URL to prevent XSS attacks.
 * Only allows http(s)://, ./resources/, and absolute paths starting with /
 * 
 * @param url - The URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function isValidResourceUrl(url: string): boolean {
  if (!url) return false;
  
  // Allow http(s):// URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Allow relative ./resources/ paths
  if (url.startsWith('./resources/')) {
    return true;
  }
  
  // Allow absolute paths starting with /
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  
  return false;
}

/**
 * Resolves resource URLs for past events.
 * Supports both local paths (served from public/) and remote URLs.
 * 
 * Local resources are stored at: public/content/past-events/event-slug/resources/filename
 * And referenced as: ./resources/filename in frontmatter
 * 
 * @param resourceUrl - The resource URL from frontmatter (relative or absolute)
 * @param eventSlug - The event slug/directory name (e.g., "april-2026-github-copilot-dev-days")
 * @returns Resolved URL ready for serving, or empty string if invalid
 */
export function resolveResourceUrl(resourceUrl: string, eventSlug: string): string {
  // Validate URL for security
  if (!isValidResourceUrl(resourceUrl)) {
    console.warn(`Invalid resource URL: ${resourceUrl}`);
    return '';
  }
  
  // If it's a remote URL (http, https), return as-is
  if (resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://')) {
    return resourceUrl;
  }
  
  // If it's a relative local path (starts with ./)
  if (resourceUrl.startsWith('./')) {
    const relPath = resourceUrl.slice(2); // Remove ./
    // Return path that will be served from public folder
    // Resources are at: public/content/past-events/event-slug/resources/filename
    return `/content/past-events/${eventSlug}/${relPath}`;
  }
  
  // Return absolute paths as-is
  if (resourceUrl.startsWith('/')) {
    return resourceUrl;
  }
  
  // Should not reach here due to validation, but default to empty string
  return '';
}

/**
 * Extracts event slug from file path
 * @param id - Astro collection entry ID (e.g., "april-2026-github-copilot-dev-days/index")
 * @returns Event slug directory name
 */
export function getEventSlug(id: string): string {
  return id.split('/')[0];
}

