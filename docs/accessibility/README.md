# Accessibility Implementation Guidelines

This document provides comprehensive guidelines for implementing accessibility features in the Hackerspace Mumbai website, following WCAG 2.1 AA standards.

## 📋 Table of Contents

- [Overview](#overview)
- [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
- [Implementation Guidelines](#implementation-guidelines)
- [Testing Procedures](#testing-procedures)
- [Common Patterns](#common-patterns)
- [Tools and Resources](#tools-and-resources)

## 🎯 Overview

Accessibility is a core principle of our website design. Every component and feature is built with accessibility in mind, ensuring that all users, regardless of their abilities, can access and interact with our content.

### Our Accessibility Commitments

- **Universal Access**: Content accessible to all users
- **Keyboard Navigation**: Full functionality without a mouse
- **Screen Reader Support**: Comprehensive screen reader compatibility
- **Visual Accessibility**: High contrast and readable text
- **Motor Accessibility**: Touch-friendly interactions
- **Cognitive Accessibility**: Clear and simple interfaces

## ✅ WCAG 2.1 AA Compliance

### Principle 1: Perceivable

#### 1.1 Text Alternatives
- **Implementation**: All images have descriptive alt text
- **Code Example**:
```astro
<LazyImage 
  src="/event-photo.jpg"
  alt="Developers collaborating at Hackerspace Mumbai meetup"
  width={800}
  height={600}
/>
```

#### 1.2 Time-based Media
- **Implementation**: Video content includes captions and transcripts
- **Code Example**:
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
  <p>Your browser doesn't support video. <a href="video.mp4">Download the video</a>.</p>
</video>
```

#### 1.3 Adaptable
- **Implementation**: Semantic HTML structure with proper landmarks
- **Code Example**:
```astro
<main role="main" aria-labelledby="main-heading">
  <h1 id="main-heading">Page Title</h1>
  <section aria-labelledby="events-heading">
    <h2 id="events-heading">Upcoming Events</h2>
  </section>
</main>
```

#### 1.4 Distinguishable
- **Implementation**: High contrast colors and scalable text
- **Requirements**:
  - Minimum contrast ratio of 4.5:1 for normal text
  - Minimum contrast ratio of 3:1 for large text
  - Text can be resized up to 200% without loss of functionality

### Principle 2: Operable

#### 2.1 Keyboard Accessible
- **Implementation**: All interactive elements are keyboard accessible
- **Code Example**:
```astro
<button 
  class="btn btn-primary"
  aria-label="Join Hackerspace Mumbai community"
  onkeydown="handleKeyDown(event)"
>
  Join Us
</button>
```

#### 2.2 Enough Time
- **Implementation**: No time limits on content consumption
- **Exception**: Forms have reasonable timeout warnings

#### 2.3 Seizures and Physical Reactions
- **Implementation**: No flashing content above 3Hz
- **Code Example**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 2.4 Navigable
- **Implementation**: Clear navigation structure with skip links
- **Code Example**:
```astro
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#navigation" class="skip-link">Skip to navigation</a>
```

### Principle 3: Understandable

#### 3.1 Readable
- **Implementation**: Clear language and proper heading hierarchy
- **Code Example**:
```astro
<article>
  <h1>Main Article Title</h1>
  <h2>Section Heading</h2>
  <h3>Subsection Heading</h3>
</article>
```

#### 3.2 Predictable
- **Implementation**: Consistent navigation and interaction patterns
- **Guidelines**:
  - Navigation appears in the same location on every page
  - Interactive elements behave consistently
  - Form submission provides clear feedback

#### 3.3 Input Assistance
- **Implementation**: Clear form labels and error messages
- **Code Example**:
```astro
<div class="form-control">
  <label class="label" for="email">
    <span class="label-text">Email Address *</span>
  </label>
  <input 
    type="email" 
    id="email"
    name="email"
    class="input input-bordered"
    aria-describedby="email-error"
    aria-required="true"
    required
  />
  <div id="email-error" class="label-text-alt text-error" role="alert">
    <!-- Error message appears here -->
  </div>
</div>
```

### Principle 4: Robust

#### 4.1 Compatible
- **Implementation**: Valid HTML and ARIA usage
- **Testing**: Regular validation with HTML validators and accessibility tools

## 🛠️ Implementation Guidelines

### Semantic HTML Structure

Always use semantic HTML elements for their intended purpose:

```astro
<!-- Good -->
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/events">Events</a></li>
    <li><a href="/blog">Blog</a></li>
  </ul>
</nav>

<!-- Avoid -->
<div class="navigation">
  <div class="nav-item">Home</div>
  <div class="nav-item">Events</div>
</div>
```

### ARIA Labels and Roles

Use ARIA attributes to enhance semantic meaning:

```astro
<!-- Descriptive labels -->
<button aria-label="Close dialog" onclick="closeDialog()">×</button>

<!-- Live regions for dynamic content -->
<div aria-live="polite" id="status-message"></div>

<!-- Expanded/collapsed states -->
<button 
  aria-expanded="false" 
  aria-controls="mobile-menu"
  onclick="toggleMenu()"
>
  Menu
</button>
```

### Focus Management

Ensure proper focus management for interactive elements:

```css
/* Visible focus indicators */
.btn:focus,
.input:focus,
.link:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
```

### Color and Contrast

Ensure sufficient color contrast:

```css
/* High contrast text */
.text-primary {
  color: #1a365d; /* Contrast ratio: 4.5:1 on white */
}

.text-secondary {
  color: #2d3748; /* Contrast ratio: 4.5:1 on white */
}

/* Never rely on color alone */
.error-message {
  color: #e53e3e;
  border-left: 3px solid #e53e3e; /* Visual indicator */
}

.error-message::before {
  content: "⚠ "; /* Icon indicator */
}
```

### Touch Targets

Ensure minimum 44px touch targets:

```css
.btn,
.input,
.link {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* For smaller visual elements, use transparent padding */
.icon-button {
  padding: 12px;
  background: transparent;
  border: none;
}
```

## 🧪 Testing Procedures

### Automated Testing

#### axe-core Integration

```javascript
// Automated accessibility testing
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility test', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

#### Lighthouse Accessibility Audit

```bash
# Run Lighthouse accessibility audit
lighthouse https://hackmum.in --only-categories=accessibility --output=json
```

### Manual Testing

#### Keyboard Navigation Testing

1. **Tab Navigation**: Ensure all interactive elements are reachable
2. **Enter/Space**: Activate buttons and links
3. **Arrow Keys**: Navigate within components (menus, carousels)
4. **Escape**: Close modals and dropdowns

#### Screen Reader Testing

Test with popular screen readers:
- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

#### Visual Testing

1. **Zoom to 200%**: Ensure content remains usable
2. **High Contrast Mode**: Test in OS high contrast mode
3. **Color Blindness**: Use tools like Stark or Colorblinding

### Testing Checklist

- [ ] All images have appropriate alt text
- [ ] All form inputs have associated labels
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets WCAG AA standards
- [ ] Content is readable when zoomed to 200%
- [ ] Screen reader announces content correctly
- [ ] No keyboard traps exist
- [ ] Error messages are clearly associated with inputs
- [ ] Page structure uses proper heading hierarchy

## 🎨 Common Patterns

### Accessible Forms

```astro
<form class="space-y-4" novalidate>
  <div class="form-control">
    <label class="label" for="name">
      <span class="label-text">Full Name *</span>
    </label>
    <input 
      type="text" 
      id="name"
      name="name"
      class="input input-bordered"
      aria-describedby="name-help name-error"
      aria-required="true"
      required
    />
    <div id="name-help" class="label-text-alt">
      Enter your first and last name
    </div>
    <div id="name-error" class="label-text-alt text-error" role="alert">
      <!-- Error message appears here -->
    </div>
  </div>
  
  <button type="submit" class="btn btn-primary">
    Submit Form
  </button>
</form>
```

### Accessible Navigation

```astro
<nav role="navigation" aria-label="Main navigation">
  <div class="navbar">
    <div class="navbar-start">
      <a href="/" class="btn btn-ghost text-xl" aria-label="Hackerspace Mumbai Home">
        HackMum
      </a>
    </div>
    
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1" role="menubar">
        <li role="none">
          <a href="/events" role="menuitem">Events</a>
        </li>
        <li role="none">
          <a href="/blog" role="menuitem">Blog</a>
        </li>
      </ul>
    </div>
    
    <div class="navbar-end lg:hidden">
      <button 
        class="btn btn-square btn-ghost"
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="mobile-menu"
        onclick="toggleMobileMenu()"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
  </div>
  
  <div id="mobile-menu" class="lg:hidden" hidden>
    <ul class="menu menu-vertical px-1" role="menu">
      <li role="none">
        <a href="/events" role="menuitem">Events</a>
      </li>
      <li role="none">
        <a href="/blog" role="menuitem">Blog</a>
      </li>
    </ul>
  </div>
</nav>
```

### Accessible Modals

```astro
<div 
  id="modal" 
  class="modal" 
  role="dialog" 
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  aria-hidden="true"
>
  <div class="modal-box">
    <h3 id="modal-title" class="font-bold text-lg">Modal Title</h3>
    <p id="modal-description" class="py-4">Modal content description</p>
    
    <div class="modal-action">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmAction()">Confirm</button>
    </div>
    
    <button 
      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      aria-label="Close modal"
      onclick="closeModal()"
    >
      ✕
    </button>
  </div>
</div>
```

## 🔧 Tools and Resources

### Development Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in Chrome accessibility audit
- **Color Oracle**: Color blindness simulator
- **Stark**: Figma/Sketch accessibility plugin

### Screen Readers

- **NVDA**: Free Windows screen reader
- **VoiceOver**: Built-in macOS/iOS screen reader
- **TalkBack**: Built-in Android screen reader
- **JAWS**: Commercial Windows screen reader

### Testing Resources

- **WebAIM**: Comprehensive accessibility resources
- **A11y Project**: Community-driven accessibility checklist
- **WCAG Guidelines**: Official W3C accessibility guidelines
- **MDN Accessibility**: Mozilla's accessibility documentation

### Color Contrast Tools

- **WebAIM Contrast Checker**: Online contrast ratio calculator
- **Colour Contrast Analyser**: Desktop application
- **Stark**: Design tool plugin for contrast checking

## 📚 Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

---

Remember: Accessibility is not a checklist item—it's an ongoing commitment to inclusive design that benefits all users.