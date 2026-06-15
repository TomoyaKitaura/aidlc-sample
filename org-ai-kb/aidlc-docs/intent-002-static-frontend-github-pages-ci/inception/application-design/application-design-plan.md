# Application Design — Plan

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)
Input: inception/requirements-analysis/requirements.md
Upstream note: workflow intentionally skips user-stories/wireframes; FR-1…FR-10
are used as the story-equivalent mapping basis.

## Clarification outcome (auto-proceed)

All six clarifying questions answered with recommended answers (see
`application-design-questions.md`):
- Q1=a single Catalogue Data Provider (list-all + by-id), static-source backed
- Q2=a single Checkout / Order Simulation component (full client-side parity)
- Q3=a build-time catalogue-generation logical concern + static catalogue artifact
- Q4=reuse existing localStorage Cart unchanged (A-2)
- Q5=base-path-aware reference resolution as a cross-cutting standard
- Q6=no conditional artifacts (no persistence / API / events / external integrations)

## Logical components to design

- [x] **Catalogue Data Provider** — replaces the removed `/api/products` and
      `/api/products/:id` server access; client-side, reads the static catalogue
      artifact; exposes get-all-products and get-product-by-id (null on unknown,
      preserving not-found behaviour FR-3/FR-4). Owns: Product (catalogue).
- [x] **Checkout / Order Simulation** — ports the former server order domain to
      the client; calculate-total, generate-order-id, build-order (empty-cart
      guard), place-order (build + clear cart). Owns: Order. (FR-5/FR-6)
- [x] **Cart** — existing localStorage cart, reused unchanged (A-2); stateful;
      add / set-quantity / remove / line-items / total / count / is-empty / clear.
      Owns: Cart, CartItem.
- [x] **Build-Time Catalogue Generation** — logical (non-runtime) concern that
      derives the static catalogue artifact from the single authoritative
      catalogue source (FR-1/NFR-2); recorded for traceability, no tooling named.

## Artifacts to produce

Always-on:
- [x] `components.md` — the components above, each with Name / Purpose /
      Responsibilities / State / Owns; plus an explicit statement of which
      conditional artifacts are omitted and why (validation rule 2); plus the
      build-time generation concern at logical altitude.
- [x] `component-methods.md` — methods per component with logical
      inputs/outputs/preconditions/postconditions (every component appears here
      with >=1 method — validation rule 3).
- [x] `component-dependencies.md` — dependency matrix (Checkout→Cart,
      Catalogue→static artifact via cross-cutting standard, presentation flow
      Catalogue→Cart add); rationale per edge; no circular deps expected.
- [x] `services.md` — orchestrations: Browse-Catalogue, View-Product-Detail,
      Manage-Cart, Place-Order(simulated); each references components and maps to
      FR-equivalent ids (validation rule 4 + rule 5 coverage).
- [x] `cross-cutting.md` — error format (logical), authorisation model (none —
      guest-only, no server), logging taxonomy (client-side, logical),
      validation approach (edge/client), base-path-aware reference-resolution
      standard (FR-7/NFR-4), single-source-of-truth build concern (FR-1).

Conditional (to be OMITTED with reasons stated in components.md):
- [x] data-models.md — omitted (no owned persistence; static read-only catalogue
      + transient client state captured via component "Owns").
- [x] api-contracts.md — omitted (no runtime API exposed after `/api` removal).
- [x] event-catalog.md — omitted (not event-driven).
- [x] external-dependencies.md — omitted (no external runtime integration in the
      deployed artifact).

## Validation alignment (self-check during execution, not self-validation)

- [x] All four always-on artifacts + cross-cutting.md present and non-empty.
- [x] Every component appears in component-methods.md (>=1 method) and
      component-dependencies.md.
- [x] Every service references >=1 component.
- [x] Every FR (FR-1…FR-10) addressable by a component/service; CI-only FRs
      (FR-8/FR-9) flagged as deferred to infrastructure-design with rationale.
- [x] Omitted conditional artifacts justified in components.md.
- [x] No language/framework/infra/deployment specifics anywhere.

## Scope guardrails

- [x] No tooling, framework, runtime, or CI/Pages YAML named.
- [x] Server code retained-but-excluded recorded only as a logical boundary note,
      not redesigned.
- [x] Cart internals not re-litigated (A-2).
