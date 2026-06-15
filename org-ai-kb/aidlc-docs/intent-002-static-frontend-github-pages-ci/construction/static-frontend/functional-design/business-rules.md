# Functional Design — Business Rules (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: functional-design (construction, technology-agnostic)
Unit: static-frontend

Explicit catalogue of every business rule governing the `static-frontend` unit.
Technology-agnostic: no language, framework, storage mechanism, protocol, or
vendor is named. Story traceability uses functional-requirement IDs `FR-n`
(clarification Q1). Brownfield behaviour is preserved per NFR-3 and assumptions
A-2/A-3/A-4.

---

## BR-1 — Catalogue retrieval returns the full catalogue

- **Name** — Full-catalogue retrieval
- **Description** — Retrieving the catalogue returns every Product defined in the
  single authoritative catalogue source (exposed at runtime as the read-only
  static catalogue artifact), in order, with no filtering or omission.
- **Type** — constraint
- **Trigger** — `get-all-products` is invoked (Browse Catalogue, W-1).
- **Logic** — `result = every Product in the catalogue artifact` (read-only; the
  artifact is unchanged). The catalogue is defined in exactly one source; no
  second hand-maintained copy exists (FR-1, NFR-2).
- **Violation behaviour** — If the catalogue artifact cannot be resolved, the
  retrieval fails with failure category not-found / artifact-unresolvable
  (cross-cutting error format); no partial or fabricated catalogue is returned.
  Loggable occurrence `catalogue.load` at severity error.
- **Stories** — FR-1, FR-2

## BR-2 — Product lookup by id returns match or null/absent

- **Name** — By-id lookup resolution
- **Description** — Looking up a Product by identifier returns the matching
  Product when the identifier exists, and null/absent when it does not.
- **Type** — validation
- **Trigger** — `get-product-by-id` is invoked with a Product Identifier (View
  Product Detail, W-2; and edge-level add validation, W-3).
- **Logic** —
  - if a Product with the given `id` exists → return that Product
  - else → return null/absent
- **Violation behaviour** — Not applicable as an error: returning null/absent for
  an unknown id is the defined correct outcome, not a violation. (A
  catalogue-artifact-unresolvable failure is handled by BR-1's violation
  behaviour.)
- **Stories** — FR-3

## BR-3 — Unknown product id resolves to the not-found state, not an error

- **Name** — Not-found state (no regression)
- **Description** — When a by-id lookup resolves to null/absent, the product
  detail presents the existing product-not-found state rather than raising an
  error. Preserves current observable behaviour (NFR-3).
- **Type** — state-transition
- **Trigger** — `get-product-by-id` returns null/absent in the View Product Detail
  workflow (W-2).
- **Logic** —
  - if lookup result is a Product → present detail view
  - if lookup result is null/absent → present the not-found state (severity-info
    loggable occurrence `product.lookup.miss`); do **not** surface a failure
- **Violation behaviour** — If the not-found outcome were treated as an error
  (e.g. surfaced as a failure rather than the not-found state), it would be a
  regression against NFR-3; the rule requires the not-found state to be shown.
- **Stories** — FR-3, FR-4

## BR-4 — Add-item known-product edge validation

- **Name** — Known-product validation on add
- **Description** — Before a product is added to the cart, the Manage Cart
  workflow resolves the product at the service/edge boundary via
  `get-product-by-id`; an unresolved (null/absent) product is rejected and the
  Cart is not invoked. (Clarification Q6.)
- **Type** — validation
- **Trigger** — A user add action in the Manage Cart workflow (W-3), evaluated at
  the edge before `add-item`.
- **Logic** —
  - resolve product via `get-product-by-id(productId)`
  - if resolved (non-null) → proceed to `add-item`
  - if null/absent → reject the add (failure category invalid-input); do not
    invoke the Cart; Cart unchanged
- **Violation behaviour** — The add is rejected at the edge with failure category
  invalid-input; no line item is created or modified. The Cart component is not
  invoked (no Cart→Catalogue dependency — `component-dependencies.md`).
- **Stories** — FR-2

## BR-5 — Add increments an existing line item rather than duplicating

- **Name** — Add increments existing line item
- **Description** — Adding a product already present in the cart increases that
  line item's quantity; it does not create a second line item for the same
  product. A new product creates a new line item. Preserved from
  `app/src/domain/cart.js` `addItem` (A-2).
- **Type** — constraint
- **Trigger** — `add-item` is invoked with a resolved product (W-3).
- **Logic** —
  - let `q = max(1, floor(requested quantity))` (default requested quantity = 1)
  - if a line item with the product's `id` exists → set its quantity to
    `existing quantity + q`
  - else → append a new line item with quantity `q`, capturing `id`, `name`,
    `unit price`
- **Violation behaviour** — Creating a duplicate line item for a product already
  present would violate the Cart no-duplicate invariant
  (`domain-entities.md` → Cart); the rule requires increment instead.
- **Stories** — FR-2

## BR-6 — Set-quantity coercion and zero-removes

- **Name** — Set-quantity outcome
- **Description** — Setting a line item's quantity coerces the value to an integer;
  a resulting quantity of 0 or less removes the line item, otherwise the quantity
  is set. Preserved from `app/src/domain/cart.js` `setQuantity` (A-2,
  clarification Q5).
- **Type** — constraint
- **Trigger** — `set-quantity` is invoked with a product identifier and a quantity
  (W-3).
- **Logic** — decision table (coerce `q = floor(quantity)` first):

  | Condition on `q = floor(quantity)` | Line item exists? | Outcome |
  |---|---|---|
  | `q` is not a finite integer **or** `q ≤ 0` | yes | Remove the line item |
  | `q ≥ 1` | yes | Set the line item quantity to `q` |
  | any | no (absent item) | No-op (remove of an absent item is a no-op) |

- **Violation behaviour** — Persisting a zero or negative quantity, or a
  non-integer quantity, would violate the CartItem invariant `quantity` integer
  `≥ 1` (`domain-entities.md`); the rule requires removal or coercion as above.
- **Stories** — FR-2

## BR-7 — Cart/line subtotal and total rounding

- **Name** — Cart rounding rule
- **Description** — Each display line subtotal is `round(unit price × quantity, 2
  decimal places)`; the cart total is `round(Σ over line items of (unit price ×
  quantity), 2 decimal places)`. A non-numeric or missing unit price or quantity
  contributes 0 (defensive coercion). Preserved exactly from
  `app/src/domain/cart.js` `lineItems` and `app/src/domain/order.js`
  `calculateTotal` (NFR-3, clarification Q3).
- **Type** — calculation
- **Trigger** — Computing a line subtotal (`get-line-items` display), the cart
  total (`get-total`), or the order total at checkout (`calculate-total`).
- **Logic** —
  - per line item: `contribution = (numeric(unit price) or 0) × (numeric(quantity)
    or 0)`
  - line subtotal = `round(contribution, 2 decimal places)`
  - total = `round(Σ contribution over all line items, 2 decimal places)` — the
    final sum is rounded once (not a sum of pre-rounded subtotals)
- **Violation behaviour** — Any other rounding strategy (e.g. summing pre-rounded
  subtotals, or rounding only for display) can produce an off-by-a-cent
  difference versus current output and is a regression against NFR-3; the rule
  requires the exact computation above.
- **Stories** — FR-5

## BR-8 — Order total computation

- **Name** — Order total
- **Description** — The order total computed at checkout equals `round(Σ over the
  order's items of (unit price × quantity), 2 decimal places)`, applying the same
  rounding and coercion as BR-7. Preserved from `calculateTotal` (NFR-3).
- **Type** — calculation
- **Trigger** — `calculate-total` is invoked during `build-order` (W-4).
- **Logic** — `total = round(Σ over items of ((numeric(unit price) or 0) ×
  (numeric(quantity) or 0)), 2 decimal places)`. Consistent with BR-7 so the
  confirmation total matches the cart total for the same items.
- **Violation behaviour** — A total inconsistent with the order's items (or using
  a different rounding strategy) violates the Order invariant `total` consistent
  with `items` (`domain-entities.md`) and regresses NFR-3.
- **Stories** — FR-5

## BR-9 — Order identifier generation

- **Name** — Order id generation
- **Description** — Each checkout generates a unique order identifier by combining
  a time component with a random component so that consecutive checkouts do not
  collide. The identifier is generated fresh per checkout and is persisted
  nowhere. Described technology-agnostically from `generateOrderId`
  (clarification Q4, NFR-3).
- **Type** — calculation
- **Trigger** — `generate-order-id` is invoked during `build-order` for a
  non-empty cart (W-4).
- **Logic** — `order identifier = fixed prefix + time-derived component +
  random-derived component`, where the combination of a time component and a
  random component makes a collision between distinct checkouts effectively
  impossible. No persisted counter or registry is used (Checkout is stateless —
  `components.md`).
- **Violation behaviour** — Generating a non-unique identifier within a checkout,
  or requiring persisted state to guarantee uniqueness, violates the
  `generate-order-id` postcondition (`component-methods.md`) and the Order
  uniqueness invariant; the rule requires the time+random construction with no
  persistence.
- **Stories** — FR-5

## BR-10 — Empty-cart guard

- **Name** — Empty-cart guard
- **Description** — Building or placing an order with an empty cart is rejected:
  no order identifier is generated, no Order is built, no confirmation is shown,
  and the cart is left unchanged. Preserved from `buildOrder` (FR-6,
  clarification Q5).
- **Type** — constraint (validation guard)
- **Trigger** — `build-order` / `place-order` is invoked (W-4), evaluated before
  any order construction.
- **Logic** — decision table:

  | Cart state (`is-empty`) | Outcome |
  |---|---|
  | empty (true) | Reject: failure category empty-cart; no `generate-order-id`, no Order, no confirmation; Cart unchanged. Loggable occurrence `checkout.rejected.empty-cart` (warning). |
  | non-empty (false) | Proceed: generate id, build Order, compute total, then BR-11. |

- **Violation behaviour** — Producing an Order, an order identifier, or a
  confirmation from an empty cart violates the `build-order` precondition
  (`component-methods.md`) and FR-6; the rule requires rejection with no side
  effects.
- **Stories** — FR-6

## BR-11 — Successful placement clears the cart and produces a confirmation

- **Name** — Place-order success effect
- **Description** — On a successful (non-empty) checkout, the cart is cleared and
  the confirmation content (order identifier, itemised items, total) is produced.
  Nothing is persisted (no server — OOS-2). Preserved observable behaviour
  (FR-5, NFR-3).
- **Type** — state-transition
- **Trigger** — `place-order` succeeds after the empty-cart guard passes (BR-10),
  in W-4.
- **Logic** —
  - build the Order (id via BR-9, items snapshot, total via BR-8)
  - clear the Cart via `clear` (Cart transitions Non-empty → Empty —
    `domain-entities.md`); loggable occurrence `cart.change`
  - return the confirmation content (order identifier + itemised items + total);
    loggable occurrence `checkout.success` (info)
  - persist nothing
- **Violation behaviour** — Leaving the cart populated after a successful
  checkout, omitting any confirmation element (id, items, or total), or
  persisting order data would regress FR-5 / NFR-3 / OOS-2; the rule requires the
  clear-and-confirm effect with no persistence.
- **Stories** — FR-5

---

## Coverage check

| FR | Covered by | Notes |
|---|---|---|
| FR-1 | BR-1 | Full-catalogue retrieval / single source of truth. |
| FR-2 | BR-1, BR-4, BR-5, BR-6 | Catalogue retrieval and cart provenance/management. |
| FR-3 | BR-2 | By-id lookup returns match or null/absent. |
| FR-4 | BR-3 | Not-found state for unknown id. |
| FR-5 | BR-7, BR-8, BR-9, BR-11 | Client-side order stub, full parity. |
| FR-6 | BR-10 | Empty-cart guard. |
| FR-7 | (cross-cutting standard) | Sub-path portability is a cross-cutting reference-resolution standard inherited by every workflow (`cross-cutting.md`, `services.md`), not a discrete business rule. Noted here for traceability; no `BR-n` is assigned. |
| FR-8, FR-9, FR-10 | (out of runtime altitude) | CI build-and-publish and deployed-artifact boundary; deferred to infrastructure-design (OOS-4). No runtime business rule. |

Every mapped runtime FR (FR-1 … FR-6) is covered by at least one business rule.
FR-7 is satisfied as an inherited cross-cutting standard. FR-8, FR-9, and FR-10
are out of this unit's runtime altitude (consistent with `components.md` and
`services.md`).

## Conflict check

No two rules apply to the same trigger with conflicting outcomes:

- BR-1 and BR-2/BR-3 operate on different methods (`get-all-products` vs.
  `get-product-by-id`).
- BR-4 (edge validation) precedes and gates BR-5 (cart add behaviour); they
  compose sequentially and do not conflict.
- BR-6 (set-quantity) and BR-5 (add) operate on distinct triggers
  (`set-quantity` vs. `add-item`).
- BR-7 and BR-8 use the same rounding/coercion definition, so the cart total and
  the order total agree for the same items — they reinforce rather than conflict.
- BR-10 (empty-cart guard) strictly precedes BR-9/BR-11; nothing in the
  success-path rules can run on an empty cart, so the guard and the success
  effects never both fire for the same checkout.

No contradictory rules exist; no resolution strategy is required.
