# Requirements Analysis — Clarifying Questions

Intent: intent-001-sample-ec-site (greenfield, minimal sample EC site)
Scope reminder: checkout is simulated (no real payment), guest-only — per prior decisions. Questions below focus only on WHAT the system does, not how it is built.

> **Human constraint (recorded by orchestrator, applies to ALL requirements):** This is a SAMPLE that must **run locally** with no external dependencies. The **backend must return MOCK DATA** — no real database, no real payment gateway, no external services. Capture this as a project constraint/assumption; it shapes code-generation (a self-contained, locally-runnable app backed by in-memory/mock data).

---

### Q1: What product attributes must the site display?

a) Minimal: name, price, single image, short description
b) Minimal + category/tag for grouping or filtering on the listing page
c) Richer: name, price, multiple images, long description, category, SKU
d) Other

**Recommendation:** (a) — name, price, one image, and a short description per product.

[Answer]: (a) — name, price, one image, short description. Confirmed. (Images may be placeholder assets since data is mock.)

---

### Q2: Should the site track inventory / stock levels?

a) No stock tracking — every product is always available to add and order
b) Track stock; show "out of stock" and block adding/ordering when quantity is zero
c) Track stock and decrement it when an order is placed
d) Other

**Recommendation:** (a) — no stock tracking for the minimal scope.

[Answer]: (a) — no stock tracking. Products always orderable. Confirmed.

---

### Q3: What cart operations must be supported?

a) Add to cart only
b) Add, change item quantity, and remove item
c) Add, change quantity, remove item, and clear entire cart
d) Other

**Recommendation:** (b) — add to cart, change quantity, and remove an item.

[Answer]: (b) — add to cart, change quantity, remove item. Confirmed.

---

### Q4: What information must checkout capture for a (simulated, guest) order?

a) Nothing — confirm the cart contents and place the order as-is
b) Basic shipping/contact details: name, email, shipping address
c) Shipping/contact details plus a mock payment-method entry (not charged)
d) Other

**Recommendation:** (b) — capture name, email, and shipping address.

[Answer]: (b) — capture name, email, shipping address. No real payment (simulated, guest-only). Confirmed.

---

### Q5: What counts as a successfully placed order (the success outcome)?

a) An order confirmation screen showing an order ID and the ordered items
b) Confirmation screen plus a persisted order record viewable later
c) Confirmation screen plus an emailed/notified receipt
d) Other

**Recommendation:** (a) — confirmation with an order ID and ordered items; empty the cart.

[Answer]: (a) — show a confirmation screen with a generated order ID and the ordered items, then empty the cart. Order data is mock/in-memory only (no persistence beyond the session, consistent with the local/mock constraint). Confirmed.

---

### Q6: Please confirm the items that are OUT OF SCOPE for this minimal sample.

a) Out of scope: user accounts/login, real payment processing, order history/retrieval, admin/product management, search/filter, reviews, discounts/coupons, shipping cost/tax calculation
b) Same as (a) but KEEP listing-page search or filter in scope
c) Same as (a) but KEEP order history retrieval in scope
d) Other

**Recommendation:** (a) — exclude all listed items.

[Answer]: (a) — exclude all listed items. Plus explicit OUT OF SCOPE: real/persistent backend, real database, external/real services (replaced by mock data running locally). Confirmed.
