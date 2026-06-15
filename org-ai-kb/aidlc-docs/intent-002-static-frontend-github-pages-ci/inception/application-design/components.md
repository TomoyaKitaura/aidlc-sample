# Application Design — Components

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)

This document describes the logical component structure of the post-refactor
system: a self-contained client application that retrieves its catalogue from a
build-time-generated static catalogue artifact and simulates checkout entirely
on the client, with no runtime server surface.

Upstream note: this intent's approved workflow intentionally skips the
user-stories and wireframes skills, so `stories.md`, `personas.md`, and
`screen-data-map.md` do not exist. The functional requirements (FR-1 … FR-10)
in `requirements.md` are used as the story-equivalent mapping basis for
`services.md` and for coverage tracing.

---

## Component: Catalogue Data Provider

- **Purpose** — Provides read access to the product catalogue for the client
  application, replacing the former server catalogue access (`/api/products` and
  `/api/products/:id`) with self-contained client-side retrieval from a static
  catalogue artifact. (FR-2, FR-3)
- **Responsibilities**
  - Retrieve the full product catalogue from the static catalogue artifact.
  - Look up a single product by its identifier, resolving to null/absent when the
    identifier is unknown (preserving the existing not-found semantics — FR-3,
    FR-4).
  - Locate the static catalogue artifact through the cross-cutting base-path-aware
    reference-resolution standard so retrieval works under any hosting sub-path
    (FR-7, NFR-4).
- **State** — Stateless. Holds no mutable state of its own; it reads from the
  static catalogue artifact, which is an immutable, read-only input at runtime.
- **Owns** — Product (the catalogue entry: the authoritative read-only catalogue
  data as exposed at runtime, derived at build time from the single authoritative
  catalogue source — FR-1, NFR-2).

## Component: Checkout / Order Simulation

- **Purpose** — Simulates order placement entirely on the client, porting the
  former server order domain so that checkout produces the same observable
  outcome as before with no server involvement. (FR-5, FR-6, NFR-3)
- **Responsibilities**
  - Compute the order total from the current cart line items.
  - Generate a unique order identifier.
  - Build an order from the current cart, rejecting an empty cart (empty-cart
    guard — FR-6).
  - Place an order: build the order and, on success, clear the cart. Persist
    nothing (no server — OOS-2).
  - Produce the confirmation content (order identifier, itemised items, total)
    that matches current behaviour (NFR-3).
- **State** — Stateless. Each order is computed from the cart supplied at
  invocation; no order is retained after placement (nothing is persisted).
- **Owns** — Order (the simulated, transient order produced at checkout time; it
  is the authoritative source of order identity, total, and confirmation content
  for the lifetime of a single checkout).

## Component: Cart

- **Purpose** — Maintains the user's shopping cart as persisted client-side
  state. Reused unchanged by this intent (assumption A-2); included here so the
  dependency picture is complete.
- **Responsibilities**
  - Add a product to the cart.
  - Set the quantity of a cart line item.
  - Remove a line item from the cart.
  - Expose the current line items, total, item count, and whether the cart is
    empty.
  - Clear the cart.
- **State** — Stateful. Holds the cart contents persistently on the client across
  sessions.
- **Owns** — Cart and CartItem (the persisted client-side cart aggregate and its
  line items; authoritative source of cart contents).
- **Change scope** — Out of scope for change in this intent (A-2). Documented as
  an unchanged dependency; its internals are not re-designed here.

## Logical Concern: Build-Time Catalogue Generation

This is a logical, non-runtime design concern, not a runtime component, so it is
recorded here for traceability rather than in `component-methods.md` or
`component-dependencies.md`.

- **Purpose** — Derives the static catalogue artifact from the single
  authoritative catalogue source at build time, so the catalogue is defined in
  exactly one place and the runtime client consumes a generated read-only copy
  (FR-1, NFR-2).
- **Inputs** — The single authoritative catalogue source (the existing catalogue
  data file).
- **Outputs** — The static catalogue artifact consumed at runtime by the
  Catalogue Data Provider.
- **Altitude note** — This concern records the single-source-of-truth constraint
  at the logical level only. The build tooling, the build-and-publish pipeline,
  and any deploy-only-on-green behaviour (FR-8, FR-9, NFR-1) are deferred to
  infrastructure-design and are intentionally not modelled here.

---

## Boundary note: retained-but-excluded server

The existing server and `/api` routes are retained in the repository for local
development but excluded from the deployed artifact (OOS-1, FR-10). At the
logical level of this design, the deployed system has no server component and no
runtime API surface. The retained server is recorded only as a logical boundary
note and is not part of this component model and not re-designed here.

---

## Conditional artifacts — omitted (validation rule 2)

All four conditional artifacts are intentionally omitted. The post-refactor
deployed system is a self-contained client with no server surface.

- **data-models.md — OMITTED.** There is no owned runtime persistence to model.
  The catalogue is a static, read-only artifact (generated at build time), and
  the cart and order are transient client state. Entity ownership (Product, Cart,
  CartItem, Order) is captured through each component's **Owns** field above,
  which is the correct technology-agnostic treatment for static read-only data
  and transient client state. (OOS-2)
- **api-contracts.md — OMITTED.** The system exposes no runtime API after the
  `/api` boundary is removed (FR-2, FR-10). `api-contracts.md` documents APIs the
  system *exposes*; there are none. The legacy `/api` is being removed from the
  runtime path, not documented as a current contract.
- **event-catalog.md — OMITTED.** The system is not event-driven. There is no
  event bus, no asynchronous message flow, and no events produced or consumed
  between components; all component interaction is direct synchronous in-process
  invocation.
- **external-dependencies.md — OMITTED.** The deployed artifact has no external
  runtime integration. It is a self-contained client that reads only its own
  bundled static catalogue artifact; there is no external system it calls at
  runtime.

---

## Functional-requirement coverage note

Every functional requirement is addressable by a component or service in this
design except the two CI/pipeline requirements, which are out of altitude for
inception application-design:

- **FR-8 (automated CI trigger) and FR-9 (deploy-only-on-green)** — Flagged as
  deferred to infrastructure-design. These describe the build-and-publish
  pipeline behaviour, which is a construction/infrastructure concern (OOS-4);
  this stage models logical runtime behaviour only. They are not unmapped by
  oversight — they are intentionally out of scope for the application-design
  altitude.

All remaining FRs (FR-1 … FR-7, FR-10) are traced to components and services
(see `services.md`).
