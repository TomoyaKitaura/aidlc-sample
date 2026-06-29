# Requirements Analysis — Clarification Questions

Intent: intent-003-product-search-filter
Step: clarification
Generated: 2026-06-22

These questions cover only genuinely ambiguous requirements decisions. The
following are already locked upstream (workflow-composition) and are NOT in
scope here: client-side-only implementation (static GitHub Pages build and the
Express server must both keep working); filter dimensions are name/keyword
search plus a price-range filter over existing product fields only (no
category/tag); single logical unit `product-listing`; basic XSS/output-encoding
hygiene for the search input is expected as ordinary correctness (no OWASP lens).

---

### Q1: What fields does the keyword search match against?

a) Product `name` only
b) `name` and `description`
c) `name`, `description`, and `id`
d) Other

**Trade Offs:** `name`-only is the most predictable for a shopper typing a
product name and avoids noisy hits from long description text. Including
`description` improves recall ("noise cancellation", "ceramic", "cotton" all
appear only in descriptions for the current 6 products) at the cost of
less-obvious matches. Matching `id` (e.g. "p3") has little shopper value.

**Recommendation:** (b) name + description — with only 6 short products, the
descriptions carry meaningful keywords and recall matters more than precision.

[Answer]: a) Product `name` only. (Human chose name-only over the recommendation for predictability.)

---

### Q2: What is the matching semantics for the search term?

a) Case-insensitive substring match (the term appears anywhere in the field)
b) Case-sensitive substring match
c) Whole-word / token match only
d) Prefix match (field starts with the term)

**Trade Offs:** Case-insensitive substring is the conventional expectation for
a catalogue search box and is forgiving of casing and partial words ("lamp",
"head"). Case-sensitive or whole-word matching surprises users and reduces
recall on a tiny catalogue.

**Recommendation:** (a) case-insensitive substring match.

[Answer]: a) Case-insensitive substring match.

---

### Q3: How should multi-word search input be interpreted?

a) Treat the entire trimmed input as one substring (must appear contiguously)
b) Split on whitespace; a product matches if it contains ALL terms (AND)
c) Split on whitespace; a product matches if it contains ANY term (OR)
d) Other

**Trade Offs:** Single-substring (a) is the simplest and most predictable but
fails for "lamp aurora" (wrong order). AND-of-terms (b) is more forgiving of
word order while still narrowing results. OR (c) tends to broaden results in a
way that feels unfiltered.

**Recommendation:** (a) single trimmed substring — simplest, matches the small
catalogue's needs, and avoids surprising results. Revisit only if word-order
flexibility is explicitly wanted.

[Answer]: a) Treat the entire trimmed input as one substring (must appear contiguously).

---

### Q4: How do the keyword search and the price-range filter combine?

a) Both apply together (AND) — a product must match the search term AND fall in the price range
b) Either may match (OR)
c) Other

**Trade Offs:** AND is the universal e-commerce convention: each active control
narrows the result set. OR would widen results and contradict the "narrow it
down" intent.

**Recommendation:** (a) AND — both active controls must be satisfied.

[Answer]: a) Both apply together (AND).

---

### Q5: How is the price-range filter expressed in the UI, and what are its bounds?

a) Two numeric inputs (min and max), both optional; blank min = 0, blank max = no upper bound
b) A fixed set of preset price bands (e.g. <$25, $25–$50, $50–$100, >$100)
c) A single slider with min/max handles bounded by the catalogue's actual price range
d) Other

**Trade Offs:** Two optional numeric inputs (a) are the most flexible, easy to
implement client-side, and handle open-ended ranges naturally. Preset bands (b)
are quick to click but rigid. A slider (c) is friendlier but needs the
min/max derived from data and more UI work. Current catalogue prices span
$14.50–$129.00.

**Recommendation:** (a) two optional min/max numeric inputs — flexible, simple,
and matches the "filter by price" intent without locking in arbitrary bands.

[Answer]: a) Two numeric inputs (min and max), both optional; blank min = 0, blank max = no upper bound.

---

### Q6: Are the price-range bounds inclusive or exclusive at the endpoints?

a) Inclusive on both ends (min ≤ price ≤ max)
b) Exclusive
c) Inclusive min, exclusive max

**Trade Offs:** Inclusive-both is the least surprising for shoppers ("up to
$50" includes a $50 item). The distinction only matters for products priced
exactly on a boundary, but it must be specified for verifiable acceptance.

**Recommendation:** (a) inclusive on both ends.

[Answer]: a) Inclusive on both ends (min ≤ price ≤ max).

---

### Q7: What should the UI show when no products match the current search/filter?

a) An explicit empty-state message (e.g. "No products match your search")
b) Simply render an empty grid with no message
c) Clear the filters automatically and show all products
d) Other

**Trade Offs:** An explicit empty-state message (a) tells the shopper the query
ran and returned nothing, avoiding a "did it break?" impression. A blank grid
(b) is ambiguous against a load error. Auto-clearing (c) hides the user's
intent and is confusing.

**Recommendation:** (a) explicit empty-state message, visually distinct from the
existing "Could not load products" error state.

[Answer]: a) An explicit empty-state message (e.g. "No products match your search"), visually distinct from the load-error state.

---

### Q8: Should the search and filter controls update results live (as the user types/changes), or only on an explicit submit?

a) Live / instant — results re-filter on each keystroke and price change (debounced)
b) Explicit submit — results update only when the user clicks a "Search/Apply" button or presses Enter
c) Hybrid — search box is live, price filter applies on change

**Trade Offs:** With a fully client-side 6-product dataset, live filtering is
cheap, responsive, and the modern expectation. Explicit submit adds a click and
feels dated for such a small set but is unambiguous. Debounce only matters for
perceived smoothness, not performance, at this scale.

**Recommendation:** (a) live filtering with a small debounce on the text input;
no network calls are involved so it is effectively instant.

[Answer]: b) Explicit submit — results update only when the user clicks a "Search/Apply" button or presses Enter. (Human chose explicit submit over the live recommendation.)

---

### Q9: Should there be a way to clear/reset all active search and filter controls at once?

a) Yes — provide a visible "Clear" / "Reset" control that restores the full catalogue
b) No — the user clears controls individually
c) Only show a Clear control when at least one filter is active

**Trade Offs:** A reset control (a or c) is a small, expected affordance that
lets a shopper return to the full list in one action, especially useful after
landing on an empty result. Individual clearing (b) is workable but slightly
more tedious.

**Recommendation:** (c) show a Clear control only when at least one filter is
active — keeps the default view uncluttered while providing the affordance when
useful.

[Answer]: c) Only show a Clear/Reset control when at least one filter is active.

---

### Q10: Should the active search term and price range persist across page navigation/reload (e.g. via URL query params or storage), or reset each time the listing page loads?

a) Reset on every load — controls start empty, full catalogue shown
b) Persist in the URL query string (shareable/bookmarkable, survives reload and back-button)
c) Persist in browser storage (localStorage/sessionStorage) across visits

**Trade Offs:** Reset-on-load (a) is the simplest and matches a "tool you reach
for in the moment" model. URL persistence (b) makes filtered views shareable and
survives reload/back, at modest implementation cost and consistent with how the
product detail page already uses `?id=`. Storage persistence (c) can feel sticky
in a surprising way ("why is my old search still here?").

**Recommendation:** (a) reset on every load for the initial increment — lowest
complexity and no surprising stickiness. Note (b) as a reasonable later
enhancement if shareable filtered views are desired; flag if you want it now.

[Answer]: a) Reset on every load — controls start empty, full catalogue shown.

---

### Q11: What are the acceptance/measurability expectations for this feature?

a) Functional pass/fail only (correct products shown for given search/price inputs; correct empty-state) — no quantitative performance target
b) Functional pass/fail PLUS a perceived-responsiveness target (e.g. results update within 100 ms of input on the 6-product set)
c) Other

**Trade Offs:** Because the dataset is tiny and entirely client-side, filtering
is effectively instantaneous; a hard latency NFR adds little. Stating one
anyway gives the validator a measurable NFR criterion. Functional-only keeps the
requirements honest about what actually matters here.

**Recommendation:** (b) functional pass/fail plus a soft, measurable
responsiveness target (results visibly update within ~100 ms of an input change
on the current catalogue) so the NFR section has a quantified criterion while
staying realistic.

[Answer]: b) Functional pass/fail PLUS a perceived-responsiveness target (results update within ~100 ms of submit on the 6-product set).

---

### Q12: When the search input is empty AND no price bounds are set, what is shown?

a) The full catalogue (all 6 products), identical to today's behaviour
b) An empty grid until the user enters a query
c) Other

**Trade Offs:** Showing the full catalogue (a) preserves the current landing
experience and treats search/filter as an opt-in narrowing tool — no regression
for users who do not search. (b) would change the default landing experience.

**Recommendation:** (a) full catalogue when no controls are active — preserves
existing behaviour and is the safe brownfield default.

[Answer]: a) The full catalogue (all 6 products), identical to today's behaviour.
