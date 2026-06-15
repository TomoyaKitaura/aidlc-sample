# Infrastructure Design — Plan (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: infrastructure-design (construction)
Unit: static-frontend
State key: `infrastructure-design:static-frontend`

This plan produces the two required artifacts (`infrastructure-design.md`,
`deployment-architecture.md`) mapping the unit's logical components and the CI/CD
target onto concrete GitHub Pages + GitHub Actions infrastructure. Clarification
is complete (answers recorded in `infrastructure-design-questions.md`).

Upstream gap: nfr-assessment and nfr-design were skipped — no
`nfr-requirements.md` / `tech-stack-decisions.md`. Minimal NFR/tech context is
derived from `requirements.md` (FR-7..FR-10, NFR-1..NFR-4) and concrete
technology choices are recorded here as explicit decisions/assumptions (first
stage where concrete technology is named).

---

## Steps

### infrastructure-design.md

- [x] Map each runtime logical component from `components.md` (Catalogue Data Provider, Checkout / Order Simulation, Cart) to its concrete deployment substrate: static assets served by GitHub Pages CDN; record that they have no server-side runtime infrastructure.
- [x] Map the Build-Time Catalogue Generation logical concern to the concrete build step (Node 20 `require()` of `app/src/data/products.js` → serialized `products.json`), covering FR-1/NFR-2.
- [x] Add the CI/CD pipeline as an infrastructure entry: GitHub Actions runner (`ubuntu-latest`), `actions/setup-node` (Node 20), build job, deploy job.
- [x] Add the GitHub Pages hosting entry: first-party deployment model, `github-pages` environment, CDN delivery.
- [x] For each entry record Configuration, Networking, Security, Observability, Cost estimate, Rationale, and Platform assumptions (per SKILL.md output spec).
- [x] Record the retained-but-excluded Express server as a boundary note (in repo for local dev, excluded from artifact — FR-10/OOS-1/Q6).
- [x] Address each NFR with infrastructure implications: NFR-1 (deploy-only-on-green via `needs: build`), NFR-2 (single-source-of-truth generation), NFR-4 (relative reference resolution / sub-path portability — FR-7).
- [x] Record concrete technology decisions and platform assumptions explicitly (compensating for the skipped nfr-assessment) with $0 cost notes for free-tier GitHub Pages/Actions on a public repo.

### deployment-architecture.md

- [x] Describe the CI/CD topology: trigger `push` to `main` → `build` job → `deploy` job (`needs: build`) → GitHub Pages.
- [x] Detail the build steps: checkout, setup-node, install (if needed), generate `products.json` from `app/src/data/products.js`, assemble `dist/` (allowlist `app/public/*` + `products.json`, normalize root-absolute references to relative), `configure-pages`, `upload-pages-artifact` (upload `dist/`).
- [x] Detail the deploy step: `deploy-pages` to the `github-pages` environment, gated on build success.
- [x] Document the deploy mechanism and FR-9/NFR-1 guarantee (deploy job unreachable on build failure; previously published site untouched).
- [x] Document least-privilege permissions: default `contents: read`; deploy job `pages: write` + `id-token: write`; pinned action versions; `concurrency` group; no secrets in bundle.
- [x] Document the environment strategy: single `github-pages` production environment; dev/staging parity N/A.
- [x] Document scaling, failover/recovery: CDN-served static site (no app scaling); recovery = re-run workflow / Pages keeps last good deploy (maps to no formal RTO/RPO; gap noted since none defined upstream).
- [x] Document the deployed-artifact boundary (FR-10): explicit `dist/` allowlist excludes server code, `/api` routes, tests, `node_modules`.
- [x] Document inter-unit connectivity: none — `static-frontend` is the sole unit, self-contained client with no runtime API (consistent with omitted `external-dependencies.md` and absent `units-of-work-dependency.md`).
- [x] Document the IaC approach: the committed workflow YAML at repo root (`.github/workflows/`) is the unit's infrastructure-as-code; no Terraform/CDK; describe the single-stack boundary (one workflow file + repo Pages setting).

### State

- [x] Add a NEW row `infrastructure-design:static-frontend` to `intent-state.md` and set `execution: complete` with the two artifact filenames after execution.
