# Session Premiere Promotion

A single configuration drives the site-wide promotion of a YouTube session premiere:
the announcement bar, the featured premiere section on the event page, and the extra
"Watch Premiere" chip on the matching session resource card.

**The canonical destination for every announcement is the event page on hackmum.in**, not
YouTube. This keeps traffic, SEO value, and session discovery on the site; only the explicit
watch buttons go to YouTube.

## Configuration

[`src/data/featuredSessionPremiere.ts`](../../src/data/featuredSessionPremiere.ts) exports
`FEATURED_SESSION_PREMIERE` (type `FeaturedSessionPremiere` from
[`src/utils/premiere.ts`](../../src/utils/premiere.ts)):

| Field | Purpose |
| --- | --- |
| `enabled` | Set to `false` (or export `null`) to retire the promotion everywhere. |
| `eventSlug` | Past-event slug the premiere belongs to; the featured section only renders on that page. |
| `eventUrl` | Canonical landing page used by the announcement bar. |
| `sessionTitle` | Promotional title shown in the bar and featured section. |
| `sessionTitleAliases` | Fallback titles (e.g. the archive's own `sessionTitle`) used only when speaker matching fails. |
| `speakerName` | **Primary match key** for the session card — must equal the `name` in the archive's `speaker.md`. |
| `speakerTitle`, `description` | Speaker and abstract copy. |
| `watchUrl` | YouTube watch URL (premiere and recording share one URL). |
| `thumbnailUrl` | Defaults to the custom YouTube thumbnail via `getYouTubeThumbnailUrl(watchUrl)`. |
| `startAt`, `endAt` | ISO timestamps (with offset) bounding the premiere. |
| `announcementPrefix`, `announcementLivePrefix`, `announcementCtaText` | Announcement bar copy. |

## Lifecycle states

`resolvePremiereState()` returns `upcoming`, `live`, or `post`. Pages are server-rendered with
the correct state, and [`public/scripts/premiere-promo.js`](../../public/scripts/premiere-promo.js)
keeps it accurate while the page stays open.

| State | Announcement bar | Featured section | Session card chip |
| --- | --- | --- | --- |
| `upcoming` | Visible, with "premiering tonight" copy | Badge + live countdown | `Watch Premiere` |
| `live` | Visible, with "premiering now" copy | "Premiering now" badge | `Watch Premiere` |
| `post` | Removed | Recording badge, "Watch Recording" | `Watch Recording` |

## Components

- [`AnnouncementBar.astro`](../../src/components/AnnouncementBar.astro) — rendered by
  `Layout.astro` above the navigation on every page. The whole banner links to `eventUrl`,
  and the dismiss button stores a per-premiere key in `localStorage`.
- [`FeaturedPremiereSection.astro`](../../src/components/FeaturedPremiereSection.astro) —
  rendered at the top of the event page, above highlights and session cards.
- [`SessionResourceCard.astro`](../../src/components/SessionResourceCard.astro) — adds a
  filled watch chip next to the existing resource chips when the session matches the premiere.
  Card ordering is unchanged.

## Session card matching

Session cards are built at build time from `speaker.md` frontmatter in the
[events repo](https://github.com/HackerspaceMumbai/events), so their titles can be reworded
upstream at any time. `isPremiereSession()` therefore matches **speaker-first**:

1. If any of the card's `speakers` normalizes to `speakerName`, it is the premiere session.
2. Otherwise the card title is compared against `sessionTitle` and `sessionTitleAliases`
   (case-, punctuation- and whitespace-insensitive), which covers archives that list a
   session without a speaker name.

For the Dev Days promotion, `speakerName: 'Pratik Pathak'` matches the `name` field in
`speakers/zpratikpathak/speaker.md`, and that archive's `sessionTitle`
("You Shouldn't Prompt GitHub Copilot Agent…") is kept as an alias. Both paths are covered by
tests in [`premiere.test.js`](../../src/utils/__tests__/premiere.test.js), including one that
runs the shipped config against the real frontmatter.

If no card matches, `PastEventDetail.astro` logs a build-time `[premiere]` warning listing the
session titles it saw, so a renamed session never silently drops the watch link.

The homepage hero is intentionally untouched; the hero's own premiere takeover is configured
separately in `src/data/featuredPremiere.ts`.

## Script contract

`premiere-promo.js` initialises once per page and handles every element marked
`data-premiere-promo` with `data-start-at` / `data-end-at` (epoch milliseconds):

- `data-premiere-state="upcoming live"` — descendant is shown only in the listed states.
- `data-premiere-label` with `data-label-upcoming` / `data-label-live` / `data-label-post` —
  text content swapped per state.
- `data-premiere-countdown` (and `data-premiere-countdown-a11y`) — countdown target.
- `data-hide-after-end="true"` — remove the element once the premiere ends.
- `data-dismiss-key` plus `data-premiere-dismiss` — dismissible, persisted in `localStorage`.
