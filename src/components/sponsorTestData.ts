// =============================================================================
// SPONSOR TEST DATA
// =============================================================================

import type { Sponsor } from './types';

/**
 * Mock sponsor data for development and testing
 */
export const mockSponsors: Sponsor[] = [
  // Platinum Sponsors
  {
    name: 'TechCorp Global',
    logo: '/sponsors/techcorp-logo.png',
    url: 'https://techcorp.example.com',
    tier: 'platinum',
    description: 'Leading technology solutions provider supporting open source innovation',
    featured: true,
    status: 'active',
    contact: {
      email: 'partnerships@techcorp.com',
      representative: 'Jane Smith'
    },
    social: {
      twitter: '@techcorp',
      linkedin: 'company/techcorp'
    },
    sponsorship: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      benefits: ['Logo placement', 'Speaking slot', 'Booth space']
    }
  },
  
  // Gold Sponsors
  {
    name: 'DevTools Inc',
    logo: '/sponsors/devtools-logo.png',
    url: 'https://devtools.example.com',
    tier: 'gold',
    description: 'Professional development tools for modern software teams',
    featured: false,
    status: 'active',
    contact: {
      email: 'community@devtools.com'
    },
    sponsorship: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  },
  
  {
    name: 'CloudHost Solutions',
    logo: '/sponsors/cloudhost-logo.png',
    url: 'https://cloudhost.example.com',
    tier: 'gold',
    description: 'Reliable cloud hosting for developers and startups',
    featured: false,
    status: 'active'
  },
  
  // Silver Sponsors
  {
    name: 'CodeAcademy Mumbai',
    logo: '/sponsors/codeacademy-logo.png',
    url: 'https://codeacademy-mumbai.example.com',
    tier: 'silver',
    description: 'Coding bootcamp and professional development courses',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'StartupHub',
    logo: '/sponsors/startuphub-logo.png',
    url: 'https://startuphub.example.com',
    tier: 'silver',
    description: 'Incubator and accelerator for tech startups',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'DesignStudio Pro',
    logo: '/sponsors/designstudio-logo.png',
    url: 'https://designstudio.example.com',
    tier: 'silver',
    description: 'UI/UX design services for digital products',
    featured: false,
    status: 'active'
  },
  
  // Bronze Sponsors
  {
    name: 'LocalCafe Connect',
    logo: '/sponsors/localcafe-logo.png',
    url: 'https://localcafe.example.com',
    tier: 'bronze',
    description: 'Coworking space and community hub',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'TechBooks Publisher',
    logo: '/sponsors/techbooks-logo.png',
    url: 'https://techbooks.example.com',
    tier: 'bronze',
    description: 'Technical books and learning resources',
    featured: false,
    status: 'active'
  },
  
  // Community Sponsors
  {
    name: 'Mumbai Developers',
    logo: '/sponsors/mumbaidevs-logo.png',
    url: 'https://mumbaidevs.example.com',
    tier: 'community',
    description: 'Local developer community and meetup organizers',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'OpenSource India',
    logo: '/sponsors/opensource-logo.png',
    url: 'https://opensource-india.example.com',
    tier: 'community',
    description: 'Promoting open source adoption in India',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'WomenInTech Mumbai',
    logo: '/sponsors/womenintech-logo.png',
    url: 'https://womenintech-mumbai.example.com',
    tier: 'community',
    description: 'Supporting women in technology careers',
    featured: false,
    status: 'active'
  },
  
  // Startup Sponsors
  {
    name: 'InnovateNow',
    logo: '/sponsors/innovatenow-logo.png',
    url: 'https://innovatenow.example.com',
    tier: 'startup',
    description: 'Early-stage startup building developer tools',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'CodeCraft Studios',
    logo: '/sponsors/codecraft-logo.png',
    url: 'https://codecraft.example.com',
    tier: 'startup',
    description: 'Custom software development studio',
    featured: false,
    status: 'active'
  },
  
  // Partner Sponsors
  {
    name: 'Mumbai Tech University',
    logo: '/sponsors/techuni-logo.png',
    url: 'https://techuni.example.com',
    tier: 'partner',
    description: 'Leading technical education institution',
    featured: false,
    status: 'active'
  },
  
  {
    name: 'Innovation District',
    logo: '/sponsors/innovation-logo.png',
    url: 'https://innovation-district.example.com',
    tier: 'partner',
    description: 'Technology and innovation hub in Mumbai',
    featured: false,
    status: 'active'
  },
  
  // Some inactive/expired sponsors for testing
  {
    name: 'OldTech Corp',
    logo: '/sponsors/oldtech-logo.png',
    url: 'https://oldtech.example.com',
    tier: 'silver',
    description: 'Former sponsor - contract expired',
    featured: false,
    status: 'expired'
  },
  
  {
    name: 'PendingPartner',
    logo: '/sponsors/pending-logo.png',
    url: 'https://pending.example.com',
    tier: 'bronze',
    description: 'Sponsorship agreement pending',
    featured: false,
    status: 'pending'
  }
];

/**
 * Get sponsors by tier
 */
export function getSponsorsByTier(tier: Sponsor['tier']) {
  return mockSponsors.filter(sponsor => sponsor.tier === tier);
}

/**
 * Get active sponsors only
 */
export function getActiveSponsors() {
  return mockSponsors.filter(sponsor => sponsor.status === 'active');
}

/**
 * Get featured sponsors
 */
export function getFeaturedSponsors() {
  return mockSponsors.filter(sponsor => sponsor.featured);
}

/**
 * Get sponsors for testing different layouts
 */
export function getTestSponsors(count: number = 5): Sponsor[] {
  return mockSponsors.slice(0, count);
}

/**
 * Sponsor data organized by tier for easy access
 */
export const sponsorsByTier = {
  platinum: getSponsorsByTier('platinum'),
  gold: getSponsorsByTier('gold'),
  silver: getSponsorsByTier('silver'),
  bronze: getSponsorsByTier('bronze'),
  community: getSponsorsByTier('community'),
  startup: getSponsorsByTier('startup'),
  partner: getSponsorsByTier('partner')
};

/**
 * Sample sponsor for individual component testing
 */
export const sampleSponsor: Sponsor = {
  name: 'Sample Tech Company',
  logo: '/sponsors/sample-logo.png',
  url: 'https://sample.example.com',
  tier: 'gold',
  description: 'A sample sponsor for component testing and development',
  featured: true,
  status: 'active',
  contact: {
    email: 'contact@sample.com',
    representative: 'John Doe'
  },
  social: {
    twitter: '@sampletech',
    linkedin: 'company/sampletech',
    github: 'sampletech'
  }
};