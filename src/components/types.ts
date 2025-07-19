// =============================================================================
// BASE COMPONENT INTERFACES
// =============================================================================

/**
 * Base interface for all components with common accessibility and styling props
 */
export interface BaseComponent {
  /** Unique identifier for the component */
  id?: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Test identifier for automated testing */
  'data-testid'?: string;
  /** Custom inline styles (use sparingly) */
  style?: string;
}

/**
 * Enhanced card component props with comprehensive accessibility support
 */
export interface CardProps extends BaseComponent {
  /** Card title text */
  title?: string;
  /** Card subtitle or description */
  subtitle?: string;
  /** Image source URL */
  image?: string;
  /** Alt text for image (required if image is provided) */
  imageAlt?: string;
  /** Action buttons or links */
  actions?: React.ReactNode | any;
  /** Card variant for different styling */
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// SPONSOR TYPES
// =============================================================================

/**
 * Sponsor tier levels - easily extensible for future tiers
 */
export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'community' | 'startup' | 'partner';

/**
 * Enhanced sponsor interface with comprehensive data model
 */
export interface Sponsor extends BaseComponent {
  /** Required sponsor name - supports any length with automatic text wrapping */
  name: string;
  
  /** Optional logo image path or URL - supports various formats and sizes */
  logo?: string;
  
  /** Optional sponsor website URL - enables clickable sponsor cards */
  url?: string;
  
  /** Optional sponsor tier for visual differentiation and styling */
  tier?: SponsorTier;
  
  /** Optional description for accessibility and future tooltip/modal features */
  description?: string;
  
  /** Optional featured flag for highlighting important sponsors */
  featured?: boolean;
  
  /** Sponsor status for filtering and display logic */
  status?: 'active' | 'inactive' | 'pending' | 'expired';
  
  /** Optional contact information for future sponsor management features */
  contact?: {
    email?: string;
    phone?: string;
    representative?: string;
  };
  
  /** Optional social media links for future integration */
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  
  /** Optional sponsorship details for future sponsor portal features */
  sponsorship?: {
    startDate?: string;
    endDate?: string;
    amount?: number;
    benefits?: string[];
  };
  
  /** Optional custom styling overrides for special cases */
  customStyles?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Event status enumeration
 */
export type EventStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'postponed';

/**
 * Event location interface
 */
export interface EventLocation {
  /** Venue name */
  name: string;
  /** Street address */
  address?: string;
  /** City */
  city?: string;
  /** State/Province */
  state?: string;
  /** Country */
  country?: string;
  /** Postal code */
  postalCode?: string;
  /** Latitude for mapping */
  latitude?: number;
  /** Longitude for mapping */
  longitude?: number;
  /** Virtual event URL */
  virtualUrl?: string;
}

/**
 * Comprehensive event interface
 */
export interface Event extends BaseComponent {
  /** Unique event identifier */
  id: string;
  /** Event title */
  title: string;
  /** Event date and time */
  date: string;
  /** Event end date and time */
  endDate?: string;
  /** Event location details */
  location: EventLocation;
  /** Event description */
  description: string;
  /** RSVP or registration link */
  rsvpLink?: string;
  /** Event cover image */
  coverImage?: string;
  /** Event tags for categorization */
  tags?: string[];
  /** Maximum capacity */
  capacity?: number;
  /** Current attendee count */
  attendeeCount?: number;
  /** Event status */
  status: EventStatus;
  /** Event organizer */
  organizer?: string;
  /** Event cost (0 for free) */
  cost?: number;
  /** Event prerequisites */
  prerequisites?: string[];
  /** Event agenda or schedule */
  agenda?: Array<{
    time: string;
    title: string;
    description?: string;
    speaker?: string;
  }>;
}

// =============================================================================
// BLOG POST TYPES
// =============================================================================

/**
 * Blog post author interface
 */
export interface BlogAuthor {
  /** Author name */
  name: string;
  /** Author bio */
  bio?: string;
  /** Author avatar image */
  avatar?: string;
  /** Author social links */
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

/**
 * Enhanced blog post interface
 */
export interface BlogPost extends BaseComponent {
  /** URL slug */
  slug: string;
  /** Post title */
  title: string;
  /** Post description/excerpt */
  description: string;
  /** Publication date */
  date: string;
  /** Last updated date */
  updatedDate?: string;
  /** Post author */
  author: string | BlogAuthor;
  /** Post tags */
  tags?: string[];
  /** Cover image */
  coverImage?: string;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Whether post is featured */
  featured?: boolean;
  /** Post status */
  status?: 'published' | 'draft' | 'archived';
  /** Post category */
  category?: string;
  /** SEO metadata */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
}

// =============================================================================
// GALLERY TYPES
// =============================================================================

/**
 * Gallery image interface
 */
export interface GalleryImage extends BaseComponent {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image caption */
  caption?: string;
  /** Thumbnail image URL */
  thumbnail: string;
  /** Image category */
  category?: string;
  /** Image date */
  date?: string;
  /** Photographer credit */
  photographer?: string;
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Image file size */
  fileSize?: number;
  /** Image tags */
  tags?: string[];
}

// =============================================================================
// COMMUNITY STATS TYPES
// =============================================================================

/**
 * Community statistics interface
 */
export interface CommunityStats {
  /** Years the community has been running */
  yearsRunning: number;
  /** Total meetups hosted */
  meetupsHosted: number;
  /** Member count (formatted string) */
  membersCount: string;
  /** Projects supported */
  projectsSupported: number;
  /** GitHub stars (optional) */
  githubStars?: number;
  /** Discord members (optional) */
  discordMembers?: number;
  /** Additional custom stats */
  customStats?: Array<{
    label: string;
    value: string | number;
    icon?: string;
  }>;
}

// =============================================================================
// TESTIMONIAL TYPES
// =============================================================================

/**
 * Testimonial interface
 */
export interface Testimonial extends BaseComponent {
  /** Testimonial quote */
  quote: string;
  /** Author name */
  author: string;
  /** Author role/title */
  role?: string;
  /** Author company */
  company?: string;
  /** Author avatar */
  avatar?: string;
  /** Testimonial date */
  date?: string;
  /** Rating (1-5) */
  rating?: number;
  /** Whether testimonial is featured */
  featured?: boolean;
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Form field validation interface
 */
export interface FormValidation {
  /** Whether field is required */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Regex pattern */
  pattern?: string;
  /** Custom validation function */
  validator?: (value: string) => string | null;
}

/**
 * Form field interface
 */
export interface FormField extends BaseComponent {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  /** Field placeholder */
  placeholder?: string;
  /** Field value */
  value?: string;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is readonly */
  readonly?: boolean;
  /** Field validation rules */
  validation?: FormValidation;
  /** Field options (for select, radio, checkbox) */
  options?: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
  /** Field help text */
  helpText?: string;
  /** Field error message */
  error?: string;
}

// =============================================================================
// LAYOUT AND SEO TYPES
// =============================================================================

/**
 * SEO metadata interface
 */
export interface SEOMetadata {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Page keywords */
  keywords?: string[];
  /** Canonical URL */
  canonical?: string;
  /** Open Graph image */
  image?: string;
  /** Whether to index the page */
  noindex?: boolean;
  /** Whether to follow links */
  nofollow?: boolean;
  /** Structured data */
  structuredData?: object;
  /** Additional meta tags */
  additionalMeta?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

/**
 * Enhanced layout props interface
 */
export interface LayoutProps extends BaseComponent {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** SEO metadata */
  seo?: SEOMetadata;
  /** Fonts to preload */
  preloadFonts?: string[];
  /** Critical CSS to inline */
  criticalCSS?: string;
  /** Page-specific CSS classes for body */
  bodyClass?: string;
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether to show footer */
  showFooter?: boolean;
}

// =============================================================================
// COMPONENT STATE TYPES
// =============================================================================

/**
 * Loading state interface
 */
export interface LoadingState {
  /** Whether component is loading */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Loading progress (0-100) */
  progress?: number;
}

/**
 * Error state interface
 */
export interface ErrorState {
  /** Whether there's an error */
  hasError: boolean;
  /** Error message */
  message?: string;
  /** Error code */
  code?: string;
  /** Error details for debugging */
  details?: any;
  /** Recovery action */
  onRetry?: () => void;
}

/**
 * Generic component state interface
 */
export interface ComponentState {
  /** Loading state */
  loading?: LoadingState;
  /** Error state */
  error?: ErrorState;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Whether component is visible */
  visible?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Responsive breakpoint values
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Color variants
 */
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';

/**
 * Size variants
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Animation variants
 */
export type AnimationVariant = 'none' | 'fade' | 'slide' | 'scale' | 'bounce' | 'pulse';

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  /** Color scheme */
  colorScheme: 'light' | 'dark' | 'auto';
  /** Primary color */
  primaryColor?: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Border radius */
  borderRadius?: string;
  /** Animation duration */
  animationDuration?: string;
}
