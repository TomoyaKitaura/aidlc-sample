# Domain Entities — product-listing

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: functional-design
Step: execution
Generated: 2026-06-29

## Upstream-availability note (read first)

This workflow **skipped the application-design and units-generation stages**
(single pre-existing client-side unit; asserted by `workflow-composition`).
Therefore the upstream artifacts named by the skill's Input/Output spec and the
validation-spec **do not exist**: `data-models.md`, `components.md`,
`component-methods.md`, `component-dependencies.md`, `services.md`,
`units-of-work.md`, `units-of-work-story-map.md`, `stories.md`/`personas.md`.

Per the builder protocol's gap/brownfield rules (and the precedent already set by
the wireframes stage in `screen-data-map.md`), this artifact:

- Grounds entities in the **existing codebase** — `app/src/data/products.js`
  (mirrored client-side via `app/public/js/api.js`) — as accepted brownfield
  context, in place of a (non-existent) `data-models.md`.
- Traces to **requirement IDs** (`FR-<n>`, `NFR-<n>`) and the single asserted
  **guest-shopper** persona, in place of `S-<n>` story IDs.
- **Flags every new domain construct introduced by this unit as an addition**,
  since there is no upstream catalogue to trace it to. The `AppliedFilterCriteria`
  value object and the `FilteredCatalogue` derived view are NEW; `Product` is
  existing.

This deviation is stated up front so the result is not read as orphan or
untraceable. It does not relax rigour: every entity is grounded in the existing
data shape or flagged as a new addition, with attributes, optionality,
invariants, lifecycle, and constraints stated precisely enough to implement.

---

## Entity: Product (existing)

- **Status:** Existing — defined in `app/src/data/products.js`
  (`PRODUCTS` array; `getAllProducts()` / `getProductById()` accessors), mirrored
  for the client at `app/public/js/api.js`. Not introduced by this unit.
- **Owning component:** Client-side catalogue data access (the existing product
  data layer; logically `getAllProducts` / `Api.fetchProducts`). No upstream
  `components.md` exists; this owner is grounded in the existing codebase.
- **Role in this unit:** The read-only source records that the search/filter logic
  narrows. The product-listing view derives its displayed set from these records;
  it never mutates them.

### Attributes

| Attribute | Logical type | Optionality | Default | Notes |
|---|---|---|---|---|
| `id` | string identifier | required | — | Unique within the catalogue. Used only to build the existing detail link; **never** consulted by search (FR-1). |
| `name` | text | required | — | The **only** field matched by the keyword search (FR-1, FR-2). |
| `price` | number (decimal) | required | — | Non-negative. The field the price-range filter compares against (FR-3). |
| `image` | URL / asset reference | required | — | Card thumbnail; not involved in filtering. |
| `description` | text | required | — | Shown on each card; **never** matched by search (FR-1). |

- No derived/computed attributes.

### Relationships

- None. The catalogue is a flat collection of independent `Product` records; a
  `Product` has no relationship to another `Product` or to any other entity.

### Invariants

- `id` is unique within the catalogue.
- `price` is a non-negative number.
- Searching/filtering is **non-mutating**: evaluating a `Product` against filter
  criteria never alters the `Product` (it remains read-only for this unit).

### Lifecycle

- **Not stateful.** `Product` records are fixed, in-memory data with no states,
  no transitions, and no lifecycle. There is no create/update/delete path within
  this unit.

### Constraints

- The catalogue is **read-only** for this unit; the search/filter feature adds no
  write path.
- **No persistence** of the catalogue is introduced by this unit (FR-9). The
  catalogue is whatever the existing data access returns on load.

### Concurrency

- N/A — single guest shopper, single client-side session; no concurrent
  modification of `Product` records is possible within this unit's scope.

---

## Value object: AppliedFilterCriteria (NEW — addition)

- **Status:** NEW — introduced by this unit. There is no upstream `data-models.md`
  to trace it to; it is flagged here as an addition. Decision basis: Q5 (model the
  applied criteria as a value object snapshotted at submit, not a stateful entity).
- **Owning component:** The product-listing view. The value object is constructed
  and held by the view as the snapshot of "what is currently applied" (see the
  pending-vs-applied note in `business-logic-model.md`).
- **Nature:** An **immutable value object** — equality is by value (two instances
  with the same `searchTerm`, `minPrice`, and `maxPrice` are equal). It is an
  immutable submit-time snapshot of the filter inputs, already normalised.

### Attributes

| Attribute | Logical type | Optionality | Default (empty/identity) | Notes |
|---|---|---|---|---|
| `searchTerm` | normalised text | always present (may be the empty string) | `""` | Trimmed + simple-lowercased at construction (Q4, BR-1). Internal whitespace is preserved **verbatim** (no tokenisation, no collapse). An all-whitespace raw input normalises to `""`. `""` means **no search constraint** (FR-2/FR-6). |
| `minPrice` | optional decimal lower bound | optional | absent | Absent (blank / empty-after-trim) means **no lower bound** (Q1, FR-3). Numeric-only input controls (`number` inputs, `min="0"`, decimal step — a UI-layer mechanism) preclude non-numeric/negative entry (Q2). |
| `maxPrice` | optional decimal upper bound | optional | absent | Absent means **no upper bound** (Q1, FR-3). |

- The **empty / identity criteria** is `searchTerm = ""` with both `minPrice` and
  `maxPrice` absent. Applying it denotes the **full catalogue** (FR-6).

### Relationships

- Applied against the `Product` catalogue by the pure filter function
  (`filterCatalogue` in `business-logic-model.md`) to produce a `FilteredCatalogue`.
  The value object holds no reference to any `Product`.

### Invariants

- **Immutable once snapshotted.** A constructed instance is never mutated; a new
  submit or a Clear produces a new instance that replaces the prior one wholesale.
- `searchTerm` is **already normalised** (trimmed + simple-lowercased) by
  construction (BR-1); downstream logic does not re-trim or re-case it.
- **No `minPrice ≤ maxPrice` invariant.** An inverted range (`minPrice > maxPrice`)
  is **permitted**; it is not rejected, swapped, or corrected. It simply yields no
  matches when applied (Q3, BR-5).
- The empty / identity criteria (`searchTerm = ""`, both bounds absent) denotes
  the full catalogue (FR-6).

### Lifecycle

- **Not stateful.** It is a value snapshot, replaced wholesale on each submit or
  Clear; it holds no transitions of its own. The pending-vs-applied distinction
  (FR-5 — editing controls without submitting changes nothing) lives in the
  **workflow** (the live control values versus the last-snapshotted value object),
  **not** as state on this object.

### Constraints

- **No persistence.** It is reconstructed as the empty/identity criteria on every
  page load (FR-9); it is never read from or written to the URL query string or
  browser storage.

### Concurrency

- N/A — single guest shopper, single client-side session.

---

## Derived view: FilteredCatalogue (NEW — addition, pure derivation, not stateful)

- **Status:** NEW — introduced by this unit, flagged as an addition. Decision
  basis: Q5 (pure derived view, not a stored/stateful entity).
- **Owning component:** Conceptually owned by the product-listing view as the
  thing it renders; it is **not a stored entity** and has no independent identity.
- **Definition:**
  `FilteredCatalogue = filterCatalogue(catalogue, appliedCriteria)` — a **pure,
  deterministic** function of `(catalogue, appliedCriteria)`. Given the same
  catalogue and the same applied criteria, it always produces the same result.
  See `business-logic-model.md` for the `filterCatalogue` definition.

### Attributes

- It is an ordered collection of the `Product` records that pass the applied
  criteria. **Order is preserved from the catalogue** (catalogue order; no sorting
  or ranking is introduced). It carries no fields of its own beyond the selected
  `Product` records.

### Relationships

- Derived from the `Product` catalogue under an `AppliedFilterCriteria`. It holds
  the subset of `Product` records that pass; it does not copy or mutate them.

### Invariants

- It is **always recomputable** from `(catalogue, appliedCriteria)` and is never
  the authoritative source — the catalogue is the single source of truth.
- An empty `FilteredCatalogue` (zero passing products) corresponds to the
  empty-state (FR-7), which must be rendered distinctly from the catalogue
  load-error notice (BR-8).
- Applying the empty/identity criteria yields the **entire catalogue** in
  catalogue order (FR-6).

### Lifecycle

- **Not stateful** and **not persisted.** It is a transient derivation recomputed
  on each explicit submit, on Clear, and on initial load. It has no states and no
  transitions.

### Constraints

- No persistence; no caching that would make it the source of truth. It is purely
  a function of its inputs.

### Concurrency

- N/A — single guest shopper, single client-side session.

---

## Traceability

| Entity / value object / view | Status | Grounding / basis | Requirements |
|---|---|---|---|
| `Product` | Existing | `app/src/data/products.js` / `app/public/js/api.js` | FR-1, FR-2, FR-3, FR-9 |
| `AppliedFilterCriteria` | NEW (addition) | Q5 (value-object snapshot); Q1, Q2, Q4 (attribute normalisation) | FR-2, FR-3, FR-5, FR-6, FR-9 |
| `FilteredCatalogue` | NEW (addition) | Q5 (pure derived view) | FR-4, FR-6, FR-7 |

Persona: guest shopper (single persona; no roles, no authentication).
