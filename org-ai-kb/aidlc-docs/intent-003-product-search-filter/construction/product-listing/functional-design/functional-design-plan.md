# Functional Design — Plan

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: functional-design
Step: planning
Generated: 2026-06-29

## Purpose

Plan for the three functional-design artifacts of the `product-listing` unit:
`business-logic-model.md`, `domain-entities.md`, and `business-rules.md`. This
plan describes the structure and content of each artifact and how they encode
the search/filter business logic. The artifacts themselves are written only
after this plan is approved (execution step).

## Inputs and grounding

- `requirements.md` — locked FR-1…FR-10, NFR-1/NFR-2 (single source of behaviour).
- `screen-data-map.md`, `wireframe-guidance.md` — the single Product Listing
  screen, its three states (default / results / empty), inputs (search term,
  optional min/max price), and the explicit-submit + conditional-Clear interaction.
- `app/src/data/products.js` — the canonical product shape:
  `{ id: string, name: string, price: number, image: string, description: string }`,
  fixed in-memory catalogue (6 products, $14.50–$129.00), accessed client-side
  via `getAllProducts()` (mirrored in `app/public/js/api.js`).
- Answered clarification questions Q1–Q5 (all `[Answer]:` filled).

## Upstream-availability note (read first)

This workflow **skipped application-design and units-generation** (single
pre-existing client-side unit; asserted by workflow-composition). Therefore the
following upstream artifacts named by the skill/validation-spec **do not exist**:
`data-models.md`, `component-methods.md`, `component-dependencies.md`,
`components.md`, `services.md`, `event-catalog.md`, `units-of-work.md`,
`units-of-work-story-map.md`, `stories.md`/`personas.md`.

Per the builder protocol's gap/brownfield rules and the precedent already set by
the wireframes stage (documented in `screen-data-map.md`), the artifacts will:

- Trace to **requirement IDs** (`FR-<n>`, `NFR-<n>`) in place of `S-<n>` story IDs,
  and to the single asserted **guest-shopper** persona.
- Ground entities and methods in the **existing codebase** (`products.js`,
  `api.js`) as accepted brownfield context, rather than in a (non-existent)
  `data-models.md` / `component-methods.md`. New domain constructs introduced by
  this unit (the applied-criteria value object, the filter function) are flagged
  explicitly as additions, since there is no upstream catalogue to trace them to.

This deviation is stated up front in each artifact so the result is not read as
orphan/untraceable. It does not relax rigour: every workflow, entity, and rule is
still traced to FR/NFR IDs and the logic is implementation-precise.

## Locked decisions carried in from Q1–Q5

- **Q1 (price normalisation):** trim the raw price string; empty-after-trim =
  absent bound; otherwise parse as a plain decimal (no currency symbol, no
  thousands separators, no locale handling).
- **Q2 (input constraint):** price min/max use **numeric-only input controls**
  (number inputs, `min="0"`, decimal step) so non-numeric/negative values cannot
  be entered. The business rule still treats blank/absent as "no bound on that
  side" as the safety net; the unparseable case is effectively unreachable. **No
  separate validation-error UI.** (This is a UI *constraint* recorded as the
  precondition of the price-bound rules, not a UI design decision — it is
  captured as the assumption that makes the parse total.)
- **Q3 (inverted range):** honour `min ≤ price ≤ max` literally; min > max matches
  no product and yields the empty-state (FR-7). No swap, no special-casing.
- **Q4 (search normalisation):** trim ends + simple lowercase only; internal
  whitespace preserved verbatim (no tokenisation, no collapse); an all-whitespace
  term trims to empty and imposes no search constraint (full catalogue for the
  search dimension, per FR-6).
- **Q5 (domain model):** pure derived view. Catalogue is the single source of
  truth; result = `filter(catalogue, appliedCriteria)`; applied criteria is a
  **value object snapshotted at submit** (the pending-vs-applied distinction of
  FR-5). No lifecycle entity, no state machine, no persistence (FR-9).

---

## Artifact 1 — `business-logic-model.md`

Sections to produce:

- [x] **Header + upstream-availability note.** Restate the application-design /
      units-generation skip and the FR/NFR + guest-shopper traceability basis.
- [x] **Unit scope.** Unit name `product-listing`; owning logical component =
      the client-side product-listing view + its data access (`Api.fetchProducts`
      / `getAllProducts`); persona = guest shopper. In place of mapped `S-<n>`
      stories, list the requirements owned by this unit: FR-1…FR-10, NFR-1, NFR-2.
- [x] **Business workflows.** One primary workflow plus two supporting ones, each
      step-by-step with decision points and the FR IDs they satisfy:
  - [x] **W-1 Apply filter (explicit submit).** Trigger = submit (Search button
        or Enter, FR-5). Steps: (1) read live control values; (2) normalise into
        an `AppliedFilterCriteria` value object — trim+lowercase term (Q4),
        trim+parse-or-absent each price bound (Q1, Q2); (3) snapshot the value
        object (this is the pending→applied transition, FR-5); (4) compute
        `filteredProducts = filterCatalogue(catalogue, appliedCriteria)` — the
        pure filter function (Q5); (5) branch on result size → render grid in
        catalogue order (≥1) or empty-state (0, FR-7). Decision points:
        empty-criteria → full catalogue (FR-6); zero matches → empty-state (FR-7);
        inverted range falls out as zero matches (Q3). Cites the AND-combination
        (FR-4) and the name-only substring + inclusive-price predicates (FR-1…FR-3).
  - [x] **W-2 Clear / reset.** Trigger = Clear control (visible only when criteria
        non-empty, FR-8). Steps: reset term + both bounds to empty, set applied
        criteria to the empty/identity criteria, recompute → full catalogue,
        hide Clear. Cites FR-6, FR-8.
  - [x] **W-3 Initial load.** Trigger = page load (FR-9). Steps: load catalogue
        via existing data access; applied criteria = empty (no persistence,
        controls empty); render full catalogue (FR-6). Cites FR-6, FR-9, NFR-2.
- [x] **Pending-vs-applied note.** Explicitly state that editing controls without
      submitting does not change the applied criteria nor the rendered result
      (FR-5); the only stateful nuance is the snapshot, not an entity lifecycle.
- [x] **Derived nature / responsiveness.** Note the result is a pure synchronous,
      in-memory derivation over ~6 products with no network round-trip, satisfying
      NFR-1 (~100 ms). Output-encoding hygiene (FR-10) is recorded as a rendering
      obligation on the workflow that echoes the term (treated as inert text).
- [x] **Domain events.** State explicitly that this unit produces/consumes **no
      domain events** (no `event-catalog.md` upstream; purely client-side derived
      view) — satisfies the skill's domain-events section by explicit negative.
- [x] **Integration touchpoints.** One touchpoint: read-only catalogue load via
      the existing client-side data access (`getAllProducts` / `Api.fetchProducts`).
      No cross-boundary writes; checkout/cart flows untouched (NFR-2). State that
      no `component-dependencies.md` exists upstream and this touchpoint is grounded
      in the existing codebase.

## Artifact 2 — `domain-entities.md`

Sections to produce:

- [x] **Header + upstream-availability note** (no `data-models.md`; entities
      grounded in `products.js` and flagged where newly introduced by this unit).
- [x] **Entity: Product** (existing, from `app/src/data/products.js`).
  - [x] Owning component: client-side catalogue data access.
  - [x] Attributes: `id` (string identifier, required), `name` (text, required —
        the only field matched by search, FR-1), `price` (number/decimal,
        required — the field the price filter compares, FR-3), `image`
        (URL/asset ref, required), `description` (text, required — never matched,
        FR-1). No derived attributes.
  - [x] Relationships: none (flat catalogue records).
  - [x] Invariants: `id` unique within the catalogue; `price` is a non-negative
        number; matching/filtering never mutates a Product.
  - [x] Lifecycle: **not stateful** — fixed in-memory records, no states/transitions.
  - [x] Constraints: catalogue is read-only for this unit; no persistence (FR-9).
- [x] **Value object: AppliedFilterCriteria** (NEW — flagged as an addition;
      no upstream catalogue, introduced by this unit per Q5).
  - [x] Owning component: the product-listing view (snapshot held at submit).
  - [x] Attributes:
    - [x] `searchTerm` — normalised text: trimmed + simple-lowercased; may be the
          empty string meaning "no search constraint" (Q4, FR-1/FR-2/FR-6).
          Internal whitespace preserved verbatim; all-whitespace input normalises
          to empty.
    - [x] `minPrice` — optional decimal lower bound; absent (blank/empty-after-trim)
          means "no lower bound" (Q1, FR-3). Numeric-only input precludes
          non-numeric/negative entry (Q2).
    - [x] `maxPrice` — optional decimal upper bound; absent means "no upper bound"
          (Q1, FR-3).
  - [x] Relationships: applied against the Product catalogue by the filter function.
  - [x] Invariants: it is **immutable once snapshotted** (a value object — equality
        by value); `searchTerm` is already trimmed+lowercased; there is **no
        invariant that `minPrice ≤ maxPrice`** — an inverted range is permitted and
        simply yields no matches (Q3). The empty/identity criteria
        (`searchTerm = ""`, both bounds absent) denotes the full catalogue (FR-6).
  - [x] Lifecycle: **not stateful** — a value snapshot, replaced wholesale on each
        submit/clear; no transitions held on the object itself. The pending-vs-
        applied distinction (FR-5) lives in the workflow, not as object state.
  - [x] Constraints: no persistence; reconstructed empty on every load (FR-9).
- [x] **Derived view: FilteredCatalogue** (described as a pure derivation, not a
      stored entity, per Q5).
  - [x] Definition: `FilteredCatalogue = filterCatalogue(catalogue, appliedCriteria)`
        — a pure, deterministic function of (catalogue, applied criteria); order
        preserved from the catalogue. Stated explicitly as **not stateful** and
        **not persisted**; always recomputable. Empty result → empty-state (FR-7).
- [x] **Concurrency:** state explicitly N/A — single guest shopper, single
      client-side session, no concurrent modification.

## Artifact 3 — `business-rules.md`

A catalogue of `BR-<n>` rules. Each rule: ID, name, description, type, trigger,
declarative logic, violation/non-match behaviour, and the FR/NFR IDs it supports
(used in place of `S-<n>`). Planned rules:

- [x] **BR-1 Search-term normalisation** (calculation/transformation). Trigger:
      building AppliedFilterCriteria at submit. Logic: `searchTerm := lowercase(
      trim(rawTerm))`; internal whitespace preserved; result may be `""`. (Q4,
      FR-1, FR-2.)
- [x] **BR-2 Name substring match** (constraint/predicate). Trigger: per product
      during filter. Logic: product passes the search dimension iff
      `searchTerm == "" OR contains(lowercase(product.name), searchTerm)`; only
      `name` is consulted (never `description`/`id`); single contiguous substring,
      no tokenisation. (FR-1, FR-2, FR-6.)
- [x] **BR-3 Price-bound normalisation** (calculation/transformation). Trigger:
      building AppliedFilterCriteria at submit. Logic: for each of min/max,
      `trim` the raw value; empty → bound absent; otherwise parse as plain decimal
      (no symbols/separators). Numeric-only input controls preclude
      non-numeric/negative values; the absent-on-blank fallback makes the parse a
      total function (no error path, no validation-error UI). (Q1, Q2, FR-3.)
- [x] **BR-4 Inclusive price-range match** (constraint/predicate). Trigger: per
      product during filter. Logic: product passes the price dimension iff
      `(minPrice absent OR product.price >= minPrice) AND (maxPrice absent OR
      product.price <= maxPrice)` — inclusive on both ends. (FR-3.)
- [x] **BR-5 Inverted range yields empty** (constraint; expressed as a consequence,
      not a special case). Trigger: filter with `minPrice > maxPrice`. Logic: the
      inclusive predicate (BR-4) is honoured literally, so no product satisfies it
      → zero matches → empty-state (FR-7). No swap/auto-correct. (Q3, FR-3, FR-7.)
- [x] **BR-6 AND-combination** (constraint). Trigger: per product during filter.
      Logic: a product appears iff it passes **both** the search dimension (BR-2)
      **and** the price dimension (BR-4); the result equals the intersection.
      (FR-4.)
- [x] **BR-7 Full-catalogue default** (constraint). Trigger: filter with empty
      criteria. Logic: when `searchTerm == ""` AND both bounds absent, every
      product passes (BR-2 and BR-4 are both vacuously true) → full catalogue, in
      catalogue order. Holds on initial load and after Clear. (FR-6, FR-8, FR-9.)
- [x] **BR-8 Empty-state on zero matches** (state-transition of the rendered view /
      constraint). Trigger: filter result size == 0. Logic: render the explicit
      empty-state message, no cards; must be visually distinct from the
      load-error notice. (FR-7.)
- [x] **BR-9 Explicit-submit application** (constraint). Trigger: control edits vs
      submit. Logic: the AppliedFilterCriteria and the rendered result change only
      on an explicit submit (Search button / Enter); editing controls without
      submitting leaves applied criteria and result unchanged (pending ≠ applied).
      (FR-5.)
- [x] **BR-10 Conditional Clear visibility** (constraint). Trigger: control state.
      Logic: Clear is present iff at least one *live* control is non-empty
      (non-empty term OR either price input non-empty); activating Clear resets all
      controls + applied criteria to empty and restores the full catalogue. (FR-8.)
- [x] **BR-11 No persistence / reset on load** (constraint). Trigger: page load.
      Logic: term and both bounds start empty on every load; applied criteria =
      empty; no URL query-param or browser-storage read/write of filter state.
      (FR-9.)
- [x] **BR-12 Output-encoding hygiene** (constraint/validation). Trigger: echoing
      the search term into the page. Logic: the term is inert data and is
      output-encoded (rendered as text, never markup); markup/script characters do
      not execute or alter page structure. (FR-10.)
- [x] **BR-13 Responsiveness** (constraint; non-functional). Trigger: explicit
      submit. Logic: the in-memory recompute + re-render completes within ~100 ms
      on the ~6-product catalogue with no network round-trip. (NFR-1.)
- [x] **BR-14 No regression to delivery modes** (constraint; non-functional).
      Trigger: feature operation. Logic: the filter behaviour is identical under
      the static GitHub Pages build and the Express server; default view and
      cart/checkout flows unchanged. (NFR-2.)
- [x] **Conflict review.** Confirm and document that no two rules produce
      conflicting outcomes for the same trigger (e.g. BR-4 vs BR-5: BR-5 is a
      derived consequence of BR-4, not a contradiction; BR-2/BR-6 compose, they do
      not conflict). No decision-table-class rule (no multi-variable branching with
      divergent outcomes) is present; the filter is a conjunction of independent
      predicates, so prose + the per-rule logic expressions suffice.

## Traceability coverage

- [x] Every FR (FR-1…FR-10) and NFR (NFR-1, NFR-2) maps to ≥1 business rule and is
      addressed by a workflow:
      FR-1→BR-1/BR-2; FR-2→BR-2; FR-3→BR-3/BR-4/BR-5; FR-4→BR-6; FR-5→BR-9;
      FR-6→BR-7; FR-7→BR-5/BR-8; FR-8→BR-10; FR-9→BR-11; FR-10→BR-12;
      NFR-1→BR-13; NFR-2→BR-14.
- [x] Every workflow (W-1, W-2, W-3) cites the FR/NFR IDs it satisfies.
- [x] Q1→BR-3; Q2→BR-3 (input-constraint note); Q3→BR-5 + AppliedFilterCriteria
      "no min≤max invariant"; Q4→BR-1; Q5→AppliedFilterCriteria value object +
      FilteredCatalogue derived view + W-1 snapshot.

## Out of scope for these artifacts

- Any technology, framework, DOM, or CSS detail (technology-agnostic, per the
  builder protocol and validation rule 13). Implementation lives in code-generation.
- Filtering by category/tag, description/id matching, tokenisation, fuzzy match,
  ranking, live filtering, server-side filter, pagination, sorting, and any
  filter-state persistence (all out of scope per `requirements.md`).
