# Screen Data Map — intent-003-product-search-filter

Intent: intent-003-product-search-filter
Skill: wireframes
Step: execution
Generated: 2026-06-29

## Traceability note (read first)

This workflow **skipped the user-stories stage** (asserted by workflow-composition;
`workflow.md` feeds wireframes directly from `requirements.md`). There is therefore
**no `stories.md`/`personas.md`** and no `S-<n>` story IDs. Per the builder protocol's
gap/brownfield rules, the "Source stories" field of the validation-spec is satisfied
here by tracing each screen to **requirement IDs** (`FR-<n>`, `NFR-<n>`) instead of
`S-<n>`, and to the single asserted persona — the **guest shopper**. This is a
deliberate, documented deviation so the screen is not read as orphan/untraceable.

There is **one logical screen** (Product Listing). The three wireframe files in
`screens/` are three depicted **states** of that single screen, not three screens.

---

## Screen: Product Listing (catalogue with search & price filter)

- **Screen name:** Product Listing.
- **Persona:** Guest shopper (single persona; no authentication, no roles).
- **Purpose:** The guest shopper browses the product catalogue and narrows it by
  product name and/or price range, then reviews the matching products (or an
  explicit empty-state message when nothing matches). This extends the existing
  full-catalogue landing view (`app/public/index.html`) without changing it for the
  default case.

### Depicted states

| State | File | Description |
|---|---|---|
| Default / full catalogue | `screens/product-listing-default.html` | Empty controls, full grid, **no Clear** (FR-6, FR-8). |
| Active filter with results | `screens/product-listing-results.html` | Populated controls, narrowed grid, **Clear visible** (FR-1…FR-5, FR-8). |
| Active filter, zero matches | `screens/product-listing-empty.html` | Populated controls, distinct `.empty-state` message, **Clear visible** (FR-7, FR-8). |

### Data displayed

Drawn only from the existing catalogue shape (`products.json` / `app/public/js/api.js`);
no invented fields, consistent with `requirements.md`.

| Field | Logical type | Source | Notes |
|---|---|---|---|
| Product name | text | catalogue `name` | Shown on each product card; also the only field matched by search (FR-1). |
| Product price | numeric (currency) | catalogue `price` | Shown as `$nn.nn`; the field the price range filters on (FR-3). |
| Product description | text | catalogue `description` | Shown on each card; never matched by search (FR-1). |
| Product image | URL / asset reference | catalogue `image` | Card thumbnail. |
| Product id | identifier | catalogue `id` | Used only to build the detail link (`/product.html?id=<id>`); never matched. |
| Empty-state message | text | UI constant | Shown in State 3 only ("No products match your search."), visually distinct from the load-error `.notice` (FR-7). |

- **No result count** is displayed (Q3) — feedback is the grid itself plus the
  empty-state message.

### Data submitted

All optional; logical types consistent with `requirements.md`. No invented fields.

| Input | Logical type | Required | Notes |
|---|---|---|---|
| Search term | text | optional | Trimmed, case-insensitive contiguous substring matched against `name` only (FR-1, FR-2). Treated as inert/output-encoded data (FR-10). |
| Minimum price | numeric | optional | Blank → 0 / no lower bound; inclusive (FR-3). |
| Maximum price | numeric | optional | Blank → no upper bound; inclusive (FR-3). |

### Actions

| Action | Trigger | Behaviour | Requirement |
|---|---|---|---|
| Search / Apply | Click Search button **or** press Enter in a control | Explicit submit only: recompute the result set from the current control values (name match AND price range) and re-render the grid (or the empty-state if zero match). Editing without submitting changes nothing. | FR-4, FR-5 |
| Clear / Reset | Click Clear (visible only when a control is active) | Empty the search term and both price bounds, restore the full catalogue, and hide itself. | FR-8 |
| View product detail | Click card image / name / Details link | Navigate to existing `/product.html?id=<id>`. Unchanged. | existing |
| Add to cart | Click "Add to cart" on a card | Existing cart behaviour (toast + badge). Unchanged. | existing |
| View cart | Click Cart in header nav | Navigate to existing `/cart.html`. Unchanged. | existing |

- No URL or browser-storage persistence of filter state; controls reset on every
  page load (FR-9).

### Source requirements (traceability)

`FR-1` (name search), `FR-2` (single contiguous substring), `FR-3` (optional inclusive
price bounds), `FR-4` (AND-combine), `FR-5` (explicit submit), `FR-6` (full-catalogue
default), `FR-7` (distinct empty-state), `FR-8` (conditional Clear), `FR-9` (no
persistence), `FR-10` (output-encoding hygiene); `NFR-1` (~100 ms update on submit),
`NFR-2` (no regression to static GitHub Pages build or Express server).
Persona: guest shopper.

> See the traceability note at the top: user-stories was skipped, so traceability is to
> requirement IDs (`FR-<n>` / `NFR-<n>`) and the guest-shopper persona, not `S-<n>`.

### Source components (inferred, not dictated)

- The single `product-listing` logical unit (per `requirements.md`) and its
  client-side data access (`Api.fetchProducts` in `app/public/js/api.js`).
- Filtering is **client-side** over the already-loaded catalogue (no backend
  filter, no network round-trip on submit) — consistent with the locked
  client-side-only constraint. `application-design` makes the final component call.
