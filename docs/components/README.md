# Component Documentation

This document provides comprehensive documentation for all components in the Hackerspace Mumbai website, including usage examples, props, accessibility features, and best practices.

## 📋 Table of Contents

- [Layout Components](#layout-components)
- [Content Components](#content-components)
- [Interactive Components](#interactive-components)
- [Utility Components](#utility-components)
- [Monitoring Components](#monitoring-components)
- [Testing Components](#testing-components)

## 🏗️ Layout Components

> Site-wide session premiere promotion (announcement bar, featured premiere section, and
> session card watch chip) is documented in [PremierePromotion.md](./PremierePromotion.md).

### Layout.astro

The main layout component that wraps all pages with consistent structure, SEO, and monitoring.

**Props:**
```typescript
interface Props {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}
```

**Usage:**
```astro
---
import Layout from '../components/Layout.astro';
---

<Layout 
  title="Page Title"
  description="Page description for SEO"
  type="article"
  author="Author Name"
  tags={['tag1', 'tag2']}
>
  <h1>Page Content</h1>
</Layout>
```

**Features:**
- ✅ Complete SEO meta tags (Open Graph, Twitter Cards)
- ✅ Structured data for organization and articles
- ✅ Accessibility landmarks and skip links
- ✅ Performance monitoring integration
- ✅ Security headers and CSP
- ✅ Theme management with system preference detection
- ✅ Service worker registration

**Accessibility:**
- Semantic HTML structure with proper landmarks
- Skip links for keyboard navigation
- Proper heading hierarchy
- Screen reader optimized

### Header.astro

Responsive navigation header with mobile hamburger menu.

**Features:**
- ✅ Mobile-first responsive design
- ✅ Hamburger menu for mobile devices
- ✅ Keyboard navigation support
- ✅ Theme toggle integration
- ✅ Proper ARIA labels and roles

**Usage:**
```astro
---
import Header from '../components/Header.astro';
---

<Header />
```

**Accessibility:**
- ARIA labels for navigation elements
- Keyboard accessible menu toggle
- Focus management for mobile menu
- Screen reader announcements

### Footer.astro

Site footer with social links and contact information.

**Features:**
- ✅ Responsive grid layout
- ✅ Social media links with proper security attributes
- ✅ Contact information with structured data
- ✅ Accessibility optimized

## 🎯 Content Components

### HeroSection.astro

Main hero section with responsive background and call-to-action.

**Props:**
```typescript
interface Props {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}
```

**Usage:**
```astro
---
import HeroSection from '../components/HeroSection.astro';
---

<HeroSection 
  title="Welcome to Hackerspace Mumbai"
  subtitle="Join Mumbai's largest open source community"
  ctaText="Join Us"
  ctaLink="/join"
  backgroundImage="/hero-bg.jpg"
/>
```

**Features:**
- ✅ Mobile-first responsive design
- ✅ Optimized background image handling
- ✅ Accessible typography with proper contrast
- ✅ Touch-friendly CTA buttons

**Accessibility:**
- Proper heading hierarchy
- High contrast text over images
- Alternative text for background images
- Keyboard accessible CTAs

### AboutSection.astro

About section with statistics and testimonials.

**Features:**
- ✅ Responsive stats grid
- ✅ Mobile-optimized testimonials
- ✅ Accessible data presentation
- ✅ Loading states for dynamic content

**Accessibility:**
- Semantic markup for statistics
- Proper labeling for data points
- Screen reader friendly testimonials

### EventsSection.astro

Events listing with responsive card layout.

**Props:**
```typescript
interface Props {
  events?: Event[];
  showPastEvents?: boolean;
  maxEvents?: number;
}
```

**Features:**
- ✅ Responsive card grid
- ✅ Touch-friendly interactions
- ✅ Loading and error states
- ✅ Accessible date formatting

**Usage:**
```astro
---
import EventsSection from '../components/EventsSection.astro';
---

<EventsSection 
  maxEvents={6}
  showPastEvents={false}
/>
```

### BlogCard.astro

Individual blog post card component with robust image handling.

**Props:**
```typescript
interface Props {
  post: CollectionEntry<'posts'>;
  featured?: boolean;
}
```

**Usage:**
```astro
---
import BlogCard from '../components/BlogCard.astro';
---

<BlogCard post={post} featured={true} />
```

**Features:**
- ✅ Robust image resolution with automatic fallback
- ✅ Support for Astro content collection images
- ✅ Responsive design with hover effects
- ✅ Accessibility optimized with proper alt text
- ✅ Performance optimized with lazy loading
- ✅ Comprehensive error handling

**Image Handling:**
- Automatic resolution of ImageMetadata objects
- Graceful fallback to placeholder image
- Support for legacy string paths
- Dynamic alt text generation
- Console warnings for debugging

**Accessibility:**
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader optimized
- High contrast design

### BlogSection.astro

Blog posts section with card-based layout using BlogCard components.

**Features:**
- ✅ Responsive blog card grid
- ✅ Image optimization with lazy loading
- ✅ Accessible content structure
- ✅ SEO-friendly markup

### GallerySection.astro

Image gallery with responsive grid and lazy loading.

**Features:**
- ✅ Responsive image grid
- ✅ Lazy loading for performance
- ✅ Touch-friendly interactions
- ✅ Keyboard navigation support

**Accessibility:**
- Alternative text for all images
- Keyboard navigation between images
- Screen reader descriptions

### SponsorsSection.astro

Sponsors showcase with responsive logo grid.

**Features:**
- ✅ Responsive sponsor logos
- ✅ Hover effects and animations
- ✅ Accessible link handling
- ✅ Loading states

## 🎮 Interactive Components

### CTAButton.astro

Reusable call-to-action button component.

**Props:**
```typescript
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  target?: '_blank' | '_self';
  rel?: string;
}
```

**Usage:**
```astro
---
import CTAButton from '../components/CTAButton.astro';
---

<CTAButton 
  href="/join"
  variant="primary"
  size="lg"
  ariaLabel="Join Hackerspace Mumbai community"
>
  Join Us
</CTAButton>
```

**Features:**
- ✅ Multiple variants and sizes
- ✅ Loading and disabled states
- ✅ Minimum 44px touch targets
- ✅ Proper focus indicators
- ✅ Security attributes for external links

**Accessibility:**
- ARIA labels and descriptions
- Keyboard navigation support
- High contrast focus indicators
- Screen reader announcements for state changes

### ModeToggle.astro / ThemeToggle.astro

Theme switching components for dark/light mode.

**Features:**
- ✅ System preference detection
- ✅ Smooth theme transitions
- ✅ Persistent theme storage
- ✅ Accessible toggle controls

**Accessibility:**
- ARIA labels for theme state
- Keyboard accessible
- Screen reader announcements

### SecureForm.astro

Secure form component with validation and sanitization.

**Props:**
```typescript
interface Props {
  action?: string;
  method?: 'GET' | 'POST';
  enctype?: string;
  novalidate?: boolean;
  autocomplete?: 'on' | 'off';
}
```

**Features:**
- ✅ Built-in input validation
- ✅ XSS protection and sanitization
- ✅ CSRF protection
- ✅ Accessible error messaging
- ✅ Loading states during submission

**Accessibility:**
- Proper form labels and descriptions
- Error message association
- Keyboard navigation
- Screen reader friendly validation

### NewsletterSection.astro

Newsletter signup form with validation.

**Features:**
- ✅ Email validation
- ✅ Success/error states
- ✅ Mobile-optimized form layout
- ✅ Accessible form controls

## 🛠️ Utility Components

### LazyImage.astro

Optimized image component with lazy loading.

**Props:**
```typescript
interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
  class?: string;
}
```

**Usage:**
```astro
---
import LazyImage from '../components/LazyImage.astro';
---

<LazyImage 
  src="/image.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Features:**
- ✅ Automatic format optimization (WebP, AVIF)
- ✅ Responsive image sizing
- ✅ Lazy loading for performance
- ✅ Proper aspect ratio maintenance

### LoadingSpinner.astro

Accessible loading spinner component.

**Props:**
```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  ariaLabel?: string;
}
```

**Features:**
- ✅ Multiple sizes and colors
- ✅ Accessible to screen readers
- ✅ Reduced motion support

### EmptyState.astro

Empty state component for when no content is available.

**Props:**
```typescript
interface Props {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  icon?: string;
}
```

**Features:**
- ✅ Customizable messaging
- ✅ Optional call-to-action
- ✅ Accessible design
- ✅ Consistent styling

### ErrorBoundary.astro

Error boundary component for graceful error handling.

**Features:**
- ✅ Graceful error fallbacks
- ✅ Error logging integration
- ✅ User-friendly error messages
- ✅ Accessibility considerations

## 📊 Monitoring Components

### MonitoringSystem.astro

Comprehensive monitoring system integration.

**Props:**
```typescript
interface Props {
  enableAnalytics?: boolean;
  enableErrorMonitoring?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableInDevelopment?: boolean;
  enableInProduction?: boolean;
}
```

**Features:**
- ✅ Privacy-respecting analytics
- ✅ Error monitoring and logging
- ✅ Core Web Vitals tracking
- ✅ Performance dashboards

### Analytics.astro

Privacy-focused analytics component using Plausible.

**Features:**
- ✅ No cookies or personal data collection
- ✅ Custom event tracking
- ✅ Outbound link tracking
- ✅ File download tracking

### ErrorMonitoring.astro

Comprehensive error monitoring and logging.

**Features:**
- ✅ JavaScript error capture
- ✅ Network error monitoring
- ✅ Performance issue detection
- ✅ User feedback integration

### PerformanceDashboard.astro

Real-time performance monitoring dashboard.

**Features:**
- ✅ Core Web Vitals visualization
- ✅ Performance alerts
- ✅ Real-time metrics
- ✅ Historical data tracking

## 🧪 Testing Components

### AccessibilityTester.astro

Automated accessibility testing integration.

**Features:**
- ✅ axe-core integration
- ✅ Real-time accessibility audits
- ✅ Detailed violation reporting
- ✅ Development-time feedback

### CrossBrowserTester.astro

Cross-browser compatibility testing.

**Features:**
- ✅ Browser-specific issue detection
- ✅ Feature compatibility checks
- ✅ Automated testing integration

### SecurityEnhancer.astro

Security enhancement and testing.

**Features:**
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Input validation
- ✅ Security header enforcement

## 🎨 Design System Integration

All components follow consistent design patterns:

- **Color System**: Uses DaisyUI theme colors with proper contrast ratios
- **Typography**: Consistent font scales and line heights
- **Spacing**: Standardized spacing using Tailwind's spacing scale
- **Breakpoints**: Mobile-first responsive breakpoints
- **Animations**: Smooth transitions with reduced motion support

## 🔧 Development Guidelines

### Component Creation Checklist

When creating new components, ensure:

- [ ] TypeScript interfaces for all props
- [ ] Proper error handling and fallback states
- [ ] Accessibility features (ARIA labels, keyboard navigation)
- [ ] Mobile-first responsive design
- [ ] Loading states for async operations
- [ ] Consistent styling with design system
- [ ] Documentation with usage examples
- [ ] Unit tests for component logic

### Performance Considerations

- Use lazy loading for images and heavy components
- Implement proper caching strategies
- Minimize JavaScript bundle size
- Optimize CSS delivery
- Monitor Core Web Vitals

### Accessibility Requirements

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

---

For more detailed information about specific components, refer to the individual component files and their inline documentation.