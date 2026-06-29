# Workflow Rationale — intent-003-product-search-filter

Composition for adding client-side product search and price filtering to the existing EC site (`app/`). One logical unit: `product-listing`. No lenses active.

## Inception phase

- **reverse-engineering** — Skipped. RE-kb is unhydrated, but the affected surface is a handful of small, directly readable files (`products.js`, `api.js`, `app/public/js/`, the listing page); per Q4 downstream skills read `app/` directly. RE-kb remains an unhydrated known gap.
- **requirements-analysis** — Included (always-on). Captures the search/filter behaviour, acceptance criteria, and the client-side-only scope (Q1) with search-by-name plus price-range filtering over existing fields only (Q5).
- **user-stories** — Skipped. Single-actor (shopper), low-novelty extension of an existing listing page; requirements analysis and functional design cover the behaviour (Q2). Matches the "small feature add to an existing service" pattern.
- **wireframes** — Included. The human wants a visual contract for the new UI controls (search box, price-range control) and result states (no-match / empty-result) before coding (Q3).
- **application-design** — Skipped. Client-side-only implementation reuses existing component boundaries with no API/contract change (Q1), so there are no component seams to design.
- **units-generation** — Skipped. The change touches one logical unit (`product-listing`); there is nothing to fan out.

## Construction phase (unit: product-listing)

- **functional-design** — Included, `--unit product-listing` (single pass; one unit). Captures the real domain logic of the matching/filtering rules (keyword match, price-range narrowing, combined search+filter, empty-result handling).
- **nfr-assessment** — Skipped. No NFR shift; the catalogue is tiny and fixed, the feature is client-side, and existing non-functional characteristics are inherited.
- **nfr-design** — Skipped. No NFR changes to design for (follows from nfr-assessment being skipped).
- **infrastructure-design** — Skipped. No infrastructure change; the feature ships within the existing server-served and static GitHub Pages deployments established by intent-002.
- **code-generation** — Included (always-on), `--unit product-listing`. Implements the search box, price filter, and result rendering against the existing listing page.
- **build-and-test** — Included (always-on), `--phase construction` (single-pass; not per-unit). Validates the implemented behaviour.

## Lenses

- **owasp** — Deactivated. Default-on, but the human chose to deactivate it for this intent (Q6). The feature is a public, unauthenticated product catalogue with no PII or financial data. Standard XSS / output-encoding hygiene for the search input is still expected to be handled in functional design and code generation as ordinary correctness, but no formal OWASP lens is injected — recorded as a known gap.
