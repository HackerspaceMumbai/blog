# PRD: Hackerspace Mumbai Website Revamp (Astro Migration & Feature Enhancement)

## Overview

This document outlines the requirements for a complete revamp of the Hackerspace Mumbai website ([hackmum.in](http://hackmum.in)), migrating from Eleventy to Astro and introducing significant feature enhancements. The goal is to create a modern, high-performance, and community-driven platform for Mumbai’s largest open-source community and its flagship #meetup events.

---

## Purpose

- Modernize the tech stack for maintainability, performance, and scalability.
- Enhance the user experience for community members, newcomers, and event attendees.
- Showcase the community’s activities, blog content, and events in an engaging, accessible, and discoverable way.

---

## Target Audience

- Open-source enthusiasts, developers, and technologists in Mumbai and beyond.
- Newcomers interested in OSS, tech meetups, and community events.
- Existing Hackerspace Mumbai members and contributors.

---

## Core Features

### 1. Hero Section

- Prominent Hackerspace Mumbai branding, logo, and tagline.
- Brief mission statement and call-to-action (e.g., “Join the Community”, “Attend #meetup”).
- Social media links (Twitter, GitHub, LinkedIn, etc.).

### 2. Upcoming Events & Meetups

- List of upcoming meetups and events with dates, locations, and RSVP links.
- Integration with platforms like Meetup.com or custom event management.
- Highlight of the next major event.

### 3. Community Blog & News

- Latest blog posts with featured images, titles, summaries, and author info.
- “Read more” links to full posts.
- Tagging and categorization (e.g., #OSS, #meetup, #workshop).
- **Reading time estimate displayed for each blog post.**
- **Visual read progress indicator:** A colored navbar or progress bar at the top of each blog post that fills as the user scrolls, indicating how much of the post remains.

### 4. About the Community

- Brief history and impact of Hackerspace Mumbai.
- Key achievements, milestones, and community stats (e.g., years running, number of meetups, members).
- Testimonials or quotes from members.

### 5. Get Involved / Join Us

- Clear instructions on how to join the community (e.g., Discord, Telegram, mailing list).
- Volunteer and contribution opportunities (e.g., “How to Contribute”, “Become a Speaker”).
- Links to GitHub and open-source projects.

### 6. Sponsors & Partners

- Logos and links for sponsors, partners, and supporters.

### 7. Media Gallery

- Photos and videos from past events and meetups.
- Community highlights.

### 8. Accessibility & Performance

- Accessibility best practices (WCAG compliance).
- SEO and social sharing metadata (OGP, Twitter cards, schema.org JSON-LD).
- Sitemap and robots.txt.

### 9. Security & Privacy

- Strong Content Security Policy (CSP).
- Privacy policy and terms of use.

### 10. Footer

- Quick links (About, Blog, Events, Contact, Code of Conduct).
- Copyright and license info.
- Social media and contact links.

---

## Technical Requirements (Astro-specific, not provided out of the box)

- Integration with external event platforms (e.g., Meetup.com API).
- Custom analytics integration (if not using default Astro integrations).
- Automated build, test, and deployment workflows (CI/CD).
- Custom share buttons and social integrations.
- Community member directory or profiles (if implemented).
- Newsletter signup integration.

---

## Stretch Goals

- Member directory or profiles.
- Interactive map of meetup locations.
- Live chat or Q&A widget.
- Newsletter signup.

---

## Migration Notes

- All features of the previous Eleventy-based blog (including performance, SEO, and accessibility optimizations) must be matched or exceeded.
- Astro’s built-in features (image optimization, static generation, modern CSS/JS handling) will be leveraged to reduce custom technical requirements.

---

## Success Criteria

- All core features implemented and fully functional.
- Site achieves high scores in performance, accessibility, and SEO audits.
- Positive feedback from community members and event attendees.
- Easy onboarding for new contributors and maintainers.

---
