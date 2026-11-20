# Developer onboarding

## Prerequisites

- Node.js 22.12 or later
- pnpm 10.18.3 (the repository's `packageManager` version)
- Git

Check the installed versions with `node --version` and `pnpm --version`.

## Project setup

```sh
git clone https://github.com/HackerspaceMumbai/blog.git
cd blog
pnpm install
pnpm dev
```

The local site is available at `http://localhost:4321`. Keep local secrets in
an untracked `.env` file and never commit them.

## Daily workflow

```sh
pnpm test
pnpm test:blog-images
pnpm build
pnpm test:cloudflare-build
```

For changes to the production Worker, build and preview the Cloudflare output:

```sh
pnpm exec wrangler dev --local --persist-to .wrangler/preview-state
```

Then run `pnpm test:cloudflare-build http://localhost:8787` in a second
terminal. It checks generated pages, assets, redirects, headers, and
non-mutating newsletter preflight routes.

## Content and component changes

Blog posts live in `src/content/posts/` as directories containing an `index.mdx`
and their colocated images. Components live in `src/components/`, route pages
in `src/pages/`, and shared styles in `src/styles/`.

After changes, run the focused tests and the build checks above. UI changes
should also be checked with keyboard navigation and a browser accessibility
tool; automated checks do not replace manual review.

## Production deployment

Pull requests targeting `main` run CI. A reviewed merge to `main` triggers the
protected Cloudflare production workflow; a manual dispatch is accepted only
from `main`. Routine production releases are not performed from a developer
machine. See [the production deployment runbook](./DEPLOYMENT.md) for
environment setup, first-release verification, rollback, and break-glass
procedures.

## Troubleshooting

- **Unsupported Node version:** use Node.js 22.12 or later.
- **Wrong pnpm version:** use pnpm 10.18.3, as declared in `package.json`.
- **Worker preview fails:** run `pnpm build` first, then start
  `pnpm exec wrangler dev --local --persist-to .wrangler/preview-state`.
- **Build fails with `table _cf_ALARM has 3 columns`:** local Workers state was
  upgraded by a newer runtime. Follow the recovery steps in
  [the deployment runbook](./DEPLOYMENT.md).
- **CI deployment is blocked:** check the GitHub `production` environment
  approval and confirm its Cloudflare secrets are present; do not copy them
  into a pull-request workflow.

For workflow and Cloudflare setup questions, see
[Production deployment](./DEPLOYMENT.md).
