# Wireframes — Clarification Questions

Intent: intent-003-product-search-filter
Skill: wireframes
Step: clarification
Generated: 2026-06-29

These wireframes bolt a name-search + price-range filter onto the EXISTING
product-listing page (`app/public/index.html`, styled by
`app/public/css/styles.css`). Behaviour is already locked by `requirements.md`
(FR-1…FR-10, NFR-1/2): name-only case-insensitive substring search, two optional
inclusive price bounds, explicit submit (button or Enter), full catalogue when no
control is active, a distinct empty-state message, a Clear/Reset shown only when a
control is active, and no persistence. Single persona: the guest shopper.

The questions below cover ONLY the genuinely open visual/layout decisions the
locked requirements do not settle. They do not re-litigate behaviour.

---

### Q1: Where should the search / filter bar sit relative to the existing product grid?

a) A horizontal bar in `<main>` directly below the existing `<h1>Products</h1>`
   and above the `#status`/grid region — full content width, scrolls with the page.
b) Same below-`<h1>` placement, but as a left sidebar beside the grid (grid shifts
   to a content column on the right).
c) Inside the sticky `.site-header` next to the nav.

**Trade Offs:** (a) is the smallest, lowest-risk change — it reuses the existing
single-column `main` flow, keeps the full-width responsive grid untouched, and
reads top-to-bottom (search, then status/empty-state, then results), which matches
the explicit-submit model. (b) gives persistent visibility while scrolling but
forces the grid into a narrower column and complicates the existing
`auto-fill minmax(230px, 1fr)` responsive behaviour, especially on mobile. (c)
crowds the sticky header (which already holds brand + Products/Cart nav) and mixes
a page-specific control into a site-wide shared component used by cart/product
pages.

**Recommendation:** (a). It is the minimal, grounded change to the existing layout,
preserves the current full-width landing grid, and places the empty-state message
in the natural reading position between the controls and where results would be.

[Answer]: a) Horizontal bar in `<main>` directly below `<h1>Products</h1>`, above the status/grid region, full content width.

### Q2: How should the controls be arranged within the bar?

a) Single horizontal row on desktop — [search input] [min price] [max price]
   [Search button] [Clear ×] — wrapping/stacking to a vertical column on narrow
   viewports (reuses the existing 720px responsive instinct).
b) Always-stacked vertical column (search on its own line, the two price inputs on
   a second line, buttons on a third) at all widths.
c) Search input on its own full-width row, with price min/max + buttons on a second
   row, at all widths.

**Trade Offs:** (a) is compact and scannable on desktop and degrades gracefully on
mobile via flex-wrap, matching the look of the existing `.row-gap` / card
`.actions` rows. (b) is the simplest to render but wastes horizontal space and
looks heavy for just three small inputs. (c) is a middle ground that keeps the
search prominent but uses two rows even on wide screens.

**Recommendation:** (a). A single wrapping flex row is consistent with the existing
stylesheet's flex-row patterns and the site's responsive habit, and keeps the
feature visually light.

[Answer]: a) Single horizontal row [search][min][max][Search][Clear] on desktop, wrapping/stacking to a column on narrow viewports.

### Q3: Should the bar show a result count (e.g. "Showing 3 of 6 products")?

a) No count — show only the grid (and the empty-state message when zero match).
b) Show a count line only when at least one control is active (hidden on the
   default full-catalogue view, like the Clear/Reset control).
c) Always show a count, including on the default view.

**Trade Offs:** A count is useful feedback for explicit-submit filtering and helps a
shopper distinguish "a few matched" from "everything is shown". But it is NOT in
`requirements.md` (FR-1…FR-10) — adding it as a visible, behavioural element risks
introducing functionality beyond the locked requirements (validation rule 8), so it
must be an explicit human decision rather than silently added. Option (b) mirrors
the conditional-visibility pattern already required for Clear/Reset (FR-8).

**Recommendation:** (a) to stay strictly within the locked requirements; or (b) if
you want the extra feedback, in which case we will document it as a deliberate,
human-approved addition (not a requirement) in the wireframe artifacts.

[Answer]: a) No count — show only the grid and the empty-state message when zero match. Stays strictly within the locked requirements.

### Q4: What visual format should the wireframe files use?

a) HTML wireframes (static `.html` per screen) that reuse the real
   `app/public/css/styles.css`, so the wireframe renders in the actual site styling
   and the search/filter bar can be seen exactly as it will look.
b) SVG wireframes (`.svg` per screen) — neutral, annotated boxes, format-agnostic.

**Trade Offs:** Because this is a brownfield change layered onto a real, already-
styled page, HTML wireframes (a) give the most faithful, grounded review — the
human sees the new bar against the genuine grid, header, cards, and the existing
empty/error styling (`.empty-state`, `.notice`). SVG (b) is better for greenfield
layout exploration but here would re-draw boxes that already exist in CSS and risk
drifting from the real page. The folder convention's visual directory is
`screens/` and accepts either format.

**Recommendation:** (a) HTML, reusing the existing stylesheet, for a faithful and
low-risk review grounded in the real page.

[Answer]: a) HTML wireframes that reuse the real `app/public/css/styles.css`, rendered in the actual site styling.

### Q5: Which screen states should each wireframe depict?

a) Three annotated variants of the single listing screen: (1) default
   full-catalogue (no controls, no Clear), (2) active filter with matching results
   (Clear visible), (3) active filter with zero matches (distinct empty-state
   message, no error styling).
b) Only the default and the populated-results states; describe the empty-state in
   the guidance markdown text rather than drawing it.
c) A single state (active filter with results) plus textual notes for the rest.

**Trade Offs:** The empty-state (FR-7) is explicitly required to be visually
distinct from the existing load-error state, so depicting it (a) lets the human
verify that distinction visually rather than trusting prose. The default-view
suppression of Clear/Reset (FR-8) is also a visible conditional worth showing. (b)
and (c) are lighter but leave the two most safety-relevant visual rules unverified.

**Recommendation:** (a). Showing all three states directly exercises the two
conditional-rendering requirements (empty-state distinctness FR-7, conditional
Clear FR-8) that most benefit from visual review.

[Answer]: a) Three annotated variants: (1) default full-catalogue (no controls, no Clear), (2) active filter with matching results (Clear visible), (3) active filter with zero matches (distinct empty-state, no error styling). [Adopted per orchestrator recommendation.]
