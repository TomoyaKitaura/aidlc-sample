# Screen Structure — intent-003-product-search-filter

Intent: intent-003-product-search-filter
Skill: wireframes
Step: execution
Generated: 2026-06-29

This intent is a brownfield change to a single page of the existing EC site. Only
the **Product Listing** screen changes (a new filter bar). The header, product grid,
cards, toast, and all sibling pages (Product Detail, Cart, Checkout) are unchanged and
are listed only for context.

## Screen inventory

| Screen | Status this intent | File(s) |
|---|---|---|
| **Product Listing** | **Changed** — new `.filter-bar` added | existing `app/public/index.html`; wireframe states under `screens/` |
| Product Detail | Unchanged (context) | existing `app/public/product.html` |
| Cart | Unchanged (context) | existing `app/public/cart.html` |
| Checkout | Unchanged (context) | existing `app/public/checkout.html` |

The Product Listing screen has **three depicted states** (not separate screens):

| State | Wireframe file |
|---|---|
| Default / full catalogue (no Clear) | `screens/product-listing-default.html` |
| Active filter with results (Clear visible) | `screens/product-listing-results.html` |
| Active filter, zero matches (distinct empty-state, Clear visible) | `screens/product-listing-empty.html` |

## Screen groups

- **Catalogue / browse group** — the Product Listing screen. This is the group this
  intent touches.
- **Purchase group** (context only) — Product Detail → Cart → Checkout. Untouched.

## Navigation map

Existing links only. **No new routes or navigation are introduced** by this intent;
the filter is in-page and does not change the URL (FR-9, no persistence). No dead
links — every target below already exists in the inventory.

| From | Control | To | Status |
|---|---|---|---|
| Any page | Header brand "Sample EC" | Product Listing (`/`) | existing |
| Any page | Header nav "Products" | Product Listing (`/`) | existing |
| Any page | Header nav "Cart" | Cart (`/cart.html`) | existing |
| Product Listing | Card image / name / "Details" | Product Detail (`/product.html?id=<id>`) | existing |
| Product Listing | "Add to cart" | Cart state update (in-page toast + badge) | existing |
| Product Listing | **Search / Apply** | Product Listing (same screen, recomputed result set) | **new, in-page only** |
| Product Listing | **Clear / Reset** | Product Listing (same screen, full catalogue restored) | **new, in-page only** |

The two new controls are in-page state transitions on the same screen, not navigation
to a new route.

## Component tree per screen — Product Listing

```
body
├── header.site-header                 [SHARED, unchanged]
│   ├── a.brand "Sample EC"            → /
│   └── nav
│       ├── a "Products"              → /
│       └── a "Cart" + span.cart-badge → /cart.html
├── main
│   ├── h1 "Products"                  [unchanged]
│   ├── form.filter-bar                [NEW — the only added region]
│   │   ├── input.search   (type=search, optional)        — search term (FR-1, FR-2)
│   │   ├── input.price    (type=number, optional)        — minimum price (FR-3)
│   │   ├── input.price    (type=number, optional)        — maximum price (FR-3)
│   │   ├── button[submit] "Search"                       — explicit submit (FR-5)
│   │   └── button "Clear ×"  [CONDITIONAL — present only when a control is active] (FR-8)
│   └── (one of, by result state)
│       ├── #status.muted "Loading products…"  [unchanged — initial load only]
│       ├── div.product-grid > div.product-card[*]   [SHARED card; State 1 & 2]
│       └── div.empty-state "No products match your search."  [State 3; FR-7]
│            (NOTE: distinct from the load-error .notice, which is reserved for
│             catalogue load failure — not shown for zero matches)
└── div.toast                          [SHARED, unchanged]
```

The product card (`div.product-card` → image link, `.body` with `.name`, `.price`,
`.desc`, `.actions` containing a Details `.btn.secondary` link and an "Add to cart"
button) is the existing structure, reused verbatim.

## Shared components

Defined once, consistent across every screen that references them (validation rule 12):

| Component | Definition | Appears on |
|---|---|---|
| `header.site-header` | Brand link + nav (Products, Cart with badge); sticky. Unchanged. | All screens / all three states |
| `div.product-card` | Image link, name link, price, description, Details link + Add-to-cart button. Unchanged. | Product Listing (States 1 & 2), reused on Product Detail context |
| `div.toast` | Fixed bottom-centre transient confirmation. Unchanged. | All screens |
| `#status.muted` / `.notice` | Initial loading text; `.notice` = catalogue **load-error** styling. Unchanged. The new empty-state must NOT reuse `.notice` (FR-7). | Product Listing |

## New region

- `form.filter-bar` is the single new UI region introduced by this intent. It lives in
  `<main>` directly below `<h1>Products</h1>` and above the status/grid region, at full
  content width (Q1). It is a single wrapping flex row of controls (Q2). It contains the
  only conditional element added: the Clear control (FR-8).
