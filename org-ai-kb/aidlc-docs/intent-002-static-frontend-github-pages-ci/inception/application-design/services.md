# Application Design — Services

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)

Service-layer orchestrations compose the components into the user-facing business
workflows. As this intent intentionally skips user-stories, the "Stories
addressed" field references the functional-requirement identifiers (FR-n) from
`requirements.md` as the story-equivalent mapping basis.

---

## Service: Browse Catalogue

- **Purpose** — Presents the full product catalogue to the user.
- **Components used** — Catalogue Data Provider.
- **Operations**
  1. Invoke `get-all-products` on the Catalogue Data Provider.
  2. Present the returned products in the catalogue listing.
- **Stories addressed** — FR-1, FR-2 (catalogue retrieval from the static source;
  single-source-of-truth catalogue rendered with no runtime `/api` call).

## Service: View Product Detail

- **Purpose** — Shows the detail view for a single product, including the
  not-found state for unknown identifiers.
- **Components used** — Catalogue Data Provider.
- **Operations**
  1. Invoke `get-product-by-id` on the Catalogue Data Provider with the requested
     identifier.
  2. If a product is returned, present its detail view.
  3. If null/absent is returned, present the existing product-not-found state.
- **Stories addressed** — FR-3, FR-4 (by-id lookup; not-found state with no
  regression — NFR-3).

## Service: Manage Cart

- **Purpose** — Lets the user add products to the cart and adjust cart contents.
- **Components used** — Cart; Catalogue Data Provider (to resolve the product
  being added).
- **Operations**
  1. On an add action, invoke the Cart's `add-item` for the chosen product.
  2. On quantity change, invoke `set-quantity`.
  3. On removal, invoke `remove-item`.
  4. Present current cart state via `get-line-items`, `get-total`, `get-count`,
     and `is-empty`.
- **Stories addressed** — FR-2 (catalogue products are the source of items added);
  supports the checkout precondition (a populated cart for FR-5 / FR-6). Cart
  internals are reused unchanged (A-2).

## Service: Place Order (simulated)

- **Purpose** — Completes a simulated checkout entirely on the client.
- **Components used** — Checkout / Order Simulation; Cart.
- **Operations**
  1. Read the current cart line items (via Cart).
  2. Invoke `place-order` on Checkout / Order Simulation.
  3. If the cart is empty, the order is rejected — no confirmation is shown
     (FR-6).
  4. On success, present the confirmation (order identifier, itemised items,
     total) and the cart is cleared (FR-5, NFR-3).
- **Stories addressed** — FR-5, FR-6 (client-side order stub with full parity;
  empty-cart guard). Nothing is persisted (OOS-2).

---

## Cross-workflow standard

All four services inherit the cross-cutting base-path-aware reference-resolution
standard (FR-7, NFR-4) for resolving data and asset references, and the
cross-cutting error and validation standards (see `cross-cutting.md`).

## Coverage note

FR-7 / NFR-4 (sub-path portability) are satisfied as a cross-cutting standard
inherited by every service rather than by a dedicated workflow. FR-8 / FR-9
(CI build-and-publish behaviour) and FR-10 (deployed-artifact boundary) are
deferred to infrastructure-design (OOS-4) and are out of altitude for these
runtime service orchestrations; they are flagged in `components.md`.
