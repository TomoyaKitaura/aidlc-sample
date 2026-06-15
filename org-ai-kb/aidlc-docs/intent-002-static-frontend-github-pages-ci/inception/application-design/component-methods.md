# Application Design — Component Methods

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)

Methods are described at the logical level. Inputs and outputs are logical types,
not language-specific. The Build-Time Catalogue Generation concern is a
non-runtime concern (documented in `components.md`) and exposes no runtime
methods, so it does not appear here.

---

## Catalogue Data Provider

### get-all-products

- **Inputs** — None.
- **Outputs** — Product List (the full catalogue; an ordered collection of
  Product entries).
- **Preconditions** — The static catalogue artifact is available and resolvable
  via the cross-cutting base-path-aware reference-resolution standard.
- **Postconditions** — Returns every Product defined in the static catalogue
  artifact; the artifact is unchanged (read-only access).

### get-product-by-id

- **Inputs** — Product Identifier.
- **Outputs** — Product, or null/absent when no Product matches the identifier.
- **Preconditions** — The static catalogue artifact is available and resolvable.
- **Postconditions** — Returns the matching Product when the identifier exists;
  returns null/absent for an unknown identifier (preserving not-found semantics
  for FR-3 / FR-4). No state is changed.

---

## Checkout / Order Simulation

### calculate-total

- **Inputs** — Cart Line Items (collection of line items, each with a product
  reference, unit price, and quantity).
- **Outputs** — Order Total (monetary amount).
- **Preconditions** — Each line item has a non-negative quantity and a defined
  unit price.
- **Postconditions** — Returns the computed total for the supplied line items; no
  state is changed.

### generate-order-id

- **Inputs** — None.
- **Outputs** — Order Identifier (a value unique within this checkout).
- **Preconditions** — None.
- **Postconditions** — Returns a newly generated, unique order identifier; no
  state is changed.

### build-order

- **Inputs** — Cart Line Items.
- **Outputs** — Order (containing the generated order identifier, the itemised
  items, and the computed total).
- **Preconditions** — The supplied cart is not empty (empty-cart guard — FR-6).
- **Postconditions** — On a non-empty cart, returns a fully populated Order. On an
  empty cart, no Order is produced and no order identifier is generated (the call
  is rejected — FR-6). No persistence occurs.

### place-order

- **Inputs** — The current Cart (its line items).
- **Outputs** — Order Confirmation (the placed Order: order identifier, itemised
  items, total), or a rejection when the cart is empty.
- **Preconditions** — The Cart is not empty.
- **Postconditions** — On success, an Order is built and the Cart is cleared via
  the Cart component; the confirmation content is returned (FR-5, NFR-3). Nothing
  is persisted to any server (OOS-2). On an empty cart, no Order is produced, no
  confirmation is returned, and the Cart is left unchanged (FR-6).

---

## Cart

(Reused unchanged — A-2. Listed for dependency completeness.)

### add-item

- **Inputs** — Product Identifier (and optionally a quantity).
- **Outputs** — Updated Cart state.
- **Preconditions** — The product identifier refers to a known catalogue product.
- **Postconditions** — The product is present in the cart with the requested
  quantity (a new line item, or an increased quantity if already present).

### set-quantity

- **Inputs** — Product Identifier, Quantity.
- **Outputs** — Updated Cart state.
- **Preconditions** — The line item exists in the cart; quantity is a
  non-negative integer.
- **Postconditions** — The line item's quantity equals the supplied quantity (a
  quantity of zero removes the line item).

### remove-item

- **Inputs** — Product Identifier.
- **Outputs** — Updated Cart state.
- **Preconditions** — None (removing an absent item is a no-op).
- **Postconditions** — The cart contains no line item for the given product.

### get-line-items

- **Inputs** — None.
- **Outputs** — Cart Line Items.
- **Preconditions** — None.
- **Postconditions** — Returns the current line items; no state is changed.

### get-total

- **Inputs** — None.
- **Outputs** — Cart Total (monetary amount).
- **Preconditions** — None.
- **Postconditions** — Returns the current cart total; no state is changed.

### get-count

- **Inputs** — None.
- **Outputs** — Item Count.
- **Preconditions** — None.
- **Postconditions** — Returns the current total item count; no state is changed.

### is-empty

- **Inputs** — None.
- **Outputs** — Boolean (whether the cart has no line items).
- **Preconditions** — None.
- **Postconditions** — Returns whether the cart is empty; no state is changed.

### clear

- **Inputs** — None.
- **Outputs** — Updated (empty) Cart state.
- **Preconditions** — None.
- **Postconditions** — The cart contains no line items.
