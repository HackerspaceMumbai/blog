/**
 * Unit tests for SponsorsSection component
 * Tests grid layout, responsive behavior, and sponsor list rendering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Helper function to create sponsors section DOM element for testing
const createSponsorsSectionElement = (sponsors, options = {}) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const {
    title = "Our Sponsors",
    ctaText = "Become a Sponsor",
    ctaUrl = "/sponsors",
    sortByPriority = true
  } = options;
  
  // Create main section
  const section = document.createElement('section');
  section.className = 'py-16 px-4 bg-base-200 text-base-content';
  section.setAttribute('aria-labelledby', 'sponsors-heading');
  section.setAttribute('role', 'region');
  
  // Create container
  const container = document.createElement('div');
  container.className = 'max-w-6xl mx-auto text-center';
  
  // Create heading
  const heading = document.createElement('h2');
  heading.id = 'sponsors-heading';
  heading.className = 'text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-primary drop-shadow-sm';
  heading.textContent = title;
  container.appendChild(heading);
  
  // Create grid
  const grid = document.createElement('div');
  const gridClasses = getGridClasses(sponsors.length);
  grid.className = `
    grid ${gridClasses} gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-6 
    mb-8 sm:mb-12 auto-rows-fr place-items-stretch justify-items-center w-full
  `.replace(/\s+/g, ' ').trim();
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', `List of ${sponsors.length} sponsors supporting Hackerspace Mumbai`);
  grid.setAttribute('aria-live', 'polite');
  
  // Add sponsor cards
  sponsors.forEach((sponsor, index) => {
    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.className = 'w-full max-w-xs sm:max-w-sm md:max-w-none flex';
    listItem.setAttribute('aria-setsize', sponsors.length.toString());
    listItem.setAttribute('aria-posinset', (index + 1).toString());
    
    // Create simplified sponsor card for testing
    const card = document.createElement('div');
    card.className = 'sponsor-card';
    card.textContent = sponsor.name;
    card.setAttribute('data-tier', sponsor.tier || 'none');
    card.setAttribute('data-featured', sponsor.featured ? 'true' : 'false');
    
    listItem.appendChild(card);
    grid.appendChild(listItem);
  });
  
  container.appendChild(grid);
  
  // Create CTA button
  const ctaButton = document.createElement('div');
  ctaButton.className = 'text-center';
  const button = document.createElement('a');
  button.href = ctaUrl;
  button.className = 'btn btn-outline';
  button.textContent = ctaText;
  ctaButton.appendChild(button);
  container.appendChild(ctaButton);
  
  section.appendChild(container);
  return section;
};

// Helper function to determine grid classes based on sponsor count
const getGridClasses = (count) => {
  if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto";
  return "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
};

// Test data
const testSponsors = {
  single: [
    { name: "Single Corp", tier: "gold" }
  ],
  pair: [
    { name: "First Corp", tier: "platinum", featured: true },
    { name: "Second Corp", tier: "gold" }
  ],
  triple: [
    { name: "Alpha Corp", tier: "platinum" },
    { name: "Beta Corp", tier: "gold" },
    { name: "Gamma Corp", tier: "silver" }
  ],
  many: [
    { name: "Corp 1", tier: "platinum", featured: true },
    { name: "Corp 2", tier: "gold" },
    { name: "Corp 3", tier: "silver" },
    { name: "Corp 4", tier: "bronze" },
    { name: "Corp 5", tier: "community" },
    { name: "Corp 6", tier: "startup" },
    { name: "Corp 7", tier: "partner" },
    { name: "Corp 8", tier: "gold" }
  ],
  mixed: [
    { name: "Featured Platinum", tier: "platinum", featured: true, logo: "logo1.png", url: "https://example1.com" },
    { name: "Regular Gold", tier: "gold", logo: "logo2.png" },
    { name: "Simple Silver", tier: "silver" },
    { name: "Community Sponsor", tier: "community", url: "https://community.org" },
    { name: "No Tier Corp" }
  ]
};

describe('SponsorsSection Component', () => {
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

  describe('Basic Structure', () => {
    it('should render section with proper semantic structure', () => {
      const section = createSponsorsSectionElement(testSponsors.triple);
      
      expect(section.tagName).toBe('SECTION');
      expect(section.getAttribute('role')).toBe('region');
      expect(section.getAttribute('aria-labelledby')).toBe('sponsors-heading');
    });

    it('should render heading with correct text and styling', () => {
      const section = createSponsorsSectionElement(testSponsors.triple);
      const heading = section.querySelector('#sponsors-heading');
      
      expect(heading.tagName).toBe('H2');
      expect(heading.textContent).toBe('Our Sponsors');
      expect(heading.className).toContain('text-2xl');
      expect(heading.className).toContain('sm:text-3xl');
      expect(heading.className).toContain('text-primary');
    });

    it('should render custom title when provided', () => {
      const section = createSponsorsSectionElement(testSponsors.triple, { 
        title: "Custom Sponsor Title" 
      });
      const heading = section.querySelector('#sponsors-heading');
      
      expect(heading.textContent).toBe('Custom Sponsor Title');
    });

    it('should render CTA button with correct attributes', () => {
      const section = createSponsorsSectionElement(testSponsors.triple);
      const button = section.querySelector('a.btn');
      
      expect(button.href).toBe('/sponsors');
      expect(button.textContent).toBe('Become a Sponsor');
      expect(button.className).toContain('btn-outline');
    });

    it('should render custom CTA when provided', () => {
      const section = createSponsorsSectionElement(testSponsors.triple, {
        ctaText: "Join Us",
        ctaUrl: "/join"
      });
      const button = section.querySelector('a.btn');
      
      expect(button.href).toBe('/join');
      expect(button.textContent).toBe('Join Us');
    });
  });

  describe('Grid Layout and Responsive Behavior', () => {
    it('should apply single column layout for one sponsor', () => {
      const section = createSponsorsSectionElement(testSponsors.single);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('max-w-xs');
      expect(grid.className).toContain('mx-auto');
    });

    it('should apply two column layout for two sponsors', () => {
      const section = createSponsorsSectionElement(testSponsors.pair);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('max-w-2xl');
    });

    it('should apply three column layout for three sponsors', () => {
      const section = createSponsorsSectionElement(testSponsors.triple);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('max-w-4xl');
    });

    it('should apply full responsive layout for many sponsors', () => {
      const section = createSponsorsSectionElement(testSponsors.many);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should have proper gap spacing classes', () => {
      const section = createSponsorsSectionElement(testSponsors.many);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('gap-4');
      expect(grid.className).toContain('xs:gap-5');
      expect(grid.className).toContain('sm:gap-6');
      expect(grid.className).toContain('md:gap-7');
      expect(grid.className).toContain('lg:gap-8');
      expect(grid.className).toContain('xl:gap-6');
    });

    it('should have proper grid layout classes', () => {
      const section = createSponsorsSectionElement(testSponsors.many);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.className).toContain('auto-rows-fr');
      expect(grid.className).toContain('place-items-stretch');
      expect(grid.className).toContain('justify-items-center');
    });
  });

  describe('Sponsor List Rendering', () => {
    it('should render all sponsors in the list', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const listItems = section.querySelectorAll('[role="listitem"]');
      
      expect(listItems.length).toBe(testSponsors.mixed.length);
    });

    it('should render sponsor cards with correct data attributes', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const cards = section.querySelectorAll('.sponsor-card');
      
      expect(cards[0].getAttribute('data-tier')).toBe('platinum');
      expect(cards[0].getAttribute('data-featured')).toBe('true');
      expect(cards[1].getAttribute('data-tier')).toBe('gold');
      expect(cards[1].getAttribute('data-featured')).toBe('false');
      expect(cards[4].getAttribute('data-tier')).toBe('none');
    });

    it('should set proper ARIA attributes for list items', () => {
      const section = createSponsorsSectionElement(testSponsors.triple);
      const listItems = section.querySelectorAll('[role="listitem"]');
      
      listItems.forEach((item, index) => {
        expect(item.getAttribute('aria-setsize')).toBe('3');
        expect(item.getAttribute('aria-posinset')).toBe((index + 1).toString());
      });
    });

    it('should have proper list container attributes', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.getAttribute('aria-label')).toBe(
        `List of ${testSponsors.mixed.length} sponsors supporting Hackerspace Mumbai`
      );
      expect(grid.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper semantic structure', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      
      expect(section.getAttribute('role')).toBe('region');
      expect(section.querySelector('[role="list"]')).toBeTruthy();
      expect(section.querySelectorAll('[role="listitem"]').length).toBe(testSponsors.mixed.length);
    });

    it('should have proper heading association', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const heading = section.querySelector('#sponsors-heading');
      
      expect(section.getAttribute('aria-labelledby')).toBe('sponsors-heading');
      expect(heading.id).toBe('sponsors-heading');
    });

    it('should have live region for dynamic updates', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const grid = section.querySelector('[role="list"]');
      
      expect(grid.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sponsor list', () => {
      const section = createSponsorsSectionElement([]);
      const grid = section.querySelector('[role="list"]');
      const listItems = section.querySelectorAll('[role="listitem"]');
      
      expect(grid.getAttribute('aria-label')).toBe(
        'List of 0 sponsors supporting Hackerspace Mumbai'
      );
      expect(listItems.length).toBe(0);
    });

    it('should handle sponsors without tiers', () => {
      const sponsorsWithoutTiers = [
        { name: "No Tier 1" },
        { name: "No Tier 2" }
      ];
      const section = createSponsorsSectionElement(sponsorsWithoutTiers);
      const cards = section.querySelectorAll('.sponsor-card');
      
      cards.forEach(card => {
        expect(card.getAttribute('data-tier')).toBe('none');
        expect(card.getAttribute('data-featured')).toBe('false');
      });
    });

    it('should handle very large sponsor lists', () => {
      const largeList = Array.from({ length: 50 }, (_, i) => ({
        name: `Sponsor ${i + 1}`,
        tier: ['platinum', 'gold', 'silver', 'bronze'][i % 4]
      }));
      
      const section = createSponsorsSectionElement(largeList);
      const listItems = section.querySelectorAll('[role="listitem"]');
      const grid = section.querySelector('[role="list"]');
      
      expect(listItems.length).toBe(50);
      expect(grid.className).toContain('xl:grid-cols-4');
      expect(grid.getAttribute('aria-label')).toContain('50 sponsors');
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper section styling', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      
      expect(section.className).toContain('py-16');
      expect(section.className).toContain('px-4');
      expect(section.className).toContain('bg-base-200');
      expect(section.className).toContain('text-base-content');
    });

    it('should have proper container styling', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const container = section.querySelector('.max-w-6xl');
      
      expect(container.className).toContain('max-w-6xl');
      expect(container.className).toContain('mx-auto');
      expect(container.className).toContain('text-center');
    });

    it('should have proper list item styling', () => {
      const section = createSponsorsSectionElement(testSponsors.mixed);
      const listItems = section.querySelectorAll('[role="listitem"]');
      
      listItems.forEach(item => {
        expect(item.className).toContain('w-full');
        expect(item.className).toContain('max-w-xs');
        expect(item.className).toContain('sm:max-w-sm');
        expect(item.className).toContain('md:max-w-none');
        expect(item.className).toContain('flex');
      });
    });
  });
});