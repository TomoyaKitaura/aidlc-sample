# Functional Design — Plan (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Skill: aidlc-functional-design
Unit: static-frontend
Clarification: complete (7 questions, auto-answered — see `functional-design-questions.md`)

This plan produces the three technology-agnostic functional-design artifacts for
the `static-frontend` unit. Story traceability uses the functional-requirement
identifiers `FR-1 … FR-10` as the story-equivalent basis (Q1), since this intent
has no `stories.md` / `units-of-work-story-map.md`.

---

## Decisions carried from clarification

- [x] D1 — Use `FR-1 … FR-10` as story-equivalent IDs throughout (Q1).
- [x] D2 — Order has no customer attribute; built from cart line items only (Q2).
- [x] D3 — Preserve brownfield rounding: total = round(Σ unitPrice×qty, 2dp); each line subtotal = round(unitPrice×qty, 2dp); non-numeric inputs coerce to 0 (Q3).
- [x] D4 — Preserve brownfield order-id scheme (time component + random component, no persistence), described technology-agnostically (Q4).
- [x] D5 — Preserve cart invariants: integer quantity ≥ 1; set-quantity ≤ 0 removes item; add-item increments existing; line items expose name, unit price, quantity, computed subtotal (Q5).
- [x] D6 — Known-product check for add is an edge-level validation rule; no Cart→Catalogue dependency (Q6).
- [x] D7 — No domain events; logging-taxonomy entries recorded as logical loggable occurrences (Q7).

## Artifact 1 — business-logic-model.md

- [x] Unit scope: unit name `static-frontend`; mapped story-equivalents FR-1 … FR-7, FR-10 (runtime-addressable; note FR-8/FR-9 are infrastructure-deferred and out of altitude); owning components Catalogue Data Provider, Checkout / Order Simulation, Cart.
- [x] Business workflow: Browse Catalogue (uses `get-all-products`) → FR-1, FR-2.
- [x] Business workflow: View Product Detail (uses `get-product-by-id`, not-found branch) → FR-3, FR-4.
- [x] Business workflow: Manage Cart (uses `add-item`, `set-quantity`, `remove-item`, `get-line-items`, `get-total`, `get-count`, `is-empty`, `clear`) with edge-level known-product validation → FR-2 plus checkout precondition.
- [x] Business workflow: Place Order (simulated) (uses `place-order`, `build-order`, `calculate-total`, `generate-order-id`, and Cart `clear`) with empty-cart guard branch → FR-5, FR-6.
- [x] Each workflow: step-by-step flow, decision points, happy path and exception path, referencing only methods that exist in `component-methods.md`.
- [x] Domain events section: explicit "no domain events produced or consumed" statement; logging-taxonomy entries listed as logical loggable occurrences (D7).
- [x] Integration touchpoints: Checkout → Cart (synchronous call) and Catalogue Data Provider → static catalogue artifact / reference-resolution standard, each traced to `component-dependencies.md` (no undeclared cross-boundary interaction).
- [x] Coverage note: confirm every mapped FR is addressed by ≥1 workflow; flag FR-8/FR-9 as infrastructure-deferred with reason.

## Artifact 2 — domain-entities.md

- [x] Entity Product (owning component Catalogue Data Provider): attributes (id, name, unit price, image reference, description) with logical types and optionality; read-only/immutable invariant; not stateful (explicit); uniqueness of id; trace as refinement of the component **Owns** field (note: `data-models.md` omitted upstream — flag Product as derived from the **Owns** field, not an invented entity).
- [x] Entity Cart (owning component Cart): attributes (collection of CartItem; derived total, item count, is-empty); relationship Cart 1—* CartItem; invariants (no duplicate product line items; total = Σ subtotals); lifecycle stateful but simple (empty ↔ non-empty) with explicit description; concurrency note (single-client persisted state, last-write-wins, no concurrent actors).
- [x] Entity CartItem (owning component Cart): attributes (product id, name, unit price, integer quantity ≥ 1, derived subtotal = round(unitPrice×qty, 2dp)); relationship to Product by id; invariants (quantity ≥ 1; quantity integer); not independently stateful.
- [x] Entity Order (owning component Checkout / Order Simulation): attributes (order identifier, itemised items [snapshot of id, name, unit price, quantity], total = round(Σ unitPrice×qty, 2dp)); NO customer attribute (D2); relationship Order *—* item snapshots (value copies, not live cart refs); invariants (order id present and unique within checkout; total consistent with items; at least one item — empty-cart rejected); lifecycle: transient, built-then-confirmed, never persisted (explicit terminal/transient statement); concurrency N/A.
- [x] For each entity: at least one attribute, explicit lifecycle (or explicit not-stateful), and at least one invariant (validation rule 7).

## Artifact 3 — business-rules.md

- [x] BR-1 Catalogue retrieval returns full catalogue (validation/constraint) → FR-1, FR-2.
- [x] BR-2 Product lookup by id returns match or null/absent (validation) → FR-3.
- [x] BR-3 Unknown product id resolves to not-found state, not an error (state-transition/constraint) → FR-4.
- [x] BR-4 Add-item known-product edge validation (validation) → FR-2.
- [x] BR-5 Add-item increments existing line item rather than duplicating (constraint) → FR-2.
- [x] BR-6 Set-quantity ≤ 0 removes the line item; quantity coerced to integer ≥ 1 otherwise (constraint) → FR-2.
- [x] BR-7 Cart total / line subtotal rounding rule, 2dp, non-numeric coerces to 0 (calculation) → FR-5.
- [x] BR-8 Order total computation = round(Σ unitPrice×qty, 2dp) (calculation) → FR-5.
- [x] BR-9 Order identifier generation: unique within checkout, time+random construction, no persistence (calculation/constraint) → FR-5.
- [x] BR-10 Empty-cart guard: build-order/place-order rejected on empty cart; no id generated, no confirmation, cart unchanged (constraint/validation) → FR-6.
- [x] BR-11 Place-order success clears the cart and produces confirmation (order id + items + total); nothing persisted (state-transition) → FR-5.
- [x] Each rule: unique BR-n, type, trigger, declarative logic (decision table where multi-variable — e.g. set-quantity outcome table, place-order empty/non-empty table), violation behaviour, and Stories (FR-n).
- [x] Coverage check: every mapped FR (FR-1 … FR-6 runtime business rules; FR-7 cross-cutting reference-resolution noted) covered by ≥1 rule; no contradictory rules (validation rules 10, 11).
- [x] Confirm no technology/framework/vendor specifics appear in any artifact (validation rule 13).

## State

- [x] Add new row `functional-design:static-frontend` to `intent-state.md` reflecting clarification path (auto) and `execution:complete` after artifacts are written (done in execution invocation, not this plan step).
