# Wireframes — Plan

Intent: intent-003-product-search-filter
Skill: wireframes
Step: planning
Generated: 2026-06-29

## Purpose

Add a name-search + price-range filter bar to the EXISTING product-listing page
(`app/public/index.html`, styled by `app/public/css/styles.css`) and produce the
wireframes-skill deliverables for downstream consumption. Behaviour is locked by
`requirements.md` (FR-1…FR-10, NFR-1/NFR-2) and is NOT re-litigated here. This plan
covers only the visual/layout decisions settled by the answered questions
(`wireframes-questions.md`, Q1–Q5, all recommendations accepted).

## Context and grounding notes

- **Brownfield, single page changed.** Only the catalogue listing screen
  (`index.html`) is affected. The header (`.site-header` brand + Products/Cart nav),
  product grid (`.product-grid` / `.product-card`), and the rest of the site
  (cart, product detail, checkout) are unchanged. Wireframes reuse the real
  `app/public/css/styles.css` (Q4) so the human reviews against genuine site styling.
- **No user-stories stage in this workflow.** `workflow.md` feeds wireframes directly
  from `requirements.md`; there is no `stories.md`/`personas.md`. Per the builder
  protocol gap/brownfield rules, screens trace to requirement IDs (`FR-<n>`) instead
  of `S-<n>` story IDs, and the single persona is the **guest shopper** asserted by
  workflow-composition. This deviation from the validation-spec's "Source stories"
  wording will be stated explicitly in `screen-data-map.md` so it is not read as an
  orphan/untraceable screen.
- **One logical screen, three depicted states (Q5).** There is a single screen
  (Product Listing). The three wireframe files are three *states* of that one screen,
  not three separate screens.
- **Strictly within locked requirements.** No result count (Q3 = no count). No data
  fields beyond `name`, `price`, `description`, `image`, `id` already in the catalogue
  (api.js / products.json). No persistence, no live filtering, no extra controls.

## Layout decisions captured (from Q1–Q5)

- **Q1 — Placement:** A horizontal search/filter bar in `<main>`, directly below
  `<h1>Products</h1>` and above the `#status`/grid region, at full content width,
  scrolling with the page (not sticky). Grid keeps its current
  `auto-fill minmax(230px, 1fr)` responsive behaviour untouched.
- **Q2 — Arrangement:** A single wrapping flex row on desktop —
  `[search input] [min price] [max price] [Search button] [Clear ×]` — that wraps /
  stacks to a vertical column on narrow viewports (reusing the existing 720px
  responsive instinct and the stylesheet's flex-row patterns, e.g. `.row-gap`,
  `.actions`).
- **Q3 — No result count.** The bar shows controls only; feedback is the grid itself
  plus the empty-state message when zero match.
- **Q4 — HTML wireframes** that `<link>` the real `app/public/css/styles.css`, so each
  state renders in actual site styling. New, feature-specific styling needed for the
  bar is expressed as proposed additive CSS classes (e.g. `.filter-bar`) documented in
  `wireframe-guidance.md`; the wireframe HTML may inline a minimal style block ONLY for
  the new bar to preview it, clearly marked as proposed additive styling, never editing
  the real stylesheet.
- **Q5 — Three depicted states** of the single listing screen:
  1. **Default / full catalogue** — empty controls, full grid, **no Clear** (FR-6, FR-8).
  2. **Active filter with results** — populated controls, narrowed grid, **Clear visible**
     (FR-1…FR-5, FR-8).
  3. **Active filter, zero matches** — populated controls, **distinct empty-state**
     message using `.empty-state` (neutral muted, centred), explicitly NOT the
     error-styled `.notice` used for load failure, **Clear visible** (FR-7, FR-8).

## Deliverables

### A. Visual wireframes — `screens/` directory (HTML, reuse real stylesheet) (Q4)

Folder-structure convention places visual files under `screens/`. One HTML file per
depicted state of the single Product Listing screen:

- [x] `screens/product-listing-default.html` — State 1: default full catalogue, empty
      controls, no Clear. Annotated to mark the new `.filter-bar` region and note that
      Clear is intentionally absent (FR-8).
- [x] `screens/product-listing-results.html` — State 2: active filter with matching
      results. Controls pre-filled with an illustrative term and price bound; grid
      shows a narrowed subset; Clear (×) visible. Annotated for the explicit-submit
      model (FR-5) and AND-combine (FR-4).
- [x] `screens/product-listing-empty.html` — State 3: active filter, zero matches.
      Controls pre-filled with a non-matching query; grid replaced by the distinct
      `.empty-state` message (e.g. "No products match your search"); Clear visible.
      Annotated to contrast `.empty-state` (muted, centred) vs the load-error `.notice`
      (FR-7).

Each file:
- Reuses the existing header, `<main>`, `<h1>Products</h1>`, and product-card markup so
  the human sees the genuine page; placeholder product content is realistic (drawn from
  the existing catalogue shape: name, price, description, image).
- Adds the new filter bar between the `<h1>` and the status/grid region (Q1).
- Carries clearly-marked annotations (e.g. a comment band or labelled callouts) for
  behaviour not visible in a static snapshot (submit-only update, conditional Clear,
  empty-state distinctness). Annotations are visually separated from the previewed UI.
- Is well-formed, standalone HTML that renders without JavaScript (static snapshots of
  each state), so no behaviour is implied beyond the locked requirements.

### B. Machine-readable artifacts (markdown)

- [x] **`screen-data-map.md`** — one entry for the single **Product Listing** screen:
  - *Screen name:* Product Listing (catalogue with search & price filter).
  - *Purpose:* guest shopper browses the catalogue and narrows it by product name
    and/or price.
  - *Data displayed:* product cards — `name` (text), `price` (numeric/currency),
    `description` (text), `image` (URL/asset), link to detail by `id`; the
    empty-state message (text) in State 3. No result count (Q3).
  - *Data submitted:* search term (text, optional), minimum price (numeric, optional),
    maximum price (numeric, optional). All logical types consistent with
    `requirements.md` and the existing catalogue fields — no invented fields.
  - *Actions:* Search/Apply submit (button click or Enter) → recompute and render
    result set (FR-4, FR-5); Clear/Reset → empty all controls, restore full catalogue,
    hide itself (FR-8); Add to cart and Details links — existing, unchanged.
  - *Source requirements:* `FR-1…FR-10`, `NFR-1`, `NFR-2` (explicit note: this workflow
    skipped user-stories, so traceability is to requirement IDs, not `S-<n>`; single
    persona = guest shopper).
  - *Source components (inferred, not dictated):* the `product-listing` unit and its
    client-side data-access (`Api.fetchProducts` in `app/public/js/api.js`); filtering
    is client-side over the already-loaded catalogue. application-design makes the
    final call.

- [x] **`screen-structure.md`** — system-wide screen architecture for the changed page:
  - *Screen inventory:* the single Product Listing screen (with the three depicted
    states enumerated as states, not separate screens), positioned within the existing
    site map (sibling pages: Product Detail, Cart, Checkout — listed for context, not
    modified by this intent).
  - *Navigation map:* existing links only — header brand/Products → listing, Cart →
    cart, card name/Details/image → product detail, Add to cart → cart state. No new
    navigation introduced (no dead links; filter is in-page, no route change; FR-9
    no URL persistence).
  - *Component tree per screen:* `body` → `header.site-header` (brand + nav, shared,
    unchanged) → `main` → `h1` → **`.filter-bar` (NEW)** [search input, min price, max
    price, Search button, conditional Clear] → `#status` / `.product-grid` (or
    `.empty-state` in State 3) → existing `.toast`. The NEW region is the only addition.
  - *Shared components:* `.site-header` nav (unchanged), product card, toast — defined
    once, consistent across screens (consistency per validation rule 12).
  - *Screen groups:* catalogue/browse group (this screen) within the existing EC site.

- [x] **`wireframe-guidance.md`** — step-by-step reproduction guidance for
      code-generation, one entry for the Product Listing screen covering all three
      states:
  - *Element placement:* top-to-bottom — header (unchanged) → `h1` → filter bar →
    status/grid (or empty-state). Within the bar, left-to-right ordering, spacing/gap
    matching existing flex-row patterns, alignment, and wrap behaviour (Q1, Q2).
  - *Proposed additive CSS:* the new `.filter-bar` (and any helper classes) described in
    terms of the existing design tokens (`--card`, `--line`, `--radius`, `--accent`,
    `--muted`) and existing patterns (`.row-gap`, button styles, `form.checkout` input
    styling) so generated code stays consistent with the stylesheet. Explicit statement
    that the real `styles.css` is reused and only additive classes are introduced.
  - *Interaction behaviour (state transitions):* submit (button or Enter) recomputes and
    re-renders (FR-5); editing without submit changes nothing (FR-5); Clear appears once
    any control is non-empty and disappears on the default view (FR-8); Clear resets all
    controls and restores the full catalogue (FR-8); zero matches swaps the grid for the
    distinct `.empty-state` message, explicitly NOT the `.notice` error style (FR-7);
    output-encode any echo of the search term (FR-10). NFR-1 (~100 ms) noted as a
    rendering expectation.
  - *Responsive adaptations:* single wrapping flex row on wide viewports; controls stack
    to a column on narrow viewports (consistent with the existing 720px breakpoint);
    grid retains `auto-fill minmax(230px, 1fr)` (Q1, Q2).
  - *Conditional rendering:* Clear control (presence by active-control state, FR-8);
    grid-vs-empty-state (by result-set size, FR-7). No role/flag-based conditions
    (single guest persona).
  - *Animation/transition notes:* none introduced; existing toast behaviour unchanged.

## Out of scope for this skill / deferred

- No backend, API, or component-boundary design (that is application-design).
- No new data fields, result count, live filtering, persistence, or extra controls
  (locked by requirements; Q3 no count).
- No change to cart/checkout/detail pages or to the real `styles.css`.

## Execution checklist

- [x] Create `screens/product-listing-default.html` (State 1)
- [x] Create `screens/product-listing-results.html` (State 2)
- [x] Create `screens/product-listing-empty.html` (State 3)
- [x] Write `screen-data-map.md`
- [x] Write `screen-structure.md`
- [x] Write `wireframe-guidance.md`
- [x] Update `intent-state.md` (execution → complete) and append audit entry

> Note: artifacts above are produced only AFTER this plan is human-approved
> (`plan-verification: "true"`). This step produces the plan only.
