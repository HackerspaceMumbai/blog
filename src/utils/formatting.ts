// =============================================================================
// DATE FORMATTING UTILITIES
// =============================================================================

import { extractTextFromHtml } from '../config/security.js';

/**
 * Formats a date string to a readable format
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'unknown time';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) {
      // Future date – use a “from now” message.
      return `in ${Math.abs(diffInSeconds / 3600).toFixed(0)} hours`;
    }

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'unknown time';
  }
}

/**
 * Formats time for events (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}

/**
 * Formats date range for events
 */
export function formatDateRange(startDate: string, endDate?: string): string {
  try {
    const start = new Date(startDate);
    
    if (!endDate) {
      return formatDate(startDate);
    }
    
    const end = new Date(endDate);
    
    // Same day
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(startDate)} from ${formatTime(startDate)} to ${formatTime(endDate)}`;
    }
    
    // Different days
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid Date Range';
  }
}

// =============================================================================
// TEXT FORMATTING UTILITIES
// =============================================================================

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts text to title case
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts text to kebab-case
 */
export function toKebabCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts text to camelCase
 */
export function toCamelCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Pluralizes a word based on count
 */
export function pluralize(word: string, count: number, pluralForm?: string): string {
  if (count === 1) return word;
  return pluralForm || `${word}s`;
}

/**
 * Generates reading time estimate
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  if (!text || typeof text !== 'string') return 0;
  
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extracts excerpt from text
 */
export function extractExcerpt(text: string, maxLength: number = 160): string {
  if (!text || typeof text !== 'string') return '';
  
  // SECURITY NOTE: Instead of using vulnerable regex patterns to remove HTML tags,
  // we use a conservative approach that focuses on extracting safe text content.
  // This prevents HTML injection vulnerabilities that simple regex replacement can't handle.
  
  let cleanText: string;
  
  // Check if input appears to contain HTML
  const containsHtml = /<[^>]+>/.test(text);
  
  if (!containsHtml) {
    // If no HTML detected, use text as-is
    cleanText = text;
  } else {
    // For HTML content, use DOM parsing if available (client-side)
    if (typeof document !== 'undefined') {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        cleanText = tempDiv.textContent || tempDiv.innerText || '';
      } catch (error) {
        // If DOM parsing fails, return empty string for security
        cleanText = '';
      }
    } else {
      // Server-side: For security, reject HTML content and return empty string
      // This prevents any potential HTML injection vulnerabilities
      // In production, this should be replaced with a proper HTML parser library
      console.warn('HTML content detected in server-side context - returning empty excerpt for security');
      cleanText = '';
    }
  }
  
  // Clean up the extracted text
  cleanText = cleanText
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (cleanText.length <= maxLength) return cleanText;
  
  // Find the last complete sentence within the limit
  const truncated = cleanText.slice(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return truncated.slice(0, lastSentence + 1);
  }
  
  // If no good sentence break, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

// =============================================================================
// NUMBER FORMATTING UTILITIES
// =============================================================================

/**
 * Formats numbers with commas (e.g., 1,234)
 */
export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Formats large numbers with abbreviations (e.g., 1.2K, 1.5M)
 */
export function formatCompactNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  });
  
  return formatter.format(num);
}

/**
 * Formats currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formats percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
}

// =============================================================================
// URL AND SLUG UTILITIES
// =============================================================================

/**
 * Generates a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Checks if URL is external
 */
export function isExternalUrl(url: string, currentDomain?: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = currentDomain || (typeof window !== 'undefined' ? window.location.hostname : '');
    return urlObj.hostname !== domain;
  } catch (error) {
    return false;
  }
}

// =============================================================================
// ARRAY FORMATTING UTILITIES
// =============================================================================

/**
 * Joins array items with proper grammar (e.g., "A, B, and C")
 */
export function formatList(items: string[], conjunction: string = 'and'): string {
  if (!Array.isArray(items) || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
}

/**
 * Sorts array of strings alphabetically
 */
export function sortAlphabetically(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b));
}

/**
 * Groups array items by a key function
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates color contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation - in production, use a proper library
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const luminance1 = (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255;
  const luminance2 = (0.299 * rgb2.r + 0.587 * rgb2.g + 0.114 * rgb2.b) / 255;
  
  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}