# Application Design — Clarifying Questions

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)
Mode: auto-proceed (human-clarification treated as false for this run — recommended answers are pre-filled and accepted)

Scope note: this stage describes LOGICAL components and their behaviour only —
no language, framework, infrastructure, or deployment specifics. The CI build /
publish pipeline (GitHub Actions / Pages) belongs to infrastructure-design and
is referenced here only as a logical "build artifact" concern at the appropriate
altitude.

Upstream note: this intent's approved workflow intentionally skips the
user-stories and wireframes skills (right-sized for a small brownfield refactor),
so `stories.md`, `personas.md`, and `screen-data-map.md` do not exist. The
functional requirements (FR-1 … FR-10) in `requirements.md` are therefore used
as the story-equivalent mapping basis for the `services.md` "stories addressed"
field and for validation rule 5.

---

### Q1: How should the catalogue/product data-access boundary be modelled now that the runtime `/api` server is removed?

a) A single logical **Catalogue Data Provider** component that owns catalogue retrieval (full list + by-id lookup), sourcing from a static data artifact produced at build time. The former server `/api/products` and `/api/products/:id` access collapses into this one client-side provider.
b) Two separate components — one for "list all" and one for "lookup by id".
c) Keep an abstract "API client" component whose internals point at static data.

**Trade Offs:** (a) preserves the existing cohesion (both reads already live together in `api.js` and `products.js`) and gives one clear owner of catalogue data, matching FR-1/FR-2/FR-3. (b) over-fragments two trivially-related reads. (c) keeps a misleading "API" abstraction when no runtime API remains, blurring the component-boundary change this intent is about.

**Recommendation:** (a). One cohesive Catalogue Data Provider that replaces the server products API, exposing list-all and lookup-by-id, backed by a static data source. Cleanest boundary, matches existing code cohesion.

[Answer]: a — A single logical Catalogue Data Provider owning both full-catalogue retrieval and by-id lookup, sourcing a build-time static catalogue artifact. Rationale: the two reads are already cohesive in the existing code (`api.js` + `products.js`), one owner of catalogue data is the clearest expression of the boundary change (server API removed, replaced by a self-contained client provider), and it directly satisfies FR-1/FR-2/FR-3/FR-4.

---

### Q2: Where should the order/checkout logic (order-id generation, total calculation, empty-cart guard, cart clearing) live now that there is no server?

a) A single client-side **Checkout / Order Simulation** component that ports the former server order domain (`order.js` buildOrder / generateOrderId / calculateTotal) verbatim in behaviour and orchestrates cart clearing on success.
b) Split into a pure "order calculation" library plus a separate "checkout orchestration" service.
c) Fold order logic into the cart component.

**Trade Offs:** (a) gives full parity with the former server order domain in one cohesive client component (FR-5/FR-6) and keeps the simulation boundary obvious. (b) is more granular but adds a layer with no current driver — the order domain is small and already cohesive; the calculation can still be expressed as distinct methods within the one component. (c) overloads the cart (which has a single clear responsibility: persisted cart state) and muddies ownership of the Order entity.

**Recommendation:** (a), with the calculation expressed as discrete methods (calculate-total, generate-order-id, build-order) inside the component so the pure-vs-orchestration distinction is preserved without a separate layer.

[Answer]: a — One client-side Checkout / Order Simulation component owning the Order entity, exposing calculate-total, generate-order-id, build-order (with empty-cart guard), and a place-order operation that builds the order and clears the cart on success. Rationale: mirrors the existing `order.js` cohesion, delivers full client-side parity (FR-5/FR-6) with no server, and keeps the cart's responsibility narrow. The pure calculation steps remain distinct methods, so no separate library layer is warranted at this scale.

---

### Q3: Should the build-time generation of the static catalogue artifact be modelled as a logical design component, or captured only as a concern?

a) Capture it as a logical **Build-Time Catalogue Generation** concern/artifact (a build-step that derives the static catalogue from the single authoritative catalogue source) without naming tooling — not a runtime component.
b) Model it as a first-class runtime component in `components.md`.
c) Omit it entirely and treat the static catalogue as a given input.

**Trade Offs:** (a) records the single-source-of-truth requirement (FR-1/NFR-2) at the right altitude: the artifact and its derivation are logical, the *how* (tooling, CI) is deferred to infrastructure-design. (b) is wrong — it is not a runtime component and naming it as one would invite tech-stack detail this stage forbids. (c) loses the FR-1 single-source-of-truth constraint that the design must honour.

**Recommendation:** (a). Document a "Build-Time Catalogue Generation" logical concern (and the static catalogue as a build artifact the Catalogue Data Provider consumes) in `components.md` and `cross-cutting.md`, technology-agnostic.

[Answer]: a — Capture build-time catalogue generation as a logical concern plus a "static catalogue artifact" that the Catalogue Data Provider reads at runtime; record it in components.md (as a non-runtime concern) and cross-cutting.md, with the authoritative source being the single existing catalogue source file. Rationale: preserves FR-1/NFR-2 single-source-of-truth at the correct altitude while deferring all tooling and CI specifics to infrastructure-design, honouring inception scope rules.

---

### Q4: How should the existing localStorage cart be represented in this design?

a) Reuse it unchanged as a **Cart** component (stateful, owns Cart/CartItem) — explicitly unchanged by this intent per assumption A-2.
b) Redesign the cart as part of this refactor.
c) Exclude it from the design since it is unchanged.

**Trade Offs:** (a) makes the cart a first-class component the Checkout depends on, giving validation a complete dependency picture without re-litigating its internals (A-2). (b) is out of scope — A-2 fixes the cart as unchanged. (c) would leave Checkout depending on an undocumented component and break the dependency-matrix completeness (validation rule 3).

**Recommendation:** (a). Include the Cart as an unchanged stateful component (owner of the persisted client cart) so dependencies are complete, but mark it explicitly out-of-scope-for-change.

[Answer]: a — Represent the existing localStorage cart as a stateful Cart component that owns the Cart / CartItem entities and is reused unchanged (A-2). Rationale: it is a dependency of the Checkout component and the Catalogue→Cart add flow, so it must appear for a complete dependency matrix (validation rule 3); marking it unchanged keeps it documented without redesigning in-scope-frozen behaviour.

---

### Q5: Sub-path portability (FR-7 / NFR-4) — where is it owned conceptually?

a) As a **cross-cutting reference-resolution standard**: all data/asset references are base-path aware so the system functions under a repository sub-path. The Catalogue Data Provider resolves the static catalogue location through this standard.
b) As a dedicated component.
c) Defer entirely to infrastructure-design.

**Trade Offs:** (a) is the right altitude — sub-path portability is a system-wide reference-resolution rule that every reference (catalogue data, assets) inherits, which is exactly what cross-cutting captures, while staying technology-agnostic (no base-path *mechanism* named). (b) over-engineers a single rule into a component. (c) under-specifies — FR-7/NFR-4 are functional/quality requirements the logical design must acknowledge as a standard, even though the deployment mechanism is infrastructure's job.

**Recommendation:** (a). Record base-path-aware reference resolution as a cross-cutting standard and note the Catalogue Data Provider's static-source location obeys it.

[Answer]: a — Own sub-path portability as a cross-cutting reference-resolution standard (all data/asset references are base-path aware); the Catalogue Data Provider locates the static catalogue artifact via that standard. Rationale: it is a system-wide rule inherited by every reference, which is precisely cross-cutting's role, and it satisfies FR-7/NFR-4 at the logical level without naming any base-path mechanism (deferred to infrastructure-design).

---

### Q6: Which conditional artifacts apply (persistence / APIs / events / external integrations)?

a) **None** of the conditional artifacts apply: there is no server persistence (orders persisted nowhere, OOS-2), no runtime API is exposed (the `/api` boundary is removed — FR-2/FR-10), the system is not event-driven, and there are no external runtime integrations in the deployed artifact.
b) Produce api-contracts.md to document the removed/legacy `/api`.
c) Produce data-models.md for the catalogue/order/cart entities.

**Trade Offs:** (a) is accurate to the post-refactor logical system: the deployed artifact is a self-contained client with no server surface, no event bus, and no external runtime dependency; client-only data (catalogue/cart) is local state, not owned persistence. (b) would document an API the intent explicitly removes — and api-contracts is for APIs the system *exposes*, which it no longer does. (c) data-models.md is for *persisted* domain entities; here the catalogue is a static read-only artifact and cart/order are transient client state, so a formal persistence model is not warranted — entities are instead captured via component "Owns" fields.

**Recommendation:** (a). Omit all four conditional artifacts and state the reason in `components.md` (per validation rule 2). Capture entity ownership through the "Owns" field of each component rather than a persistence data-model.

[Answer]: a — Produce none of the conditional artifacts (no data-models.md, api-contracts.md, event-catalog.md, or external-dependencies.md) and state the omission reasons explicitly in components.md per validation rule 2. Rationale: after the refactor the deployed system is a self-contained client — no exposed runtime API (FR-2/FR-10), no server persistence (OOS-2), not event-driven, and no external runtime integration; entity ownership (catalogue / cart / order) is recorded via each component's "Owns" field, which is the correct technology-agnostic treatment for static read-only data and transient client state.
