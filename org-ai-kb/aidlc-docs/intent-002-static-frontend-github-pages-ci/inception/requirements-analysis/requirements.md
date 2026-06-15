# Requirements — intent-002-static-frontend-github-pages-ci

Source intent: `intent.md`
Clarified answers: `requirements-analysis-questions.md` (Q1–Q7, all confirmed clear)

This document is technology-agnostic on construction concerns. GitHub Pages and
GitHub Actions are named only because they are fixed, upstream-decided
constraints of this intent — not implementation choices deferred to later
phases. Concrete build tooling and the Actions YAML are out of scope here.

---

## 1. Intent summary

- **Type:** Feature (CI/CD pipeline) combined with a brownfield refactor of the
  existing frontend to make it fully static.
- **Scope:** Single unit `static-frontend`, operating on the existing `app/`
  codebase plus a new repository-root CI workflow.
- **Complexity:** Moderate. Three runtime `/api` calls are ported to client-side
  / static-data access, and a new build-and-publish CI pipeline is introduced.
- **Classification:** Brownfield. Modifies the existing `app/` application
  delivered by intent-001-sample-ec-site.
- **Affected repo:** `aidlc-sample` — the `app/` directory (frontend data-access
  and order logic) and a repository-root CI workflow.

The existing frontend (`app/public`) is plain HTML/CSS/JS whose data-access
layer (`app/public/js/api.js`) makes three calls to the Express backend:
`GET /api/products`, `GET /api/products/:id`, and `POST /api/orders`. The cart
already lives entirely in `localStorage` (`app/public/js/cart.js`). This intent
removes the runtime `/api` dependency, builds the frontend into a deployable
static bundle, and adds automated publish to GitHub Pages on every push to
`main`.

## 2. Functional requirements

Each requirement is verifiable as pass/fail.

- **FR-1 — Static catalogue source (single source of truth).** The build
  generates the static catalogue artifact (e.g. `products.json`) from the
  existing `app/src/data/products.js` at build time, so the catalogue remains
  defined in exactly one source file. Pass: the static catalogue is produced
  from `app/src/data/products.js` and no second hand-maintained copy of the
  catalogue data exists. (Q1c)

- **FR-2 — Catalogue retrieval.** The client retrieves the full catalogue from
  the static data file, preserving the existing async/`fetch` shape of
  `api.js` (only the URL changes to a relative/base-path-aware static path).
  Pass: the catalogue listing renders the six products from the static data
  source with no call to a `/api` endpoint at runtime. (Q1c)

- **FR-3 — Product-detail lookup.** A lookup by product id returns the matching
  product, and an unknown/missing id resolves to null/absent. Pass: a valid id
  shows the product detail; an unknown id resolves to null/absent. (Q2a)

- **FR-4 — Product-not-found state (no regression).** When the detail lookup
  resolves to null/absent for an unknown id, the detail page shows the existing
  "product not found" state. Pass: navigating to a detail URL for an unknown id
  displays the existing not-found message rather than erroring. (Q2a)

- **FR-5 — Client-side order stub (full parity).** On checkout the client-side
  order stub generates a unique order id, computes the order total, renders the
  same confirmation as today (order id + itemised items + total), and clears the
  cart on success. Nothing is persisted (no server). Pass: a successful checkout
  shows a confirmation containing a generated order id, the itemised items, and
  the total, and the cart is empty afterwards; no data is sent to or stored on a
  server. (Q3a)

- **FR-6 — Empty-cart guard.** Checkout with an empty cart is rejected
  client-side; no order id is generated and no confirmation is shown. Pass:
  attempting checkout with an empty cart does not produce an order confirmation.
  (Q3a)

- **FR-7 — Sub-path portability.** All asset, script, image, and catalogue-data
  references are relative or base-path aware so the deployed site functions when
  served from a GitHub Pages repository sub-path `/<repo>/`. Pass: every
  in-site reference resolves correctly when the site is hosted under a sub-path
  (no root-absolute `/...` reference that breaks under `/<repo>/`). (Q4a)

- **FR-8 — Automated CI trigger.** A GitHub Actions workflow builds and
  publishes the static site to GitHub Pages on every push to the `main` branch.
  Pass: a push to `main` triggers a workflow run that builds and (on success)
  publishes the static site. (intent.md)

- **FR-9 — Deploy-only-on-green build behaviour.** When the static build step
  fails on a push to `main`, the workflow fails and publishes nothing, leaving
  the previously published site intact. Pass: a failing build produces a failed
  workflow run with no deployment step executed; the live site is unchanged.
  (Q5a)

- **FR-10 — Deployed artifact boundary.** The published artifact contains only
  the built static frontend assets (HTML, CSS, client JS, images, catalogue
  data) and excludes server code, tests, and `node_modules`. Pass: the
  published output contains no Express server code, no `/api` route files, no
  test files, and no `node_modules`. (Q7a)

## 3. Non-functional requirements

Measurable where possible; categories with no measurable criterion state
"None identified".

- **NFR-1 — Deploy-only-on-green (reliability).** Measurable: no deploy occurs
  when the build exits non-zero — deploy runs in zero cases where the build
  fails, in all cases where the build succeeds on `main`. (Q5a)

- **NFR-2 — Single source of truth (maintainability).** Measurable: the
  catalogue is defined in exactly one source file (`app/src/data/products.js`);
  the static catalogue artifact is derived from it, so there is zero duplication
  of catalogue data. (Q1c)

- **NFR-3 — No regression on observable behaviour (correctness).** Measurable
  against current app behaviour: the product-detail not-found state and the
  checkout confirmation (order id + items + total + cart cleared) match the
  current `app/` behaviour exactly. (Q2a, Q3a)

- **NFR-4 — Portability.** Measurable: the site functions unchanged both at a
  domain root and under a repository sub-path `/<repo>/` — every reference
  resolves in both hosting contexts. (Q4a)

- **Performance:** None identified (no quantitative performance target stated in
  the intent or answers).

- **Security:** None identified (no server-side surface remains in the deployed
  artifact; no security target stated). The OWASP lens was explicitly not
  activated for this intent.

- **Scalability:** None identified (static hosting; no scalability target
  stated).

- **Usability/Accessibility:** None identified (no usability or accessibility
  target stated beyond no-regression, captured in NFR-3).

## 4. Assumptions

The following are flagged as assumptions, not facts.

- **A-1.** GitHub Pages serves this repository as a project site under a
  repository sub-path by default (basis for the FR-7 / NFR-4 portability
  requirement).
- **A-2.** The existing client cart in `localStorage` (`app/public/js/cart.js`)
  is reused unchanged; only the order/catalogue data-access changes.
- **A-3.** The existing order logic in `app/src/domain/order.js` (unique order
  id, total computation, empty-cart validation) can be ported to run on the
  client. (Q3a)
- **A-4.** The existing six-product catalogue in `app/src/data/products.js`
  remains the authoritative catalogue source; no catalogue content changes are
  introduced by this intent.

## 5. Out of scope

- **OOS-1.** Removing or deleting the Express server (`app/server.js`) and
  `/api` routes (`app/src/routes/api.js`). They are kept in the repository for
  local development and are merely excluded from the deployed artifact. (Q6a)
- **OOS-2.** Server-side persistence of orders — there is no server in the
  deployed static site, so orders are simulated client-side and persisted
  nowhere.
- **OOS-3.** Custom-domain or user/organization GitHub Pages configuration. The
  repository sub-path is the assumed deployment target. (Q4)
- **OOS-4.** Build-tool / tech-stack selection and the concrete GitHub Actions
  workflow YAML. These construction-phase decisions are deferred per
  inception-phase scope rules.
