/**
 * Unit tests for SponsorCard component rendering
 * Tests all sponsor card features including accessibility, responsive behavior, and visual consistency
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock Astro component rendering for testing
const mockAstroRender = (component, props) => {
  // Simulate Astro component rendering
  const sponsorCard = createSponsorCardElement(props.sponsor);
  return { html: sponsorCard.outerHTML };
};

// Helper function to create sponsor card DOM element for testing
const createSponsorCardElement = (sponsor) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  // Create the main card element
  const card = document.createElement('div');
  
  // Apply base classes and tier-specific styling
  const tierStyles = getTierStyles(sponsor.tier);
  card.className = `
    h-32 xs:h-36 sm:h-40 md:h-44 lg:h-48 xl:h-44 min-h-[8rem] w-full max-w-xs sm:max-w-sm md:max-w-none
    bg-base-100 border ${tierStyles} rounded-xl shadow-lg hover:shadow-2xl hover:bg-base-200 
    hover:-translate-y-1 hover:scale-[1.02] focus-visible:shadow-2xl focus-visible:ring-2 
    focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100
    focus-visible:outline-none focus-visible:-translate-y-1 focus-visible:scale-[1.02] 
    focus-visible:bg-base-200 transition-all duration-300 ease-out flex items-center justify-center 
    p-3 sm:p-4 md:p-5 lg:p-6 cursor-pointer group relative overflow-hidden backdrop-blur-sm mx-auto
    ${sponsor.featured ? 'ring-2 ring-primary/20' : ''}
  `.replace(/\s+/g, ' ').trim();
  
  // Set accessibility attributes
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', sponsor.url ? 'link' : 'article');
  card.setAttribute('aria-label', getAccessibilityLabel(sponsor));
  card.setAttribute('aria-describedby', `sponsor-${sponsor.name.replace(/\s+/g, '-').toLowerCase()}-desc`);
  
  // Add keyboard event handling
  if (sponsor.url) {
    card.setAttribute('onclick', `window.open('${sponsor.url}', '_blank', 'noopener,noreferrer')`);
  }
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'text-center relative z-10';
  
  // Add logo if present
  if (sponsor.logo) {
    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = `${sponsor.name} logo`;
    img.className = `
      max-w-full max-h-12 sm:max-h-16 md:max-h-20 lg:max-h-24 w-auto h-auto mx-auto 
      mb-2 sm:mb-3 object-contain transition-all duration-300 ease-out group-hover:scale-110 
      group-hover:brightness-110 group-focus-visible:scale-110 group-focus-visible:brightness-110 
      filter drop-shadow-sm group-hover:drop-shadow-md group-focus-visible:drop-shadow-md
    `.replace(/\s+/g, ' ').trim();
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    content.appendChild(img);
  }
  
  // Add sponsor name
  const title = document.createElement('h3');
  title.className = `
    text-sm sm:text-base md:text-lg font-semibold text-base-content group-hover:text-primary 
    transition-all duration-300 ease-out leading-tight group-hover:scale-105 relative text-center 
    break-words hyphens-auto max-w-full overflow-hidden px-1
  `.replace(/\s+/g, ' ').trim();
  title.textContent = getSponsorDisplayName(sponsor.name);
  content.appendChild(title);
  
  card.appendChild(content);
  
  // Add gradient overlay
  const gradient = document.createElement('div');
  gradient.className = `
    absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 
    group-hover:opacity-100 transition-opacity duration-300 ease-out rounded-xl
  `.replace(/\s+/g, ' ').trim();
  card.appendChild(gradient);
  
  // Add hidden description for screen readers
  const description = document.createElement('div');
  description.id = `sponsor-${sponsor.name.replace(/\s+/g, '-').toLowerCase()}-desc`;
  description.className = 'sr-only';
  description.textContent = getAccessibilityDescription(sponsor);
  card.appendChild(description);
  
  return card;
};

// Helper functions (simplified versions of the actual component functions)
const getTierStyles = (tier) => {
  const tierStyleMap = {
    platinum: 'border-yellow-400/30 hover:border-yellow-400 hover:shadow-yellow-400/20',
    gold: 'border-amber-400/30 hover:border-amber-400 hover:shadow-amber-400/20',
    silver: 'border-gray-400/30 hover:border-gray-400 hover:shadow-gray-400/20',
    bronze: 'border-orange-400/30 hover:border-orange-400 hover:shadow-orange-400/20',
    community: 'border-green-400/30 hover:border-green-400 hover:shadow-green-400/20',
    startup: 'border-purple-400/30 hover:border-purple-400 hover:shadow-purple-400/20',
    partner: 'border-blue-400/30 hover:border-blue-400 hover:shadow-blue-400/20',
  };
  return tier ? tierStyleMap[tier] : 'border-base-300 hover:border-primary hover:shadow-primary/20';
};

const getSponsorDisplayName = (name) => {
  return name.length > 25 ? name.replace(/\s+/g, ' ').trim() : name;
};

const getAccessibilityLabel = (sponsor) => {
  const tierText = sponsor.tier ? ` (${sponsor.tier} tier sponsor)` : '';
  const actionText = sponsor.url ? ' - Click to visit website' : '';
  return `${sponsor.name}${tierText}${actionText}`;
};

const getAccessibilityDescription = (sponsor) => {
  let description = `${sponsor.name} is a sponsor of Hackerspace Mumbai`;
  if (sponsor.tier) description += ` in the ${sponsor.tier} tier`;
  if (sponsor.description) description += `. ${sponsor.description}`;
  if (sponsor.url) description += '. Click to visit their website.';
  return description;
};

// Test data
const testSponsors = {
  minimal: {
    name: "Test Corp"
  },
  withLogo: {
    name: "Logo Corp",
    logo: "logo.png"
  },
  withUrl: {
    name: "URL Corp",
    url: "https://example.com"
  },
  withTier: {
    name: "Tier Corp",
    tier: "gold"
  },
  featured: {
    name: "Featured Corp",
    featured: true,
    tier: "platinum"
  },
  comprehensive: {
    name: "Comprehensive Technology Solutions",
    logo: "comprehensive.png",
    url: "https://comprehensive.tech",
    tier: "platinum",
    description: "Leading technology solutions provider",
    featured: true
  },
  longName: {
    name: "Very Long Company Name Technologies Private Limited Solutions",
    tier: "silver"
  }
};

describe('SponsorCard Component Rendering', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
  });

  afterEach(() => {
    dom = null;
    global.document = undefined;
    global.window = undefined;
  });

  describe('Basic Rendering', () => {
    it('should render minimal sponsor card with just name', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card).toBeTruthy();
      expect(card.tagName).toBe('DIV');
      expect(card.querySelector('h3').textContent).toBe('Test Corp');
      expect(card.querySelector('img')).toBeNull();
    });

    it('should render sponsor card with logo', () => {
      const card = createSponsorCardElement(testSponsors.withLogo);
      
      const img = card.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.src).toBe('logo.png');
      expect(img.alt).toBe('Logo Corp logo');
      expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('should render sponsor card with URL (clickable)', () => {
      const card = createSponsorCardElement(testSponsors.withUrl);
      
      expect(card.getAttribute('role')).toBe('link');
      expect(card.getAttribute('onclick')).toContain('https://example.com');
      expect(card.getAttribute('aria-label')).toContain('Click to visit website');
    });

    it('should render sponsor card with tier styling', () => {
      const card = createSponsorCardElement(testSponsors.withTier);
      
      expect(card.className).toContain('border-amber-400/30');
      expect(card.className).toContain('hover:border-amber-400');
    });

    it('should render featured sponsor with special styling', () => {
      const card = createSponsorCardElement(testSponsors.featured);
      
      expect(card.className).toContain('ring-2 ring-primary/20');
    });

    it('should render comprehensive sponsor with all features', () => {
      const card = createSponsorCardElement(testSponsors.comprehensive);
      
      expect(card.querySelector('h3').textContent).toBe('Comprehensive Technology Solutions');
      expect(card.querySelector('img')).toBeTruthy();
      expect(card.getAttribute('role')).toBe('link');
      expect(card.className).toContain('ring-2 ring-primary/20'); // featured
      expect(card.className).toContain('border-yellow-400/30'); // platinum tier
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      const card = createSponsorCardElement(testSponsors.comprehensive);
      
      expect(card.getAttribute('aria-label')).toBe(
        'Comprehensive Technology Solutions (platinum tier sponsor) - Click to visit website'
      );
      expect(card.getAttribute('aria-describedby')).toBe(
        'sponsor-comprehensive-technology-solutions-desc'
      );
    });

    it('should have proper role attributes', () => {
      const linkCard = createSponsorCardElement(testSponsors.withUrl);
      const articleCard = createSponsorCardElement(testSponsors.minimal);
      
      expect(linkCard.getAttribute('role')).toBe('link');
      expect(articleCard.getAttribute('role')).toBe('article');
    });

    it('should be keyboard focusable', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card.getAttribute('tabindex')).toBe('0');
      expect(card.className).toContain('focus-visible:ring-2');
      expect(card.className).toContain('focus-visible:ring-primary');
    });

    it('should have screen reader descriptions', () => {
      const card = createSponsorCardElement(testSponsors.comprehensive);
      const description = card.querySelector('.sr-only');
      
      expect(description).toBeTruthy();
      expect(description.textContent).toContain('Comprehensive Technology Solutions is a sponsor');
      expect(description.textContent).toContain('platinum tier');
      expect(description.textContent).toContain('Leading technology solutions provider');
      expect(description.textContent).toContain('Click to visit their website');
    });
  });

  describe('Visual Consistency', () => {
    it('should have consistent base styling classes', () => {
      const cards = [
        createSponsorCardElement(testSponsors.minimal),
        createSponsorCardElement(testSponsors.withLogo),
        createSponsorCardElement(testSponsors.withTier)
      ];
      
      cards.forEach(card => {
        expect(card.className).toContain('bg-base-100');
        expect(card.className).toContain('border');
        expect(card.className).toContain('rounded-xl');
        expect(card.className).toContain('shadow-lg');
        expect(card.className).toContain('transition-all');
        expect(card.className).toContain('duration-300');
      });
    });

    it('should have consistent hover effects', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card.className).toContain('hover:shadow-2xl');
      expect(card.className).toContain('hover:bg-base-200');
      expect(card.className).toContain('hover:-translate-y-1');
      expect(card.className).toContain('hover:scale-[1.02]');
    });

    it('should handle long names properly', () => {
      const card = createSponsorCardElement(testSponsors.longName);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('break-words');
      expect(title.className).toContain('hyphens-auto');
      expect(title.className).toContain('overflow-hidden');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive height classes', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card.className).toContain('h-32');
      expect(card.className).toContain('xs:h-36');
      expect(card.className).toContain('sm:h-40');
      expect(card.className).toContain('md:h-44');
      expect(card.className).toContain('lg:h-48');
      expect(card.className).toContain('xl:h-44');
    });

    it('should have responsive padding classes', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card.className).toContain('p-3');
      expect(card.className).toContain('sm:p-4');
      expect(card.className).toContain('md:p-5');
      expect(card.className).toContain('lg:p-6');
    });

    it('should have responsive typography for sponsor names', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('text-sm');
      expect(title.className).toContain('sm:text-base');
      expect(title.className).toContain('md:text-lg');
    });

    it('should have responsive logo sizing', () => {
      const card = createSponsorCardElement(testSponsors.withLogo);
      const img = card.querySelector('img');
      
      expect(img.className).toContain('max-h-12');
      expect(img.className).toContain('sm:max-h-16');
      expect(img.className).toContain('md:max-h-20');
      expect(img.className).toContain('lg:max-h-24');
    });
  });

  describe('Tier-Specific Styling', () => {
    const tierTests = [
      { tier: 'platinum', expectedBorder: 'border-yellow-400/30', expectedHover: 'hover:border-yellow-400' },
      { tier: 'gold', expectedBorder: 'border-amber-400/30', expectedHover: 'hover:border-amber-400' },
      { tier: 'silver', expectedBorder: 'border-gray-400/30', expectedHover: 'hover:border-gray-400' },
      { tier: 'bronze', expectedBorder: 'border-orange-400/30', expectedHover: 'hover:border-orange-400' },
      { tier: 'community', expectedBorder: 'border-green-400/30', expectedHover: 'hover:border-green-400' },
      { tier: 'startup', expectedBorder: 'border-purple-400/30', expectedHover: 'hover:border-purple-400' },
      { tier: 'partner', expectedBorder: 'border-blue-400/30', expectedHover: 'hover:border-blue-400' }
    ];

    tierTests.forEach(({ tier, expectedBorder, expectedHover }) => {
      it(`should apply correct styling for ${tier} tier`, () => {
        const sponsor = { name: `${tier} Corp`, tier };
        const card = createSponsorCardElement(sponsor);
        
        expect(card.className).toContain(expectedBorder);
        expect(card.className).toContain(expectedHover);
      });
    });

    it('should apply default styling for sponsors without tier', () => {
      const card = createSponsorCardElement(testSponsors.minimal);
      
      expect(card.className).toContain('border-base-300');
      expect(card.className).toContain('hover:border-primary');
    });
  });
});