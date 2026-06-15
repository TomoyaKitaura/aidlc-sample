# Code Generation Summary — unit: static-frontend

Intent: intent-002-static-frontend-github-pages-ci
Stage: code-generation (construction)
Unit: static-frontend
State key: `code-generation:static-frontend`

This unit turns the existing local Express EC app into a fully static site
buildable as `app/dist/` and continuously deployed to GitHub Pages, with the
client refactored to read a build-generated catalogue and simulate order
placement entirely client-side. Code was generated in three independently
verified layers per the approved `code-generation-plan.md`. No self-validation
against `validation-spec.md` and nothing in the skill's `scripts/` was run (those
are the validator's job).

---

## Files created / modified

### Created (application / CI code — in the workspace)

- `/Users/hi-masano/workspace/murata/aidlc-sample/app/build.js` — Layer 1.
  Dependency-free CommonJS build script. `require()`s the single-source-of-truth
  catalogue (`app/src/data/products.js`), serializes it to `dist/products.json`
  (normalizing the root-absolute image path to relative on serialization),
  cleans and re-assembles `app/dist/` by allowlist construction (copies only
  `app/public/**`), and normalizes root-absolute in-site references in copied
  `*.html` to relative so the site works under a GitHub Pages repo sub-path.
- `/Users/hi-masano/workspace/murata/aidlc-sample/.github/workflows/deploy-pages.yml`
  — Layer 3. GitHub Actions workflow: `build` job (checkout, setup-node 20,
  `npm ci`, `npm run build` in `app/`, `configure-pages`, `upload-pages-artifact`
  pointed at `app/dist`) → `deploy` job (`needs: build`, `environment:
  github-pages`, `deploy-pages`). Least-privilege permissions, pinned actions,
  `pages` concurrency group.

### Modified (existing files — brownfield, diff summaries below)

- `/Users/hi-masano/workspace/murata/aidlc-sample/app/package.json` — Layer 1.
  Added `"build": "node build.js"` to `scripts`. No new dependencies; `start`,
  `test`, `engines`, `type`, `dependencies` unchanged.
- `/Users/hi-masano/workspace/murata/aidlc-sample/app/.gitignore` — Layer 1.
  Added `dist/` (build output is git-ignored; deterministically regenerable).
- `/Users/hi-masano/workspace/murata/aidlc-sample/app/public/js/api.js` —
  Layer 2. Replaced the three runtime `/api` `fetch` calls. `fetchProducts()`
  and `fetchProduct(id)` now read the static `products.json` via a relative,
  base-path-aware URL (`fetchProduct` returns `null` on not-found).
  `placeOrder({customer, items})` is now a client-side stub that ports the
  `app/src/domain/order.js` logic (empty-cart guard, `ORD-` id, rounded total),
  ignores `customer`, returns `{orderId, items, total}`, and persists nothing.
  The `Api` object shape, the `async` signatures, and the dual browser/CommonJS
  export are all preserved, so the `.html` files and `cart.js` are untouched.

### Diff summaries (validation-spec rule 8)

- `app/package.json`: inserted one line `"build": "node build.js",` between
  `"start"` and `"test"` inside `scripts`. Nothing else changed.
- `app/.gitignore`: appended one line `dist/` after `node_modules/`.
- `app/public/js/api.js`: full rewrite of the module body (still a single
  `Api` IIFE with dual export). `fetchProducts`/`fetchProduct` switched from
  `/api/products[/:id]` to a relative `products.json` fetch; `fetchProduct`
  keeps `null`-not-found by `.find()` instead of an HTTP 404. `placeOrder`
  switched from a `POST /api/orders` round-trip to an inline port of
  `buildOrder` + `calculateTotal` + `generateOrderId`, returning
  `{orderId, items, total}` (customer dropped). Public surface unchanged.

### Generated build output (NOT committed — git-ignored, regenerable)

- `app/dist/` including `app/dist/products.json` and the assembled, normalized
  `index.html`, `product.html`, `cart.html`, `checkout.html`, `css/styles.css`,
  `js/api.js`, `js/cart.js`, `images/placeholder.svg`.

### Explicitly unchanged (retained for local dev / boundary — OOS-1, A-2, NFR-3)

`app/server.js`, `app/src/routes/api.js`, `app/src/domain/order.js`,
`app/src/domain/cart.js`, `app/src/data/products.js`, `app/test/order.test.js`,
`app/public/*.html`, `app/public/js/cart.js`, `app/public/css/styles.css`,
`app/public/images/placeholder.svg`.

---

## Decisions (per the answered clarification questions)

- **Q1 (sub-path portability of HTML refs)** — Normalize root-absolute in-site
  references to relative *during `dist/` assembly* (option a). Source
  `app/public/*.html` files are left unchanged so the retained local Express
  server still works (OOS-1, NFR-3); no repo-name input is needed (TD-4). The
  normalizer handles both ordinary attributes and the string-concatenated
  `href`/`src` values built inside the pages' inline scripts (e.g.
  `'<a href="/product.html?id='`). `href="/"` → `index.html`.
- **Q2 (image path)** — Normalize each product's `image`
  (`/images/placeholder.svg` → `images/placeholder.svg`) only on serialization
  to `products.json` (option a). `app/src/data/products.js` stays the single
  source of truth, unchanged (FR-1, NFR-2, A-4).
- **Q3 (build location/invocation)** — `app/build.js` + `npm run build`, output
  `app/dist/`, dependency-free CommonJS reusing the existing toolchain (option
  a). Locally runnable for per-layer verification; `app/dist/` is git-ignored.
- **Q4 (`customer` reconciliation)** — `placeOrder` keeps accepting
  `{customer, items}` so `checkout.html` is untouched, ignores `customer`, and
  returns `{orderId, items, total}` matching `domain-entities.md` (option a).
  The confirmation UI never displayed `customer`, so observable behaviour is
  unchanged (FR-5, NFR-3).
- **Q5 (logic parity)** — Verbatim port of `calculateTotal`
  (`Number(total.toFixed(2))`), `generateOrderId` (`ORD-<ts36>-<rand6>`), and
  the empty-cart guard from `app/src/domain/order.js`, plus `null`-not-found
  from `products.js`. Catalogue fetched from `products.json`, not embedded
  (option a; FR-1, NFR-2, BR-2/BR-3/BR-7/BR-8/BR-9/BR-10).
- **Q6 (CI workflow)** — `deploy-pages.yml`; `on: push: branches: [main]` +
  `workflow_dispatch`; five first-party actions pinned to major tags
  (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3,
  deploy-pages@v4); two jobs `build` → `deploy` (`needs: build`); workflow-level
  `permissions: contents: read`, deploy-job `pages: write` + `id-token: write`;
  `concurrency: {group: pages, cancel-in-progress: false}`; deploy
  `environment: github-pages` (option a; TD-2/TD-5/TD-6/TD-7, FR-8/FR-9, NFR-1).
- **Q7 (conventions)** — Confirmed correct; all generated/modified code follows
  the extracted brownfield conventions.

---

## Conventions followed (brownfield — Q7, validation-spec rules 7 & 12)

- CommonJS with `'use strict';` for the Node build script (`build.js`).
- Client `api.js` remains a browser IIFE with the dual export
  `if (typeof module !== 'undefined' && module.exports) { module.exports = Api; }`.
- 2-space indentation, single quotes, semicolons, trailing commas in multiline
  literals.
- `Api` object shape `{fetchProducts, fetchProduct, placeOrder}`, all `async`;
  `fetchProduct` returns `null` on not-found.
- Money via `Number(x.toFixed(2))`; order id
  `ORD-<Date.now().toString(36).toUpperCase()>-<random 6 chars>`.
- Tests stay `node:test`/`node:assert` run by `npm test`; `test/order.test.js`
  and the server-side `order.js` it covers are untouched, so the suite is
  unchanged.

No new cross-cutting patterns were invented; error handling (throw on load
failure, `null` on not-found, throw on empty cart) matches the existing code.

---

## Traceability (selected)

- FR-1/FR-2/NFR-2: single-source catalogue → `build.js` `writeCatalogue()` +
  `api.js` `fetchProducts`.
- FR-3/FR-4 (BR-2/BR-3): `api.js` `fetchProduct` → `null` on unknown id.
- FR-5/FR-6 (BR-7/BR-8/BR-9/BR-10/BR-11): `api.js` `placeOrder` client stub.
- FR-7/NFR-4 (TD-4): `build.js` `normalizeHtml`/`normalizeRef` +
  `catalogueUrl()` base-path-aware fetch.
- FR-8/FR-9/FR-10/NFR-1 (TD-2/TD-5/TD-6/TD-7): `deploy-pages.yml`.

---

## Per-layer verification results

### Layer 1 — Build foundation — PASS

`cd app && npm run build` (exit 0):

```
> sample-ec-site@1.0.0 build
> node build.js

Build complete: assembled dist/ with products.json (6 products). PLACEHOLDER_IMAGE source=/images/placeholder.svg -> images/placeholder.svg.
```

- `dist/` tree (exact):
  `dist/cart.html, dist/checkout.html, dist/css/styles.css,
  dist/images/placeholder.svg, dist/index.html, dist/js/api.js, dist/js/cart.js,
  dist/product.html, dist/products.json`.
- `products.json` valid JSON, 6 products, every `image` == `images/placeholder.svg`
  (no leading `/`).
- No forbidden artifacts in `dist/` (`server.js`, `src/`, `test/`,
  `node_modules` — search returned nothing).
- No root-absolute in-site reference remains in `dist/*.html`
  (`grep -RnoE '(href|src)=("|'\'')/[^"'\'']*' dist/*.html` returned nothing).
  Spot check: `href="css/styles.css"`, `href="index.html"`, `href="cart.html"`,
  `src="js/api.js"`, `href="product.html?id="`.
- `cd app && npm test` (exit 0): 6 passed, 0 failed.

Note: the first build pass left the inline-script-concatenated
`href="/product.html?id="` strings root-absolute because the initial regex
required a matching closing quote of the same type. The `normalizeHtml` regex
was corrected to match `(href|src)=<quote>/...` up to the next quote of either
type (preserving the boundary quote), after which the grep check passed.

### Layer 2 — Client data-access refactor — PASS

- `grep '/api/'` over `app/public/js/api.js` returns nothing (the three runtime
  `/api` calls are gone; the only `/api` token left is in a comment).
- `Api` keys == `["fetchProducts","fetchProduct","placeOrder"]`, all `async`,
  dual CommonJS export intact (`require('./public/js/api.js')` works).
- placeOrder parity spot-check (Node):
  - empty-cart throw parity = true (`'Cannot place an order with an empty cart.'`).
  - total for `[{price:39.99,qty:1},{price:14.5,qty:2}]` = `68.99`, matches
    server `order.calculateTotal` = `68.99`.
  - order id matches `/^ORD-[0-9A-Z]+-[0-9A-Z]{6}$/` (e.g. `ORD-MQEYPBT8-W0F02I`).
  - returned keys == `["orderId","items","total"]` (no `customer`); item shape
    `{id,name,unitPrice,quantity}`.
- `cd app && npm run build` (exit 0); `dist/js/api.js` reflects the refactor
  (3 `catalogueUrl` references, 0 `/api/`).
- `cd app && npm test` (exit 0): 6 passed, 0 failed.

### Layer 3 — CI/CD pipeline — PASS

`.github/workflows/deploy-pages.yml` parsed (structural YAML parse via Ruby
`YAML.load_file`); all 22 structural assertions PASS:

- `on.push.branches == [main]`; `workflow_dispatch` present.
- workflow `permissions.contents == read`; no top-level `contents: write`.
- `concurrency.group == pages`; `cancel-in-progress == false`.
- jobs `build` and `deploy` present; `deploy.needs == build` (deploy gating).
- deploy `permissions.pages == write` + `id-token == write`;
  `environment.name == github-pages`.
- five actions pinned: `checkout@v4`, `setup-node@v4`, `configure-pages@v5`,
  `upload-pages-artifact@v3`, `deploy-pages@v4`.
- `upload-pages-artifact` `path == app/dist`; `build` runs `npm run build` and
  `npm ci`.
- no `secrets.` referenced; only `actions/*` (no third-party deploy action).

### Cross-layer / final — PASS

- All three layer checkpoints pass.
- `cd app && npm test` exits 0 (6/6; existing suite unchanged — NFR-3).
- `cd app && npm run build` exits 0; `app/dist/` is a clean, allowlisted,
  sub-path-portable bundle.

---

## Deviations

- The Layer 1 `normalizeHtml` regex needed a one-time correction (described in
  the Layer 1 note) to also normalize the root-absolute `href`/`src` strings
  built inside the pages' inline scripts. This is the self-correction allowed by
  the Execution Model and is reflected in the final `build.js`; no other plan
  deviation.
- `placeOrder`'s `calculateTotal`/`generateOrderId` are inlined inside the
  `Api` IIFE rather than re-exported; this keeps the client module's public
  surface identical (`{fetchProducts, fetchProduct, placeOrder}`) per Q7/NFR-3.
  The pure logic remains a verbatim port of the already-tested
  `app/src/domain/order.js`, so no duplicate co-located test was added
  (validation-spec rule 4 note in the plan); parity is covered by the existing
  server test suite plus the Layer 2 Node parity spot-check.
