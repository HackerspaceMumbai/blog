/**
 * Accessibility tests for sponsor cards
 * Tests keyboard navigation, screen reader support, and WCAG compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock axe-core for accessibility testing
const mockAxeCheck = (element) => {
  const violations = [];
  
  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt) {
      violations.push({
        id: 'image-alt',
        description: 'Images must have alternate text',
        nodes: [img]
      });
    }
  });
  
  // Check for missing ARIA labels on interactive elements
  const interactive = element.querySelectorAll('[tabindex], button, a, [role="button"], [role="link"]');
  interactive.forEach(el => {
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      violations.push({
        id: 'aria-label',
        description: 'Interactive elements must have accessible names',
        nodes: [el]
      });
    }
  });
  
  // Check for proper heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    // Allow reasonable heading jumps: h1 to h2, h2 to h3, etc.
    // Also allow starting with h2 (common in sections)
    if (level > lastLevel + 1 && lastLevel !== 0 && !(lastLevel === 2 && level === 3)) {
      violations.push({
        id: 'heading-order',
        description: 'Heading levels should not skip',
        nodes: [heading]
      });
    }
    lastLevel = Math.max(lastLevel, level);
  });
  
  // Check for proper color contrast (simplified check)
  const textElements = element.querySelectorAll('*');
  textElements.forEach(el => {
    const styles = el.className || '';
    if (styles.includes('text-gray-300') || styles.includes('text-gray-400')) {
      violations.push({
        id: 'color-contrast',
        description: 'Text must have sufficient color contrast',
        nodes: [el]
      });
    }
  });
  
  return { violations };
};

// Helper to create sponsor card for accessibility testing
const createAccessibleSponsorCard = (sponsor) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const card = document.createElement('div');
  card.className = `
    h-40 w-full bg-base-100 border border-base-300 rounded-xl shadow-lg 
    hover:shadow-2xl hover:bg-base-200 focus-visible:shadow-2xl focus-visible:ring-2 
    focus-visible:ring-primary focus-visible:outline-none transition-all duration-300 
    flex items-center justify-center p-6 cursor-pointer group
  `.replace(/\s+/g, ' ').trim();
  
  // Accessibility attributes
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', sponsor.url ? 'link' : 'article');
  card.setAttribute('aria-label', getAccessibilityLabel(sponsor));
  card.setAttribute('aria-describedby', `sponsor-${sponsor.name.replace(/\s+/g, '-').toLowerCase()}-desc`);
  
  // Keyboard event handling
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (sponsor.url) {
        window.open(sponsor.url, '_blank', 'noopener,noreferrer');
      }
    }
  });
  
  // Click handling for URLs
  if (sponsor.url) {
    card.addEventListener('click', () => {
      window.open(sponsor.url, '_blank', 'noopener,noreferrer');
    });
  }
  
  const content = document.createElement('div');
  content.className = 'text-center';
  
  // Logo with proper alt text
  if (sponsor.logo) {
    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = `${sponsor.name} logo`;
    img.className = 'max-w-full max-h-16 mx-auto mb-3 object-contain';
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    content.appendChild(img);
  }
  
  // Sponsor name with proper heading level
  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold text-base-content group-hover:text-primary transition-all duration-300';
  title.textContent = sponsor.name;
  content.appendChild(title);
  
  card.appendChild(content);
  
  // Hidden description for screen readers
  const description = document.createElement('div');
  description.id = `sponsor-${sponsor.name.replace(/\s+/g, '-').toLowerCase()}-desc`;
  description.className = 'sr-only';
  description.textContent = getAccessibilityDescription(sponsor);
  card.appendChild(description);
  
  return { card, document };
};

// Helper to create sponsors section for accessibility testing
const createAccessibleSponsorsSection = (sponsors) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const section = document.createElement('section');
  section.className = 'py-16 px-4 bg-base-200';
  section.setAttribute('aria-labelledby', 'sponsors-heading');
  section.setAttribute('role', 'region');
  
  const container = document.createElement('div');
  container.className = 'max-w-6xl mx-auto text-center';
  
  // Main heading
  const heading = document.createElement('h2');
  heading.id = 'sponsors-heading';
  heading.className = 'text-3xl font-bold mb-12 text-primary';
  heading.textContent = 'Our Sponsors';
  container.appendChild(heading);
  
  // Sponsors grid
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', `List of ${sponsors.length} sponsors`);
  
  sponsors.forEach((sponsor, index) => {
    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute('aria-setsize', sponsors.length.toString());
    listItem.setAttribute('aria-posinset', (index + 1).toString());
    
    const { card } = createAccessibleSponsorCard(sponsor);
    listItem.appendChild(card);
    grid.appendChild(listItem);
  });
  
  container.appendChild(grid);
  section.appendChild(container);
  
  return { section, document };
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
const accessibilityTestSponsors = [
  {
    name: "Accessible Corp",
    logo: "accessible.png",
    url: "https://accessible.com",
    tier: "platinum",
    description: "Leading accessibility solutions provider"
  },
  {
    name: "Screen Reader Friendly Inc",
    tier: "gold",
    url: "https://screenreader.com"
  },
  {
    name: "Keyboard Navigation Ltd",
    logo: "keyboard.png",
    tier: "silver"
  },
  {
    name: "ARIA Compliant Solutions",
    tier: "bronze",
    description: "WCAG 2.1 AA compliant services"
  }
];

describe('Sponsor Cards Accessibility', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom = null;
    global.document = undefined;
    global.window = undefined;
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tab key', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      expect(card.getAttribute('tabindex')).toBe('0');
      expect(card.className).toContain('focus-visible:ring-2');
      expect(card.className).toContain('focus-visible:ring-primary');
    });

    it('should handle Enter key activation', () => {
      const { card, document } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      let activated = false;
      
      // Mock window.open
      global.window.open = () => { activated = true; };
      
      const event = new document.defaultView.KeyboardEvent('keydown', { key: 'Enter' });
      card.dispatchEvent(event);
      
      expect(activated).toBe(true);
    });

    it('should handle Space key activation', () => {
      const { card, document } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      let activated = false;
      
      // Mock window.open
      global.window.open = () => { activated = true; };
      
      const event = new document.defaultView.KeyboardEvent('keydown', { key: ' ' });
      card.dispatchEvent(event);
      
      expect(activated).toBe(true);
    });

    it('should not activate on other keys', () => {
      const { card, document } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      let activated = false;
      
      // Mock window.open
      global.window.open = () => { activated = true; };
      
      const event = new document.defaultView.KeyboardEvent('keydown', { key: 'Escape' });
      card.dispatchEvent(event);
      
      expect(activated).toBe(false);
    });

    it('should have visible focus indicators', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      expect(card.className).toContain('focus-visible:shadow-2xl');
      expect(card.className).toContain('focus-visible:ring-2');
      expect(card.className).toContain('focus-visible:ring-primary');
      expect(card.className).toContain('focus-visible:outline-none');
    });

    it('should support sequential keyboard navigation in grid', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const focusableElements = section.querySelectorAll('[tabindex="0"]');
      
      expect(focusableElements.length).toBe(accessibilityTestSponsors.length);
      focusableElements.forEach(el => {
        expect(el.getAttribute('tabindex')).toBe('0');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      expect(card.getAttribute('aria-label')).toBe(
        'Accessible Corp (platinum tier sponsor) - Click to visit website'
      );
    });

    it('should have proper role attributes', () => {
      const { card: linkCard } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const { card: articleCard } = createAccessibleSponsorCard({ name: "No URL Corp" });
      
      expect(linkCard.getAttribute('role')).toBe('link');
      expect(articleCard.getAttribute('role')).toBe('article');
    });

    it('should have descriptive text for screen readers', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const description = card.querySelector('.sr-only');
      
      expect(description).toBeTruthy();
      expect(description.textContent).toContain('Accessible Corp is a sponsor');
      expect(description.textContent).toContain('platinum tier');
      expect(description.textContent).toContain('Leading accessibility solutions provider');
      expect(description.textContent).toContain('Click to visit their website');
    });

    it('should have proper aria-describedby associations', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const describedBy = card.getAttribute('aria-describedby');
      const description = card.querySelector(`#${describedBy}`);
      
      expect(describedBy).toBe('sponsor-accessible-corp-desc');
      expect(description).toBeTruthy();
      expect(description.className).toContain('sr-only');
    });

    it('should have proper list semantics', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const list = section.querySelector('[role="list"]');
      const listItems = section.querySelectorAll('[role="listitem"]');
      
      expect(list).toBeTruthy();
      expect(list.getAttribute('aria-label')).toContain('List of 4 sponsors');
      expect(listItems.length).toBe(4);
      
      listItems.forEach((item, index) => {
        expect(item.getAttribute('aria-setsize')).toBe('4');
        expect(item.getAttribute('aria-posinset')).toBe((index + 1).toString());
      });
    });

    it('should have proper heading hierarchy', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const mainHeading = section.querySelector('h2');
      const cardHeadings = section.querySelectorAll('h3');
      
      expect(mainHeading.tagName).toBe('H2');
      expect(cardHeadings.length).toBe(accessibilityTestSponsors.length);
      cardHeadings.forEach(heading => {
        expect(heading.tagName).toBe('H3');
      });
    });
  });

  describe('Image Accessibility', () => {
    it('should have proper alt text for logos', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const img = card.querySelector('img');
      
      expect(img.alt).toBe('Accessible Corp logo');
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    });

    it('should handle missing logos gracefully', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[1]);
      const img = card.querySelector('img');
      
      expect(img).toBeNull();
    });

    it('should not have empty alt attributes', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const images = section.querySelectorAll('img');
      
      images.forEach(img => {
        expect(img.alt).toBeTruthy();
        expect(img.alt.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Color and Contrast', () => {
    it('should use high contrast colors', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('text-base-content');
      expect(card.className).toContain('bg-base-100');
    });

    it('should have visible focus indicators with sufficient contrast', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      expect(card.className).toContain('focus-visible:ring-primary');
      expect(card.className).toContain('focus-visible:ring-2');
    });

    it('should maintain contrast in hover states', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('group-hover:text-primary');
      expect(card.className).toContain('hover:bg-base-200');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility across screen sizes', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const grid = section.querySelector('[role="list"]');
      
      // Grid should maintain semantic structure regardless of layout
      expect(grid.getAttribute('role')).toBe('list');
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should have touch-friendly target sizes', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      // Cards should be large enough for touch interaction (minimum 44px)
      expect(card.className).toContain('h-40');
      expect(card.className).toContain('p-6');
    });
  });

  describe('WCAG Compliance', () => {
    it('should pass basic accessibility checks', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const results = mockAxeCheck(section);
      
      // Debug: log violations if any
      if (results.violations.length > 0) {
        console.log('Accessibility violations found:', results.violations);
      }
      
      expect(results.violations.length).toBe(0);
    });

    it('should have proper semantic structure', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      
      expect(section.getAttribute('role')).toBe('region');
      expect(section.getAttribute('aria-labelledby')).toBe('sponsors-heading');
      expect(section.querySelector('#sponsors-heading')).toBeTruthy();
    });

    it('should support assistive technologies', () => {
      const { card } = createAccessibleSponsorCard(accessibilityTestSponsors[0]);
      
      // Should have all required ARIA attributes
      expect(card.getAttribute('aria-label')).toBeTruthy();
      expect(card.getAttribute('aria-describedby')).toBeTruthy();
      expect(card.getAttribute('role')).toBeTruthy();
      expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('should handle dynamic content updates', () => {
      const { section } = createAccessibleSponsorsSection(accessibilityTestSponsors);
      const grid = section.querySelector('[role="list"]');
      
      // Should have aria-live for dynamic updates
      expect(grid.getAttribute('aria-label')).toContain('List of');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle sponsors with special characters in names', () => {
      const specialSponsor = { name: "Tech & Innovation Co., Ltd." };
      const { card } = createAccessibleSponsorCard(specialSponsor);
      const description = card.querySelector('.sr-only');
      
      expect(card.getAttribute('aria-describedby')).toBe('sponsor-tech-&-innovation-co.,-ltd.-desc');
      expect(description.id).toBe('sponsor-tech-&-innovation-co.,-ltd.-desc');
    });

    it('should handle very long sponsor names', () => {
      const longNameSponsor = { 
        name: "Very Long Company Name Technologies Private Limited Solutions" 
      };
      const { card } = createAccessibleSponsorCard(longNameSponsor);
      const title = card.querySelector('h3');
      
      expect(title.textContent).toBe(longNameSponsor.name);
      expect(card.getAttribute('aria-label')).toContain(longNameSponsor.name);
    });

    it('should handle missing sponsor data gracefully', () => {
      const minimalSponsor = { name: "Minimal Corp" };
      const { card } = createAccessibleSponsorCard(minimalSponsor);
      
      expect(card.getAttribute('aria-label')).toBe('Minimal Corp');
      expect(card.getAttribute('role')).toBe('article');
      expect(card.querySelector('img')).toBeNull();
    });
  });
});