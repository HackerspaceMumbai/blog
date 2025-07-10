# Copilot Instructions for Hackerspace Mumbai Community Site (Astro)

## Project Overview
- This is the official site for Hackerspace Mumbai, built with [Astro](https://astro.build/).
- The site migrated from Eleventy to Astro for better performance and maintainability.
- Major features: Hero section, events/meetups, blog/news, about, join/contribute, sponsors, media gallery, accessibility, SEO, security, and privacy.

## Key Architecture & Patterns
- **Astro Components:** All UI is built from `.astro` components in `src/components/` (e.g., `Header.astro`, `Footer.astro`, `Layout.astro`).
- **Pages:** Route-based files in `src/pages/` (e.g., `index.astro`, `blog/`).
- **Content:** Blog posts and config in `src/content/`.
- **Assets:** Images and static files in `src/assets/images/` and `public/`.
- **Styling:** Global styles in `src/styles/global.css`; component styles are colocated or imported. Uses Tailwind CSS v4 for utility-first styling. And its uses ShadCN theme as a base which is in `src/styles/global.css`.
- **Config:** Project-wide config in `astro.config.mjs`, TypeScript in `tsconfig.json`.

## Developer Workflows
- **Install dependencies:** `pnpm install`
- **Start dev server:** `pnpm dev` (serves at `localhost:4321`)
- **Build for production:** `pnpm build` (outputs to `./dist/`)
- **Preview build:** `pnpm preview`
- **No custom test or lint scripts** are defined yet; follow Astro/TypeScript best practices.

## Project-Specific Conventions
- **Content-first:** Blog posts and static content live in `src/content/posts/`.
- **Component-driven:** All UI logic is in Astro components; avoid direct DOM manipulation.
- **Image usage:** Place new images in `src/assets/images/` or `public/images/` and reference with relative paths.
- **Accessibility & SEO:** Follow best practices; check for alt text, metadata, and semantic HTML in components.
- **Security:** CSP and privacy policy are implemented; review before adding new scripts or integrations.

## Integration Points
- **Events:** Planned integration with external event APIs (e.g., Meetup.com) – see PRD for details.
- **Analytics:** Custom analytics may be added; check for existing integrations before adding new ones.
- **Newsletter/Community:** Future integrations for signups and member directories are possible.

## Examples
- To add a new blog post: create a markdown file in `src/content/posts/`.
- To add a new page: create a `.astro` file in `src/pages/`.
- To update the header/footer: edit `src/components/Header.astro` or `Footer.astro`.

## References
- See `README.md` for project structure and workflow.
- See `docs/PRD.md` for product requirements and feature details.

---

**If you are unsure about a workflow or convention, check the README or ask for clarification.**
