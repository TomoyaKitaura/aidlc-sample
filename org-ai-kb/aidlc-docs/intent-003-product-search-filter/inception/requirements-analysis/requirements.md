# Requirements — Product Search & Filter

Intent: intent-003-product-search-filter
Step: execution
Generated: 2026-06-29

Derived from the intent statement (`intent.md`), the 12 answered clarification
questions (`requirements-analysis-questions.md`), and the locked upstream
decisions from workflow-composition: client-side-only implementation; the static
GitHub Pages build and the Express server must both keep working; filter
dimensions are name/keyword search plus a price-range filter over existing
product fields only (no category/tag); single logical unit `product-listing`;
basic XSS/output-encoding hygiene expected as ordinary correctness (no OWASP
lens). These constraints are not re-litigated here.

---

## 1. Intent Summary

- **Type:** Feature — an enhancement to the existing product-listing experience
  of the sample EC site.
- **Scope:** Single logical unit `product-listing` and its supporting
  client-side product data access. Checkout and cart flows are unaffected.
- **Complexity:** Low. The catalogue is a tiny, fully client-side dataset
  (~6 products); there is no backend filtering logic, no persistence, and no
  network round-trip on filter.
- **Classification:** **Brownfield.** This intent extends the existing `app/` EC
  site (produced by intent-001). Both the static GitHub Pages build and the
  Express server must continue to work, and there must be no regression to the
  current full-catalogue landing view.
- **Affected repos/areas:** `app/` — the product-listing UI and its product data
  access layer.
- **Brownfield-context note:** RE-kb is not hydrated for this intent. The
  brownfield classification and affected-area assessment are asserted from direct
  reading of the existing `app/` codebase, which is permitted brownfield context.

---

## 2. Functional Requirements

Each requirement is pass/fail-verifiable via the stated acceptance criteria.

### FR-1 — Keyword search by product name
A search input lets the shopper enter a term used to narrow the catalogue by
product name. (Q1, Q2)

**Acceptance criteria:**
- A product is included in the result set **if and only if** its `name` field,
  lowercased, contains the lowercased, trimmed search term as a substring.
- Matching is **case-insensitive** (e.g. "LAMP", "lamp", and "Lamp" yield the
  same matches).
- Only the `name` field is matched; the `description` and `id` fields are
  **never** consulted for matching.

### FR-2 — Search term treated as a single contiguous substring
The entire trimmed search input is treated as one substring; there is no
whitespace tokenisation. (Q3)

**Acceptance criteria:**
- Leading and trailing whitespace are trimmed from the input before matching.
- A multi-word term such as "lamp aurora" matches only a product whose name
  contains that exact contiguous sequence (case-insensitively); the words are
  not matched independently or out of order.

### FR-3 — Price-range filter with two optional bounds
Two optional numeric inputs (minimum and maximum) let the shopper filter by
price. (Q5, Q6)

**Acceptance criteria:**
- Both inputs are optional. A blank minimum is treated as 0 (no effective lower
  bound); a blank maximum is treated as no upper bound.
- Bounds are **inclusive on both ends**: a product passes the price filter when
  `min ≤ price ≤ max`.
- Enumerated cases against the current catalogue range ($14.50–$129.00):
  - Blank/blank → all products pass the price filter.
  - Min only (e.g. min = 50) → products with price ≥ 50 pass.
  - Max only (e.g. max = 50) → products with price ≤ 50 pass.
  - Both set (e.g. 20–100) → products with 20 ≤ price ≤ 100 pass.
  - Boundary-equal: a product priced exactly at the min or exactly at the max
    **passes** (inclusive).

### FR-4 — Search and price filter combine with AND
When both controls are active, a product must satisfy both the name match and
the price range to appear. (Q4)

**Acceptance criteria:**
- The displayed result set equals (products whose name matches the term) ∩
  (products whose price is within the range).
- A product that matches the search term but falls outside the price range is
  excluded, and vice versa.

### FR-5 — Explicit submit applies the controls
Results update **only** on an explicit submit action — clicking the Search/Apply
control or pressing Enter — not on every keystroke or input change. (Q8)

**Acceptance criteria:**
- Editing the search input or the price inputs without submitting leaves the
  currently displayed results unchanged.
- On submit (button click or Enter), the result set is recomputed from the
  current control values and the display updates accordingly.

### FR-6 — Default view shows the full catalogue
When the search term is empty AND no price bounds are set, all products are
shown, identical to today's behaviour. (Q12)

**Acceptance criteria:**
- On initial page load, the full catalogue (all ~6 products) is displayed.
- Clearing all controls and submitting (with empty term and no price bounds)
  returns the display to the full catalogue.

### FR-7 — Empty-state message when nothing matches
When the active search/filter yields zero products, the UI shows an explicit
empty-state message. (Q7)

**Acceptance criteria:**
- A query that matches no products renders an explicit empty-state message
  (e.g. "No products match your search") and no product cards.
- The empty-state message is **visually distinct from** the existing
  load-error state ("Could not load products"); the two are distinguishable, so
  a shopper can tell "nothing matched" apart from "loading failed".

### FR-8 — Conditional Clear/Reset control
A Clear/Reset affordance is shown only when at least one control is active, and
activating it restores the full catalogue. (Q9)

**Acceptance criteria:**
- The Clear/Reset control is **absent** on the default view (no search term and
  no price bounds set).
- The control is **present** once a search term is entered or a price bound is
  set.
- Activating the control resets all controls (search term and both price bounds)
  to empty and restores the full catalogue.

### FR-9 — No persistence; reset on every load
The search term and price bounds start empty on every page load; there is no URL
query-parameter or browser-storage persistence of filter state. (Q10)

**Acceptance criteria:**
- After any search/filter, reloading the page shows empty controls and the full
  catalogue, regardless of the prior search/filter.
- No filter state is written to or read from the URL query string or browser
  storage.

### FR-10 — Output-encoding hygiene for the search input
The search term is treated as inert data and never interpreted as markup; any
echo of the term into the page is output-encoded. (Ordinary correctness, not an
OWASP-lens requirement.)

**Acceptance criteria:**
- A search term containing HTML or script characters (e.g. `<img src=x
  onerror=alert(1)>`) does not execute and does not alter the page structure
  when entered, submitted, or echoed back into the page.

---

## 3. Non-Functional Requirements

### NFR-1 — Responsiveness
After an explicit submit, the filtered results visibly update quickly on the
current fully client-side dataset. (Q11)

**Measurable criterion:** From the explicit submit action to the rendered result,
the displayed product set updates within **~100 ms** on the current ~6-product
catalogue. This complements the functional pass/fail criteria; it does not
replace them.

### NFR-2 — No regression to existing delivery modes
The feature must work in both delivery modes the EC site supports today, with no
behavioural change to existing flows. (Brownfield constraint.)

**Measurable criterion:** The product-listing page with search/filter renders and
operates correctly both in the **static GitHub Pages build** and under the
**Express server**, and the existing checkout/cart behaviour is unchanged
(verifiable by exercising both build modes and confirming checkout/cart flows
behave as before).

---

## 4. Assumptions

The following are flagged as assumptions, not stated as facts:

- The catalogue remains small and entirely client-side (~6 products); no
  server-side search, filtering, or pagination is introduced by this intent.
- Product price is a numeric field already available client-side; the current
  range $14.50–$129.00 is used only for illustrative acceptance cases and is not
  hard-coded into requirements.
- RE-kb is not hydrated; the brownfield classification and affected-area
  assessment are asserted from direct reading of the existing `app/` codebase.

---

## 5. Out of Scope

The following are explicitly excluded from this intent:

- Filtering by category, tag, or any attribute other than price; matching the
  search term against the `description` or `id` fields.
- Multi-term tokenisation, fuzzy matching, or relevance ranking.
- Live / instant (as-you-type) filtering; results update only on explicit submit.
- Persistence of filter state in the URL query string or browser storage (noted
  as a possible later enhancement for shareable filtered views).
- Server-side search/filter, pagination, and sorting.
- Any change to the checkout or cart flows.
