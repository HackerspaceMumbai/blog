# Production readiness checklist

Use this checklist before enabling or changing the production Worker release
path. For the full procedure, see [Production deployment](./DEPLOYMENT.md).

## GitHub and Cloudflare setup

- [ ] GitHub environment `production` exists, is restricted to `main`, and has
      the intended approval requirements.
- [ ] Environment secrets `CLOUDFLARE_API_TOKEN` and
      `CLOUDFLARE_ACCOUNT_ID` are set and scoped to the intended account.
- [ ] Cloudflare runtime secrets, including `KIT_API_KEY`, are configured on
      the Worker and are not stored in GitHub or source control.
- [ ] Worker `hackmum-blog` and its production domain/route are verified in
      Cloudflare.
- [ ] External Netlify Git integration and Build Hook status have been checked
      separately; this repository change does not modify that service.

## Before release

- [ ] Pull request review and required CI checks pass.
- [ ] `pnpm test`, `pnpm build`, and `pnpm test:cloudflare-build` pass.
- [ ] Worker aliases, static redirects, response headers, and cache policies
      are included in the built artifact.
- [ ] Rollback access and the last known-good Worker version are available.

## After release

- [ ] Workflow summary shows the expected Worker name and commit SHA.
- [ ] Homepage and a representative blog post load.
- [ ] Newsletter health endpoint returns a healthy response.
- [ ] Newsletter `OPTIONS` endpoints return the expected CORS and no-store
      headers; no real subscription was used as a smoke test.
- [ ] A legacy `/posts/<slug>` URL redirects to `/blog/<slug>`.
- [ ] Static and Worker-generated responses have their expected security
      headers.
