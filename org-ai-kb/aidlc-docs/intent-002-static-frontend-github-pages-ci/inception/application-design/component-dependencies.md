# Application Design — Component Dependencies

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)

Dependencies are described at the logical level. All inter-component
communication in this system is synchronous, direct in-process invocation
(request/response). There is no asynchronous messaging and no shared mutable
state between components.

The Build-Time Catalogue Generation concern is a non-runtime concern; its
relationship to the runtime components is the production of the static catalogue
artifact, captured in the matrix below as a logical artifact dependency rather
than a runtime call.

---

## Dependency matrix

| From | To | Pattern | Rationale |
|---|---|---|---|
| Checkout / Order Simulation | Cart | Synchronous call | At checkout, Checkout reads the current cart line items to build the order and, on success, invokes the Cart's clear operation. (FR-5) |
| Catalogue Data Provider | Static catalogue artifact (produced by Build-Time Catalogue Generation) | Read of build-time artifact | The provider reads the read-only static catalogue artifact at runtime, locating it via the cross-cutting base-path-aware reference-resolution standard. This is a logical artifact dependency, not a runtime call to another component. (FR-1, FR-2, FR-7) |
| Catalogue Data Provider | Cross-cutting reference-resolution standard | Standard inheritance | The provider resolves the static catalogue artifact location through the system-wide base-path-aware reference-resolution standard so it works under any hosting sub-path. (FR-7, NFR-4) |

Note on the presentation/browse flow (Catalogue → Cart add): when a user adds a
product to the cart from a catalogue or detail view, the add originates from the
presentation layer driven by a service orchestration (see `services.md`), not
from a direct Catalogue-Data-Provider-to-Cart call. The Catalogue Data Provider
supplies product data; the service routes the user's add action to the Cart's
`add-item`. There is therefore no direct Catalogue Data Provider → Cart
dependency in the component matrix.

---

## Circular dependencies

None. The dependency graph is acyclic:

- Checkout / Order Simulation → Cart (one direction only; Cart does not depend on
  Checkout).
- Catalogue Data Provider → static catalogue artifact / reference-resolution
  standard (no component depends back on the Catalogue Data Provider).

No circular dependencies exist, so none require justification.
