# Wireframe Guidance — intent-003-product-search-filter

Intent: intent-003-product-search-filter
Skill: wireframes
Step: execution
Generated: 2026-06-29

Reproduction guidance for code-generation. There is one screen (Product Listing) with
three depicted states. The only new UI is the `form.filter-bar` region; everything else
(header, grid, cards, toast) is the existing page reused verbatim. The real stylesheet
`app/public/css/styles.css` is **reused unchanged**; only **additive** classes are
introduced.

---

## Screen: Product Listing

### Element placement (top-to-bottom, left-to-right)

1. `header.site-header` — unchanged (brand left, nav right; sticky).
2. `main` (max-width 1040px, centred, 24px padding) — unchanged container.
3. `h1 "Products"` — unchanged.
4. **`form.filter-bar` (NEW)** — placed directly below `<h1>` and above the
   status/grid region, at full content width (Q1). Scrolls with the page (not sticky).
   Inside it, a single row left-to-right:
   `[search input] [min price] [max price] [Search button] [Clear ×]`.
   - The search input is the flexible/primary control (it grows to fill leftover
     width); the two price inputs are fixed, narrow (~110px); the buttons sit at the
     right end.
   - Gap between controls ~10px, matching the existing `.row-gap` (10px) / card
     `.actions` (8px) flex-row spacing instinct.
   - Vertical alignment: controls centred on the cross-axis (`align-items: center`).
5. Result region (exactly one of):
   - `#status.muted` "Loading products…" — initial load only, unchanged.
   - `div.product-grid` of `div.product-card` — States 1 & 2; retains the existing
     `grid-template-columns: repeat(auto-fill, minmax(230px, 1fr))` with 18px gap.
   - `div.empty-state` — State 3 (zero matches), replacing the grid.
6. `div.toast` — unchanged.

### Proposed additive CSS (real stylesheet reused; only new classes added)

The real `app/public/css/styles.css` is **not edited**. Add the following classes,
expressed in terms of the existing design tokens and patterns so generated markup stays
visually consistent. (The wireframe HTML files inline an identical preview block, marked
"proposed additive styling — preview only"; that inline block is for review and must not
be copied into the real stylesheet — move it into `styles.css` as real classes instead.)

- `.filter-bar`
  - `display: flex; flex-wrap: wrap; gap: 10px; align-items: center;`
  - `background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);`
    `padding: 14px; margin: 0 0 18px;` — same card surface, hairline, radius, and 18px
    bottom rhythm used elsewhere (cards, forms, the grid gap).
- `.filter-bar .search`
  - `flex: 1 1 220px; min-width: 160px;` — grows to fill the row.
  - `padding: 9px; border: 1px solid var(--line); border-radius: 8px; font: inherit;` —
    identical to the existing `form.checkout input` styling.
- `.filter-bar .price`
  - `width: 110px;` plus the same 9px padding / `var(--line)` border / 8px radius /
    `font: inherit` input treatment.
- Buttons: reuse the existing global `button` / `.btn` styles. The **Search** button is
  the default (accent) variant; the **Clear** control reuses `button.secondary`
  (transparent, accent text) so it reads as the lower-emphasis action.
- Empty-state: reuse the existing `.empty-state` class as-is
  (`color: var(--muted); padding: 32px 0; text-align: center;`). Do **not** introduce a
  new class and do **not** use `.notice` for it (see FR-7 below).

No new colours, tokens, fonts, or radii are introduced — only the four tokens
`--card`, `--line`, `--radius`, plus the accent/`--muted` already in use are referenced.

### Interaction behaviour (state transitions)

- **Explicit submit (FR-5).** The result set updates **only** on submit — clicking the
  Search button or pressing Enter within a control. Typing into the search box or
  changing a price input without submitting leaves the currently rendered result set
  unchanged. There is no as-you-type / live filtering.
- **Compute on submit (FR-1…FR-4).** On submit, recompute the visible products as
  `(name contains trimmed, lowercased term — substring on name only) AND
  (min ≤ price ≤ max, inclusive, blank min = 0, blank max = no upper bound)`. Re-render
  the grid with the matching products in catalogue order.
- **Conditional Clear (FR-8).** The Clear/Reset control is **absent** whenever the
  search term is empty and both price bounds are unset (the default view). It becomes
  **present** as soon as any one control is non-empty. Activating Clear empties the
  search term and both price inputs, restores the full catalogue, and hides the Clear
  control again (returning to the default view). Wireframes: absent in State 1, visible
  in States 2 and 3.
- **Empty-state distinctness (FR-7).** When the active filter yields zero products, swap
  the grid for `div.empty-state` ("No products match your search.") — neutral, muted,
  centred. This must be **visually distinct** from the catalogue load-error, which uses
  `.notice` (red text on a pink panel with a red border, "Could not load products…").
  Never render the empty-state with `.notice` styling: the shopper must be able to tell
  "nothing matched" apart from "loading failed". The empty wireframe shows the
  `.notice` style only in its annotation band, for contrast, never on the screen.
- **Output-encoding hygiene (FR-10).** The search term is inert data. Any echo of it
  into the page must be output-encoded (treat as text, never as markup). A term such as
  `<img src=x onerror=alert(1)>` must not execute or alter page structure. Note that the
  existing card-rendering code (`app/public/index.html` inline script) interpolates
  product fields into `innerHTML`; when wiring the filter, do not introduce a new
  unencoded interpolation of the user's search term.
- **Existing actions unchanged.** Details / image / name links navigate to
  `/product.html?id=<id>`; "Add to cart" updates the cart and shows the existing toast;
  the header Cart link navigates to `/cart.html`.
- **Responsiveness (NFR-1).** The recomputed result set should render within ~100 ms on
  the ~6-product client-side catalogue; this is a client-side, in-memory recompute with
  no network round-trip.
- **No regression (NFR-2).** The change must work both in the static GitHub Pages build
  and under the Express server, with the default view identical to today (FR-6) and
  cart/checkout flows unaffected.

### Responsive adaptations

- **Wide viewports:** the controls form a single horizontal wrapping flex row (Q2). The
  search input absorbs leftover width; price inputs and buttons keep their intrinsic
  widths; if the row runs out of space, `flex-wrap` lets trailing controls drop to the
  next line within the bar.
- **Narrow viewports (≤720px, the existing breakpoint):** the bar switches to a vertical
  column (`flex-direction: column; align-items: stretch`) and the price inputs go
  full-width, so controls stack legibly — consistent with the site's existing 720px
  responsive instinct (e.g. `.detail`).
- **Product grid:** unchanged — retains `auto-fill minmax(230px, 1fr)`, so it reflows
  from multiple columns down to one as width shrinks, independent of the filter bar.

### Conditional rendering

- **Clear control:** present iff at least one control is active (FR-8). No other
  condition.
- **Result region:** grid of cards when ≥1 product matches; `div.empty-state` when zero
  match (FR-7); `#status` loading text only on initial load before the catalogue
  resolves.
- **No role/flag conditions.** Single guest-shopper persona; nothing is gated by role,
  auth, or feature flag.

### Animation / transition notes

None introduced. No page transitions or filter animations are added. The existing toast
fade behaviour (on Add to cart) is unchanged.
