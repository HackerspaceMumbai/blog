# Mobile-First Design Guidelines

This document outlines the mobile-first design principles and patterns used in the Hackerspace Mumbai website, ensuring optimal user experience across all devices.

## 📋 Table of Contents

- [Mobile-First Philosophy](#mobile-first-philosophy)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Layout Patterns](#layout-patterns)
- [Typography System](#typography-system)
- [Touch Interactions](#touch-interactions)
- [Performance Considerations](#performance-considerations)
- [Design Tokens](#design-tokens)

## 📱 Mobile-First Philosophy

### Core Principles

1. **Content First**: Prioritize essential content and functionality
2. **Progressive Enhancement**: Start with basic functionality, enhance for larger screens
3. **Touch-Friendly**: Design for finger navigation and touch interactions
4. **Performance Focused**: Optimize for slower mobile connections
5. **Accessibility Minded**: Ensure usability across all abilities and devices

### Design Approach

```css
/* Mobile-first CSS approach */
.component {
  /* Base styles for mobile (320px+) */
  padding: 1rem;
  font-size: 1rem;
}

@media (min-width: 768px) {
  /* Tablet styles */
  .component {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}

@media (min-width: 1024px) {
  /* Desktop styles */
  .component {
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

## 📐 Responsive Breakpoints

### Tailwind CSS Breakpoints

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small tablets and large phones
      'md': '768px',   // Tablets
      'lg': '1024px',  // Small laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large desktops
    }
  }
}
```

### Usage Examples

```astro
<!-- Responsive grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>

<!-- Responsive text sizing -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<!-- Responsive spacing -->
<section class="px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
  <!-- Section content -->
</section>
```

## 🏗️ Layout Patterns

### Container System

```astro
<!-- Full-width container with max-width constraints -->
<div class="container mx-auto px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- Content -->
  </div>
</div>

<!-- Responsive padding -->
<section class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
  <!-- Section content -->
</section>
```

### Grid Layouts

```astro
<!-- Responsive card grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  <!-- Cards -->
</div>

<!-- Responsive two-column layout -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
  <div><!-- Content column --></div>
  <div><!-- Sidebar column --></div>
</div>
```

### Flexbox Patterns

```astro
<!-- Responsive navigation -->
<nav class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div class="logo"><!-- Logo --></div>
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
    <!-- Navigation items -->
  </div>
</nav>

<!-- Responsive hero section -->
<section class="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
  <div class="flex-1 text-center lg:text-left">
    <!-- Hero content -->
  </div>
  <div class="flex-1">
    <!-- Hero image -->
  </div>
</section>
```

## ✍️ Typography System

### Responsive Font Scales

```css
/* Base typography system */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
```

### Responsive Typography Examples

```astro
<!-- Responsive headings -->
<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
  Main Heading
</h1>

<h2 class="text-2xl sm:text-3xl lg:text-4xl font-semibold">
  Section Heading
</h2>

<p class="text-base sm:text-lg leading-relaxed">
  Body text that scales appropriately across devices.
</p>

<!-- Responsive text alignment -->
<div class="text-center sm:text-left">
  <h3 class="text-xl sm:text-2xl font-bold mb-4">
    Centered on mobile, left-aligned on larger screens
  </h3>
</div>
```

### Reading Experience

```css
/* Optimal line lengths for readability */
.prose {
  max-width: 65ch; /* Optimal reading width */
  line-height: 1.6; /* Comfortable line spacing */
}

/* Responsive prose scaling */
.prose-sm { font-size: 0.875rem; }
.prose-base { font-size: 1rem; }
.prose-lg { font-size: 1.125rem; }
.prose-xl { font-size: 1.25rem; }
```

## 👆 Touch Interactions

### Touch Target Guidelines

```css
/* Minimum touch target sizes */
.btn,
.input,
.link {
  min-height: 44px; /* iOS recommendation */
  min-width: 44px;
  padding: 12px 16px;
}

/* Larger touch targets for primary actions */
.btn-primary {
  min-height: 48px;
  padding: 14px 20px;
}

/* Touch-friendly spacing */
.touch-spacing {
  margin: 8px 0; /* Minimum 8px between touch targets */
}
```

### Interactive States

```css
/* Touch-friendly hover states */
@media (hover: hover) {
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* Active states for touch */
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Focus states for keyboard navigation */
.btn:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
```

### Gesture-Friendly Components

```astro
<!-- Swipeable carousel -->
<div class="carousel carousel-center max-w-md p-4 space-x-4 bg-neutral rounded-box">
  <div class="carousel-item">
    <img src="image1.jpg" class="rounded-box" alt="Image 1" />
  </div>
  <div class="carousel-item">
    <img src="image2.jpg" class="rounded-box" alt="Image 2" />
  </div>
</div>

<!-- Pull-to-refresh indicator -->
<div class="pull-to-refresh hidden">
  <div class="loading loading-spinner loading-sm"></div>
  <span class="text-sm">Pull to refresh</span>
</div>
```

## ⚡ Performance Considerations

### Image Optimization

```astro
<!-- Responsive images with multiple formats -->
<picture>
  <source 
    srcset="/image-320.avif 320w, /image-640.avif 640w, /image-1280.avif 1280w"
    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
    type="image/avif"
  />
  <source 
    srcset="/image-320.webp 320w, /image-640.webp 640w, /image-1280.webp 1280w"
    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
    type="image/webp"
  />
  <img 
    src="/image-640.jpg"
    srcset="/image-320.jpg 320w, /image-640.jpg 640w, /image-1280.jpg 1280w"
    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
    alt="Descriptive alt text"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Critical CSS

```css
/* Critical above-the-fold styles */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Non-critical styles loaded asynchronously */
@media (min-width: 1024px) {
  .hero {
    background-image: url('/hero-bg-large.jpg');
  }
}
```

### Font Loading Strategy

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>

<!-- Load fonts with display: swap -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-display: swap;
    font-weight: 100 900;
  }
</style>
```

## 🎨 Design Tokens

### Color System

```css
:root {
  /* Primary colors */
  --primary: #FFC107;
  --primary-focus: #FFB300;
  --primary-content: #000000;
  
  /* Secondary colors */
  --secondary: #1976D2;
  --secondary-focus: #1565C0;
  --secondary-content: #FFFFFF;
  
  /* Neutral colors */
  --base-100: #FFFFFF;
  --base-200: #F5F5F5;
  --base-300: #E0E0E0;
  --base-content: #1F2937;
  
  /* Semantic colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --base-100: #1F2937;
  --base-200: #374151;
  --base-300: #4B5563;
  --base-content: #F9FAFB;
}
```

### Spacing System

```css
/* Consistent spacing scale */
.space-1 { margin: 0.25rem; }
.space-2 { margin: 0.5rem; }
.space-3 { margin: 0.75rem; }
.space-4 { margin: 1rem; }
.space-5 { margin: 1.25rem; }
.space-6 { margin: 1.5rem; }
.space-8 { margin: 2rem; }
.space-10 { margin: 2.5rem; }
.space-12 { margin: 3rem; }
.space-16 { margin: 4rem; }
.space-20 { margin: 5rem; }
.space-24 { margin: 6rem; }
```

### Component Sizing

```css
/* Consistent component sizes */
.btn-xs { height: 1.5rem; padding: 0 0.5rem; font-size: 0.75rem; }
.btn-sm { height: 2rem; padding: 0 0.75rem; font-size: 0.875rem; }
.btn-md { height: 3rem; padding: 0 1rem; font-size: 0.875rem; }
.btn-lg { height: 4rem; padding: 0 1.5rem; font-size: 1.125rem; }

.input-xs { height: 1.5rem; padding: 0 0.5rem; font-size: 0.75rem; }
.input-sm { height: 2rem; padding: 0 0.75rem; font-size: 0.875rem; }
.input-md { height: 3rem; padding: 0 1rem; font-size: 0.875rem; }
.input-lg { height: 4rem; padding: 0 1.5rem; font-size: 1.125rem; }
```

## 📱 Mobile-Specific Patterns

### Navigation Patterns

```astro
<!-- Bottom navigation for mobile -->
<nav class="btm-nav sm:hidden">
  <button class="active">
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
    </svg>
    <span class="btm-nav-label">Home</span>
  </button>
  <button>
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
    </svg>
    <span class="btm-nav-label">Events</span>
  </button>
</nav>

<!-- Hamburger menu for mobile -->
<div class="drawer lg:drawer-open">
  <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content -->
    <div class="navbar lg:hidden">
      <div class="flex-none">
        <label for="drawer-toggle" class="btn btn-square btn-ghost">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </label>
      </div>
    </div>
  </div>
  <div class="drawer-side">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <aside class="w-80 min-h-full bg-base-200">
      <!-- Sidebar content -->
    </aside>
  </div>
</div>
```

### Form Patterns

```astro
<!-- Mobile-optimized form -->
<form class="space-y-4">
  <div class="form-control">
    <label class="label">
      <span class="label-text">Email</span>
    </label>
    <input 
      type="email" 
      class="input input-bordered w-full"
      inputmode="email"
      autocomplete="email"
      placeholder="your@email.com"
    />
  </div>
  
  <div class="form-control">
    <label class="label">
      <span class="label-text">Phone</span>
    </label>
    <input 
      type="tel" 
      class="input input-bordered w-full"
      inputmode="tel"
      autocomplete="tel"
      placeholder="+91 98765 43210"
    />
  </div>
  
  <button type="submit" class="btn btn-primary w-full">
    Submit
  </button>
</form>
```

### Card Layouts

```astro
<!-- Mobile-first card design -->
<div class="card bg-base-100 shadow-xl">
  <figure class="aspect-video">
    <img src="image.jpg" alt="Card image" class="object-cover w-full h-full" />
  </figure>
  <div class="card-body p-4 sm:p-6">
    <h2 class="card-title text-lg sm:text-xl">Card Title</h2>
    <p class="text-sm sm:text-base opacity-70">Card description</p>
    <div class="card-actions justify-end mt-4">
      <button class="btn btn-primary btn-sm sm:btn-md">Action</button>
    </div>
  </div>
</div>
```

## 🔧 Development Tools

### Responsive Design Testing

```javascript
// Viewport testing breakpoints
const breakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  large: { width: 1920, height: 1080 }
};

// Test responsive behavior
Object.entries(breakpoints).forEach(([device, dimensions]) => {
  test(`Layout works on ${device}`, async ({ page }) => {
    await page.setViewportSize(dimensions);
    await page.goto('/');
    // Test responsive behavior
  });
});
```

### Performance Testing

```javascript
// Mobile performance testing
test('Mobile performance', async ({ page }) => {
  // Simulate slow 3G connection
  await page.route('**/*', route => {
    route.continue({
      // Simulate slow connection
      delay: Math.random() * 1000
    });
  });
  
  await page.goto('/');
  
  // Test Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve(entries);
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    });
  });
  
  // Assert performance metrics
  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.fid).toBeLessThan(100);
  expect(metrics.cls).toBeLessThan(0.1);
});
```

## 📚 Best Practices Summary

### Do's ✅

- Start with mobile design and enhance for larger screens
- Use relative units (rem, em, %) for scalability
- Implement touch-friendly interactions (44px minimum)
- Optimize images for different screen densities
- Test on real devices, not just browser dev tools
- Consider thumb-friendly navigation zones
- Use system fonts for better performance
- Implement proper focus management

### Don'ts ❌

- Don't hide important content on mobile
- Don't rely solely on hover states
- Don't use fixed pixel values for responsive elements
- Don't ignore landscape orientation on mobile
- Don't forget about one-handed usage patterns
- Don't assume fast internet connections
- Don't neglect keyboard navigation
- Don't use tiny touch targets

### Performance Checklist

- [ ] Images are optimized and responsive
- [ ] Critical CSS is inlined
- [ ] Fonts use `font-display: swap`
- [ ] JavaScript is loaded asynchronously
- [ ] Core Web Vitals meet targets
- [ ] Offline functionality is considered
- [ ] Service worker is implemented
- [ ] Bundle size is optimized

---

Remember: Mobile-first design isn't just about screen size—it's about creating focused, performant, and accessible experiences that work well everywhere.