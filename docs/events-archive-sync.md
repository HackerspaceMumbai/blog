# Events archive sync

Hackmum past-event pages use the canonical archive
([HackerspaceMumbai/events](https://github.com/HackerspaceMumbai/events)).
Archive changes do not automatically deploy the Cloudflare production site.
The existing Netlify Build Hook is a legacy integration and does not update
`hackmum.in`.

## Flow

```text
Speaker/organizer PR merges on events main
  → Maintainer runs the blog's "Deploy production" workflow on main
  → Cloudflare build fetches gallery data; detail pages also fetch archive data on demand
  → Production deploy publishes the rebuilt site
```

Community contributions under `community/**` in the events archive are **not**
auto-published into Hackmum pages. The events `Notify website sync` workflow also
excludes `community/**` from rebuild triggers (official artifacts only: `event.yml`,
agenda/recap, `speakers/**`, `resources/**`, `media/**`).

## Maintainer setup

1. After official archive changes merge, run **Deploy production** in the blog
   repository Actions tab using `main`, or run
   `gh workflow run production-deploy.yml --repo HackerspaceMumbai/blog --ref main`.
2. Complete any required production environment approval and confirm that the
   workflow succeeds and deploys `hackmum-blog`.
3. Check the relevant past-event page and gallery on `hackmum.in` for the
   updated official archive content. A Netlify deploy alone is not verification
   of production.

## Content contract

Past-event markdown may keep hand-authored fields and should set `archiveLinks`
pointing at the events tree. Gallery pages ingest archive data at build time;
event detail pages fetch it on demand and memoize successful results per Worker
isolate. Both use local frontmatter when archive data is unavailable:

- Prefer `event.yml` for title, date, description, and venue/city when available
- Merge speaker resources from `speakers/*/speaker.md` frontmatter (`slides`,
  `repository`, `recording`) ahead of local `speakerResources`
- Preserve each speaker's `sessionTitle` on ingested resources; the event detail
  page groups resources into **Sessions** by that title (falling back to the
  resource title when `sessionTitle` is absent)
- Event-level rows such as a "canonical archive" GitHub link are excluded from
  Sessions and belong in the detail page archive footer instead
- Optional detail-page storytelling fields (local only, not fetched from the
  archive): `highlights`, `recapPostSlug`, and `recapExcerpt`. When both recap
  fields are set, the page shows a teaser that links to the blog post. Omit them
  for older events — sections stay hidden with no empty states
- Continue loading official gallery photos from `archiveLinks.photosUrl` when
  local `src/assets/images/events/.../photos` is empty. Gallery pages are
  prerendered, so updated photos appear after the site is rebuilt and deployed.

Do not auto-ingest `community/**` into past-event pages until a moderated
publication path exists.
