# Requirements Analysis — Plan

Intent: intent-002-static-frontend-github-pages-ci
Step: planning
Artifact to produce: `requirements.md`

This plan describes how `requirements.md` will be assembled from the intent
(`intent.md`) and the seven clarified answers in
`requirements-analysis-questions.md`. It is technology-agnostic on construction
concerns where the validation-spec permits; GitHub Pages / GitHub Actions are
named only because they are fixed, upstream-decided constraints of this intent,
not implementation choices to be made later.

## Source inputs

- [x] Intent statement (`intent.md`): static-build the `app/` frontend, publish
      to GitHub Pages, automate via GitHub Actions on push to `main`, and remove
      the runtime `/api` dependency by making the frontend fully static.
- [x] Clarified answers Q1–Q7 (all confirmed clear, no follow-up needed).

## Section 1: Intent summary

- [x] Type: feature (CI/CD pipeline) + brownfield refactor.
- [x] Scope: single unit `static-frontend` within the existing `app/` codebase.
- [x] Complexity: moderate (client-side port of three `/api` calls + new CI).
- [x] Classification: brownfield — modifies existing `app/` (intent-001).
- [x] Affected repo: `aidlc-sample` (the `app/` directory and repo-root CI).

## Section 2: Functional requirements (FR-<n>, each pass/fail)

- [x] FR for static catalogue source: build-time generation of `products.json`
      from `app/src/data/products.js` as the single source of truth (Q1c).
- [x] FR for catalogue retrieval: client fetches catalogue from the static data
      file, preserving the existing async/`fetch` shape of `api.js` (Q1c).
- [x] FR for product-detail lookup: unknown/missing id resolves to null/absent
      and the detail page shows the existing "not found" state (Q2a — no regression).
- [x] FR for client-side order stub: generate a unique order id, compute the
      total, render the same confirmation (order id + items + total), and clear
      the cart on success; persist nothing (Q3a).
- [x] FR for empty-cart guard: checkout with an empty cart is rejected client-side (Q3a).
- [x] FR for sub-path portability: all asset/data references are relative or
      base-path aware so the site works under a GitHub Pages repo sub-path
      `/<repo>/` (Q4a).
- [x] FR for CI trigger: a GitHub Actions workflow builds and publishes the
      static site on every push to `main` (intent.md).
- [x] FR for build-failure behaviour: a failed build fails the workflow and
      publishes nothing, leaving the previously published site intact (Q5a).
- [x] FR for deployed artifact contents: only built static frontend assets
      (HTML, CSS, client JS, images, catalogue data) are published; server code,
      tests, and `node_modules` are excluded (Q7a).
- [x] Each FR phrased as a verifiable pass/fail statement, numbered FR-1..FR-n.

## Section 3: Non-functional requirements (measurable where possible)

- [x] Deploy-only-on-green: published site is replaced only by a successful build
      (derived from Q5a) — measurable as "no deploy occurs when build exits non-zero".
- [x] Single-source-of-truth: zero duplication of catalogue data between
      `app/src/data/products.js` and the static artifact (Q1c) — measurable as
      "catalogue defined in exactly one source file".
- [x] No-regression on observable behaviour: detail not-found and checkout
      confirmation match current app behaviour (Q2a, Q3a).
- [x] Portability: site functions unchanged at domain root and at a repo
      sub-path (Q4a).
- [x] State "None identified" for any NFR category with no measurable criterion
      rather than emitting a vague statement.

## Section 4: Assumptions (flagged as assumptions)

- [x] GitHub Pages serves this as a project site under a repo sub-path by default
      (basis for Q4a), flagged as an assumption.
- [x] The existing client cart in `localStorage` (`app/public/js/cart.js`) is
      reused unchanged; only the order/catalogue data-access changes.
- [x] Order logic in `app/src/domain/order.js` can be ported to the client (Q3a).
- [x] Any further assumptions discovered during drafting are flagged, not stated
      as facts.

## Section 5: Out of scope (explicit exclusions)

- [x] Removing/deleting the Express server and `/api` routes — kept in repo for
      local dev, merely excluded from the deployed artifact (Q6a).
- [x] Server-side persistence of orders (there is no server in the deployed site).
- [x] Custom-domain / user-or-org GitHub Pages configuration (sub-path is the
      assumed target; Q4).
- [x] Tech-stack / build-tool selection and concrete Actions YAML — deferred to
      construction per inception-phase scope rules.

## Coverage check (validation-spec)

- [x] Every capability in the intent (static build, /api removal/static-isation,
      GitHub Pages publish, CI on push to main) maps to at least one FR/NFR.
- [x] All five mandatory sections present; empty ones state "None identified".
- [x] FRs numbered `FR-<n>` and verifiable; NFRs measurable where possible.
- [x] Assumptions explicitly flagged.

## State

- [x] On approval: planning:awaiting-human → planning:approved → execution:pending
      (orchestrator/next invocation), then produce `requirements.md`.
