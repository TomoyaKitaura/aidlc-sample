# Business Logic Model — product-listing

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: functional-design
Step: execution
Generated: 2026-06-29

## Upstream-availability note (read first)

This workflow **skipped the application-design and units-generation stages**
(single pre-existing client-side unit; asserted by `workflow-composition`). The
upstream artifacts named by the skill's Input/Output spec and the validation-spec
therefore **do not exist**: `components.md`, `component-methods.md`,
`component-dependencies.md`, `services.md`, `event-catalog.md`,
`units-of-work.md`, `units-of-work-story-map.md`, `stories.md`/`personas.md`.

Per the builder protocol's gap/brownfield rules (and the precedent set by the
wireframes stage in `screen-data-map.md`), this artifact:

- Traces workflows and touchpoints to **requirement IDs** (`FR-<n>`, `NFR-<n>`)
  and the single asserted **guest-shopper** persona, in place of `S-<n>` story IDs.
- Grounds components and methods in the **existing codebase**
  (`app/src/data/products.js` / `app/public/js/api.js`), in place of a
  (non-existent) `component-methods.md` / `component-dependencies.md`.
- Flags new domain constructs (the `AppliedFilterCriteria` value object and the
  `filterCatalogue` function) as **additions**, since there is no upstream
  catalogue to trace them to.

This deviation is stated up front so the model is not read as orphan or
untraceable. Each workflow, touchpoint, and the filter function is specified
precisely enough to implement, and is technology-agnostic (no DOM, framework, or
CSS detail).

---

## Unit scope

- **Unit:** `product-listing`.
- **Persona:** Guest shopper (single persona; no authentication, no roles).
- **Owning component:** The client-side product-listing view and its supporting
  catalogue data access (the existing data layer, `getAllProducts` /
  `Api.fetchProducts`). No upstream `components.md` exists; this owner is grounded
  in the existing codebase.
- **Requirements owned by this unit** (in place of mapped `S-<n>` stories, per the
  upstream-availability note): **FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8,
  FR-9, FR-10, NFR-1, NFR-2** — the full set from `requirements.md`.

---

## Business workflows

Three workflows. W-1 is the primary flow; W-2 and W-3 are supporting flows. Each
cites the requirement IDs it satisfies and references the business rules
(`BR-<n>`) in `business-rules.md` and the domain constructs in
`domain-entities.md`.

### W-1 — Apply filter (explicit submit)

- **Trigger:** Explicit submit — the shopper clicks the Search control or presses
  Enter in a control (FR-5). Editing controls without submitting does **not**
  trigger this workflow.
- **Satisfies:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-10, NFR-1.

**Steps:**

1. **Read live control values.** Read the current raw values of the three
   controls: the search term, the minimum price, and the maximum price. These are
   the *pending* (live) values, distinct from the currently applied criteria.
2. **Normalise into an `AppliedFilterCriteria` value object.**
   - `searchTerm := lowercase(trim(rawTerm))` — trim ends, simple-lowercase;
     internal whitespace preserved verbatim; an all-whitespace term normalises to
     `""` (BR-1, Q4).
   - For each price bound: trim the raw value; empty-after-trim → bound **absent**;
     otherwise parse as a plain decimal (BR-3, Q1). Numeric-only input controls
     (number inputs, `min="0"`, decimal step — a UI-layer mechanism) preclude
     non-numeric/negative entry, and the absent-on-blank fallback keeps the parse a
     **total function** with no error path and no validation-error UI (BR-3, Q2).
3. **Snapshot the value object (pending → applied).** Replace the unit's applied
   criteria with this newly constructed, immutable value object. This snapshot
   **is** the pending-to-applied transition required by FR-5 (BR-9). The applied
   criteria is the only thing that changed; the live controls are unchanged.
4. **Compute the filtered result (pure derivation).**
   `filteredProducts := filterCatalogue(catalogue, appliedCriteria)` — the pure
   function defined below (Q5). It applies the name-substring predicate (BR-2) AND
   the inclusive price-range predicate (BR-4), combined with AND (BR-6).
5. **Branch on result size.**
   - **≥ 1 match →** render the product grid in **catalogue order** with the
     matching products (FR-1…FR-4).
   - **0 matches →** render the distinct empty-state (FR-7, BR-8) and no product
     cards.

**Decision points:**

| Condition | Outcome | Rules |
|---|---|---|
| `searchTerm == ""` AND both bounds absent | Full catalogue (every product passes) | BR-7 (FR-6) |
| `filterCatalogue` result size `> 0` | Render grid in catalogue order | BR-2, BR-4, BR-6 (FR-1…FR-4) |
| `filterCatalogue` result size `== 0` | Render distinct empty-state | BR-8 (FR-7) |
| `minPrice > maxPrice` (inverted range) | Falls out as zero matches → empty-state (no special-casing) | BR-5 (Q3, FR-7) |

- **Output-encoding obligation:** any echo of the (normalised or raw) search term
  back into the page is treated as **inert text**, output-encoded, never markup
  (FR-10, BR-12). This is an obligation on the rendering side of this workflow.

### W-2 — Clear / reset

- **Trigger:** The shopper activates the Clear control. Clear is present **only
  when** at least one live control is non-empty (FR-8, BR-10).
- **Satisfies:** FR-6, FR-8.

**Steps:**

1. Reset all controls — the search term and both price bounds — to empty.
2. Set the applied criteria to the **empty / identity** `AppliedFilterCriteria`
   (`searchTerm = ""`, both bounds absent).
3. Recompute `filterCatalogue(catalogue, emptyCriteria)` → the **full catalogue**
   in catalogue order (FR-6, BR-7).
4. Render the full grid; the Clear control becomes absent again (no live control
   is non-empty) (FR-8, BR-10).

### W-3 — Initial load

- **Trigger:** Page load (FR-9).
- **Satisfies:** FR-6, FR-9, NFR-2.

**Steps:**

1. Load the catalogue via the existing client-side data access (read-only;
   `getAllProducts` / `Api.fetchProducts`).
2. Initialise the applied criteria to the **empty / identity** criteria. Controls
   start empty; **no** filter state is read from the URL query string or browser
   storage (FR-9, BR-11).
3. Render the **full catalogue** in catalogue order (FR-6, BR-7). The Clear control
   is absent (no live control is non-empty) (FR-8). The default view is identical
   to today's full-catalogue landing view, with no regression (NFR-2, BR-14).

---

## The pure filter function — `filterCatalogue(catalogue, appliedCriteria)`

NEW construct (addition); decision basis Q5. Pure, deterministic,
technology-agnostic.

```
filterCatalogue(catalogue, appliedCriteria):
    return [ product
             for product in catalogue                       # catalogue order preserved
             if matchesSearch(product, appliedCriteria.searchTerm)     # BR-2
             and matchesPrice(product, appliedCriteria.minPrice,
                                       appliedCriteria.maxPrice) ]      # BR-4

matchesSearch(product, searchTerm):
    # BR-2 — name-only contiguous substring; empty term matches everything
    return searchTerm == ""
           or contains(lowercase(product.name), searchTerm)

matchesPrice(product, minPrice, maxPrice):
    # BR-4 — inclusive on both ends; absent bound = no constraint on that side
    return (minPrice is absent or product.price >= minPrice)
           and (maxPrice is absent or product.price <= maxPrice)
```

- **Determinism / purity:** no side effects, no I/O, no mutation of `catalogue` or
  any `Product`. Same inputs → same output.
- **Order:** preserves catalogue order (no sorting/ranking).
- **AND-combination (BR-6, FR-4):** a product is included **iff** it passes both
  `matchesSearch` and `matchesPrice` — the result equals the intersection of the
  two dimensions.
- **Empty/identity criteria (BR-7, FR-6):** when `searchTerm == ""` and both bounds
  are absent, both predicates are vacuously true → the full catalogue.
- **Inverted range (BR-5, Q3):** `minPrice > maxPrice` is honoured literally by
  `matchesPrice`, so no product satisfies it → zero matches (the empty-state, FR-7).
  No swap, no special branch.

---

## Pending-vs-applied (FR-5)

- The unit distinguishes the **live (pending) control values** from the **applied
  criteria** (the last `AppliedFilterCriteria` snapshot).
- Editing the search input or a price input **without submitting** changes only the
  live control values; it does **not** change the applied criteria and does **not**
  change the rendered result (FR-5, BR-9).
- The applied criteria changes only via W-1 (submit → new snapshot) or W-2 (Clear →
  empty/identity criteria).
- This is the **only** stateful nuance in the unit, and it is expressed as the
  snapshot, **not** as an entity lifecycle or state machine (see
  `domain-entities.md`: `AppliedFilterCriteria` is a not-stateful value object).

---

## Derived nature and responsiveness (NFR-1)

- The rendered result is a **pure, synchronous, in-memory derivation** over the
  small catalogue (~6 products) with **no network round-trip** on submit. The
  recompute + re-render completes within ~100 ms (NFR-1, BR-13).
- The result is always `filterCatalogue(catalogue, appliedCriteria)`; there is no
  long-lived mutable result entity to keep consistent.

---

## Domain events

- This unit **produces and consumes no domain events.** There is no upstream
  `event-catalog.md`, and the unit is a purely client-side derived view with no
  cross-boundary event flow. (Stated explicitly per the skill's domain-events
  section; this is an explicit negative, not an omission.)

---

## Integration touchpoints

- **Single touchpoint — read-only catalogue load.** On initial load (W-3), the
  unit reads the catalogue via the existing client-side data access
  (`getAllProducts` / `Api.fetchProducts`). This is the only cross-boundary
  interaction.
  - **Direction / pattern:** read-only; the unit never writes back to the data
    layer and introduces no write path.
  - **No cross-boundary writes.** The checkout and cart flows are untouched
    (NFR-2, BR-14); the existing detail-link / add-to-cart / cart-nav actions are
    reused unchanged and are outside this unit's filter logic.
- **Grounding note:** there is no upstream `component-dependencies.md`; this
  touchpoint is grounded in the existing codebase
  (`app/src/data/products.js` / `app/public/js/api.js`) as accepted brownfield
  context, and is the only cross-boundary interaction this unit relies on.

---

## Requirement coverage by workflow

| Requirement | Addressed by |
|---|---|
| FR-1 (name keyword search) | W-1 |
| FR-2 (single contiguous substring) | W-1 |
| FR-3 (optional inclusive price bounds) | W-1 |
| FR-4 (AND-combine) | W-1 |
| FR-5 (explicit submit) | W-1 (+ pending-vs-applied) |
| FR-6 (full-catalogue default) | W-1, W-2, W-3 |
| FR-7 (distinct empty-state) | W-1 |
| FR-8 (conditional Clear) | W-2 (and absence on W-1/W-3 default) |
| FR-9 (no persistence; reset on load) | W-3 |
| FR-10 (output-encoding hygiene) | W-1 (rendering obligation) |
| NFR-1 (~100 ms responsiveness) | W-1 |
| NFR-2 (no regression to delivery modes) | W-3 (and overall) |
