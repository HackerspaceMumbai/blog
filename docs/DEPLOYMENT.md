# Production deployment

`hackmum.in` is served by the `hackmum-blog` Cloudflare Worker with Workers
Static Assets. It is not a Pages upload and is no longer hosted on Netlify. The
Astro Cloudflare adapter produces the Worker entry point and client assets;
`wrangler.jsonc` is the deployment configuration.

The `main` branch is the production source of truth: what is merged to `main`
is what the production workflow deploys.

## Release path

1. Open a pull request targeting `main`. GitHub Actions runs the Vitest suite,
   builds the site, and verifies the Cloudflare artifact. Pull request
   workflows never deploy and receive no Cloudflare credentials.
2. Merge only after required checks and review pass.
3. The production workflow (`.github/workflows/production-deploy.yml`) runs on
   every push to `main`. It installs with `pnpm install --frozen-lockfile`,
   repeats the tests and artifact verification, then runs `pnpm deploy:prod`,
   which calls the project-local Wrangler (`pnpm exec wrangler deploy`). The
   deployment job is protected by the GitHub `production` environment.
4. The workflow can also be started manually with **Run workflow**
   (`workflow_dispatch`). The job runs only when the selected ref is `main`; a
   dispatch from any other branch or tag is skipped and deploys nothing.
5. The workflow summary records the Worker name and deployed commit SHA.

Production deployments are serialized and are not cancelled by newer pushes.
Cloudflare credentials are exposed only to the deploy step, never to pull
request workflows or build/test steps.

## One-time GitHub and Cloudflare setup

1. In GitHub, create an environment named `production`. Restrict it to the
   `main` branch and configure required reviewers if production approval is
   part of the repository's release policy.
2. Add these as **environment secrets**, not repository-wide secrets:
   - `CLOUDFLARE_API_TOKEN`: a token scoped to the account that owns the Worker
     and with only the permissions required to deploy Workers and assets.
   - `CLOUDFLARE_ACCOUNT_ID`: the account ID for that same account.
3. Configure runtime-only values such as `KIT_API_KEY` in the Cloudflare
   Worker secrets. They are not GitHub deployment credentials and must not be
   added to source control.
4. Confirm in Cloudflare that `hackmum-blog` is the intended Worker and that
   its production route/custom domain is attached as expected. Domain and route
   attachment are not configured by this repository's Wrangler file.
5. Check the existing Netlify account/site separately. This change does not
   modify external Netlify settings; any still-enabled Git integration or
   events-archive Build Hook can continue to build independently.

## Validation and local preview

Use Node.js 22 (22.12 or later, as required by Astro 6) and the
repository-pinned pnpm version (`pnpm@10.18.3`, declared in `packageManager`).
Use only pnpm; do not use npm or Yarn, and do not install Wrangler globally.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm test:cloudflare-build
```

For a local Worker preview, run
`pnpm exec wrangler dev --local --persist-to .wrangler/preview-state`, then in
a second terminal run:

```sh
pnpm test:cloudflare-build http://localhost:8787
```

Keep the preview's `--persist-to` directory separate from `.wrangler/state`.
`pnpm build` starts the Workers runtime bundled with `@astrojs/cloudflare`, and
`wrangler dev` uses the newer runtime bundled with Wrangler. Both default to
`.wrangler/state/v3`. A newer runtime can upgrade that local SQLite state, after
which `pnpm build` fails with
`table _cf_ALARM has 3 columns but 2 values were supplied`. This is local
runtime state only; it is not a source or dependency failure. To recover, stop
any running local Workers, move the state aside, and rebuild:

```sh
mv .wrangler/state .wrangler/state.backup-$(date +%Y%m%d%H%M%S)
pnpm build
```

Delete the backup once the build passes. Remote Cloudflare resources are not
affected.

The verifier checks the prerendered pages, image budgets, generated Worker
entry and assets, and the published `_redirects` and `_headers` rules. With a
preview URL it also checks static blog redirects and `OPTIONS` handling for
newsletter routes without submitting a subscription.

Cloudflare Static Assets applies `_redirects` to static requests such as
`/posts/*`; it does not rewrite Worker-generated responses. The newsletter
compatibility paths therefore have Astro Worker routes:

| Path | Behavior |
| --- | --- |
| `/api/newsletter` and `/subscribe` | Newsletter endpoint |
| `/api/newsletter-health` | Canonical health endpoint |
| `/api/newsletter/health` and `/health/newsletter` | Health endpoint aliases |
| `/posts/*` | Static 301 redirect to `/blog/*` |

The Worker runs before static asset routing for `/api/*`, `/subscribe`, and
`/health/newsletter`; middleware rewrites the compatibility paths to their
canonical API routes. Static blog redirects remain asset-first.

Static asset security/cache headers are defined in `public/_headers`. Astro
middleware applies security headers to Worker responses and `no-store` to API
responses, including the compatibility paths. Keep those policies aligned
with `src/config/responseHeaders.ts`.

## Netlify parity

The removed `netlify.toml` was audited against the Workers deployment:

| Netlify feature | Workers equivalent | Status |
| --- | --- | --- |
| Build and publish `dist` | `pnpm build`; adapter emits `dist/server` (Worker) and `dist/client` (assets) | Covered |
| Functions `newsletter`, `newsletter-health` | Astro API routes in `src/pages/api/` calling `functions/` handlers | Covered |
| API rewrites `/api/newsletter`, `/subscribe`, health aliases | `run_worker_first` in `wrangler.jsonc` plus middleware rewrites | Covered |
| `/posts/*` 301 redirect | `public/_redirects`, copied to `dist/client/_redirects` | Covered |
| Static security and cache headers | `public/_headers`, copied to `dist/client/_headers` | Covered |
| Worker response headers | `src/middleware.ts` with `src/config/responseHeaders.ts` | Covered |
| Context environments (production, previews) | `vars` and `env` blocks in `wrangler.jsonc` | Covered |
| API CORS `*` | Production restricts CORS to `https://hackmum.in` | Intentional change |
| Image optimization | Astro image service with the Cloudflare `IMAGES` binding | Covered |
| Netlify Forms | No form uses Netlify Forms; the setting was empty | Not needed |
| Lighthouse build plugin | No build-time equivalent; existing accessibility scripts run separately | Not migrated |
| Deploy and branch previews | Pull requests validate the build only; use a local Worker preview | Not migrated |

`netlify/functions/` remains as legacy code with its own tests. It is not part
of the Worker build and can be removed in a follow-up change.

## First-release verification

After the production job completes, confirm that the deployment reports the
expected commit SHA and Worker name. Then verify the live site and non-mutating
endpoints:

```sh
curl -i https://hackmum.in/
curl -i https://hackmum.in/api/newsletter-health
curl -i -X OPTIONS https://hackmum.in/subscribe
curl -i -X OPTIONS https://hackmum.in/health/newsletter
```

Also verify that an existing `/posts/<slug>` URL returns a 301 to its
`/blog/<slug>` destination, that static assets include the expected security
and cache headers, and that newsletter health is healthy. Do not use a live
subscription POST as a deployment smoke test.

## Rollback and break-glass

For a bad Worker release, use the Cloudflare dashboard's Worker deployment
history to select the last known-good version, or use Wrangler with a
maintainer-authorized Cloudflare token:

```sh
pnpm exec wrangler rollback --name hackmum-blog <version-id>
```

For a code-level correction, revert the offending commit, review the revert,
and merge it to `main`; the normal workflow will deploy that reviewed state.
If GitHub Actions is unavailable, an authorized maintainer may run the
repository checks and deploy the reviewed `main` checkout with `pnpm deploy`.
Keep any break-glass token in a secure environment, never in the repository or
shell history. Normal releases always go through the GitHub workflow; use
break-glass only when that path is unavailable, and record the deployed SHA.

## Out of scope

Migrating from Wrangler to the newer Cloudflare `cf` CLI is not part of this
release process. Deployments continue to use the project-local Wrangler.
