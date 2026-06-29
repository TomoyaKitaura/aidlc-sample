# Code Summary — product-listing

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: code-generation
Step: execution
Generated: 2026-06-29

Client-side name + price product search/filter for the Product Listing screen.
Implemented in three layers per the approved `code-generation-plan.md`, each
build/test-verified before proceeding. No server change, no new dependency, no
`build.js` change. Conventions extracted from `api.js` (dual-export IIFE),
`order.test.js` (`node:test` + `node:assert` with FR/BR-cited titles), and
`styles.css` (existing tokens / input treatment).

## Source files created / modified

| File | Action | Layer |
|---|---|---|
| `app/public/js/search-filter.js` | created | L1 |
| `app/test/search-filter.test.js` | created | L1 |
| `app/public/css/styles.css` | edited (append-only) | L2 |
| `app/public/index.html` | edited | L3 |
| `app/server.js` | edited (rework, attempt 2) | — |

`app/build.js` — unchanged (Q5). The new client-side files ship to `dist/` via
the existing `public/**` allowlist copy; the inline `<script src="/js/search-filter.js">`
is relativized to `js/search-filter.js` by the existing `normalizeHtml` pass.

## Layer 1 — Pure filter module + co-located unit tests

**Created `app/public/js/search-filter.js`** — dual-export IIFE (`SearchFilter`
browser global + `module.exports`), pure/side-effect-free, no DOM:
- `normaliseCriteria(raw)` — BR-1 (trim + simple-lowercase term; internal
  whitespace verbatim; all-whitespace -> `""`) and BR-3 (each bound trimmed;
  blank/absent -> `null`; else plain-decimal `Number(...)`; unparseable degrades
  to `null`, never an error).
- `matchesSearch(product, searchTerm)` — BR-2 (name-only, case-insensitive,
  contiguous substring; empty term matches everything; description/id never
  consulted).
- `matchesPrice(product, minPrice, maxPrice)` — BR-4 (inclusive both ends;
  absent bound = no constraint) and BR-5 (inverted range yields no match as a
  literal consequence — no swap).
- `filterCatalogue(catalogue, criteria)` — BR-6 (AND-intersection), BR-7
  (empty/identity criteria -> full catalogue), order-preserving, non-mutating.

**Created `app/test/search-filter.test.js`** — 22 `node:test` cases with FR/BR
citations, inline fixture mirroring the `products.js` shape. Covers BR-1
(trim/lowercase/internal-whitespace-verbatim/all-whitespace->""), BR-3 (decimal
parse + blank->absent), BR-2 (case-insensitivity, multi-word contiguous,
name-only), BR-4 (exact min/max boundary, out-of-bound exclusion, absent
bounds), BR-5 (inverted range -> empty), BR-6 (AND exclusion both directions),
BR-7 (empty + all-whitespace -> full catalogue in order, order preservation),
non-mutation, and the documented example `name contains "e" AND price <= 50 ->
p1, p3, p4, p6`.

**Verification:**
- `cd app && npm test` -> **28 pass, 0 fail** (6 existing `order.test.js` + 22
  new). No regression.
- `node -e "require('./public/js/search-filter')"` -> loads cleanly under
  CommonJS (dual export confirmed; no browser-only top-level dependency).

## Layer 2 — Additive filter-bar styles

**Edited `app/public/css/styles.css` (append-only).** Added `.filter-bar`,
`.filter-bar .search`, `.filter-bar .price`, and a `@media (max-width: 720px)`
block stacking the bar to a full-width column. Only existing tokens (`--card`,
`--line`, `--radius`) and the existing input treatment are reused; the Search
button reuses the default `button`/`.btn`, Clear reuses `button.secondary`, the
zero-match message reuses the existing `.empty-state`. No new
colour/token/font/radius. The appended block matches the wireframe preview CSS
verbatim.

**Verification:**
- `cd app && npm run build` -> build succeeds; `dist/css/styles.css` contains the
  appended classes (`.filter-bar` matched, `.filter-bar .search`, `.filter-bar
  .price` present).

## Layer 3 — Page markup + DOM wiring + safe `card()`

**Edited `app/public/index.html`.**
- Inserted `<form class="filter-bar" id="filter-bar">` directly below
  `<h1>Products</h1>`: a `type="search"` name input, two `type="number"
  min="0" step="0.01"` price inputs (min/max), a `type="submit"` Search button,
  and a `type="button"` Clear control (`hidden` by default).
- Added `<script src="/js/search-filter.js">` after `api.js` (before `cart.js`).
- Added a `<div class="empty-state" id="empty" hidden>` for the distinct
  zero-match message (separate from the `.notice` load error, which is
  untouched).
- **Refactored `card()` to safe DOM** (FR-10/BR-12): built entirely with
  `document.createElement` + `textContent` for name/price/description and
  `img.src`/`img.alt`/`a.href` set via element properties. All `innerHTML`
  string interpolation eliminated (`grep innerHTML dist/index.html` -> 0).
  Same DOM shape/classes, `/product.html?id=` links, and Add-to-cart ->
  `Cart.add`/`refreshBadge`/`showToast` behaviour preserved.
- **Wiring:** holds the fetched catalogue; `render()` shows the empty-state or
  the grid; `applyFilter()` runs only on form `submit` (Search click / Enter,
  `preventDefault`) via `SearchFilter.normaliseCriteria` +
  `SearchFilter.filterCatalogue`; Clear resets controls, restores the full
  catalogue, hides itself; an `input` listener toggles Clear visibility only
  (does not filter); no URL/storage persistence; initial load renders the full
  catalogue with Clear hidden. Existing badge/toast/load-error path preserved.

**Verification:**
- `cd app && npm test` -> **28 pass, 0 fail** (no regression).
- `cd app && npm run build` -> succeeds; `dist/index.html`,
  `dist/js/search-filter.js`, `dist/css/styles.css` all present; `<script>` src
  relativized to `js/search-filter.js`; 0 `innerHTML` in `dist/index.html`.
- **Wireframe check** (read `inception/wireframes/screens/`): default
  (full catalogue, controls empty, Clear hidden), results (narrowed
  catalogue-ordered grid, Clear visible; `e` AND `<=50` -> p1/p3/p4/p6 covered
  by the L1 test), and empty (`.empty-state` message distinct from `.notice`,
  Clear visible) all match.

## Rework — attempt 2: Express delivery-mode parity for `products.json`

**Defect (human-verified, reproduced):** running the app via the Express dev
server (`npm start` / `node server.js`) and opening the Product Listing page
showed "Could not load products. Is the server running?" — the filter bar
rendered, but the catalogue never loaded.

**Root cause (pre-existing, surfaced by this unit's NFR-2 / BR-14):** the client
`app/public/js/api.js` `fetchProducts()` requests a *relative* `products.json`
(resolved against `document.baseURI` → `/products.json` at the site root). This
is correct for the static GitHub Pages build, where `app/build.js` serialises
`getAllProducts()` to `dist/products.json`. But `app/server.js` only served the
static `public/` directory (which contains **no** `products.json`) plus the
`/api` router. Under Express, `GET /products.json` → 404, so the page failed.
Reproduced before the fix: `curl /products.json` → 404 while `curl /api/products`
→ 200. This violated NFR-2 / BR-14 ("works under BOTH the static GitHub Pages
build AND the Express server; no regression").

**Fix (minimal, server-side only, no contract change, no data duplication):**
Added a `GET /products.json` route to `app/server.js`, placed **before**
`app.use(express.static(PUBLIC_DIR))` so it wins over any (absent) static file.
The route serves the live in-memory catalogue from `./src/data/products`
(`getAllProducts()`) as JSON, normalising each product's root-absolute image
path to a relative form (`/images/placeholder.svg` → `images/placeholder.svg`)
exactly as `build.js`'s `normalizeRef`/`writeCatalogue` does. This brings the
Express server to parity with the static build — the path the client fetches and
the JSON shape now match in both delivery modes. The single source of truth
(`src/data/products.js`) is read directly; nothing is duplicated.

**Diff summary — `app/server.js`:**
- **Added** `const { getAllProducts } = require('./src/data/products');` beside
  the existing requires.
- **Added** a commented `app.get('/products.json', ...)` route immediately
  before `express.static`, returning `getAllProducts()` with the image path
  normalised to relative (matching `build.js`).
- **Unchanged:** the `/api` router and all `/api/*` routes, `express.json()`,
  `express.static`, both 404 handlers, the JSON error handler, the `listen`
  guard, and `module.exports`. No change to `api.js`, `build.js`, the product
  data, or any search/filter code.

**Verification (run in `app/`):**
- `npm test` → **28 pass, 0 fail** (no regression).
- `npm run build` → success; `dist/products.json` still generated (6 products).
- Server started on test port 3199:
  - `GET /products.json` → **HTTP 200** with the full catalogue JSON (image paths
    relative). Confirmed **byte-equivalent** to the build-generated
    `dist/products.json` (deep-equality check passed).
  - `GET /api/products` → **HTTP 200** (unchanged).
  - `GET /` → **HTTP 200** (unchanged).
  - Server stopped afterward.

**Scope nuance:** the search/filter feature logic is client-side, but a small
server-side addition was required to satisfy *this unit's own* NFR-2 / BR-14
(Express + static parity). Restoring Express delivery-mode parity is a faithful
implementation of the no-regression requirement, not scope creep; it is the
minimum change that makes the client `api.js` contract resolvable under both
delivery modes.

## Brownfield diff summary (edited files)

### `app/public/css/styles.css` (append-only)
- **Unchanged:** lines 1–143 (all existing rules and tokens).
- **Added** after `.row-gap`: a `/* Filter bar */` comment block plus
  `.filter-bar`, `.filter-bar .search`, `.filter-bar .price`, and a
  `@media (max-width: 720px)` rule. No existing rule altered; no new token.

### `app/public/index.html`
- **Unchanged:** doctype/head/header/nav, `#status`, `#grid`, `.toast`, the
  `api.js`/`cart.js` script tags, `fmtPrice`/`refreshBadge`/`showToast`, the
  Add-to-cart handler, the load-error `.notice` path.
- **Added in `<main>`:** the `<form class="filter-bar">` (search + min/max
  price + Search + hidden Clear) below `<h1>Products</h1>`, and a hidden
  `<div class="empty-state" id="empty">`.
- **Added:** `<script src="/js/search-filter.js">` after `api.js`.
- **Replaced:** `card()` rewritten from an `innerHTML` template to
  `createElement`/`textContent`/property-set DOM construction (FR-10/BR-12).
- **Replaced:** the inline `init` IIFE now holds the catalogue and adds
  `render`/`applyFilter`/`syncClearVisibility`/Clear/submit/input wiring while
  preserving the existing fetch + load-error behaviour.

## File -> requirement / business-rule traceability

| File | Requirements | Business rules | Clarif. |
|---|---|---|---|
| `app/public/js/search-filter.js` | FR-1, FR-2, FR-3, FR-4, FR-6 | BR-1, BR-2, BR-3, BR-4, BR-5, BR-6, BR-7 | Q1, Q3 |
| `app/test/search-filter.test.js` | FR-1…FR-4, FR-6, FR-7 | BR-1, BR-2, BR-4, BR-5, BR-6, BR-7 | Q3 |
| `app/public/css/styles.css` | FR-3, NFR-1 | (presentation for BR-8/BR-10/BR-13) | Q4 |
| `app/public/index.html` | FR-1…FR-10, NFR-1, NFR-2 | BR-8, BR-9, BR-10, BR-11, BR-12, BR-13, BR-14 | Q1, Q2 |
| `app/server.js` (rework) | NFR-2 | BR-14 | — |

Persona: guest shopper. Upstream `components.md`/`stories.md` do not exist
(application-design and units-generation were skipped); traceability is
expressed against `FR-<n>`/`NFR-<n>` and `BR-<n>` IDs and the existing codebase,
per the plan's upstream-availability note and the builder protocol's gap rule.

## Verification command results (summary)

| Command (run in `app/`) | Layer | Result |
|---|---|---|
| `npm test` (baseline, pre-edit) | — | 6 pass, 0 fail |
| `npm test` | L1 | 28 pass, 0 fail |
| `node -e "require('./public/js/search-filter')"` | L1 | loads cleanly |
| `npm run build` | L2 | success; classes in `dist/css/styles.css` |
| `npm test` | L3 | 28 pass, 0 fail (no regression) |
| `npm run build` | L3 | success; dist parity, 0 `innerHTML` in `dist/index.html` |
| `npm test` | rework | 28 pass, 0 fail (no regression) |
| `npm run build` | rework | success; `dist/products.json` regenerated (6 products) |
| `GET /products.json` (Express, port 3199) | rework | HTTP 200; equivalent to `dist/products.json` |
| `GET /api/products` (Express) | rework | HTTP 200 (unchanged) |
| `GET /` (Express) | rework | HTTP 200 (unchanged) |
