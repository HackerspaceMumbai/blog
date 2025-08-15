# Analytics Setup Guide

This guide explains how to set up and use Google Analytics and Microsoft Clarity tracking on the Hackerspace Mumbai website.

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Google Analytics 4 Measurement ID
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Microsoft Clarity Project ID  
CLARITY_ID=xxxxxxxxxx
```

### Getting Your Tracking IDs

**Google Analytics 4:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property or use existing one
3. Go to Admin > Data Streams > Web
4. Copy the Measurement ID (starts with `G-`)

**Microsoft Clarity:**
1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Create a new project
3. Copy the Project ID from the setup instructions

## Features

### Automatic Tracking
- Page views on all pages
- Scroll depth tracking
- Outbound link clicks
- File downloads
- Site search (if implemented)
- Video engagement (if applicable)

### Privacy-Focused Configuration
- IP anonymization enabled
- No advertising signals
- No ad personalization
- GDPR-compliant consent management ready

### Custom Event Tracking

The website includes pre-built tracking functions for common interactions:

```typescript
import { analytics } from '../utils/analytics';

// Track blog reading
analytics.trackBlogRead('blog-post-slug', 5); // 5 minutes reading time

// Track newsletter signups
analytics.trackNewsletterSignup('homepage-hero');

// Track event RSVPs
analytics.trackEventRSVP('Monthly Meetup Jan 2024', 'meetup.com');

// Track social media clicks
analytics.trackSocialClick('twitter', 'footer');

// Track external links
analytics.trackExternalLink('https://github.com/HackerspaceMumbai', 'GitHub Link');

// Track search
analytics.trackSearch('javascript tutorials', 12);

// Track downloads
analytics.trackDownload('hackmum-presentation', 'pdf');
```

### Manual Event Tracking

For custom events not covered by the pre-built functions:

```typescript
import { trackEvent, trackClarityEvent } from '../utils/analytics';

// Google Analytics custom event
trackEvent({
  action: 'custom_action',
  category: 'engagement',
  label: 'specific_element',
  value: 1
});

// Microsoft Clarity custom event
trackClarityEvent('custom_event', {
  element: 'button_name',
  location: 'header',
  user_type: 'returning'
});
```

## Implementation Examples

### Newsletter Form Tracking

```astro
---
// In your newsletter component
import { analytics } from '../utils/analytics';
---

<form onsubmit="handleSubmit(event)">
  <!-- form fields -->
</form>

<script>
  function handleSubmit(event) {
    // Track the signup attempt
    analytics.trackNewsletterSignup('newsletter-form');
    
    // Continue with form submission
    // ...
  }
</script>
```

### Blog Post Reading Time

```astro
---
// In your blog post layout
const { readingTime, slug } = Astro.props;
---

<script define:vars={{ readingTime, slug }}>
  // Track when user finishes reading (scroll to bottom)
  let hasTrackedRead = false;
  
  window.addEventListener('scroll', () => {
    if (!hasTrackedRead && window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      analytics.trackBlogRead(slug, readingTime);
      hasTrackedRead = true;
    }
  });
</script>
```

### External Link Tracking

```astro
<a 
  href="https://github.com/HackerspaceMumbai" 
  onclick="analytics.trackExternalLink(this.href, this.textContent)"
  target="_blank"
  rel="noopener noreferrer"
>
  Visit our GitHub
</a>
```

## Privacy Compliance

The tracking setup includes:

- **IP Anonymization**: User IPs are anonymized
- **No Advertising**: Ad signals and personalization disabled
- **Consent Ready**: Easy to integrate with consent management
- **Transparency**: Console message informs users about tracking

### GDPR Compliance

To fully comply with GDPR, you may want to add a cookie consent banner:

```typescript
import { initializeAnalytics, disableAnalytics } from '../utils/analytics';

// When user accepts cookies
initializeAnalytics(true);

// When user rejects cookies
disableAnalytics();
```

## Testing

### Development Environment
- Tracking scripts only load in production (`import.meta.env.PROD`)
- Use browser dev tools to test in production builds
- Check console for privacy notice message

### Verification
1. Deploy with tracking IDs configured
2. Visit your site and check:
   - Google Analytics Real-time reports
   - Microsoft Clarity session recordings
   - Browser dev tools Network tab for tracking requests

## Troubleshooting

**Scripts not loading:**
- Verify environment variables are set correctly
- Ensure you're testing in production build (`pnpm build && pnpm preview`)
- Check browser console for errors

**Events not tracking:**
- Verify tracking IDs are correct
- Check that events are fired after page load
- Use browser dev tools to debug JavaScript

**Privacy concerns:**
- All tracking is anonymized and privacy-focused
- No personal data is collected
- Users can opt-out via browser settings or consent management

## Performance Impact

The tracking implementation is optimized for performance:
- Scripts load asynchronously
- Minimal impact on page load times
- Only loads in production environment
- Uses modern tracking methods (GA4, Clarity)

## Support

For questions about analytics setup or custom tracking needs, refer to:
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Microsoft Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- This project's analytics utility functions in `src/utils/analytics.ts`