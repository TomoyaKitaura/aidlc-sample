# Code Generation Plan — product-listing

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: code-generation
Step: planning
Generated: 2026-06-29

## Purpose

Implement the name+price product search/filter feature for the Product Listing
screen, entirely client-side, with no regression to the static GitHub Pages build
or the Express server. The plan follows the **Frontend** layer ordering from the
skill (Shared/Features → Foundation/design-system → Pages), reordered so the pure,
testable derivation lands first (it is the riskiest, rule-dense part and gates the
unit tests), then the additive styling, then the page wiring that consumes both.

All five clarification answers are encoded:
- **Q1** — pure logic in a NEW `app/public/js/search-filter.js` (dual-export IIFE
  like `api.js`); DOM wiring extends `index.html`'s inline `<script>`.
- **Q2** — refactor `index.html`'s `card()` to safe DOM
  (`createElement`+`textContent`; `img.src`/`href` via properties) for FR-10/BR-12.
- **Q3** — `app/test/search-filter.test.js` under `node --test`; no new deps; no DOM
  harness; covers BR-1/BR-2/BR-4/BR-5/BR-6/BR-7.
- **Q4** — additive `.filter-bar` classes appended to `styles.css`; existing rules
  untouched.
- **Q5** — no `build.js` change.

## Scope (locked — not re-litigated)

Client-side only; static build + Express both keep working; name-only
case-insensitive contiguous-substring search + optional inclusive numeric min/max
price filter, AND-combined, on explicit submit; full catalogue when no controls
active; distinct empty-state vs load-error; conditional Clear; no persistence;
numeric-only price inputs (`min=0`). No lenses active.

## Upstream-availability note

This workflow skipped application-design and units-generation (single pre-existing
client-side unit). There is no `components.md`/`stories.md`/`data-models.md`. Per
the precedent set upstream (functional-design, wireframes) and the builder
protocol's brownfield/gap rules, file traceability is expressed against requirement
IDs (`FR-<n>`/`NFR-<n>`), business-rule IDs (`BR-<n>`), the single asserted
guest-shopper persona, and the existing codebase artifacts (`api.js`,
`products.js`, `styles.css`, `index.html`) in lieu of `components.md` component IDs
and `S-<n>` story IDs.

## Brownfield baseline (establish before any edit)

- Existing convention extracted from `app/public/js/api.js`: dual-export IIFE
  `const X = (() => { ... })(); if (typeof module !== 'undefined' && module.exports) { module.exports = X; }`,
  `'use strict';` not used in that file but used in `src/`/`test/` — new module
  follows the **`api.js` browser-module convention** (IIFE, no `'use strict'`
  pragma needed for a browser global, JSDoc-style comments with rule citations).
- Existing test convention from `app/test/order.test.js`: `node:test` + `node:assert`,
  `require('../...')`, one `test()` per behaviour with FR/BR citations in the title.
- Existing CSS tokens/classes confirmed present in `app/public/css/styles.css`:
  `--card` (L5), `--muted` (L7), `--line` (L8), `--radius` (L13), `.empty-state`
  (L137), `.notice` (L136), `button.secondary`/`.btn.secondary` (L108),
  `@media (max-width: 720px)` breakpoint (L95), `.row-gap` (L143, gap 10px),
  `form.checkout input` 9px/`--line`/8px-radius/`font:inherit` input treatment
  (L125-126). The new classes reuse these tokens only — no new colour/token/font.
- Baseline test run (`npm test` in `app/`) must pass BEFORE Layer 1 edits, to
  establish a green baseline (existing `order.test.js`).

## Per-file traceability summary

| File | Action | Purpose | Traceability |
|---|---|---|---|
| `app/public/js/search-filter.js` | **create** | Pure `filterCatalogue` + `matchesSearch` + `matchesPrice` + criteria normalisation; dual-export IIFE | BR-1, BR-2, BR-3, BR-4, BR-5, BR-6, BR-7; FR-1…FR-4, FR-6; Q1 |
| `app/test/search-filter.test.js` | **create** | `node --test` unit tests for the pure module | BR-1, BR-2, BR-4, BR-5, BR-6, BR-7; Q3 |
| `app/public/css/styles.css` | **edit (append)** | Additive `.filter-bar` / `.filter-bar .search` / `.filter-bar .price` + 720px column behaviour | wireframe-guidance; FR-3, NFR-1; Q4 |
| `app/public/index.html` | **edit** | `form.filter-bar` markup; submit/Clear/render/empty-state wiring; safe `card()` refactor | FR-1…FR-10, NFR-1/NFR-2; BR-8…BR-14, BR-12; Q1, Q2 |

`build.js` — **no change** (Q5). Verified at L3 that the new files ship to `dist/`
via the existing `public/**` allowlist copy with no edit.

---

## Layer 1 — Pure filter module + co-located unit tests

**Type:** Shared/Features (pure logic). Smallest, fully testable, no DOM.

**Files (2):**

- [x] `app/public/js/search-filter.js` — **create**.
  - Dual-export IIFE matching `api.js` (`const SearchFilter = (() => {...})();`
    + `if (typeof module !== 'undefined' && module.exports) module.exports = SearchFilter;`).
  - `normaliseCriteria(raw)` → `AppliedFilterCriteria` value object:
    `searchTerm = lowercase(trim(rawTerm))` (internal whitespace verbatim;
    all-whitespace → `""`) (BR-1); `minPrice`/`maxPrice` each = trim → blank means
    **absent** (`null`/`undefined`), else `Number(...)` plain decimal (BR-3). No
    `min<=max` invariant (Q3).
  - `matchesSearch(product, searchTerm)` → `searchTerm === "" || product.name.toLowerCase().includes(searchTerm)` — name only (BR-2).
  - `matchesPrice(product, minPrice, maxPrice)` → inclusive both ends; absent bound = no constraint (BR-4); inverted range yields no match as a literal consequence (BR-5).
  - `filterCatalogue(catalogue, criteria)` → catalogue filtered by `matchesSearch AND matchesPrice`, preserving catalogue order (BR-6); empty/identity criteria → full catalogue (BR-7). Pure, no mutation, no I/O.
  - JSDoc comments citing the BR IDs, mirroring `api.js`'s comment style.
- [x] `app/test/search-filter.test.js` — **create**.
  - `require('../public/js/search-filter')`; `node:test` + `node:assert` like
    `order.test.js`. Uses a small inline fixture catalogue (mirrors `products.js`
    shape: `{id,name,price}`) so the test has no external data coupling.
  - Cases: BR-1 normalisation (trim, lowercase, internal-whitespace verbatim,
    all-whitespace → `""`); BR-2 name substring case-insensitivity + contiguous
    multi-word + name-only (description/id never matched); BR-4 inclusive bounds
    incl. exact-boundary min and max, absent-bound semantics; BR-5 inverted range
    (min>max) → empty; BR-6 AND-combination (term-match but out-of-price excluded
    and vice versa); BR-7 empty/identity criteria → full catalogue in order.

**Verification (Layer 1 checkpoint):**
- [x] `cd app && npm test` — all tests pass (new `search-filter.test.js` green AND
  existing `order.test.js` still green; no regression to the baseline). 28 tests
  pass (6 existing order.test.js + 22 new), 0 fail.
- [x] `node -e "require('./app/public/js/search-filter')"` loads cleanly under
  CommonJS (confirms the dual export and that the module has no browser-only
  top-level dependency). Loaded cleanly.
- [x] Layer compiles independently — no reference to `index.html` wiring or to
  ungenerated files.

---

## Layer 2 — Additive filter-bar styles

**Type:** Foundation / design-system (additive CSS only). Brownfield edit — diff
produced.

**Files (1):**

- [x] `app/public/css/styles.css` — **edit (append only)**. A **diff summary will
  be produced** for human approval before writing (validation-spec rule 8). No
  existing rule is altered; only the following classes are appended:
  - `.filter-bar` — `display:flex; flex-wrap:wrap; gap:10px; align-items:center;
    background:var(--card); border:1px solid var(--line);
    border-radius:var(--radius); padding:14px; margin:0 0 18px;`
  - `.filter-bar .search` — `flex:1 1 220px; min-width:160px;` + the existing
    `form.checkout input` treatment (`padding:9px; border:1px solid var(--line);
    border-radius:8px; font:inherit;`).
  - `.filter-bar .price` — `width:110px;` + the same input treatment.
  - Inside the existing `@media (max-width:720px)` instinct: `.filter-bar` →
    `flex-direction:column; align-items:stretch;` and `.filter-bar .price` →
    `width:100%;` so controls stack full-width at narrow widths.
  - Only existing tokens (`--card`, `--line`, `--radius`, `--muted`, accent) are
    referenced; no new colour/token/font/radius introduced. The Search button
    reuses the default `button`/`.btn`; Clear reuses `button.secondary`. The
    empty-state reuses the existing `.empty-state` (NOT `.notice`).

**Verification (Layer 2 checkpoint):**
- [x] Diff summary reviewed: confirms append-only, existing rules untouched
  (lines 1–143 unchanged), tokens reused. Only `.filter-bar` / `.filter-bar
  .search` / `.filter-bar .price` + the 720px column behaviour were appended.
- [x] `cd app && npm run build` — build succeeds; `dist/css/styles.css` contains
  the appended classes (allowlist copy picks them up unchanged; confirms Q5 / no
  `build.js` change needed and NFR-2 static-mode parity). Verified via grep.
- [x] Visual check deferred to Layer 3 (the classes have no effect until the
  markup that uses them exists).

---

## Layer 3 — Page markup + DOM wiring + safe card() refactor

**Type:** Pages (the screen that consumes Layers 1 and 2). Brownfield edit — diff
produced.

**Files (1):**

- [x] `app/public/index.html` — **edit**. A **diff summary will be produced** for
  human approval before writing (validation-spec rule 8). Changes:
  - **Markup:** insert `<form class="filter-bar" id="filter-bar">` directly below
    `<h1>Products</h1>` and above `#status`/`#grid` (wireframe placement Q1):
    `[input.search type=text] [input.price type=number min=0 step=... id=min]
    [input.price type=number min=0 step=... id=max] [button type=submit Search]
    [button.secondary type=button id=clear hidden Clear]`. Price inputs are
    numeric-only with `min="0"` (Q2 precondition for BR-3); the search input is
    plain text.
  - **`<script src="/js/search-filter.js">`** tag added (after `api.js`), so the
    inline wiring can call `SearchFilter` (Q1). No other script reordering.
  - **`card()` refactor (Q2 / FR-10 / BR-12):** rebuild the card via
    `document.createElement` + `textContent` for `name`, price text, and
    `description`; set `img.src`/`img.alt` and link `href` via element properties.
    Eliminate the `innerHTML` string interpolation entirely. Behaviour preserved:
    same DOM shape/classes (`.product-card`, `.body`, `.name`, `.price`, `.desc`,
    `.actions`, Details link, `[data-add]` button), same `/product.html?id=`
    links, same Add-to-cart → `Cart.add`/`refreshBadge`/`showToast` (NFR-2).
  - **Wiring (extends the existing inline `init`):**
    - Hold the loaded catalogue in a variable after `Api.fetchProducts()`.
    - `render(products)` helper: clear `#grid`; if `products.length === 0` show
      `div.empty-state` ("No products match your search.") and hide the grid
      (BR-8 / FR-7 — distinct from the `.notice` load-error, which is untouched);
      else append `card(p)` for each and show the grid.
    - `applyFilter()`: read live control values → `SearchFilter.normaliseCriteria`
      → `SearchFilter.filterCatalogue(catalogue, criteria)` → `render(result)`.
      Wired to the form `submit` event only (`preventDefault`) — Search click and
      Enter both submit; no as-you-type (BR-9 / FR-5).
    - Clear button (`type=button`): resets all three controls, re-renders the full
      catalogue, hides itself (BR-7/BR-10/FR-8).
    - Conditional Clear visibility: an `input` listener on the three controls
      toggles the Clear button's `hidden` based on whether any control is
      non-empty (live state, BR-10/FR-8) — this toggles visibility only, it does
      NOT apply the filter.
    - No persistence: no URL/query/storage read or write; controls start empty on
      load; initial render is the full catalogue (BR-11/FR-9, BR-7/FR-6).
  - Load-error path (`.notice`) and the toast remain unchanged (NFR-2).

**Verification (Layer 3 checkpoint):**
- [x] Diff summary reviewed and approved: confirms markup insert, the safe-DOM
  `card()` rewrite (no `innerHTML` interpolation remains — grep of `dist/index.html`
  returns 0), and the wiring; existing header/grid/toast/load-error markup
  otherwise unchanged.
- [x] `cd app && npm test` — full suite still green (Layer 1 module unaffected; no
  test regression). 28 pass, 0 fail.
- [x] `cd app && npm run build` — build succeeds; `dist/index.html`,
  `dist/js/search-filter.js`, `dist/css/styles.css` all present (NFR-2 static
  parity; confirms Q5 no `build.js` change). The `<script>` src is relativized to
  `js/search-filter.js` by the existing normaliseHtml pass.
- [x] **Manual / wireframe verification** against the three depicted states in
  `inception/wireframes/screens/` — confirmed by reading the three screens: the
  implemented default (full catalogue, controls empty, Clear hidden), results
  (narrowed catalogue-ordered grid, Clear visible; documented `e` AND `<=50` ->
  p1/p3/p4/p6 covered by the L1 test), and empty (`div.empty-state` message,
  distinct from `.notice`, Clear visible) states match the wireframes:
  - `cd app && npm start` then open the listing — **default state**
    (`product-listing-default.html`): full catalogue, controls empty, Clear absent
    (FR-6/FR-8).
  - Enter a name fragment and/or price bounds, submit — **results state**
    (`product-listing-results.html`): grid narrows to catalogue-ordered matches,
    Clear visible; verify the documented example `name contains "e" AND price<=50`
    yields the four products (p1, p3, p4, p6) (FR-1…FR-5/FR-8).
  - Enter a non-matching term (e.g. `xyz`), submit — **empty state**
    (`product-listing-empty.html`): `div.empty-state` message shown, NOT `.notice`
    styling, Clear visible (FR-7/FR-8).
  - Enter inverted range (min>max), submit → empty-state (BR-5).
  - Enter `<img src=x onerror=alert(1)>` as the term and submit → no script
    executes, no markup injected; product cards render product data as inert text
    (FR-10/BR-12).
  - Resize below 720px → filter bar stacks to a full-width column (responsive).
  - Confirm Add-to-cart, toast, Details/image/name links, header Cart link all
    behave as before (NFR-2).
  - Repeat the default-state load under the static build (serve `dist/`) to confirm
    identical behaviour in both delivery modes (NFR-2/BR-14).

---

## Build / test commands (reference)

All run from `app/`:

- `npm test` — `node --test`; runs `order.test.js` + `search-filter.test.js`.
  Used at L1 (primary) and re-run at L3 (regression).
- `npm run build` — `node build.js`; assembles `dist/`. Used at L2 and L3 to
  confirm the new client-side files ship to the static build with no `build.js`
  change (Q5/NFR-2).
- `npm start` — `node server.js`; serves via Express for the L3 manual/wireframe
  verification (NFR-2 Express-mode parity).

## Execution rules (from skill / validation-spec)

- No code is written until this plan is human-approved (rule 1).
- Layers proceed in order; Layer N+1 does not begin until Layer N compiles and its
  verification passes (rule 2). Each layer is well under 12 files (rule 3).
- Unit tests are co-located in the same layer as the code they test — Layer 1
  (rule 4).
- Compile failure → self-correct up to 3 attempts; logic/test failure → stop and
  present to human (rule 5).
- Application code in the workspace (`app/`); only this plan and `CODE_SUMMARY.md`
  in aidlc-docs (rule 6).
- Brownfield: conventions extracted from `api.js`/`order.test.js`/`styles.css`
  before generating (rule 7); each existing-file edit (`styles.css`, `index.html`)
  presents a diff summary before writing (rule 8).
- On re-invocation: resume from the first unchecked layer; do not regenerate ✅
  layers unless files are missing on disk (rule 10).
