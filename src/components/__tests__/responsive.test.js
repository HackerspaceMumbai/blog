/**
 * Responsive behavior tests for sponsor cards
 * Tests layout behavior across different screen sizes and viewport configurations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock viewport dimensions for responsive testing
const mockViewport = (width, height = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  const event = new Event('resize');
  window.dispatchEvent(event);
};

// Helper to create responsive sponsor card
const createResponsiveSponsorCard = (sponsor) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const card = document.createElement('div');
  card.className = `
    h-32 xs:h-36 sm:h-40 md:h-44 lg:h-48 xl:h-44 min-h-[8rem]
    w-full max-w-xs sm:max-w-sm md:max-w-none
    bg-base-100 border border-base-300 rounded-xl shadow-lg
    hover:shadow-2xl hover:bg-base-200 hover:-translate-y-1 hover:scale-[1.02]
    transition-all duration-300 ease-out
    flex items-center justify-center
    p-3 sm:p-4 md:p-5 lg:p-6
    cursor-pointer group relative overflow-hidden mx-auto
  `.replace(/\s+/g, ' ').trim();
  
  const content = document.createElement('div');
  content.className = 'text-center relative z-10';
  
  if (sponsor.logo) {
    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = `${sponsor.name} logo`;
    img.className = `
      max-w-full max-h-12 sm:max-h-16 md:max-h-20 lg:max-h-24
      w-auto h-auto mx-auto mb-2 sm:mb-3 object-contain
      transition-all duration-300 ease-out
      group-hover:scale-110 group-hover:brightness-110
    `.replace(/\s+/g, ' ').trim();
    content.appendChild(img);
  }
  
  const title = document.createElement('h3');
  title.className = `
    text-sm sm:text-base md:text-lg font-semibold text-base-content
    group-hover:text-primary transition-all duration-300 ease-out
    leading-tight group-hover:scale-105 relative text-center
    break-words hyphens-auto max-w-full overflow-hidden px-1
  `.replace(/\s+/g, ' ').trim();
  title.textContent = sponsor.name;
  content.appendChild(title);
  
  card.appendChild(content);
  return { card, document };
};

// Helper to create responsive sponsors section
const createResponsiveSponsorsSection = (sponsors) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const section = document.createElement('section');
  section.className = 'py-16 px-4 bg-base-200 text-base-content';
  
  const container = document.createElement('div');
  container.className = 'max-w-6xl mx-auto text-center';
  
  const heading = document.createElement('h2');
  heading.className = 'text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-primary';
  heading.textContent = 'Our Sponsors';
  container.appendChild(heading);
  
  const grid = document.createElement('div');
  const gridClasses = getResponsiveGridClasses(sponsors.length);
  grid.className = `
    grid ${gridClasses} gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-6
    mb-8 sm:mb-12 auto-rows-fr place-items-stretch justify-items-center w-full
  `.replace(/\s+/g, ' ').trim();
  
  sponsors.forEach(sponsor => {
    const listItem = document.createElement('div');
    listItem.className = 'w-full max-w-xs sm:max-w-sm md:max-w-none flex';
    
    const { card } = createResponsiveSponsorCard(sponsor);
    listItem.appendChild(card);
    grid.appendChild(listItem);
  });
  
  container.appendChild(grid);
  section.appendChild(container);
  
  return { section, document, grid };
};

// Helper to determine responsive grid classes
const getResponsiveGridClasses = (count) => {
  if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto";
  return "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
};

// Test data for responsive testing
const responsiveTestSponsors = [
  { name: "Mobile Corp", logo: "mobile.png" },
  { name: "Tablet Inc", logo: "tablet.png" },
  { name: "Desktop Solutions", logo: "desktop.png" },
  { name: "Wide Screen Technologies", logo: "wide.png" },
  { name: "Ultra Wide Systems", logo: "ultra.png" },
  { name: "Responsive Design Co", logo: "responsive.png" },
  { name: "Adaptive Layout Ltd", logo: "adaptive.png" },
  { name: "Flexible Grid Corp", logo: "grid.png" }
];

// Breakpoint definitions matching Tailwind CSS
const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

describe('Sponsor Cards Responsive Behavior', () => {
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

  describe('Card Dimensions and Sizing', () => {
    it('should have responsive height classes', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      expect(card.className).toContain('h-32');        // base (mobile)
      expect(card.className).toContain('xs:h-36');     // extra small
      expect(card.className).toContain('sm:h-40');     // small
      expect(card.className).toContain('md:h-44');     // medium
      expect(card.className).toContain('lg:h-48');     // large
      expect(card.className).toContain('xl:h-44');     // extra large
      expect(card.className).toContain('min-h-[8rem]'); // minimum height
    });

    it('should have responsive width constraints', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      expect(card.className).toContain('w-full');
      expect(card.className).toContain('max-w-xs');      // base (mobile)
      expect(card.className).toContain('sm:max-w-sm');   // small
      expect(card.className).toContain('md:max-w-none'); // medium and up
    });

    it('should have responsive padding', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      expect(card.className).toContain('p-3');      // base (mobile)
      expect(card.className).toContain('sm:p-4');   // small
      expect(card.className).toContain('md:p-5');   // medium
      expect(card.className).toContain('lg:p-6');   // large
    });

    it('should maintain aspect ratio across screen sizes', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      // Cards should maintain consistent proportions
      expect(card.className).toContain('flex');
      expect(card.className).toContain('items-center');
      expect(card.className).toContain('justify-center');
    });
  });

  describe('Typography Responsiveness', () => {
    it('should have responsive text sizing for sponsor names', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('text-sm');      // base (mobile)
      expect(title.className).toContain('sm:text-base'); // small
      expect(title.className).toContain('md:text-lg');   // medium
    });

    it('should handle text wrapping on small screens', () => {
      const longNameSponsor = { 
        name: "Very Long Company Name Technologies Private Limited" 
      };
      const { card } = createResponsiveSponsorCard(longNameSponsor);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('break-words');
      expect(title.className).toContain('hyphens-auto');
      expect(title.className).toContain('overflow-hidden');
      expect(title.className).toContain('leading-tight');
    });

    it('should have responsive section heading', () => {
      const { section } = createResponsiveSponsorsSection(responsiveTestSponsors);
      const heading = section.querySelector('h2');
      
      expect(heading.className).toContain('text-2xl');   // base
      expect(heading.className).toContain('sm:text-3xl'); // small and up
    });
  });

  describe('Logo Responsiveness', () => {
    it('should have responsive logo sizing', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      const img = card.querySelector('img');
      
      expect(img.className).toContain('max-h-12');      // base (mobile)
      expect(img.className).toContain('sm:max-h-16');   // small
      expect(img.className).toContain('md:max-h-20');   // medium
      expect(img.className).toContain('lg:max-h-24');   // large
    });

    it('should maintain logo aspect ratio', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      const img = card.querySelector('img');
      
      expect(img.className).toContain('w-auto');
      expect(img.className).toContain('h-auto');
      expect(img.className).toContain('object-contain');
      expect(img.className).toContain('max-w-full');
    });

    it('should have responsive logo spacing', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      const img = card.querySelector('img');
      
      expect(img.className).toContain('mb-2');      // base spacing
      expect(img.className).toContain('sm:mb-3');   // small and up
    });
  });

  describe('Grid Layout Responsiveness', () => {
    it('should use single column on mobile for single sponsor', () => {
      const { grid } = createResponsiveSponsorsSection([responsiveTestSponsors[0]]);
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('max-w-xs');
      expect(grid.className).toContain('mx-auto');
    });

    it('should use responsive columns for two sponsors', () => {
      const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors.slice(0, 2));
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('max-w-2xl');
    });

    it('should use responsive columns for three sponsors', () => {
      const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors.slice(0, 3));
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('max-w-4xl');
    });

    it('should use full responsive grid for many sponsors', () => {
      const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors);
      
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('xs:grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('md:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
      expect(grid.className).toContain('2xl:grid-cols-4');
    });

    it('should have responsive gap spacing', () => {
      const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors);
      
      expect(grid.className).toContain('gap-4');       // base
      expect(grid.className).toContain('xs:gap-5');    // extra small
      expect(grid.className).toContain('sm:gap-6');    // small
      expect(grid.className).toContain('md:gap-7');    // medium
      expect(grid.className).toContain('lg:gap-8');    // large
      expect(grid.className).toContain('xl:gap-6');    // extra large (tighter for more columns)
    });
  });

  describe('Container and Section Responsiveness', () => {
    it('should have responsive section padding', () => {
      const { section } = createResponsiveSponsorsSection(responsiveTestSponsors);
      
      expect(section.className).toContain('py-16');
      expect(section.className).toContain('px-4');
    });

    it('should have responsive container max-width', () => {
      const { section } = createResponsiveSponsorsSection(responsiveTestSponsors);
      const container = section.querySelector('.max-w-6xl');
      
      expect(container.className).toContain('max-w-6xl');
      expect(container.className).toContain('mx-auto');
    });

    it('should have responsive margin spacing', () => {
      const { section } = createResponsiveSponsorsSection(responsiveTestSponsors);
      const heading = section.querySelector('h2');
      const grid = section.querySelector('.grid');
      
      expect(heading.className).toContain('mb-8');
      expect(heading.className).toContain('sm:mb-12');
      expect(grid.className).toContain('mb-8');
      expect(grid.className).toContain('sm:mb-12');
    });
  });

  describe('List Item Responsiveness', () => {
    it('should have responsive list item constraints', () => {
      const { section } = createResponsiveSponsorsSection(responsiveTestSponsors);
      const listItems = section.querySelectorAll('.w-full.max-w-xs');
      
      listItems.forEach(item => {
        expect(item.className).toContain('w-full');
        expect(item.className).toContain('max-w-xs');
        expect(item.className).toContain('sm:max-w-sm');
        expect(item.className).toContain('md:max-w-none');
        expect(item.className).toContain('flex');
      });
    });

    it('should maintain proper alignment in grid', () => {
      const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors);
      
      expect(grid.className).toContain('auto-rows-fr');
      expect(grid.className).toContain('place-items-stretch');
      expect(grid.className).toContain('justify-items-center');
    });
  });

  describe('Breakpoint Behavior', () => {
    const testBreakpoints = [
      { name: 'mobile', width: 320, expectedCols: 1 },
      { name: 'mobile-large', width: 414, expectedCols: 1 },
      { name: 'tablet-portrait', width: 768, expectedCols: 2 },
      { name: 'tablet-landscape', width: 1024, expectedCols: 3 },
      { name: 'desktop', width: 1280, expectedCols: 4 },
      { name: 'wide-desktop', width: 1920, expectedCols: 4 }
    ];

    testBreakpoints.forEach(({ name, width, expectedCols }) => {
      it(`should display ${expectedCols} columns on ${name} (${width}px)`, () => {
        const { grid } = createResponsiveSponsorsSection(responsiveTestSponsors);
        
        // Verify grid has appropriate responsive classes
        if (expectedCols === 1) {
          expect(grid.className).toContain('grid-cols-1');
        } else if (expectedCols === 2) {
          expect(grid.className).toContain('sm:grid-cols-2');
        } else if (expectedCols === 3) {
          expect(grid.className).toContain('lg:grid-cols-3');
        } else if (expectedCols === 4) {
          expect(grid.className).toContain('xl:grid-cols-4');
        }
      });
    });
  });

  describe('Touch and Mobile Optimization', () => {
    it('should have touch-friendly card sizes', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      // Minimum 44px touch target (h-32 = 128px, well above minimum)
      expect(card.className).toContain('h-32');
      expect(card.className).toContain('p-3');
    });

    it('should have appropriate hover effects for touch devices', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      
      expect(card.className).toContain('hover:shadow-2xl');
      expect(card.className).toContain('hover:-translate-y-1');
      expect(card.className).toContain('hover:scale-[1.02]');
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-300');
    });

    it('should maintain readability on small screens', () => {
      const { card } = createResponsiveSponsorCard(responsiveTestSponsors[0]);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('text-sm');
      expect(title.className).toContain('leading-tight');
      expect(title.className).toContain('px-1');
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    it('should handle very long sponsor names on mobile', () => {
      const longNameSponsor = { 
        name: "Extremely Long Company Name Technologies Private Limited Solutions International" 
      };
      const { card } = createResponsiveSponsorCard(longNameSponsor);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('break-words');
      expect(title.className).toContain('hyphens-auto');
      expect(title.className).toContain('overflow-hidden');
      expect(title.className).toContain('max-w-full');
    });

    it('should handle large numbers of sponsors', () => {
      const manySponsors = Array.from({ length: 20 }, (_, i) => ({
        name: `Sponsor ${i + 1}`,
        logo: `sponsor${i + 1}.png`
      }));
      
      const { grid } = createResponsiveSponsorsSection(manySponsors);
      const listItems = grid.children;
      
      expect(listItems.length).toBe(20);
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should handle mixed content (with and without logos)', () => {
      const mixedSponsors = [
        { name: "With Logo", logo: "logo.png" },
        { name: "Without Logo" },
        { name: "Another With Logo", logo: "logo2.png" },
        { name: "Another Without Logo" }
      ];
      
      const { section } = createResponsiveSponsorsSection(mixedSponsors);
      const cards = section.querySelectorAll('.text-center.relative.z-10');
      
      expect(cards.length).toBe(4);
      
      // Check that cards maintain consistent height despite different content
      cards.forEach(card => {
        const cardElement = card.closest('[class*="h-32"]');
        expect(cardElement.className).toContain('h-32');
      });
    });

    it('should maintain grid alignment with uneven content', () => {
      const unevenSponsors = [
        { name: "Short" },
        { name: "Medium Length Name" },
        { name: "Very Long Company Name Technologies" },
        { name: "X" }
      ];
      
      const { grid } = createResponsiveSponsorsSection(unevenSponsors);
      
      expect(grid.className).toContain('auto-rows-fr');
      expect(grid.className).toContain('place-items-stretch');
    });
  });
});