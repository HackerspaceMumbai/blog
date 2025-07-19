/**
 * Visual consistency and hover state tests for sponsor cards
 * Tests styling consistency, hover effects, and visual behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Helper to create sponsor card for visual testing
const createVisualSponsorCard = (sponsor) => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;
  
  const card = document.createElement('div');
  
  // Apply tier-specific styling
  const tierStyles = getTierStyles(sponsor.tier);
  const isFeatured = sponsor.featured;
  
  card.className = `
    h-32 xs:h-36 sm:h-40 md:h-44 lg:h-48 xl:h-44 min-h-[8rem]
    w-full max-w-xs sm:max-w-sm md:max-w-none
    bg-base-100 border ${tierStyles} rounded-xl shadow-lg
    hover:shadow-2xl hover:bg-base-200 hover:-translate-y-1 hover:scale-[1.02]
    focus-visible:shadow-2xl focus-visible:ring-2 focus-visible:ring-primary
    focus-visible:ring-offset-2 focus-visible:ring-offset-base-100
    focus-visible:outline-none focus-visible:-translate-y-1 focus-visible:scale-[1.02]
    focus-visible:bg-base-200 transition-all duration-300 ease-out
    flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6
    cursor-pointer group relative overflow-hidden backdrop-blur-sm mx-auto
    ${isFeatured ? 'ring-2 ring-primary/20' : ''}
  `.replace(/\s+/g, ' ').trim();
  
  // Add content
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
      group-focus-visible:scale-110 group-focus-visible:brightness-110
      filter drop-shadow-sm group-hover:drop-shadow-md
      group-focus-visible:drop-shadow-md
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
  
  // Add gradient overlay
  const gradient = document.createElement('div');
  gradient.className = `
    absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5
    opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out rounded-xl
  `.replace(/\s+/g, ' ').trim();
  card.appendChild(gradient);
  
  return { card, document };
};

// Helper function for tier styling
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

// Test data for visual consistency testing
const visualTestSponsors = {
  minimal: { name: "Minimal Corp" },
  withLogo: { name: "Logo Corp", logo: "logo.png" },
  withTier: { name: "Tier Corp", tier: "gold" },
  featured: { name: "Featured Corp", featured: true, tier: "platinum" },
  comprehensive: {
    name: "Comprehensive Corp",
    logo: "comprehensive.png",
    tier: "platinum",
    featured: true
  },
  longName: {
    name: "Very Long Company Name Technologies Private Limited",
    tier: "silver"
  }
};

const allTiers = ['platinum', 'gold', 'silver', 'bronze', 'community', 'startup', 'partner'];

describe('Visual Consistency Tests', () => {
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

  describe('Base Styling Consistency', () => {
    it('should have consistent base classes across all card types', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      const expectedBaseClasses = [
        'bg-base-100',
        'border',
        'rounded-xl',
        'shadow-lg',
        'transition-all',
        'duration-300',
        'ease-out',
        'flex',
        'items-center',
        'justify-center',
        'cursor-pointer',
        'group',
        'relative',
        'overflow-hidden'
      ];
      
      cards.forEach(card => {
        expectedBaseClasses.forEach(className => {
          expect(card.className).toContain(className);
        });
      });
    });

    it('should have consistent dimensions across all cards', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      const expectedDimensionClasses = [
        'h-32', 'xs:h-36', 'sm:h-40', 'md:h-44', 'lg:h-48', 'xl:h-44',
        'min-h-[8rem]', 'w-full', 'max-w-xs', 'sm:max-w-sm', 'md:max-w-none'
      ];
      
      cards.forEach(card => {
        expectedDimensionClasses.forEach(className => {
          expect(card.className).toContain(className);
        });
      });
    });

    it('should have consistent padding across all cards', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      const expectedPaddingClasses = ['p-3', 'sm:p-4', 'md:p-5', 'lg:p-6'];
      
      cards.forEach(card => {
        expectedPaddingClasses.forEach(className => {
          expect(card.className).toContain(className);
        });
      });
    });

    it('should have consistent content structure', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        const content = card.querySelector('.text-center');
        expect(content).toBeTruthy();
        expect(content.className).toContain('relative');
        expect(content.className).toContain('z-10');
        
        const title = content.querySelector('h3');
        expect(title).toBeTruthy();
        expect(title.tagName).toBe('H3');
      });
    });
  });

  describe('Hover Effects Consistency', () => {
    it('should have consistent hover shadow effects', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        expect(card.className).toContain('hover:shadow-2xl');
        expect(card.className).toContain('hover:bg-base-200');
      });
    });

    it('should have consistent hover transform effects', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        expect(card.className).toContain('hover:-translate-y-1');
        expect(card.className).toContain('hover:scale-[1.02]');
      });
    });

    it('should have consistent transition properties', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        expect(card.className).toContain('transition-all');
        expect(card.className).toContain('duration-300');
        expect(card.className).toContain('ease-out');
      });
    });

    it('should have consistent text hover effects', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        const title = card.querySelector('h3');
        expect(title.className).toContain('group-hover:text-primary');
        expect(title.className).toContain('group-hover:scale-105');
        expect(title.className).toContain('transition-all');
        expect(title.className).toContain('duration-300');
      });
    });

    it('should have consistent logo hover effects', () => {
      const cardsWithLogos = [
        createVisualSponsorCard(visualTestSponsors.withLogo).card,
        createVisualSponsorCard(visualTestSponsors.comprehensive).card
      ];
      
      cardsWithLogos.forEach(card => {
        const img = card.querySelector('img');
        if (img) {
          expect(img.className).toContain('group-hover:scale-110');
          expect(img.className).toContain('group-hover:brightness-110');
          expect(img.className).toContain('group-hover:drop-shadow-md');
        }
      });
    });

    it('should have gradient overlay hover effect', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      cards.forEach(card => {
        const gradient = card.querySelector('.absolute.inset-0');
        expect(gradient).toBeTruthy();
        expect(gradient.className).toContain('bg-gradient-to-br');
        expect(gradient.className).toContain('from-primary/5');
        expect(gradient.className).toContain('to-secondary/5');
        expect(gradient.className).toContain('opacity-0');
        expect(gradient.className).toContain('group-hover:opacity-100');
      });
    });
  });

  describe('Focus State Consistency', () => {
    it('should have consistent focus-visible effects', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      const expectedFocusClasses = [
        'focus-visible:shadow-2xl',
        'focus-visible:ring-2',
        'focus-visible:ring-primary',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-offset-base-100',
        'focus-visible:outline-none',
        'focus-visible:-translate-y-1',
        'focus-visible:scale-[1.02]',
        'focus-visible:bg-base-200'
      ];
      
      cards.forEach(card => {
        expectedFocusClasses.forEach(className => {
          expect(card.className).toContain(className);
        });
      });
    });

    it('should have consistent focus effects for logos', () => {
      const cardsWithLogos = [
        createVisualSponsorCard(visualTestSponsors.withLogo).card,
        createVisualSponsorCard(visualTestSponsors.comprehensive).card
      ];
      
      cardsWithLogos.forEach(card => {
        const img = card.querySelector('img');
        if (img) {
          expect(img.className).toContain('group-focus-visible:scale-110');
          expect(img.className).toContain('group-focus-visible:brightness-110');
          expect(img.className).toContain('group-focus-visible:drop-shadow-md');
        }
      });
    });
  });

  describe('Tier-Specific Styling Consistency', () => {
    allTiers.forEach(tier => {
      it(`should have consistent ${tier} tier styling`, () => {
        const sponsor = { name: `${tier} Corp`, tier };
        const { card } = createVisualSponsorCard(sponsor);
        
        const tierColors = {
          platinum: 'yellow-400',
          gold: 'amber-400',
          silver: 'gray-400',
          bronze: 'orange-400',
          community: 'green-400',
          startup: 'purple-400',
          partner: 'blue-400'
        };
        
        const expectedColor = tierColors[tier];
        expect(card.className).toContain(`border-${expectedColor}/30`);
        expect(card.className).toContain(`hover:border-${expectedColor}`);
        expect(card.className).toContain(`hover:shadow-${expectedColor}/20`);
      });
    });

    it('should have consistent default styling for sponsors without tiers', () => {
      const { card } = createVisualSponsorCard(visualTestSponsors.minimal);
      
      expect(card.className).toContain('border-base-300');
      expect(card.className).toContain('hover:border-primary');
      expect(card.className).toContain('hover:shadow-primary/20');
    });

    it('should maintain base styling regardless of tier', () => {
      const tieredSponsors = allTiers.map(tier => ({ name: `${tier} Corp`, tier }));
      const cards = tieredSponsors.map(sponsor => createVisualSponsorCard(sponsor).card);
      
      const baseClasses = ['bg-base-100', 'rounded-xl', 'shadow-lg', 'transition-all'];
      
      cards.forEach(card => {
        baseClasses.forEach(className => {
          expect(card.className).toContain(className);
        });
      });
    });
  });

  describe('Featured Sponsor Styling', () => {
    it('should have consistent featured styling', () => {
      const featuredSponsors = [
        { name: "Featured 1", featured: true },
        { name: "Featured 2", featured: true, tier: "gold" },
        { name: "Featured 3", featured: true, tier: "platinum", logo: "logo.png" }
      ];
      
      const cards = featuredSponsors.map(sponsor => createVisualSponsorCard(sponsor).card);
      
      cards.forEach(card => {
        expect(card.className).toContain('ring-2');
        expect(card.className).toContain('ring-primary/20');
      });
    });

    it('should combine featured styling with tier styling', () => {
      const { card } = createVisualSponsorCard(visualTestSponsors.featured);
      
      // Should have both featured and tier styling
      expect(card.className).toContain('ring-2 ring-primary/20'); // featured
      expect(card.className).toContain('border-yellow-400/30'); // platinum tier
      expect(card.className).toContain('hover:border-yellow-400');
    });

    it('should not affect non-featured sponsors', () => {
      const nonFeaturedSponsors = [
        visualTestSponsors.minimal,
        visualTestSponsors.withLogo,
        visualTestSponsors.withTier
      ];
      
      const cards = nonFeaturedSponsors.map(sponsor => createVisualSponsorCard(sponsor).card);
      
      cards.forEach(card => {
        expect(card.className).not.toContain('ring-2 ring-primary/20');
      });
    });
  });

  describe('Typography Consistency', () => {
    it('should have consistent title styling', () => {
      const cards = Object.values(visualTestSponsors).map(sponsor => 
        createVisualSponsorCard(sponsor).card
      );
      
      const expectedTitleClasses = [
        'text-sm', 'sm:text-base', 'md:text-lg',
        'font-semibold', 'text-base-content',
        'leading-tight', 'text-center',
        'break-words', 'hyphens-auto',
        'max-w-full', 'overflow-hidden', 'px-1'
      ];
      
      cards.forEach(card => {
        const title = card.querySelector('h3');
        expectedTitleClasses.forEach(className => {
          expect(title.className).toContain(className);
        });
      });
    });

    it('should handle long names consistently', () => {
      const { card } = createVisualSponsorCard(visualTestSponsors.longName);
      const title = card.querySelector('h3');
      
      expect(title.className).toContain('break-words');
      expect(title.className).toContain('hyphens-auto');
      expect(title.className).toContain('overflow-hidden');
      expect(title.textContent).toBe(visualTestSponsors.longName.name);
    });
  });

  describe('Logo Styling Consistency', () => {
    it('should have consistent logo styling', () => {
      const cardsWithLogos = [
        createVisualSponsorCard(visualTestSponsors.withLogo).card,
        createVisualSponsorCard(visualTestSponsors.comprehensive).card
      ];
      
      const expectedLogoClasses = [
        'max-w-full', 'max-h-12', 'sm:max-h-16', 'md:max-h-20', 'lg:max-h-24',
        'w-auto', 'h-auto', 'mx-auto', 'mb-2', 'sm:mb-3', 'object-contain',
        'transition-all', 'duration-300', 'ease-out',
        'filter', 'drop-shadow-sm'
      ];
      
      cardsWithLogos.forEach(card => {
        const img = card.querySelector('img');
        expectedLogoClasses.forEach(className => {
          expect(img.className).toContain(className);
        });
      });
    });

    it('should maintain consistent spacing with and without logos', () => {
      const cardWithLogo = createVisualSponsorCard(visualTestSponsors.withLogo).card;
      const cardWithoutLogo = createVisualSponsorCard(visualTestSponsors.minimal).card;
      
      // Both should have consistent content container styling
      const contentWithLogo = cardWithLogo.querySelector('.text-center');
      const contentWithoutLogo = cardWithoutLogo.querySelector('.text-center');
      
      expect(contentWithLogo.className).toBe(contentWithoutLogo.className);
    });
  });

  describe('Visual Hierarchy', () => {
    it('should maintain consistent visual hierarchy', () => {
      const { card } = createVisualSponsorCard(visualTestSponsors.comprehensive);
      
      // Content should be above gradient overlay
      const content = card.querySelector('.text-center');
      const gradient = card.querySelector('.absolute.inset-0');
      
      expect(content.className).toContain('relative');
      expect(content.className).toContain('z-10');
      expect(gradient.className).toContain('absolute');
      expect(gradient.className).toContain('inset-0');
    });

    it('should have consistent element ordering', () => {
      const { card } = createVisualSponsorCard(visualTestSponsors.comprehensive);
      const children = Array.from(card.children);
      
      // Content should come before gradient overlay
      expect(children[0].className).toContain('text-center');
      expect(children[1].className).toContain('absolute inset-0');
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    it('should handle empty sponsor names gracefully', () => {
      const { card } = createVisualSponsorCard({ name: "" });
      const title = card.querySelector('h3');
      
      expect(title.textContent).toBe("");
      expect(title.className).toContain('text-sm');
    });

    it('should handle special characters in names', () => {
      const specialSponsor = { name: "Tech & Innovation Co., Ltd. (2024)" };
      const { card } = createVisualSponsorCard(specialSponsor);
      const title = card.querySelector('h3');
      
      expect(title.textContent).toBe(specialSponsor.name);
      expect(title.className).toContain('break-words');
    });

    it('should maintain consistency with all optional fields', () => {
      const fullSponsor = {
        name: "Full Feature Corp",
        logo: "full.png",
        tier: "platinum",
        featured: true
      };
      
      const { card } = createVisualSponsorCard(fullSponsor);
      
      // Should have all styling elements
      expect(card.className).toContain('border-yellow-400/30'); // tier
      expect(card.className).toContain('ring-2 ring-primary/20'); // featured
      expect(card.querySelector('img')).toBeTruthy(); // logo
      expect(card.querySelector('h3').textContent).toBe(fullSponsor.name);
    });
  });
});