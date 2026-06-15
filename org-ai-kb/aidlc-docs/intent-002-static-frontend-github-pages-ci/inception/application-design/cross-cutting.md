# Application Design — Cross-Cutting Standards

Intent: intent-002-static-frontend-github-pages-ci
Stage: application-design (inception, technology-agnostic)

System-wide standards that every component and service inherits. All standards
are described at the logical level — no mechanism, framework, or vendor is named.

---

## Error format

The deployed system is a self-contained client with no runtime API; errors are
not transported over a wire protocol. At the logical level, an error/failure
outcome from any component method or service carries:

- **Outcome kind** — success or failure.
- **Failure category** — one of: not-found (a requested entity does not exist),
  invalid-input (a precondition was violated), and empty-cart (checkout attempted
  with no items).
- **Message** — a human-readable description suitable for the existing
  user-facing states.

Conventions:

- An unknown product identifier is *not* an error: `get-product-by-id` resolves
  to null/absent, and the View Product Detail service renders the existing
  not-found state (FR-3, FR-4). The not-found *category* above applies to logical
  failure reporting, not to this expected lookup outcome.
- The empty-cart guard surfaces the empty-cart failure category to the Place Order
  workflow, which suppresses the confirmation (FR-6).

## Authorisation model

None. The deployed system is guest-only with no accounts, no roles, and no
server-side surface. There is no authentication or authorisation boundary in the
runtime artifact. (Security: none identified — NFR section of `requirements.md`;
the OWASP lens was not activated for this intent.)

## Logging taxonomy

Logging is client-side and logical only (no log sink, transport, or format is
specified). The taxonomy of loggable events:

- **catalogue.load** — the catalogue was loaded from the static artifact;
  severity info; failure to resolve the artifact is severity error.
- **product.lookup.miss** — a by-id lookup resolved to not-found; severity info
  (expected behaviour driving the not-found state).
- **cart.change** — an add / set-quantity / remove / clear occurred; severity
  info.
- **checkout.rejected.empty-cart** — checkout was rejected due to an empty cart;
  severity warning.
- **checkout.success** — an order was simulated successfully; severity info.

Severity levels used: info, warning, error.

## Validation approach

Input validation happens at the edge (the service/presentation boundary) before
component invocation, and component methods additionally enforce their own
preconditions (defence in depth):

- Service/edge level: validate user-supplied identifiers and quantities before
  calling components.
- Component level: each method enforces its stated preconditions
  (`component-methods.md`) — notably the empty-cart guard in `build-order` /
  `place-order` (FR-6) and non-negative quantity in Cart operations.

## Reference-resolution standard (sub-path portability)

All data, asset, script, image, and catalogue-data references are **base-path
aware** so the system functions correctly both at a domain root and under a
repository sub-path (FR-7, NFR-4). No reference is root-absolute in a way that
breaks under a sub-path.

- The Catalogue Data Provider locates the static catalogue artifact through this
  standard.
- This standard records the portability requirement at the logical level; the
  concrete base-path mechanism is deferred to infrastructure-design (OOS-4).

## Single-source-of-truth catalogue standard

The catalogue is defined in exactly one authoritative source (FR-1, NFR-2). The
static catalogue artifact consumed at runtime is derived from that single source
by the Build-Time Catalogue Generation concern (`components.md`); no second,
hand-maintained copy of the catalogue data exists. This standard constrains the
design at the logical level; the build tooling that performs the derivation is
deferred to infrastructure-design (OOS-4).
