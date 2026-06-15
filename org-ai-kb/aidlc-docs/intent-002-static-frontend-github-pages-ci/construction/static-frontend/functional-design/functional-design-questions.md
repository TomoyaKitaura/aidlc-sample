# Functional Design — Clarification Questions (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Skill: aidlc-functional-design
Unit: static-frontend

Note on auto-answer mode: this skill's `human-clarification` flag is `"true"`,
but the orchestrator pre-authorised auto-proceeding for this run. Each question
below therefore carries the builder's own recommended answer on the `[Answer]:`
line with brief rationale. The file is retained for traceability.

---

### Q1: There is no `stories.md`, `units-of-work.md`, or `units-of-work-story-map.md` for this intent (the approved workflow skips user-stories, wireframes, and units-generation). What identifiers should the functional-design artifacts use for story traceability?

a) Use the functional-requirement identifiers (`FR-1 … FR-10`) from `requirements.md` directly as the story-equivalent IDs, exactly as `services.md` and `components.md` already do.
b) Invent synthetic `S-<n>` story IDs and map each to an FR.
c) Omit story traceability entirely.

**Trade Offs:** (a) keeps a single, already-established mapping basis used by every upstream artifact, so coverage tracing stays consistent across the intent. (b) introduces a second, redundant identifier scheme with no upstream source. (c) breaks the validation-spec requirement that every rule trace to at least one story.

**Recommendation:** (a). The upstream application-design artifacts explicitly adopt FR-n as the story-equivalent mapping basis; reusing them keeps traceability consistent and satisfies validation rules 2, 3, 10, and 21 without inventing identifiers.

[Answer]: a — Use FR-1 … FR-10 as the story-equivalent IDs. Rationale: this is the established, single mapping basis already used by services.md and components.md; inventing S-n IDs would create a redundant scheme with no upstream source, and omitting traceability would fail the validation spec.

---

### Q2: The brownfield `buildOrder` in `app/src/domain/order.js` accepts a `customer` object and includes it in the order, but the application-design `build-order` / `place-order` methods (`component-methods.md`) take only the cart line items and omit any customer. How should the Order entity treat customer data?

a) Follow the application-design contract: Order has no customer attribute. The order is built from cart line items only (the customer field in the legacy server stub is dropped, since the deployed static site is guest-only with no accounts — per `cross-cutting.md` authorisation model "None").
b) Preserve the legacy `customer` attribute on Order as an optional field, even though no UI collects it.
c) Make customer a required attribute.

**Trade Offs:** (a) matches the approved application-design method signatures and the guest-only authorisation model, and the confirmation content specified by FR-5 (order id + itemised items + total) does not include customer. (b) carries a vestigial field that no workflow populates, risking divergence from the application-design contract. (c) contradicts the guest-only model and FR-5.

**Recommendation:** (a). The application-design `build-order`/`place-order` signatures are the authoritative contract for this unit and deliberately omit customer; the system is guest-only and FR-5's confirmation content has no customer field. Dropping it keeps the functional design consistent with approved upstream artifacts.

[Answer]: a — Order has no customer attribute; built from cart line items only. Rationale: the approved application-design method contracts omit customer, the deployed site is guest-only (cross-cutting authorisation "None"), and FR-5's confirmation content (order id + items + total) contains no customer. The legacy customer field was a server-stub artifact not carried into this unit.

---

### Q3: How should the order total and line subtotals be computed and rounded, given the brownfield logic and the need for no observable-behaviour regression (NFR-3)?

a) Preserve the brownfield rule exactly: total = sum over line items of (unit price × quantity), rounded to 2 decimal places; each display line subtotal = (unit price × quantity) rounded to 2 decimal places. Non-numeric or missing unit price / quantity contributes 0 (defensive coercion, as in `calculateTotal`).
b) Sum without rounding and round only for display.
c) Round each line subtotal first, then sum the rounded subtotals.

**Trade Offs:** (a) reproduces current observable output exactly, satisfying NFR-3. (b) and (c) can produce off-by-a-cent differences versus today's confirmation, which is a regression.

**Recommendation:** (a). NFR-3 requires the checkout total to match current `app/` behaviour exactly; the brownfield `calculateTotal` rounds the final sum to 2 decimals and `lineItems` rounds each subtotal to 2 decimals, so preserving both rules verbatim is the only no-regression choice.

[Answer]: a — Preserve the brownfield rounding rules exactly (total = round(Σ unitPrice×qty, 2dp); each line subtotal = round(unitPrice×qty, 2dp); non-numeric inputs coerce to 0). Rationale: NFR-3 mandates byte-for-byte parity with current confirmation output; the existing calculateTotal/lineItems define these rules and any alternative rounding risks a one-cent regression.

---

### Q4: What is the Order Identifier format and uniqueness guarantee?

a) Preserve the brownfield format: `ORD-<base36 timestamp, uppercased>-<6-char base36 random suffix, uppercased>`, regenerated per checkout, unique within a single client/checkout. Describe it technology-agnostically (a generated identifier combining a time component and a random component to avoid collision between consecutive checkouts).
b) Sequential counter persisted client-side.
c) Opaque random UUID-style identifier.

**Trade Offs:** (a) matches current observable confirmation format (NFR-3) and needs no persistence. (b) requires persistent state the application-design declares Checkout does not hold (Checkout is stateless) and could collide across cleared storage. (c) changes the visible order-id shape, a regression against current behaviour.

**Recommendation:** (a). The `generate-order-id` method must produce a value unique within the checkout with no persistence; the brownfield format already satisfies this and is the current observable output, so preserving it (described technology-agnostically) satisfies NFR-3 and the stateless-component constraint.

[Answer]: a — Preserve the brownfield order-id scheme (prefix + time component + random component, described technology-agnostically), regenerated per checkout, unique within the checkout with no persistence. Rationale: matches current observable confirmation (NFR-3), needs no persisted state (Checkout is stateless per application-design), and the combined time+random construction avoids consecutive-checkout collisions.

---

### Q5: The brownfield cart stores a unit price under `price` and produces display line items with `unitPrice`/`subtotal`; quantity changes coerce to integers and a quantity of zero (or less) removes the line item. Which of these behaviours are binding invariants/rules for the functional design?

a) Preserve all of them as binding rules: CartItem holds a unit price and an integer quantity ≥ 1; `set-quantity` with quantity ≤ 0 removes the line item; `add-item` increments an existing line item's quantity rather than duplicating it; line items expose name, unit price, quantity, and a computed subtotal.
b) Treat quantity-zero-removes as an edge case left to implementation.
c) Allow quantity 0 to persist as a zero-quantity line item.

**Trade Offs:** (a) preserves current observable cart behaviour exactly (A-2 says the cart is reused unchanged) and matches `component-methods.md` (`set-quantity` "a quantity of zero removes the line item"). (b)/(c) diverge from the documented method contract and from A-2.

**Recommendation:** (a). A-2 states the cart is reused unchanged and `component-methods.md` already specifies the zero-removes and increment-existing behaviours; capturing them as binding business rules keeps the functional design faithful to both the brownfield code and the approved method contracts.

[Answer]: a — Preserve all listed cart behaviours as binding rules (integer quantity ≥ 1; set-quantity ≤ 0 removes the item; add-item increments existing line item; line items expose name, unit price, quantity, computed subtotal). Rationale: A-2 reuses the cart unchanged and component-methods.md already mandates the zero-removes and increment-existing semantics, so these are documented invariants, not implementation freedom.

---

### Q6: How should `add-item`'s precondition that "the product identifier refers to a known catalogue product" (`component-methods.md`) be modelled, given there is no runtime server to reject an unknown id?

a) Model it as an edge-level validation rule (validation happens at the service/presentation boundary per `cross-cutting.md`): the add action resolves the product via the Catalogue Data Provider's `get-product-by-id` before invoking the cart; an unresolved (null) product is rejected at the edge and not added. The cart component itself does not re-fetch the catalogue.
b) Make the Cart component depend on the Catalogue Data Provider to validate ids.
c) Drop the precondition entirely and allow adding arbitrary ids.

**Trade Offs:** (a) matches `cross-cutting.md` (edge-level validation before component invocation) and `component-dependencies.md` (the add is routed by a service, not a direct Catalogue→Cart call; there is no direct Cart→Catalogue dependency). (b) would introduce an undeclared cross-boundary dependency that contradicts `component-dependencies.md` (validation rule 14). (c) violates the documented precondition.

**Recommendation:** (a). The cross-cutting validation approach places identifier validation at the edge before component invocation, and the dependency matrix explicitly has no Cart→Catalogue edge; modelling the known-product check as an edge-level validation rule honours both without introducing an undeclared dependency.

[Answer]: a — Model the known-product check as an edge-level validation rule: the Manage Cart service resolves the product via get-product-by-id and rejects an unresolved id before invoking the cart; the Cart does not depend on the Catalogue Data Provider. Rationale: cross-cutting.md places validation at the service edge and component-dependencies.md declares no Cart→Catalogue dependency (option b would create an undeclared cross-boundary interaction, failing validation rule 14).

---

### Q7: The deployed system is not event-driven and `event-catalog.md` is omitted (no event bus). The cross-cutting logging taxonomy, however, lists domain-significant occurrences (catalogue.load, product.lookup.miss, cart.change, checkout.rejected.empty-cart, checkout.success). How should `business-logic-model.md` treat domain events?

a) State explicitly that this unit produces and consumes no domain events (no event bus, no async messaging — per `components.md` and `component-dependencies.md`), and record the cross-cutting logging taxonomy entries as logical loggable occurrences (not domain events) for traceability, consistent with `cross-cutting.md`.
b) Promote the logging taxonomy entries to domain events.
c) Omit any mention of events.

**Trade Offs:** (a) is consistent with the omitted `event-catalog.md` and the "all interaction is direct synchronous in-process invocation" statement, while still acknowledging the logging taxonomy. (b) would invent domain events with no event catalogue, contradicting upstream and validation rule 5. (c) leaves a reader unsure whether events were considered.

**Recommendation:** (a). The application design is explicitly not event-driven; the correct functional-design treatment is an explicit "no domain events" statement plus a note that the logging-taxonomy occurrences are logical log events, not domain events — consistent with upstream and the validation spec.

[Answer]: a — State explicitly that the unit produces/consumes no domain events, and record the cross-cutting logging-taxonomy entries as logical loggable occurrences (not domain events). Rationale: event-catalog.md is omitted and the system is declared non-event-driven (direct synchronous in-process invocation only); inventing domain events would contradict upstream and validation rule 5.

---

## Summary of recommended answers

- Q1: a — FR-1 … FR-10 as story-equivalent IDs.
- Q2: a — Order has no customer attribute.
- Q3: a — Preserve brownfield rounding (2dp on final total and on each line subtotal).
- Q4: a — Preserve brownfield order-id scheme (time + random, no persistence).
- Q5: a — Preserve all listed cart invariants/rules.
- Q6: a — Known-product check is an edge-level validation rule; no Cart→Catalogue dependency.
- Q7: a — No domain events; logging-taxonomy entries are logical log occurrences.
