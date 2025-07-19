// =============================================================================
// SPONSOR UTILITIES
// =============================================================================

import type { Sponsor, SponsorTier } from './types';

/**
 * Tier hierarchy for sorting sponsors
 */
const TIER_HIERARCHY: Record<SponsorTier, number> = {
  platinum: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
  partner: 5,
  community: 6,
  startup: 7
};

/**
 * Sorts sponsors by tier hierarchy, featured status, and name
 */
export function sortSponsors(sponsors: Sponsor[]): Sponsor[] {
  return [...sponsors].sort((a, b) => {
    // Featured sponsors first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Then by tier (if both have tiers)
    if (a.tier && b.tier) {
      const tierDiff = TIER_HIERARCHY[a.tier] - TIER_HIERARCHY[b.tier];
      if (tierDiff !== 0) return tierDiff;
    }
    
    // Sponsors with tiers before those without
    if (a.tier && !b.tier) return -1;
    if (!a.tier && b.tier) return 1;
    
    // Finally by name alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Groups sponsors by tier
 */
export function groupSponsorsByTier(sponsors: Sponsor[]): Record<string, Sponsor[]> {
  const grouped: Record<string, Sponsor[]> = {};
  
  sponsors.forEach(sponsor => {
    const tier = sponsor.tier || 'other';
    if (!grouped[tier]) {
      grouped[tier] = [];
    }
    grouped[tier].push(sponsor);
  });
  
  // Sort within each group
  Object.keys(grouped).forEach(tier => {
    grouped[tier] = sortSponsors(grouped[tier]);
  });
  
  return grouped;
}

/**
 * Filters sponsors by status
 */
export function filterSponsorsByStatus(
  sponsors: Sponsor[], 
  statuses: Sponsor['status'][] = ['active']
): Sponsor[] {
  return sponsors.filter(sponsor => 
    statuses.includes(sponsor.status || 'active')
  );
}

/**
 * Gets featured sponsors
 */
export function getFeaturedSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.filter(sponsor => sponsor.featured);
}

/**
 * Gets sponsors by tier
 */
export function getSponsorsByTier(sponsors: Sponsor[], tier: SponsorTier): Sponsor[] {
  return sponsors.filter(sponsor => sponsor.tier === tier);
}

/**
 * Validates sponsor data
 */
export function validateSponsor(sponsor: any): sponsor is Sponsor {
  if (!sponsor || typeof sponsor !== 'object') {
    return false;
  }
  
  // Required fields
  if (!sponsor.name || typeof sponsor.name !== 'string') {
    return false;
  }
  
  // Optional fields validation
  if (sponsor.logo && typeof sponsor.logo !== 'string') {
    return false;
  }
  
  if (sponsor.url && typeof sponsor.url !== 'string') {
    return false;
  }
  
  if (sponsor.tier && !Object.keys(TIER_HIERARCHY).includes(sponsor.tier)) {
    return false;
  }
  
  if (sponsor.status && !['active', 'inactive', 'pending', 'expired'].includes(sponsor.status)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitizes sponsor data
 */
export function sanitizeSponsor(sponsor: any): Sponsor | null {
  if (!validateSponsor(sponsor)) {
    return null;
  }
  
  return {
    name: sponsor.name.trim(),
    logo: sponsor.logo?.trim() || undefined,
    url: sponsor.url?.trim() || undefined,
    tier: sponsor.tier || undefined,
    description: sponsor.description?.trim() || undefined,
    featured: Boolean(sponsor.featured),
    status: sponsor.status || 'active',
    contact: sponsor.contact || undefined,
    social: sponsor.social || undefined,
    sponsorship: sponsor.sponsorship || undefined,
    customStyles: sponsor.customStyles || undefined
  };
}

/**
 * Processes and validates an array of sponsors
 */
export function processSponsors(rawSponsors: any[]): Sponsor[] {
  if (!Array.isArray(rawSponsors)) {
    console.warn('processSponsors: Expected array but received:', typeof rawSponsors);
    return [];
  }
  
  const validSponsors: Sponsor[] = [];
  
  rawSponsors.forEach((rawSponsor, index) => {
    const sanitized = sanitizeSponsor(rawSponsor);
    if (sanitized) {
      validSponsors.push(sanitized);
    } else {
      console.warn(`processSponsors: Invalid sponsor data at index ${index}:`, rawSponsor);
    }
  });
  
  return sortSponsors(validSponsors);
}

/**
 * Generates sponsor grid layout classes based on count
 */
export function getSponsorGridClasses(count: number): string {
  if (count === 1) return 'grid-cols-1 max-w-sm mx-auto';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto';
  if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  if (count <= 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
}

/**
 * Gets tier display name
 */
export function getTierDisplayName(tier: SponsorTier): string {
  const displayNames: Record<SponsorTier, string> = {
    platinum: '💎 Platinum Sponsors',
    gold: '🥇 Gold Sponsors',
    silver: '🥈 Silver Sponsors',
    bronze: '🥉 Bronze Sponsors',
    partner: '🤝 Partners',
    community: '🤝 Community Sponsors',
    startup: '🚀 Startup Sponsors'
  };
  
  return displayNames[tier] || tier;
}

/**
 * Calculates sponsor statistics
 */
export function getSponsorStats(sponsors: Sponsor[]): {
  total: number;
  active: number;
  byTier: Record<SponsorTier, number>;
  featured: number;
} {
  const stats = {
    total: sponsors.length,
    active: 0,
    byTier: {} as Record<SponsorTier, number>,
    featured: 0
  };
  
  // Initialize tier counts
  Object.keys(TIER_HIERARCHY).forEach(tier => {
    stats.byTier[tier as SponsorTier] = 0;
  });
  
  sponsors.forEach(sponsor => {
    if (sponsor.status === 'active' || !sponsor.status) {
      stats.active++;
    }
    
    if (sponsor.tier) {
      stats.byTier[sponsor.tier]++;
    }
    
    if (sponsor.featured) {
      stats.featured++;
    }
  });
  
  return stats;
}

/**
 * Generates sponsor card size based on tier
 */
export function getSponsorCardSize(tier?: SponsorTier): 'sm' | 'md' | 'lg' {
  if (!tier) return 'md';
  
  switch (tier) {
    case 'platinum':
      return 'lg';
    case 'gold':
      return 'lg';
    case 'silver':
      return 'md';
    case 'bronze':
      return 'md';
    default:
      return 'sm';
  }
}

/**
 * Checks if sponsor should show description
 */
export function shouldShowSponsorDescription(tier?: SponsorTier): boolean {
  return tier === 'platinum' || tier === 'gold';
}

/**
 * Creates sponsor test data for development
 */
export function createMockSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    name: 'Mock Sponsor',
    logo: '/placeholder-logo.png',
    url: 'https://example.com',
    tier: 'community',
    description: 'A mock sponsor for testing purposes',
    featured: false,
    status: 'active',
    ...overrides
  };
}

/**
 * Creates multiple mock sponsors for testing
 */
export function createMockSponsors(count: number = 5): Sponsor[] {
  const tiers: SponsorTier[] = ['platinum', 'gold', 'silver', 'bronze', 'community'];
  
  return Array.from({ length: count }, (_, index) => 
    createMockSponsor({
      name: `Mock Sponsor ${index + 1}`,
      tier: tiers[index % tiers.length],
      featured: index === 0
    })
  );
}