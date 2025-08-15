/**
 * Analytics utilities for tracking custom events
 * Supports both Google Analytics and Microsoft Clarity
 */

// Type definitions for better TypeScript support
interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

interface ClarityCustomEvent {
  [key: string]: string | number | boolean;
}

/**
 * Track a custom event in Google Analytics
 * @param event - The event object with action, category, label, and value
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const { action, category = 'engagement', label, value } = event;
    
    // @ts-ignore - gtag is loaded dynamically
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track a custom event in Microsoft Clarity
 * @param eventName - Name of the custom event
 * @param data - Additional data to track with the event
 */
export function trackClarityEvent(eventName: string, data?: ClarityCustomEvent): void {
  if (typeof window !== 'undefined' && 'clarity' in window) {
    // @ts-ignore - clarity is loaded dynamically
    window.clarity('event', eventName, data);
  }
}

/**
 * Track page views manually (useful for SPA navigation)
 * @param path - The page path to track
 * @param title - Optional page title
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - gtag is loaded dynamically
    window.gtag('config', import.meta.env.GOOGLE_ANALYTICS_ID, {
      page_path: path,
      page_title: title,
    });
  }
}

/**
 * Common event tracking functions for the Hackerspace Mumbai website
 */
export const analytics = {
  // Blog interactions
  trackBlogRead: (slug: string, readingTime: number) => {
    trackEvent({
      action: 'blog_read',
      category: 'content',
      label: slug,
      value: readingTime,
    });
    trackClarityEvent('blog_read', { slug, readingTime });
  },

  // Newsletter subscription
  trackNewsletterSignup: (source: string) => {
    trackEvent({
      action: 'newsletter_signup',
      category: 'conversion',
      label: source,
    });
    trackClarityEvent('newsletter_signup', { source });
  },

  // Event interactions
  trackEventRSVP: (eventName: string, platform: string) => {
    trackEvent({
      action: 'event_rsvp',
      category: 'engagement',
      label: `${eventName}_${platform}`,
    });
    trackClarityEvent('event_rsvp', { eventName, platform });
  },

  // Social media clicks
  trackSocialClick: (platform: string, location: string) => {
    trackEvent({
      action: 'social_click',
      category: 'engagement',
      label: `${platform}_${location}`,
    });
    trackClarityEvent('social_click', { platform, location });
  },

  // External link clicks
  trackExternalLink: (url: string, linkText: string) => {
    trackEvent({
      action: 'external_link',
      category: 'engagement',
      label: url,
    });
    trackClarityEvent('external_link', { url, linkText });
  },

  // Search interactions
  trackSearch: (query: string, resultsCount: number) => {
    trackEvent({
      action: 'search',
      category: 'engagement',
      label: query,
      value: resultsCount,
    });
    trackClarityEvent('search', { query, resultsCount });
  },

  // Download tracking
  trackDownload: (fileName: string, fileType: string) => {
    trackEvent({
      action: 'download',
      category: 'engagement',
      label: `${fileName}.${fileType}`,
    });
    trackClarityEvent('download', { fileName, fileType });
  },
};

/**
 * Initialize analytics with user consent (GDPR compliance)
 * @param hasConsent - Whether user has given consent for analytics
 */
export function initializeAnalytics(hasConsent: boolean = true): void {
  if (typeof window !== 'undefined' && 'gtag' in window && hasConsent) {
    // @ts-ignore - gtag is loaded dynamically
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

/**
 * Disable analytics tracking (for privacy compliance)
 */
export function disableAnalytics(): void {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - gtag is loaded dynamically
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
}