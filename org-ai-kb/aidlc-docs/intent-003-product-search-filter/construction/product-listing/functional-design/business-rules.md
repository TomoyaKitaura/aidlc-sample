# Business Rules — product-listing

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: functional-design
Step: execution
Generated: 2026-06-29

## Upstream-availability note (read first)

This workflow **skipped the application-design and units-generation stages**
(single pre-existing client-side unit; asserted by `workflow-composition`). There
is therefore **no `stories.md`/`personas.md`** and no `units-of-work-story-map.md`.
Per the builder protocol's gap/brownfield rules (and the precedent set by the
wireframes stage), each rule's **Requirements** field traces to requirement IDs
(`FR-<n>`, `NFR-<n>`) and the single asserted **guest-shopper** persona, in place
of `S-<n>` story IDs. Rules referencing the data shape are grounded in the
existing codebase (`app/src/data/products.js` / `app/public/js/api.js`); new
constructs (`AppliedFilterCriteria`, `filterCatalogue`) are defined in
`domain-entities.md` / `business-logic-model.md` and flagged there as additions.

All rules describe business logic only and are technology-agnostic. The one
exception explicitly permitted by the approved plan is BR-3, which **notes** the
numeric-only price input as a **UI-layer mechanism** (the precondition that makes
the price parse total); this is recorded as the rule's precondition, not as a UI
design decision.

---

## BR-1 — Search-term normalisation

- **Name:** Search-term normalisation
- **Type:** Calculation / transformation
- **Trigger:** Constructing the `AppliedFilterCriteria` value object at explicit
  submit (W-1, step 2).
- **Logic:** `searchTerm := lowercase(trim(rawTerm))`.
  - Trim leading/trailing whitespace; simple (ASCII/locale-default) lowercase.
  - **Internal** whitespace is preserved **verbatim** — no tokenisation, no
    collapsing of whitespace runs.
  - An all-whitespace raw input normalises to `""` (the empty string).
- **Violation behaviour:** None — total transformation; every raw input maps to a
  valid normalised `searchTerm` (possibly `""`). `""` imposes no search constraint
  (see BR-2, BR-7).
- **Requirements:** FR-1, FR-2 (Q4).

## BR-2 — Name substring match

- **Name:** Name-only contiguous substring match
- **Type:** Constraint (predicate)
- **Trigger:** Evaluating a product against the search dimension, per product,
  during `filterCatalogue` (W-1, step 4).
- **Logic:** A product passes the **search dimension** iff
  `searchTerm == "" OR contains(lowercase(product.name), searchTerm)`.
  - Only `name` is consulted — `description` and `id` are **never** matched.
  - Single **contiguous** substring; no tokenisation, no per-word or out-of-order
    matching. A multi-word term matches only the exact contiguous sequence.
  - Case-insensitive (both `searchTerm` and `name` are lowercased).
- **Violation behaviour:** A product whose name does not contain a non-empty
  `searchTerm` fails the search dimension and is excluded from the result.
- **Requirements:** FR-1, FR-2, FR-6.

## BR-3 — Price-bound normalisation

- **Name:** Price-bound normalisation
- **Type:** Calculation / transformation
- **Trigger:** Constructing the `AppliedFilterCriteria` value object at explicit
  submit (W-1, step 2), for each of `minPrice` and `maxPrice`.
- **Precondition (UI-layer mechanism, per Q2):** the price min/max use
  **numeric-only input controls** — HTML `number` inputs with `min="0"` and a
  decimal step — so non-numeric and negative values **cannot be entered** at the
  input layer. This is noted as the precondition that makes the parse below total;
  it is a UI-layer mechanism, not a UI design decision, and introduces **no
  separate validation-error UI**.
- **Logic:** for each bound, `trim` the raw value; if empty-after-trim → the bound
  is **absent** (no constraint on that side); otherwise parse it as a **plain
  decimal** (no currency symbol, no thousands separators, no locale handling).
- **Violation behaviour:** None — total function. The absent-on-blank fallback is
  the safety net; combined with the numeric-only input precondition, an
  unparseable/negative value is **effectively unreachable**, and if it somehow
  arose it would degrade to "absent" (no bound), never to an error. There is no
  error path and no validation-error UI.
- **Requirements:** FR-3 (Q1, Q2).

## BR-4 — Inclusive price-range match

- **Name:** Inclusive price-range match
- **Type:** Constraint (predicate)
- **Trigger:** Evaluating a product against the price dimension, per product,
  during `filterCatalogue` (W-1, step 4).
- **Logic:** A product passes the **price dimension** iff
  `(minPrice absent OR product.price >= minPrice) AND (maxPrice absent OR product.price <= maxPrice)`.
  - **Inclusive on both ends** — a product priced exactly at `minPrice` or exactly
    at `maxPrice` passes.
  - An absent bound imposes no constraint on that side (blank min = no lower
    bound; blank max = no upper bound).
- **Violation behaviour:** A product whose price falls outside an active bound
  fails the price dimension and is excluded.
- **Requirements:** FR-3.

## BR-5 — Inverted range yields empty (consequence, not a special case)

- **Name:** Inverted range yields empty
- **Type:** Constraint (expressed as a consequence of BR-4)
- **Trigger:** `filterCatalogue` evaluated with `minPrice > maxPrice` (an inverted
  range).
- **Logic:** The inclusive predicate BR-4 is honoured **literally**. When
  `minPrice > maxPrice`, no `product.price` can satisfy both `>= minPrice` and
  `<= maxPrice`, so **zero products** pass the price dimension → zero matches → the
  empty-state (BR-8). There is **no** swap, auto-correct, or special-casing.
- **Violation behaviour:** Not applicable — this is the literal, intended outcome
  of BR-4, surfaced here for clarity. The result is the empty-state.
- **Requirements:** FR-3, FR-7 (Q3).

## BR-6 — AND-combination

- **Name:** AND-combination of search and price dimensions
- **Type:** Constraint
- **Trigger:** Evaluating a product during `filterCatalogue` (W-1, step 4).
- **Logic:** A product appears in the result iff it passes **both** the search
  dimension (BR-2) **and** the price dimension (BR-4). The result equals the
  **intersection** of the two dimensions: a product matching the term but outside
  the price range is excluded, and vice versa.
- **Violation behaviour:** A product failing either dimension is excluded.
- **Requirements:** FR-4.

## BR-7 — Full-catalogue default

- **Name:** Full-catalogue default (empty criteria)
- **Type:** Constraint
- **Trigger:** `filterCatalogue` evaluated with the empty / identity criteria —
  `searchTerm == ""` AND both bounds absent. Occurs on initial load (W-3) and
  after Clear (W-2).
- **Logic:** When `searchTerm == ""` and both bounds are absent, BR-2 and BR-4 are
  each **vacuously true** for every product, so **every** product passes → the
  **full catalogue**, in catalogue order.
- **Violation behaviour:** None — this is the default state.
- **Requirements:** FR-6, FR-8, FR-9.

## BR-8 — Empty-state on zero matches

- **Name:** Distinct empty-state on zero matches
- **Type:** State-transition of the rendered view / constraint
- **Trigger:** `filterCatalogue` result size `== 0` (W-1, step 5).
- **Logic:** Render the explicit empty-state message (e.g. "No products match your
  search") and **no** product cards. The empty-state must be **visually distinct
  from** the catalogue load-error notice, so the shopper can tell "nothing matched"
  apart from "loading failed".
- **Violation behaviour:** Not applicable — defines the rendered outcome. (Rendering
  the empty-state with the load-error styling would violate the distinctness
  requirement.)
- **Requirements:** FR-7.

## BR-9 — Explicit-submit application

- **Name:** Explicit-submit application (pending ≠ applied)
- **Type:** Constraint
- **Trigger:** Any edit to a control versus an explicit submit (Search click /
  Enter).
- **Logic:** The `AppliedFilterCriteria` and the rendered result change **only** on
  an explicit submit. Editing the search input or either price input **without
  submitting** leaves the applied criteria and the rendered result **unchanged**
  (the live/pending control values are not the applied criteria). On submit, a new
  criteria snapshot is taken and the result is recomputed.
- **Violation behaviour:** Recomputing/re-rendering on a non-submit input change
  (e.g. as-you-type) would violate this rule.
- **Requirements:** FR-5.

## BR-10 — Conditional Clear visibility

- **Name:** Conditional Clear visibility
- **Type:** Constraint
- **Trigger:** The live control state.
- **Logic:** The Clear control is **present iff at least one live control is
  non-empty** — a non-empty search term OR a non-empty minimum price OR a non-empty
  maximum price. On the default view (empty term and both bounds unset) Clear is
  **absent**. Activating Clear resets all controls and the applied criteria to the
  empty/identity criteria, restores the full catalogue (BR-7), and hides Clear.
- **Violation behaviour:** Showing Clear on the default view, or hiding it while a
  control is non-empty, would violate this rule.
- **Requirements:** FR-8.

## BR-11 — No persistence / reset on load

- **Name:** No persistence; reset on every load
- **Type:** Constraint
- **Trigger:** Page load (W-3).
- **Logic:** The search term and both price bounds start **empty** on every load;
  the applied criteria initialises to the empty/identity criteria. **No** filter
  state is read from or written to the URL query string or browser storage. After
  any search/filter, reloading shows empty controls and the full catalogue.
- **Violation behaviour:** Reading or writing filter state to the URL or browser
  storage, or carrying filter state across a reload, would violate this rule.
- **Requirements:** FR-9.

## BR-12 — Output-encoding hygiene

- **Name:** Output-encoding hygiene for the search term
- **Type:** Validation / constraint
- **Trigger:** Echoing the search term into the page (any render that includes the
  term).
- **Logic:** The search term is **inert data**; any echo of it into the page is
  **output-encoded** (rendered as text, never as markup). Markup/script characters
  (e.g. `<img src=x onerror=alert(1)>`) do **not** execute and do **not** alter the
  page structure when entered, submitted, or echoed back.
- **Violation behaviour:** Interpolating the term as live markup (unencoded) would
  violate this rule.
- **Requirements:** FR-10.

## BR-13 — Responsiveness

- **Name:** Responsiveness on submit
- **Type:** Constraint (non-functional)
- **Trigger:** Explicit submit (W-1).
- **Logic:** The in-memory recompute (`filterCatalogue`) plus re-render completes
  within **~100 ms** on the current ~6-product catalogue, with **no network
  round-trip** (purely client-side, in-memory derivation).
- **Violation behaviour:** A perceptibly slow update, or introducing a network
  round-trip on submit, would violate this rule.
- **Requirements:** NFR-1.

## BR-14 — No regression to delivery modes

- **Name:** No regression to existing delivery modes
- **Type:** Constraint (non-functional)
- **Trigger:** Feature operation across delivery modes.
- **Logic:** The search/filter behaviour is **identical** under both the static
  GitHub Pages build and the Express server. The default view remains identical to
  today's full-catalogue landing view (FR-6), and the existing checkout/cart flows
  are **unchanged**.
- **Violation behaviour:** Different filter behaviour between delivery modes, a
  changed default view, or any change to checkout/cart behaviour would violate this
  rule.
- **Requirements:** NFR-2.

---

## Conflict review

No two rules produce conflicting outcomes for the same trigger:

- **BR-4 vs BR-5:** BR-5 is a **derived consequence** of BR-4 (the literal inclusive
  predicate), not a contradiction. They cannot disagree because BR-5 just names the
  zero-match outcome BR-4 already produces for an inverted range.
- **BR-2 / BR-4 / BR-6:** these **compose** — BR-2 and BR-4 are independent
  per-dimension predicates and BR-6 conjoins them. No rule both includes and
  excludes the same product for the same inputs.
- **BR-7 vs BR-2 / BR-4:** BR-7 is the vacuous-truth case of BR-2 and BR-4 (empty
  criteria), fully consistent with them.
- **BR-9 (explicit submit) vs the compute rules:** BR-9 governs *when* criteria are
  applied; BR-2/BR-4/BR-6/BR-7 govern *what* the applied criteria select. Disjoint
  concerns; no overlap.
- **BR-1 / BR-3 (normalisation) vs the predicates:** normalisation rules produce the
  inputs the predicates consume; they run at construction time, the predicates at
  filter time. No conflict.

**No decision-table-class rule is present.** The filter is a conjunction of two
independent predicates (search dimension AND price dimension); there is no
multi-variable branching with divergent outcomes, so the per-rule declarative
logic expressions above are sufficient and a decision table is not required.

---

## Requirement → rule traceability

| Requirement | Rule(s) |
|---|---|
| FR-1 (name keyword search) | BR-1, BR-2 |
| FR-2 (single contiguous substring) | BR-1, BR-2 |
| FR-3 (optional inclusive price bounds) | BR-3, BR-4, BR-5 |
| FR-4 (AND-combine) | BR-6 |
| FR-5 (explicit submit) | BR-9 |
| FR-6 (full-catalogue default) | BR-7 |
| FR-7 (distinct empty-state) | BR-5, BR-8 |
| FR-8 (conditional Clear) | BR-7, BR-10 |
| FR-9 (no persistence; reset on load) | BR-7, BR-11 |
| FR-10 (output-encoding hygiene) | BR-12 |
| NFR-1 (~100 ms responsiveness) | BR-13 |
| NFR-2 (no regression to delivery modes) | BR-14 |

Every FR-1…FR-10, NFR-1, and NFR-2 is covered by at least one rule, and every
rule traces to at least one requirement. Persona: guest shopper.

### Clarification-answer traceability

| Answer | Rule(s) / construct |
|---|---|
| Q1 (minimal price normalisation) | BR-3 |
| Q2 (numeric-only input controls) | BR-3 (UI-layer precondition note) |
| Q3 (inverted range → empty) | BR-5; `AppliedFilterCriteria` "no min≤max invariant" |
| Q4 (trim + simple lowercase) | BR-1 |
| Q5 (pure derived view) | `AppliedFilterCriteria` value object, `FilteredCatalogue` derived view, `filterCatalogue` function, W-1 snapshot |
