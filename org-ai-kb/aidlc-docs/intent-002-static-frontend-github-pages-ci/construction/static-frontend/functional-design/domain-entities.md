# Functional Design — Domain Entities (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: functional-design (construction, technology-agnostic)
Unit: static-frontend

Detailed entity definitions for all entities owned by this unit's components.
Technology-agnostic: logical types only (no language, storage mechanism, or
vendor specifics).

**Upstream note (data-models.md omitted).** `data-models.md` was intentionally
omitted upstream (`components.md`): the deployed system has no owned runtime
persistence — the catalogue is a static read-only artifact and the cart/order are
transient client state. Entity ownership is captured upstream through each
component's **Owns** field (`components.md`). The four entities below
(**Product**, **Cart**, **CartItem**, **Order**) are therefore **derived from the
component Owns fields**, not invented entities; each is annotated with its source.
Brownfield behaviour is preserved from `app/src/domain/order.js`,
`app/src/domain/cart.js`, and `app/src/data/products.js` per NFR-3 and
assumptions A-2/A-3/A-4.

---

## Entity: Product

- **Owning component** — Catalogue Data Provider (`components.md` **Owns**:
  Product). Derived from the component **Owns** field (data-models.md omitted).
- **Description** — A single catalogue entry: authoritative, read-only catalogue
  data as exposed at runtime, derived at build time from the single authoritative
  catalogue source (FR-1, NFR-2).
- **Attributes**

  | Attribute | Logical type | Optionality | Default | Notes |
  |---|---|---|---|---|
  | id | identifier (text) | required | — | Unique product identifier (e.g. `p1`). |
  | name | text | required | — | Display name. |
  | unit price | monetary amount (non-negative) | required | — | The `price` field in the source catalogue. |
  | image reference | reference (text) | required | — | Base-path-aware reference to the product image (FR-7). |
  | description | text | optional | absent | Free-text product description. |

  No derived/computed attributes.
- **Relationships** — Referenced by **CartItem** (by `id`) and by **Order** item
  snapshots (by value copy of `id`, `name`, `unit price`). The Product is the
  source of those copies; it holds no back-reference.
- **Invariants**
  - `id` is present and non-empty.
  - `unit price` is a defined non-negative monetary amount.
  - The Product is **immutable / read-only at runtime** — it is never modified by
    any workflow in this unit (the catalogue is a read-only artifact —
    `components.md`).
- **Lifecycle** — **Not stateful.** A Product has no lifecycle states; it is a
  read-only catalogue entry with no state transitions at runtime.
- **Constraints**
  - **Uniqueness**: `id` is unique across the catalogue (BR-1, BR-2).
  - **Single source of truth**: the runtime Product set is derived from exactly
    one authoritative catalogue source; no second hand-maintained copy exists
    (FR-1, NFR-2). (Build-time derivation is deferred to infrastructure-design —
    OOS-4 — and is not modelled here.)
- **Concurrency** — Not applicable (read-only; no concurrent modification).

---

## Entity: Cart

- **Owning component** — Cart (`components.md` **Owns**: Cart and CartItem).
  Derived from the component **Owns** field (data-models.md omitted). Reused
  unchanged (A-2); preserved from `app/src/domain/cart.js`.
- **Description** — The persisted client-side shopping-cart aggregate: the
  authoritative source of cart contents across sessions.
- **Attributes**

  | Attribute | Logical type | Optionality | Default | Notes |
  |---|---|---|---|---|
  | line items | collection of CartItem | required | empty collection | The cart contents. |
  | total | monetary amount (derived) | derived | 0 | Σ of CartItem subtotals, rounded to 2 decimal places (BR-7). Read via `get-total`. |
  | item count | integer (derived) | derived | 0 | Total item count; read via `get-count`. |
  | is-empty | boolean (derived) | derived | true | Whether `line items` is empty; read via `is-empty`. |

- **Relationships** — Cart **1 — \*** CartItem (a cart contains zero or more
  CartItems; navigation Cart → CartItem). Each CartItem references a Product by
  id.
- **Invariants**
  - No two line items refer to the same Product `id` (no duplicate line items —
    adding an existing product increments quantity rather than duplicating —
    BR-5).
  - `total` equals the sum of its CartItems' subtotals, rounded to 2 decimal
    places (BR-7).
  - `item count` equals the sum of its CartItems' quantities.
  - `is-empty` is true exactly when `line items` is empty.
- **Lifecycle** — **Stateful, simple.** Two logical states:
  - **Empty** — `line items` is empty (`is-empty` = true).
  - **Non-empty** — `line items` has at least one CartItem.

  State machine:

  | From state | Trigger | Guard | To state | Entry/exit action |
  |---|---|---|---|---|
  | Empty | `add-item` (resolved product) | product resolved | Non-empty | New CartItem created (quantity ≥ 1). |
  | Non-empty | `add-item` (resolved product) | product resolved | Non-empty | Existing CartItem quantity incremented, or new CartItem appended (BR-5). |
  | Non-empty | `set-quantity` (qty ≥ 1) | line item exists | Non-empty | CartItem quantity set (BR-6). |
  | Non-empty | `set-quantity` (qty ≤ 0) **or** `remove-item` | — | Non-empty **or** Empty | CartItem removed; transitions to Empty only if it was the last line item (BR-6). |
  | Non-empty | `clear` | — | Empty | All line items removed (BR-11, triggered by successful checkout). |
  | Empty | `remove-item` / `set-quantity` on absent item | — | Empty | No-op. |

  No terminal state — a cleared cart can be repopulated. No implicit transitions:
  every transition is one of the rows above.
- **Constraints**
  - **Referential**: each CartItem's product id should correspond to a known
    Product; enforced at the edge on add (BR-4), not by the Cart itself (no
    Cart→Catalogue dependency).
- **Concurrency** — Single-client persisted state. There are no concurrent
  actors: only one client mutates its own cart, sequentially. Conflict-resolution
  strategy: last-write-wins (each operation produces the new cart state). No
  multi-actor contention applies.

---

## Entity: CartItem

- **Owning component** — Cart (`components.md` **Owns**: Cart and CartItem).
  Derived from the component **Owns** field (data-models.md omitted). Preserved
  from `app/src/domain/cart.js`.
- **Description** — A single line item within the Cart: a Product reference with a
  quantity and a derived line subtotal.
- **Attributes**

  | Attribute | Logical type | Optionality | Default | Notes |
  |---|---|---|---|---|
  | product id | identifier (text) | required | — | References a Product by `id`. |
  | name | text | required | — | Snapshot of the Product name at add time. |
  | unit price | monetary amount (non-negative) | required | — | Snapshot of the Product unit price (the `price` field). |
  | quantity | integer ≥ 1 | required | 1 | Coerced to an integer (BR-6). |
  | subtotal | monetary amount (derived) | derived | — | `round(unit price × quantity, 2 decimal places)` (BR-7); exposed via display line items. |

- **Relationships** — CartItem **\* — 1** Product (references one Product by id;
  navigation CartItem → Product by id). CartItem **\* — 1** Cart (belongs to
  exactly one Cart).
- **Invariants**
  - `quantity` is an integer and `quantity ≥ 1` (a quantity of 0 or less removes
    the line item rather than persisting — BR-6).
  - `subtotal` equals `round(unit price × quantity, 2 decimal places)` (BR-7).
  - `product id` is present.
- **Lifecycle** — **Not independently stateful.** A CartItem exists while it is in
  the Cart; its only "state change" is its quantity value, governed by the Cart's
  state machine and BR-6. It has no lifecycle states of its own and no terminal
  state independent of the Cart.
- **Constraints**
  - Within a Cart, `product id` is unique across CartItems (no duplicate line
    items — BR-5).
- **Concurrency** — Inherits the Cart's single-client, last-write-wins model. Not
  separately applicable.

---

## Entity: Order

- **Owning component** — Checkout / Order Simulation (`components.md` **Owns**:
  Order). Derived from the component **Owns** field (data-models.md omitted).
  Ported from `app/src/domain/order.js` (A-3) with the rounding and order-id
  behaviour preserved (NFR-3).
- **Description** — A simulated, transient order produced at checkout time: the
  authoritative source of order identity, total, and confirmation content for the
  lifetime of a single checkout. Nothing is persisted (no server — OOS-2).
- **Attributes**

  | Attribute | Logical type | Optionality | Default | Notes |
  |---|---|---|---|---|
  | order identifier | identifier (text) | required | — | Generated per checkout; unique within the checkout (BR-9). |
  | items | collection of item snapshots | required | — | Each snapshot: `id`, `name`, `unit price`, `quantity` (value copies of the cart line items — not live cart references). |
  | total | monetary amount (derived) | derived | — | `round(Σ unit price × quantity over items, 2 decimal places)` (BR-8). |

  **No customer attribute** (clarification Q2): the Order is built from cart line
  items only. The legacy `customer` field in `app/src/domain/order.js` was a
  server-stub artifact; the deployed site is guest-only (cross-cutting
  authorisation model "None") and FR-5's confirmation content has no customer
  field.
- **Relationships** — Order **1 — \*** item snapshot. Each item snapshot is a
  **value copy** of a cart line item (and transitively of a Product by id), not a
  live reference to a CartItem or Product. The Order holds no link back to the
  Cart after it is built.
- **Invariants**
  - `order identifier` is present and unique within the checkout (BR-9).
  - `items` contains **at least one** item snapshot — an empty cart is rejected
    before an Order is built (BR-10, FR-6).
  - `total` equals `round(Σ unit price × quantity over items, 2 decimal places)`,
    consistent with `items` (BR-8).
- **Lifecycle** — **Transient (built-then-confirmed, never persisted).** Logical
  phases within a single checkout:
  - **Built** — `build-order` has produced the Order (only reachable from a
    non-empty cart — BR-10).
  - **Confirmed** — `place-order` has returned the confirmation content and the
    Cart has been cleared (BR-11).

  | From | Trigger | Guard | To | Action |
  |---|---|---|---|---|
  | (none) | `build-order` | cart non-empty (BR-10) | Built | Generate order id, snapshot items, compute total. |
  | Built | `place-order` success | — | Confirmed | Return confirmation; clear the Cart (BR-11). |
  | (none) | `build-order` / `place-order` | cart empty | **rejected — no Order created** | No id generated, no confirmation, cart unchanged (BR-10, FR-6). |

  **Confirmed is the terminal phase.** The Order is not retained after the
  checkout completes — it exists only for the lifetime of the single checkout and
  is persisted nowhere (OOS-2). There is no edit, cancel, or re-open transition.
- **Constraints**
  - **Uniqueness**: `order identifier` is unique within a single checkout
    (collision avoided by a time component combined with a random component —
    BR-9). No cross-checkout persistence or registry exists.
  - **Empty-cart**: no Order may exist with zero items (BR-10).
- **Concurrency** — Not applicable. Each Order is computed from the cart supplied
  at invocation; the component is stateless and retains no order after placement
  (`components.md`). There are no concurrent actors on a single client's checkout.
