# Events archive sync

Hackmum past-event pages can rebuild automatically when the canonical archive
([HackerspaceMumbai/events](https://github.com/HackerspaceMumbai/events)) changes
official published artifacts.

## Flow

```text
Speaker/organizer PR merges on events main
  → events workflow "Notify website sync" validates + POSTs HACKMUM_SYNC_WEBHOOK
  → Netlify Build Hook rebuilds this site
  → Build fetches event.yml + speakers/*/speaker.md (and media/photos) from GitHub
  → Past-event pages show updated metadata and speaker resources
```

Community contributions under `community/**` in the events archive do **not**
trigger rebuilds and are not auto-published here.

## Maintainer setup

1. In Netlify → Site configuration → Build & deploy → Build hooks, create a hook
   (for example `events-archive-sync`).
2. In the **events** repository Actions secrets, set `HACKMUM_SYNC_WEBHOOK` to
   that Build Hook URL.
3. In the events repo, run workflow **Notify website sync** (`workflow_dispatch`)
   and confirm a Netlify deploy starts.
4. Confirm a past-event page with `archiveLinks` (for example
   `/past-events/september-2026-github-copilot-dev-days-mumbai/`) shows speaker
   resources sourced from `speakers/*/speaker.md` after rebuild.

## Content contract

Past-event markdown may keep hand-authored fields and should set `archiveLinks`
pointing at the events tree. At build time:

- Prefer `event.yml` for title, date, description, and venue/city when available
- Merge speaker resources from `speakers/*/speaker.md` frontmatter (`slides`,
  `repository`, `recording`) ahead of local `speakerResources`
- Continue loading official gallery photos from `archiveLinks.photosUrl` when
  local `src/assets/images/events/.../photos` is empty

Do not auto-ingest `community/**` into past-event pages until a moderated
publication path exists.
