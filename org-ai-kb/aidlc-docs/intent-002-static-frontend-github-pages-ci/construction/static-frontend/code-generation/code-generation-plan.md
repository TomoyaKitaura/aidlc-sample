# Code Generation Plan — unit: static-frontend

Intent: intent-002-static-frontend-github-pages-ci
Stage: code-generation (construction)
Unit: static-frontend
State key: `code-generation:static-frontend`

Status: execution : complete

This plan turns the approved design artifacts into code in small, independently
verifiable layers. Application/CI code lives in the workspace (`app/` and
`.github/workflows/`); only this plan and `CODE_SUMMARY.md` live under
`aidlc-docs/` (validation-spec rule 6). Brownfield: all generated/modified code
follows the conventions extracted in `code-generation-questions.md` Q7 (NFR-3,
validation-spec rules 7/12). No existing file is modified without a diff summary
at execution time (validation-spec rule 8).

Clarification answers applied: Q1 (normalize refs during `dist/` assembly), Q2
(normalize image path on serialization), Q3 (`app/build.js` + `npm run build`,
output `app/dist/`), Q4 (`placeOrder` keeps `{customer,items}` input, returns
`{orderId,items,total}`), Q5 (verbatim logic port, catalogue from
`products.json`), Q6 (`deploy-pages.yml`, major-tag pinning, two-job gating),
Q7 (conventions confirmed).

---

## Layer ordering rationale

This unit has no traditional model/service/controller stack; it is a static-site
build + a client data-access refactor + a CI pipeline. The frontend layer
ordering from the SKILL.md is adapted to three buildable layers, each verifiable
on its own:

1. **Layer 1 — Build foundation** (the build script + npm wiring + ignore).
   Produces `products.json` and assembles `dist/`. Must work before the client
   refactor can be verified end-to-end (the client fetches `products.json`).
2. **Layer 2 — Client data-access refactor** (`app/public/js/api.js`). Replaces
   the three `/api` calls with static fetch + client-side order stub. Depends on
   Layer 1 producing `products.json`.
3. **Layer 3 — CI/CD pipeline** (`.github/workflows/deploy-pages.yml`). Runs the
   Layer 1 build in CI and publishes `dist/`. Depends on Layer 1's build command
   existing.

Each layer is ≤ 12 files (validation-spec rule 3) — in fact ≤ 4 each. Layer N+1
is not begun until Layer N is verified (validation-spec rule 2).

---

## Layer 1 — Build foundation

Goal: a dependency-free Node build that generates the single-source-of-truth
catalogue artifact and assembles an allowlisted, sub-path-portable `dist/`.

Files:

- [x] **CREATE `app/build.js`**
  - Purpose: the build script (Build-Time Catalogue Generation concern +
    `dist/` assembly). Steps:
    1. `require('./src/data/products.js')` and call `getAllProducts()` (single
       source of truth — FR-1, NFR-2; TD-3).
    2. Normalize each product's `image` from `/images/placeholder.svg` →
       `images/placeholder.svg` (relative) on serialization (Q2; FR-7, NFR-4).
    3. Clean and recreate `app/dist/`, then copy `app/public/**` (HTML, CSS,
       client JS, images) into `app/dist/` by allowlist-construction — copy only
       from `app/public` (TD-5; FR-10). Never copy `server.js`, `src/`, `test/`,
       `node_modules`.
    4. While copying `*.html`, normalize root-absolute in-site references to
       relative (Q1; FR-7): `="/css/` → `="css/`, `="/js/` → `="js/`,
       `="/images/` → `="images/`, `="/product.html` → `="product.html`,
       `="/cart.html` → `="cart.html`, `="/checkout.html` → `="checkout.html`,
       and bare root links `href="/"` → `href="index.html"`. Applies to both
       static markup and the `href`/`src` strings built inside inline scripts.
    5. Write `dist/products.json` (normalized catalogue) (FR-1, FR-2).
  - Conventions: CommonJS, `'use strict';`, Node 20 fs APIs, no external deps,
    2-space/single-quote/semicolon style (Q7).
  - Traceability: components.md "Build-Time Catalogue Generation"; FR-1, FR-2,
    FR-7, FR-10, NFR-2, NFR-4; infrastructure-design TD-3/TD-4/TD-5;
    deployment-architecture build steps 3–4.
- [x] **MODIFY `app/package.json`**
  - Purpose: add `"build": "node build.js"` to `scripts`. No new dependencies
    (the build is dependency-free). Leave `start`, `test`, `engines`, `type`
    unchanged.
  - Diff summary required before write (rule 8).
  - Traceability: Q3; FR-8 (the CI build invokes this); NFR-2.
- [x] **MODIFY `app/.gitignore`**
  - Purpose: add `dist/` so build output is not committed (keeps the repo clean;
    `dist/` is deterministically regenerable — deployment-architecture "Backup").
  - Diff summary required before write (rule 8).
  - Traceability: FR-10 (artifact boundary hygiene); TD-5.

Verification (Layer 1 checkpoint — all must pass before Layer 2):

- [x] `cd app && npm run build` exits 0.
- [x] `app/dist/products.json` exists, is valid JSON, contains all six products,
  and every `image` value is `images/placeholder.svg` (no leading `/`) — FR-1,
  FR-2, FR-7, NFR-2, NFR-4.
- [x] `app/dist/` contains `index.html`, `product.html`, `cart.html`,
  `checkout.html`, `css/styles.css`, `js/api.js`, `js/cart.js`,
  `images/placeholder.svg`, `products.json` — and contains NO `server.js`, NO
  `src/`, NO `test/`, NO `node_modules` (FR-10, TD-5).
- [x] `grep` of `app/dist/*.html` finds NO root-absolute in-site reference
  (`="/css`, `="/js`, `="/images`, `="/product.html`, `="/cart.html`,
  `="/checkout.html`, `href="/"`) — FR-7, NFR-4.
- [x] `cd app && npm test` still exits 0 (server-side `order.js` and
  `test/order.test.js` untouched — NFR-3).

---

## Layer 2 — Client data-access refactor

Goal: make the client self-contained — catalogue from `products.json`, order
simulated client-side — with full observable parity (NFR-3) and no `/api` calls.

Files:

- [x] **MODIFY `app/public/js/api.js`**
  - Purpose: replace the three runtime `/api` calls while preserving the `Api`
    object's public shape `{ fetchProducts, fetchProduct, placeOrder }`, the
    `async` signatures, and the dual browser/CommonJS export (Q4, Q5, Q7).
    - `fetchProducts()` → `fetch` the base-path-aware relative `products.json`,
      return the parsed array; throw on non-ok (preserve existing throw shape)
      (FR-2; W-1/BR-1; catalogue.load).
    - `fetchProduct(id)` → fetch `products.json`, find by `id`, return the match
      or **`null`** when absent (preserve not-found semantics — FR-3, FR-4;
      W-2/BR-2/BR-3; product.lookup.miss). No throw for unknown id.
    - `placeOrder({ customer, items })` → CLIENT-SIDE stub porting
      `app/src/domain/order.js`: empty-cart guard throwing
      `'Cannot place an order with an empty cart.'` (BR-10, FR-6);
      `generateOrderId()` as `ORD-${Date.now().toString(36).toUpperCase()}-${rand6}`
      (BR-9); `calculateTotal` via `Number(total.toFixed(2))` with the same
      `unitPrice||price` coercion (BR-7, BR-8); build
      `{ orderId, items:[{id,name,unitPrice,quantity}], total }` (ignore
      `customer` per Q4); persist nothing (OOS-2). Caller (`checkout.html`)
      clears the cart on success — unchanged behaviour (BR-11, FR-5).
  - `products.json` path resolution must be relative / base-path aware (no
    leading `/`) so it works under `/<repo>/` (FR-7, NFR-4) — and the inline-page
    `<img src=p.image>` already uses the relative value from Layer 1's
    normalized `products.json`.
  - Conventions: IIFE + dual export, async, 2-space/single-quote style (Q7).
  - Diff summary required before write (rule 8).
  - Traceability: components.md "Catalogue Data Provider" + "Checkout / Order
    Simulation"; component-methods get-all-products / get-product-by-id /
    place-order / build-order / calculate-total / generate-order-id; FR-2, FR-3,
    FR-4, FR-5, FR-6; BR-2, BR-3, BR-7, BR-8, BR-9, BR-10, BR-11.

Verification (Layer 2 checkpoint — all must pass before Layer 3):

- [x] `grep` of `app/public/js/api.js` finds NO `'/api/'` reference (the three
  runtime `/api` calls are removed) — FR-2, FR-5.
- [x] The `Api` object still exports exactly `fetchProducts`, `fetchProduct`,
  `placeOrder`, all `async`, with the dual browser/CommonJS export intact (so
  `index.html`/`product.html`/`checkout.html` consume it unchanged) — NFR-3.
- [x] Behavioural parity spot-checks (logic-level, no browser needed): a Node
  parity check of the ported `placeOrder`/order logic confirms the empty-cart
  throw, the `ORD-` id format, and that `total` for the existing test fixtures
  matches the server result (e.g. items `[{price:39.99,qty:1},{price:14.5,qty:2}]`
  → `68.99`) — NFR-3, BR-7/BR-8/BR-9/BR-10. (Achieved by re-running the build and
  loading `app/dist/products.json` + the module's exported functions, or an
  ad-hoc node check; not a committed test unless trivially co-locatable.)
- [x] `cd app && npm run build` still exits 0 and `app/dist/js/api.js` reflects
  the refactor (api.js was copied into `dist/`).
- [x] `cd app && npm test` still exits 0 (no regression to server tests).

Note on co-located tests (validation-spec rule 4): the unit's only pure,
node-testable logic is the order stub, which is a verbatim port of the already
fully-tested `app/src/domain/order.js` (`test/order.test.js`). The refactored
`api.js` is browser-coupled (uses `fetch`); its logic parity is verified against
the existing server tests and the Layer 2 spot-checks rather than by duplicating
the order tests. Execution step will confirm `npm test` stays green; if a small
pure helper is extracted during execution, a co-located test will be added.

---

## Layer 3 — CI/CD pipeline

Goal: build and publish `dist/` to GitHub Pages on every push to `main`, with
deploy-only-on-green and least privilege.

Files:

- [x] **CREATE `.github/workflows/deploy-pages.yml`**
  - Purpose: the GitHub Actions workflow (Q6; FR-8, FR-9; NFR-1; TD-2, TD-6, TD-7;
    deployment-architecture topology).
    - `on: push: branches: [main]` + `workflow_dispatch` (FR-8; roll-forward).
    - Workflow-level `permissions: contents: read` (least privilege — TD-6).
    - `concurrency: { group: pages, cancel-in-progress: false }` (TD-6).
    - Job `build` (`runs-on: ubuntu-latest`): `actions/checkout@v4`,
      `actions/setup-node@v4` (node-version 20), `npm run build` in the `app/`
      working directory, `actions/configure-pages@v5`,
      `actions/upload-pages-artifact@v3` with `path: app/dist`.
    - Job `deploy` (`needs: build`): `permissions: { pages: write,
      id-token: write }`, `environment: { name: github-pages, url:
      ${{ steps.deployment.outputs.page_url }} }`, `actions/deploy-pages@v4`.
  - The `needs: build` makes deploy unreachable on a failed build → nothing is
    published, the last good deployment is retained (FR-9, NFR-1;
    deployment-architecture "Deploy gating").
  - Traceability: FR-8, FR-9, FR-10 (uploads only `app/dist`); NFR-1; TD-2, TD-5,
    TD-6, TD-7; infrastructure-design "CI/CD Pipeline"; deployment-architecture
    topology + build/deploy step detail.

Verification (Layer 3 checkpoint):

- [x] `.github/workflows/deploy-pages.yml` is valid YAML (parse/lint) — it only
  truly runs on GitHub, so structural/lint validation is the local check.
- [x] Structural assertions present: `on.push.branches: [main]` and
  `workflow_dispatch`; workflow `permissions: contents: read`; `concurrency.group:
  pages`; two jobs `build` and `deploy`; `deploy.needs: build`; deploy
  `permissions` has `pages: write` + `id-token: write`; deploy
  `environment.name: github-pages`; the five actions pinned to major tags
  (`checkout@v4`, `setup-node@v4`, `configure-pages@v5`,
  `upload-pages-artifact@v3`, `deploy-pages@v4`); `upload-pages-artifact` `path`
  is `app/dist`; `build` runs `npm run build`.
- [x] No secrets referenced; no third-party deploy action; `contents: write` is
  absent (least privilege — TD-6).

---

## Cross-layer / final verification

- [x] All three layer checkpoints pass.
- [x] `cd app && npm test` exits 0 (NFR-3 — existing suite unchanged).
- [x] `cd app && npm run build` exits 0 and `app/dist/` is a clean,
  allowlisted, sub-path-portable bundle (FR-1, FR-2, FR-7, FR-10, NFR-2, NFR-4).
- [x] `CODE_SUMMARY.md` written: what was generated/modified, decisions
  (Q1–Q7), conventions followed, FR/BR traceability, and verification results.

---

## Files to be created / modified

Created:
- `app/build.js` (Layer 1)
- `.github/workflows/deploy-pages.yml` (Layer 3)
- `org-ai-kb/.../construction/static-frontend/code-generation/CODE_SUMMARY.md` (final)

Modified:
- `app/package.json` (Layer 1 — add `build` script)
- `app/.gitignore` (Layer 1 — ignore `dist/`)
- `app/public/js/api.js` (Layer 2 — static fetch + client order stub)

Generated build output (not committed; regenerable):
- `app/dist/` including `app/dist/products.json` (produced by `app/build.js`)

Explicitly unchanged (retained for local dev / boundary — OOS-1, A-2, NFR-3):
- `app/server.js`, `app/src/routes/api.js`, `app/src/domain/order.js`,
  `app/src/domain/cart.js`, `app/src/data/products.js`, `app/test/order.test.js`,
  `app/public/*.html`, `app/public/js/cart.js`, `app/public/css/styles.css`,
  `app/public/images/placeholder.svg`.
