# Functional Design — Business Logic Model (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: functional-design (construction, technology-agnostic)
Unit: static-frontend

This document models the behavioural logic of the `static-frontend` unit: the
business workflows that fulfil the unit's mapped requirements, the (absence of)
domain events, and the integration touchpoints across component boundaries. It
is strictly technology-agnostic — no language, framework, storage mechanism,
protocol, or vendor is named.

Story traceability uses the functional-requirement identifiers `FR-1 … FR-10`
from `requirements.md` as the story-equivalent IDs (clarification Q1), consistent
with `services.md` and `components.md`. This intent has no `stories.md` or
`units-of-work-story-map.md`.

---

## 1. Unit scope

- **Unit name** — `static-frontend`
- **Owning components** (from `components.md`)
  - **Catalogue Data Provider** — read access to the product catalogue.
  - **Checkout / Order Simulation** — client-side simulated order placement.
  - **Cart** — persisted client-side cart aggregate (reused unchanged — A-2).
- **Mapped story-equivalents** (FR IDs addressed at the runtime altitude of this
  unit): **FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-10**.
  - **FR-1, FR-2** — catalogue source and retrieval (Browse Catalogue workflow).
  - **FR-3, FR-4** — by-id lookup and not-found state (View Product Detail
    workflow).
  - **FR-5, FR-6** — client-side order stub with full parity and the empty-cart
    guard (Place Order workflow).
  - **FR-2 (cart provenance)** — catalogue products are the source of items added
    (Manage Cart workflow).
  - **FR-7** — sub-path portability, addressed as a cross-cutting standard
    inherited by every workflow rather than by a dedicated workflow (see §4 and
    the coverage note in §5).
  - **FR-10** — deployed-artifact boundary, a build/packaging constraint with no
    runtime business behaviour; noted in §5 as out of the runtime altitude.
- **Out-of-altitude requirements** — **FR-8** (automated CI trigger) and **FR-9**
  (deploy-only-on-green) describe the build-and-publish pipeline and are deferred
  to infrastructure-design (OOS-4, `components.md` coverage note). They have no
  runtime business workflow and are flagged in §5.

---

## 2. Business workflows

Each workflow below corresponds to a service operation in `services.md` and
references only component methods that exist in `component-methods.md`.

### W-1 — Browse Catalogue

- **Service** — Browse Catalogue (`services.md`)
- **Component method** — `get-all-products` (Catalogue Data Provider)
- **Supports** — FR-1, FR-2
- **Trigger** — The user opens the catalogue listing.
- **Happy path**
  1. The workflow invokes `get-all-products` on the Catalogue Data Provider.
  2. The provider resolves the static catalogue artifact via the cross-cutting
     base-path-aware reference-resolution standard (integration touchpoint IT-2,
     §4) and returns the full ordered collection of Product entries.
  3. The workflow presents the returned products in the catalogue listing.
  - Loggable occurrence: `catalogue.load` (severity info — see §3).
- **Decision points** — None at the business-logic level (the full catalogue is
  always returned; see BR-1 in `business-rules.md`).
- **Exception path**
  - If the static catalogue artifact cannot be resolved, the retrieval fails with
    failure category **not-found** / artifact-unresolvable per the cross-cutting
    error format. Loggable occurrence: `catalogue.load` at severity error. No
    catalogue is presented. (This is an infrastructure/resolution failure, not a
    business decision; the workflow surfaces the failure rather than fabricating
    data.)

### W-2 — View Product Detail

- **Service** — View Product Detail (`services.md`)
- **Component method** — `get-product-by-id` (Catalogue Data Provider)
- **Supports** — FR-3, FR-4
- **Trigger** — The user navigates to a product-detail view for a given product
  identifier.
- **Happy path**
  1. The workflow invokes `get-product-by-id` with the requested identifier.
  2. If a Product is returned, the workflow presents its detail view.
- **Decision point** — Lookup outcome (Product vs. null/absent):
  - **Product returned** → present the detail view.
  - **null/absent returned** → present the existing product-not-found state
    (this is the not-found branch, BR-2 and BR-3 in `business-rules.md`).
    Loggable occurrence: `product.lookup.miss` (severity info — expected
    behaviour driving the not-found state).
- **Exception path** — An unknown identifier is **not** an error (cross-cutting
  error convention): it resolves to null/absent and drives the not-found state,
  preserving current observable behaviour (NFR-3, FR-4). The only true failure is
  artifact-unresolvable, handled as in W-1.

### W-3 — Manage Cart

- **Service** — Manage Cart (`services.md`)
- **Component methods** — `add-item`, `set-quantity`, `remove-item`,
  `get-line-items`, `get-total`, `get-count`, `is-empty`, `clear` (Cart);
  `get-product-by-id` (Catalogue Data Provider, for edge-level add validation
  only)
- **Supports** — FR-2 (catalogue products are the source of items added) and the
  checkout precondition (a populated cart for FR-5 / FR-6). Cart internals are
  reused unchanged (A-2).
- **Trigger** — The user adds a product, changes a quantity, removes a line item,
  or views the current cart state.
- **Happy path — Add a product**
  1. The Manage Cart workflow resolves the chosen product at the edge by invoking
     `get-product-by-id` (edge-level known-product validation — BR-4, and
     clarification Q6). This validation occurs at the service/presentation
     boundary; the Cart component does **not** depend on the Catalogue Data
     Provider (no Cart→Catalogue dependency — `component-dependencies.md`).
  2. **Decision point — product resolution:**
     - **Product resolved (non-null)** → invoke `add-item` on the Cart for that
       product. If a line item for the product already exists, its quantity is
       increased; otherwise a new line item is created (BR-5).
     - **Product unresolved (null/absent)** → the add is rejected at the edge with
       failure category **invalid-input**; the Cart is not invoked and is left
       unchanged (BR-4).
  - Loggable occurrence on a successful change: `cart.change` (severity info).
- **Happy path — Change quantity**
  1. The workflow invokes `set-quantity` with the product identifier and the new
     quantity.
  2. **Decision point — quantity value** (BR-6, decision table in
     `business-rules.md`):
     - **quantity ≤ 0** → the line item is removed.
     - **quantity ≥ 1** (coerced to an integer) → the line item's quantity is set
       to that value.
  - Loggable occurrence: `cart.change` (severity info).
- **Happy path — Remove a line item**
  1. The workflow invokes `remove-item`. Removing an absent item is a no-op
     (precondition: none — `component-methods.md`).
  - Loggable occurrence: `cart.change` (severity info).
- **Happy path — View cart state**
  1. The workflow reads current state via `get-line-items`, `get-total`,
     `get-count`, and `is-empty` (read-only; no state change). Line subtotals and
     the cart total follow the rounding rule BR-7.
- **Exception path** — Edge-level validation rejects an unknown product
  identifier (BR-4) and a non-integer or out-of-range quantity is coerced per
  BR-6 before the Cart is invoked. The Cart's own preconditions
  (`component-methods.md`) provide defence in depth (cross-cutting validation
  approach).

### W-4 — Place Order (simulated)

- **Service** — Place Order (simulated) (`services.md`)
- **Component methods** — `place-order`, `build-order`, `calculate-total`,
  `generate-order-id` (Checkout / Order Simulation); `is-empty`,
  `get-line-items`, `clear` (Cart)
- **Supports** — FR-5, FR-6
- **Trigger** — The user initiates checkout.
- **Happy path**
  1. The workflow invokes `place-order` on Checkout / Order Simulation, which
     reads the current cart line items from the Cart (integration touchpoint
     IT-1, §4) via `get-line-items`.
  2. **Decision point — cart empty?** (empty-cart guard, BR-10; decision table in
     `business-rules.md`):
     - **Cart empty** → the order is rejected. No order identifier is generated,
       no Order is built, no confirmation is shown, and the Cart is left
       unchanged (FR-6). Failure category **empty-cart**. Loggable occurrence:
       `checkout.rejected.empty-cart` (severity warning).
     - **Cart non-empty** → continue to step 3.
  3. `place-order` builds the Order via `build-order`, which:
     - generates a unique order identifier via `generate-order-id` (BR-9),
     - itemises the cart line items as a value snapshot, and
     - computes the order total via `calculate-total` (BR-7, BR-8).
  4. On a successful build, the Cart is cleared via `clear` (BR-11), and the
     confirmation content (order identifier, itemised items, total) is returned
     and presented (FR-5, NFR-3). Nothing is persisted (no server — OOS-2).
  - Loggable occurrence: `checkout.success` (severity info).
- **Exception path** — The only business exception is the empty-cart rejection
  above. There is no payment, no external call, and no persistence, so no other
  runtime failure mode is introduced by this workflow.

---

## 3. Domain events

**This unit produces and consumes no domain events.** (Clarification Q7.) The
deployed system is not event-driven: `event-catalog.md` is intentionally omitted
upstream, there is no event bus or asynchronous messaging, and all inter-component
interaction is direct synchronous in-process invocation
(`component-dependencies.md`).

For traceability, the cross-cutting **logging taxonomy** (`cross-cutting.md`) is
recorded here as a set of **logical loggable occurrences** — they are log events,
**not** domain events. They carry no payload contract and trigger no downstream
component behaviour:

| Loggable occurrence | Trigger | Severity | Workflow |
|---|---|---|---|
| `catalogue.load` | Catalogue loaded from the static artifact (error if unresolvable) | info / error | W-1 |
| `product.lookup.miss` | A by-id lookup resolved to not-found | info | W-2 |
| `cart.change` | An add / set-quantity / remove / clear occurred | info | W-3, W-4 (clear) |
| `checkout.rejected.empty-cart` | Checkout rejected due to an empty cart | warning | W-4 |
| `checkout.success` | An order was simulated successfully | info | W-4 |

---

## 4. Integration touchpoints

All touchpoints below trace to declared dependencies in
`component-dependencies.md`. No undeclared cross-boundary interaction exists.

### IT-1 — Checkout / Order Simulation → Cart (synchronous call)

- **Declared in** — `component-dependencies.md` (Checkout / Order Simulation →
  Cart, Synchronous call).
- **Used by** — W-4 (Place Order). At checkout, Checkout reads the current cart
  line items (`get-line-items` / `is-empty`) to build the order and, on success,
  invokes the Cart's `clear` operation.
- **Direction** — One-way (Checkout depends on Cart; Cart does not depend on
  Checkout). Acyclic.

### IT-2 — Catalogue Data Provider → static catalogue artifact / reference-resolution standard

- **Declared in** — `component-dependencies.md` (Catalogue Data Provider → Static
  catalogue artifact, Read of build-time artifact; and Catalogue Data Provider →
  Cross-cutting reference-resolution standard, Standard inheritance).
- **Used by** — W-1 and W-2. The provider reads the read-only static catalogue
  artifact at runtime, locating it via the cross-cutting base-path-aware
  reference-resolution standard so retrieval works under any hosting sub-path
  (FR-7, NFR-4). This is a logical artifact dependency, not a runtime call to
  another component.

### Edge-level catalogue resolution within Manage Cart

- The known-product validation in W-3 (add path) uses `get-product-by-id` at the
  **service/edge** layer that orchestrates Manage Cart (`services.md`: "Catalogue
  Data Provider (to resolve the product being added)"). This is **not** a direct
  Cart→Catalogue component dependency — `component-dependencies.md` explicitly
  records that the add action is routed by the service, with no Cart→Catalogue
  edge. No undeclared dependency is introduced (clarification Q6).

---

## 5. Coverage note

| FR | Addressed by | Notes |
|---|---|---|
| FR-1 | W-1 + BR-1 | Catalogue source / single-source-of-truth (read at runtime). |
| FR-2 | W-1, W-3 + BR-1, BR-4, BR-5 | Catalogue retrieval and cart provenance. |
| FR-3 | W-2 + BR-2 | By-id lookup returns match or null/absent. |
| FR-4 | W-2 + BR-3 | Not-found state for unknown id (no regression). |
| FR-5 | W-4 + BR-7, BR-8, BR-9, BR-11 | Client-side order stub, full parity. |
| FR-6 | W-4 + BR-10 | Empty-cart guard. |
| FR-7 | Cross-cutting standard (IT-2) | Sub-path portability inherited by every workflow; no dedicated workflow (`services.md` coverage note). |
| FR-10 | — (out of runtime altitude) | Deployed-artifact boundary: a build/packaging constraint with no runtime business behaviour; deferred to infrastructure-design (OOS-4). |
| FR-8 | — (deferred) | Automated CI trigger — infrastructure-design (OOS-4); no runtime workflow. |
| FR-9 | — (deferred) | Deploy-only-on-green — infrastructure-design (OOS-4); no runtime workflow. |

Every mapped runtime FR (FR-1 … FR-6) is addressed by at least one business
workflow. FR-7 is satisfied as an inherited cross-cutting standard. FR-8, FR-9,
and FR-10 are flagged as out of the runtime altitude of this unit, consistent
with the upstream `components.md` and `services.md` coverage notes — they are not
unaddressed by oversight.
