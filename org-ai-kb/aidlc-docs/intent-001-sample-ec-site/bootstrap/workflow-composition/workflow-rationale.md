# Workflow Composition Rationale

Intent: intent-001-sample-ec-site — greenfield, minimal sample EC site (product listing, product detail, cart, checkout/order). No existing repos or integration targets. Human explicitly chose the shortest path: requirements analysis -> code generation -> build and test, single unit, OWASP lens off.

## Inception phase

- **requirements-analysis** — INCLUDED. Always-on; captures the four core capabilities (catalogue, product detail, cart, checkout/order) as the contract for downstream construction.
- **reverse-engineering** — SKIPPED. Greenfield with no existing repos and no integration targets, so there is nothing to reverse-engineer.
- **user-stories** — SKIPPED. Human chose the shortest path; the requirements doc captures the behaviour directly for this minimal sample.
- **wireframes** — SKIPPED. UI screens are implied by the requirements; no separate screen-data mapping warranted for a minimal sample (Q2=b).
- **application-design** — SKIPPED. Single component, no orchestration across units; component boundaries are trivial for this sample (Q4=d).
- **units-generation** — SKIPPED. Single deployable unit (Q1=a); there is nothing to fan out.

## Construction phase (single unit: sample-ec-site)

- **functional-design** — SKIPPED. Human chose the shortest path; business logic for a basic shopping flow is captured by requirements, with no separate domain model needed (Q3/Q4). Per composition rule 5, the orchestrator may insert it mid-flight if a real ambiguity surfaces during code generation.
- **nfr-assessment** — SKIPPED. Minimal sample with default NFRs; no NFR shift to assess (Q3=c).
- **nfr-design** — SKIPPED. No NFR design depth requested for a sample (Q3=c).
- **infrastructure-design** — SKIPPED. Sample/demo with no specific deployment or infra requirements (Q3=c).
- **code-generation** — INCLUDED. Always-on; produces the EC site implementation for the single unit `sample-ec-site` (per-unit skill collapsed into one pass since there is one unit).
- **build-and-test** — INCLUDED. Always-on; the human explicitly asked for a test stage. NOTE: `aidlc-build-and-test` is marked 🚧 (not yet implemented) in CATALOGUE.md — no SKILL.md folder exists in this distribution. It is listed here to honour intent, but when execution reaches this line the stage will need to be implemented/added first, or skipped if still unavailable.

## Lenses

- **owasp** — DEACTIVATED. Default activation is true, but the human explicitly opted out for this shortest-path sample (Q5=b). Data is sample-only with simulated checkout and no real PII/payment data; guest-only checkout, no accounts. The `## Active Lenses` table therefore has no rows.
