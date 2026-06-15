# Code Generation — Clarification Questions (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: code-generation (construction)
Unit: static-frontend
State key: `code-generation:static-frontend`

Auto-proceed mode: the human pre-authorized auto-proceeding with the builder's
recommended answers. Each `[Answer]:` line below is filled in by the builder with
its recommended option and rationale. State transitions
`clarification: pending → awaiting-human → answered → complete` were performed in
a single pass. This file exists for traceability.

Scope note: per the code-generation SKILL.md question guidance and builder
protocol rule 4, these questions cover implementation-level choices only
(conventions, file placement, error handling, brownfield parity) — not
architecture, tech stack, or business logic, which are fixed upstream
(`infrastructure-design.md` TD-1..TD-7, `business-rules.md` BR-1..BR-11,
`domain-entities.md`). All answers preserve existing brownfield conventions
(NFR-3) extracted from `app/`.

---

### Q1: How should sub-path portability (FR-7 / NFR-4) be achieved for the HTML root-absolute references?

The existing `app/public/*.html` files use root-absolute references throughout:
`href="/css/styles.css"`, `src="/js/api.js"`, `src="/js/cart.js"`,
`href="/"` (brand + "Products" nav + "Back to products"), `href="/cart.html"`,
`href="/checkout.html"`, `href="/product.html?id=..."`, and `src="/images/..."`
in dynamically-built markup. These break under a GitHub Pages sub-path `/<repo>/`.

a) Normalize references **in place during the `dist/` assembly step** of the build script: rewrite root-absolute in-site references to relative form (e.g. `/css/styles.css` → `css/styles.css`, `href="/"` → `index.html`, `/product.html?id=` → `product.html?id=`) while copying `app/public` into `dist/`. The source files in `app/public` keep working for the local Express server unchanged.
b) Edit the source `app/public/*.html` files to be relative, and serve those directly (no rewrite step).
c) Inject a `<base href>` tag at build time instead of rewriting each reference.
d) Other.

**Trade Offs:** (a) keeps the source files unchanged so the retained local Express server (OOS-1) and the deployed static bundle both work, and the normalization is a deterministic, testable build-step transform (matches `deployment-architecture.md` step 4 "any root-absolute references … normalized to relative during assembly"). (b) would change source files the local server depends on and risks regressing local dev. (c) `<base href>` is brittle with relative anchors/query-string links and with the dynamically-generated `href` strings inside inline scripts, and still needs a build-time repo-name input, which TD-4 explicitly avoids ("no build-time repo-name input required").

**Recommendation:** (a). It is exactly what the infrastructure design specifies (TD-4, TD-5, deployment-architecture build step 4), keeps the local server working unchanged (NFR-3, OOS-1), needs no repo-name input, and is verifiable by inspecting `dist/` after a build run.

[Answer]: a — Normalize root-absolute in-site references to relative during the `dist/` assembly step of the build script; leave `app/public` source files unchanged. Rationale: matches `deployment-architecture.md` step 4 and TD-4/TD-5; keeps the retained local Express server working (OOS-1, NFR-3); no repo-name input required; the transform is deterministic and verifiable by inspecting `dist/`. The brand/"Products"/"Back" `href="/"` links normalize to `index.html`; `/css`, `/js`, `/images`, `/product.html`, `/cart.html`, `/checkout.html` lose the leading slash.

### Q2: How should the `products.json` image reference be normalized for sub-path portability?

`app/src/data/products.js` defines `PLACEHOLDER_IMAGE = '/images/placeholder.svg'`
(root-absolute). The HTML renders product images from `p.image` directly
(`<img src="' + p.image + '">`), so the value emitted into `products.json` must be
sub-path safe.

a) The build/generation step rewrites each product's root-absolute `image` value (`/images/placeholder.svg`) to a relative form (`images/placeholder.svg`) when serializing `products.json`; the source module is unchanged.
b) Change `PLACEHOLDER_IMAGE` in the source `products.js` to a relative path.
c) Leave it root-absolute and rely on a `<base href>`.

**Trade Offs:** (a) keeps `app/src/data/products.js` as the single source of truth unchanged (FR-1, NFR-2, A-4) while emitting a portable catalogue, and is the behaviour described in `infrastructure-design.md` ("normalizes the root-absolute image path … to a relative form") and `deployment-architecture.md` step 3. (b) would change the source the local server serves (the local server resolves `/images/...` from `express.static`), a behaviour change to a file A-4 says is authoritative-as-is. (c) shares the brittleness noted in Q1.

**Recommendation:** (a). Normalize on serialization only; keep the source module authoritative and unchanged (FR-1, NFR-2, A-4). Verifiable: `dist/products.json` contains `images/placeholder.svg` (no leading slash) for all six products.

[Answer]: a — The generation step normalizes each product `image` from `/images/placeholder.svg` to `images/placeholder.svg` when writing `products.json`; `app/src/data/products.js` stays unchanged as the single source of truth. Rationale: matches `infrastructure-design.md` and `deployment-architecture.md` step 3; preserves FR-1/NFR-2/A-4; verifiable in `dist/products.json`.

### Q3: Where should the build script live and how should it be invoked?

a) A single Node.js script `app/build.js` (CommonJS, dependency-free, Node 20 compatible) invoked via a new `npm run build` script in `app/package.json`; the GitHub Actions `build` job runs `npm run build` (or `node build.js`) from the `app/` working directory and outputs `app/dist/`. Workflow uploads `app/dist/`.
b) A repository-root build script (`/build.js`) and a root `package.json`.
c) Inline the build steps as shell commands in the workflow YAML (no committed script).

**Trade Offs:** (a) co-locates the build with the app it builds, reuses the existing `app/package.json` (`type: commonjs`, `engines.node >=18`) and the existing `require()`-able `app/src/data/products.js` with no bundler (TD-3), and keeps the script unit-runnable locally (`npm run build`) which makes per-layer verification cheap. It needs no new dependencies (`upload-pages-artifact` takes any path). (b) introduces a second `package.json` and splits the project. (c) hides the build in YAML, is not locally runnable, and is hard to test per-layer (validation-spec rule 11).

**Recommendation:** (a). `app/build.js` + `npm run build`, output `app/dist/`. It reuses the existing CommonJS toolchain with zero new dependencies (TD-3), is runnable and verifiable locally, and the workflow simply runs it from `app/` and uploads `app/dist/`.

[Answer]: a — `app/build.js` (dependency-free CommonJS, Node 20), added `"build"` script in `app/package.json`, output directory `app/dist/`; the workflow runs the build from the `app/` working directory and uploads `app/dist/`. Rationale: reuses the existing CommonJS toolchain and `require()`-able products module with no bundler/new deps (TD-3); locally runnable for per-layer verification; `app/dist/` is git-ignored so build output never pollutes the repo.

### Q4: How should the client-side order stub reconcile the `customer` field, given the UI still collects it but `domain-entities.md` Q2 dropped it from the Order?

`app/public/js/checkout.html` collects name/email/address and calls
`Api.placeOrder({ customer, items })`, then renders `order.orderId`,
`order.items` (with `name`/`unitPrice`/`quantity`), and `order.total`. The
confirmation does **not** display the customer. `domain-entities.md` (Q2) drops
`customer` from the Order entity as a "server-stub artifact".

a) Keep `placeOrder(payload)`'s **input signature unchanged** (it still accepts `{ customer, items }` so `checkout.html` is untouched — NFR-3), but the ported client-side stub ignores `customer` and the returned order omits it, matching the `domain-entities.md` Order shape (`{ orderId, items, total }`). The confirmation UI already ignores `customer`, so there is full observable parity.
b) Also remove the customer form fields from `checkout.html`.
c) Keep `customer` in the returned order (verbatim port of `app/src/domain/order.js`).

**Trade Offs:** (a) is full observable parity (FR-5, NFR-3): the UI renders identically because it never displayed `customer`, while the Order data shape matches the authoritative `domain-entities.md`. It also avoids modifying `checkout.html` (fewer brownfield diffs). (b) is out of scope — the requirements/assumptions do not call for changing the checkout form, and A-2 reuse intent is to minimize UI changes. (c) re-introduces a field the functional design deliberately removed, contradicting `domain-entities.md`.

**Recommendation:** (a). Preserve the `placeOrder({ customer, items })` input shape so `checkout.html` is untouched, ignore `customer` internally, and return `{ orderId, items, total }` per `domain-entities.md`. This is full observable parity with the authoritative Order shape.

[Answer]: a — `placeOrder` keeps accepting `{ customer, items }` (so `checkout.html` is not modified), ignores `customer`, and returns `{ orderId, items, total }` matching `domain-entities.md`. Rationale: the confirmation UI never displayed `customer`, so observable behaviour is unchanged (FR-5, NFR-3); the returned shape matches the authoritative Order entity; checkout.html needs no edit.

### Q5: How should the ported catalogue/order logic preserve exact rounding, id-generation, and not-found semantics (NFR-3)?

a) Port the logic **verbatim** from `app/src/domain/order.js` (`calculateTotal`, `generateOrderId`, `buildOrder` empty-cart guard) and `app/src/data/products.js` (`getAllProducts`/`getProductById` returning `null` for unknown id) into the client `api.js`, preserving `Number(x.toFixed(2))` rounding (BR-7/BR-8), the `ORD-<ts36>-<rand36>` id format (BR-9), the empty-cart throw (BR-10), and `fetchProduct` returning `null` on unknown id (BR-2/BR-3, FR-4). The catalogue is fetched from `products.json` (not re-embedded) so single-source-of-truth is preserved (FR-1).
b) Re-implement the logic with new/cleaner code.
c) Embed the catalogue array directly in `api.js` instead of fetching `products.json`.

**Trade Offs:** (a) guarantees byte-for-byte behavioural parity (NFR-3) — the same rounding, the same id shape, the same null-not-found — and keeps the catalogue single-sourced via `products.json` (FR-1, NFR-2). (b) risks subtle off-by-a-cent or id-format regressions (BR-7 violation behaviour explicitly warns against alternative rounding). (c) duplicates the catalogue data into `api.js`, violating single-source-of-truth (FR-1, NFR-2) and the build's purpose.

**Recommendation:** (a). Verbatim port of the proven domain logic into the client, fetching the catalogue from `products.json`. Maximum parity (NFR-3), single source preserved (FR-1).

[Answer]: a — Port the existing rounding (`Number(total.toFixed(2))`), id generation (`ORD-${ts36}-${rand36}`), empty-cart guard, and null-not-found semantics verbatim into the client `api.js`; fetch the catalogue from `products.json` rather than embedding it. Rationale: byte-for-byte parity (NFR-3, BR-7/BR-8/BR-9/BR-10/BR-2/BR-3); catalogue stays single-sourced (FR-1, NFR-2).

### Q6: How should the GitHub Actions actions be pinned, and what workflow filename/triggers should be used?

a) Workflow file `.github/workflows/deploy-pages.yml`; trigger `on: push: branches: [main]` plus `workflow_dispatch`; actions pinned to released **major tags** (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`); two jobs `build` → `deploy` (`needs: build`); `permissions: contents: read` at workflow level, `pages: write` + `id-token: write` on the deploy job; `concurrency: { group: "pages", cancel-in-progress: false }`; `environment: github-pages` on deploy.
b) Pin actions to full commit SHAs instead of major tags.
c) Use floating/unpinned `@main` references.

**Trade Offs:** (a) matches `infrastructure-design.md` ("released major version or SHA") and `deployment-architecture.md` exactly: least-privilege per job (TD-6), `needs: build` gating (FR-9/NFR-1), a `pages` concurrency group with `cancel-in-progress: false` so an in-flight publish is not interrupted, and `workflow_dispatch` for the documented roll-forward/rollback path. Major-tag pinning is the conventional, readable choice for first-party GitHub actions and is the pattern the design names first. (b) SHA pinning is more supply-chain-strict but harder to read/maintain and is explicitly offered only as an alternative ("major version or SHA"); for first-party `actions/*` on a public sample repo, major tags are the pragmatic recommendation. (c) unpinned violates TD-6 pinning hygiene.

**Recommendation:** (a). Major-tag pinning of the five first-party actions, `deploy-pages.yml`, `push: main` + `workflow_dispatch`, two-job `needs: build`, least-privilege permissions, `pages` concurrency group. This is exactly the infrastructure design's required topology and hygiene, with the conventional pinning style for first-party actions.

[Answer]: a — `.github/workflows/deploy-pages.yml`; `on: push: branches: [main]` + `workflow_dispatch`; actions pinned to current released major tags (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4); two jobs `build` → `deploy` (`needs: build`); workflow-level `permissions: contents: read`, deploy-job `pages: write` + `id-token: write`; `concurrency: { group: pages, cancel-in-progress: false }`; deploy `environment: github-pages`. Rationale: matches `infrastructure-design.md`/`deployment-architecture.md` topology and TD-6 hygiene; major-tag pinning is the conventional, maintainable choice for first-party `actions/*` and is the design's first-named option; `workflow_dispatch` enables the documented roll-forward path.

### Q7: Confirm the extracted brownfield coding conventions to follow when generating/modifying code.

Extracted from `app/` (NFR-3, validation-spec rules 7/12):
- CommonJS modules with `'use strict';` at top of server-side files; `app/package.json` `type: commonjs`, `engines.node >=18`.
- Client scripts are browser IIFEs that also dual-export via `if (typeof module !== 'undefined' && module.exports) { module.exports = X; }` (see `api.js`, `cart.js`).
- 2-space indentation, single quotes, semicolons, trailing commas in multiline literals.
- `api.js` exposes a frozen-shape `Api` object: `{ fetchProducts, fetchProduct, placeOrder }`, all `async`; `fetchProduct` returns `null` on not-found.
- Money rounding via `Number(x.toFixed(2))`; order id `ORD-<Date.now().toString(36).toUpperCase()>-<random 6 chars>`.
- Tests use `node:test` + `node:assert`, run by `npm test` (`node --test`); test files under `app/test/`.

a) Yes — these conventions are correct; generate/modify code to follow them, and keep `npm test` passing unchanged (existing `test/order.test.js` is untouched because the server-side `order.js` is unchanged).
b) No — some convention is wrong (specify).

**Recommendation:** (a). The conventions are read directly from the current source; following them is mandated by validation-spec rules 7 and 12 and by NFR-3.

[Answer]: a — Conventions confirmed correct; all generated/modified code follows them (CommonJS + `'use strict'`, dual-export IIFE for client scripts, 2-space/single-quote/semicolon/trailing-comma style, `Api` async object shape with `null`-not-found, `Number(x.toFixed(2))` rounding, `ORD-` id format, `node:test`). `npm test` stays green because server-side `order.js` and `test/order.test.js` are not modified. Rationale: extracted from current source; mandated by validation-spec rules 7/12 and NFR-3.
