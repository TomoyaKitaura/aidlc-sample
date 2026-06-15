# Requirements Analysis — Clarification Questions

Intent: intent-002-static-frontend-github-pages-ci
Step: clarification

Context already decided upstream (not re-asked): the order flow becomes a CLIENT-SIDE STUB
(keep the order UI, simulate success in-browser, persist nothing); no OWASP lens; single unit
`static-frontend`; deploy target is GitHub Pages via GitHub Actions on push to `main`.

The existing frontend (`app/public`) is plain HTML/CSS/JS. Its data-access layer
(`app/public/js/api.js`) makes three calls to the Express `/api` backend:
`GET /api/products` (catalogue), `GET /api/products/:id` (product detail), and
`POST /api/orders` (place order). The cart already lives entirely in `localStorage`
(`app/public/js/cart.js`). This step captures the requirements for making the frontend fully
static and for the CI that builds and publishes it.

---

### Q1: Where should the static product catalogue data live once `/api/products` and `/api/products/:id` are removed?

The catalogue currently comes from the server module `app/src/data/products.js` (6 fixed
products). On a static site there is no server to call.

a) Bundle the catalogue as a static JSON file (e.g. `products.json`) shipped with the site and fetched at runtime via `fetch()` of a relative path
b) Inline the catalogue into a JavaScript module/array that the page imports directly (no runtime fetch)
c) Generate `products.json` at build time from the existing `app/src/data/products.js` so the catalogue stays defined in one place
d) Other

**Trade Offs:** (a) keeps data/code separated and mirrors the current async shape of `api.js`,
so the page code barely changes, but adds a runtime fetch. (b) is simplest with zero network
calls but duplicates data into the page bundle. (c) avoids duplication by keeping
`app/src/data/products.js` as the single source and deriving the static artifact during the
build, at the cost of a small build step.

**Recommendation:** (c) — derive `products.json` at build time from `app/src/data/products.js`.
It keeps a single source of truth for the catalogue (no drift), produces a clean static
artifact, and lets `api.js` keep its existing async/`fetch` shape with only the URL changing to
a relative static path. If a build step is judged unnecessary, (a) with a hand-maintained
`products.json` is the fallback.

[Answer]: (c) Generate products.json at build time from app/src/data/products.js — single source of truth; api.js keeps its async/fetch shape, only the URL changes to a relative static path.

---

### Q2: What is the expected behaviour of the product-detail lookup for an unknown/missing product id on the static site?

Today `GET /api/products/:id` returns HTTP 404 and `fetchProduct` returns `null`, which the
detail page renders as a "not found" state.

a) Preserve the current behaviour exactly — unknown id resolves to a "product not found" message on the detail page
b) Drop the not-found handling and assume ids are always valid (links only ever point to known products)
c) Other

**Trade Offs:** (a) preserves observable behaviour and is robust to stale/typed URLs, requiring
the client-side lookup to return null for unknown ids. (b) is marginally simpler but regresses
behaviour and breaks on any direct/bookmarked URL to a removed product.

**Recommendation:** (a) — preserve the not-found behaviour. The static lookup should return
null/absent for an unknown id and the detail page should keep showing its existing "not found"
state. This is a no-regression requirement and costs almost nothing.

[Answer]: (a) Preserve the not-found behaviour — the static lookup returns null/absent for an unknown id and the detail page shows its existing 'not found' state. No regression.

---

### Q3: What confirmation must the client-side order stub produce after a simulated successful checkout?

Today `POST /api/orders` validates a non-empty cart, mints a unique order id (e.g.
`ORD-<ts>-<rand>`), computes the order total, and returns an order-confirmation payload; the
frontend then clears the cart. The order flow is now a client-side stub (simulate success,
persist nothing).

a) Full parity — client-side stub generates a unique order id, computes the total, shows the same confirmation (order id + items + total), and clears the cart, exactly as today
b) Reduced — show a generic "order placed" confirmation without a generated order id or itemised total, then clear the cart
c) Other

**Trade Offs:** (a) keeps the user-visible checkout outcome identical to the current app
(order id, itemised confirmation, cart cleared) with the logic moved fully client-side; the
empty-cart guard (reject checkout with an empty cart) is preserved. (b) is less code but
visibly degrades the confirmation experience.

**Recommendation:** (a) — full client-side parity: generate an order id, compute the total,
render the same confirmation, preserve the empty-cart guard, and clear the cart on success. The
existing order logic (`app/src/domain/order.js`) can be ported to the client. Nothing is
persisted server-side (there is no server) — this matches the "persist nothing / simulate in
browser" decision.

[Answer]: (a) Full client-side parity — generate a unique order id, compute the total, render the same confirmation (order id + items + total), preserve the empty-cart guard, and clear the cart on success. Persist nothing.

---

### Q4: Does the static site need to work when served from a GitHub Pages project-site sub-path (e.g. `https://<user>.github.io/aidlc-sample/`), or only from a domain root?

GitHub Pages serves a project site under a repository sub-path unless a custom domain or
user/organization site is configured. The current app uses absolute root-relative paths (e.g.
`/api/products`, `/images/placeholder.svg`).

a) Must work under a repository sub-path — all asset/data references must be relative or base-path aware so the site works at `/<repo>/`
b) Root only — assume a custom domain or user/organization site so root-absolute paths are fine
c) Other

**Trade Offs:** (a) is the safe default for GitHub Pages project sites and makes the build
portable, but requires using relative paths (or a configured base path) for assets, images, and
the catalogue data. (b) is simpler but breaks the deployed site if it lands under a sub-path,
which is the default GitHub Pages behaviour for a project repo.

**Recommendation:** (a) — require the built site to work under a repository sub-path using
relative / base-path-aware references. This avoids broken assets on the default GitHub Pages
project URL and keeps the option of a custom domain open later. This is a functional
requirement on the build output, independent of the specific tooling chosen downstream.

[Answer]: (a) Must work under a GitHub Pages repository sub-path — all asset/data references must be relative or base-path aware so the site works at /<repo>/.

---

### Q5: What should the CI workflow do when the static build step fails (or, later, when build-time checks fail) on a push to `main`?

The intent is to build the static bundle and publish to GitHub Pages automatically on every
push to `main`.

a) Fail the workflow and publish nothing — a failed build must not deploy, leaving the previously published site intact
b) Best-effort — attempt to deploy whatever was produced even if a step failed
c) Other

**Trade Offs:** (a) is the safe behaviour: deploy only on a green build, so a broken build never
replaces a working published site. (b) risks publishing a broken or partial site.

**Recommendation:** (a) — the workflow must fail and skip deployment if the build fails, so a
broken build never overwrites the live site. Deployment happens only on a successful build of
`main`. This is a requirement on the CI pipeline's behaviour, leaving the concrete Actions
implementation to construction.

[Answer]: (a) Fail the workflow and publish nothing on build failure — a broken build must never overwrite the live published site; deploy only on a green build of main.

---

### Q6: Should the existing Express server and `/api` backend be removed as part of this intent, or left in place alongside the new static build?

The repo currently has `app/server.js` and `app/src/routes/api.js`. The static site no longer
needs them at runtime, but they may still be useful for local development or as the single
source for the catalogue (see Q1c).

a) Keep the Express server and `/api` code in the repo (for local dev) — the static build does not depend on them at runtime, and they are simply not part of the deployed artifact
b) Remove the Express server and `/api` routes entirely as part of this intent
c) Other

**Trade Offs:** (a) is non-destructive: the deployed GitHub Pages artifact contains only static
assets, while the server stays available for local development; lowest regression risk. (b)
reduces dead code but is a larger, riskier change and removes a convenient local-dev runner and
(under Q1c) the catalogue source.

**Recommendation:** (a) — keep the Express/`/api` code in the repository but exclude it from the
deployed static artifact. The deliverable is the static bundle plus CI; deleting the server is
out of scope and would increase regression risk for no deployment benefit. If the team prefers a
clean repo, removal can be a separate follow-up intent.

[Answer]: (a) Keep the Express server and /api code in the repo for local dev, but exclude them from the deployed static artifact. Deleting the server is out of scope.

---

### Q7: Are there constraints on the deployment artifact contents — specifically, should server-only files (Express server, `/api` routes, tests, `node_modules`) be excluded from what GitHub Pages publishes?

GitHub Pages publishes the contents of a build output directory. Shipping server code or
dev/test files would be unnecessary and could leak source structure.

a) Publish only the built static frontend assets (HTML, CSS, client JS, images, catalogue data) — exclude server code, tests, and `node_modules`
b) Publish the whole repository as-is
c) Other

**Trade Offs:** (a) yields a minimal, clean, correct static site and avoids shipping irrelevant
or server-only files. (b) is simplest to wire up but bloats the published site and exposes
non-deployable source.

**Recommendation:** (a) — the published artifact must contain only the static frontend
(markup, styles, client scripts, images, and the static catalogue data), excluding server code,
tests, and dependencies. This defines a clear, verifiable boundary for the build output.

[Answer]: (a) Publish only the built static frontend assets (HTML, CSS, client JS, images, catalogue data); exclude server code, tests, and node_modules.

---
