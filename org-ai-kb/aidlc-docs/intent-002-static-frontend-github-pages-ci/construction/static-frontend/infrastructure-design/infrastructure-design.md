# Infrastructure Design — static-frontend

Intent: intent-002-static-frontend-github-pages-ci
Stage: infrastructure-design (construction)
Unit: static-frontend
State key: `infrastructure-design:static-frontend`

This document maps the unit's logical components (from `components.md`) and its
build/publish concern onto concrete infrastructure: GitHub Pages for hosting and
GitHub Actions for the build-and-publish pipeline. Companion topology and
pipeline detail live in `deployment-architecture.md`.

---

## Upstream gap — recorded technology decisions

The approved workflow for this intent intentionally **skipped nfr-assessment and
nfr-design**, so `nfr-requirements.md`, `tech-stack-decisions.md`,
`nfr-design-patterns.md`, and `logical-components.md` do not exist. Per builder
protocol rule 5, the minimal NFR/tech context is derived directly from
`requirements.md` (FR-1..FR-10, NFR-1..NFR-4) and the answered clarification file
(`infrastructure-design-questions.md`). This is the first stage at which concrete
technology is named, so the choices below are recorded **explicitly here as the
authoritative technology decisions** (compensating for the absent
`tech-stack-decisions.md`). Downstream validation should treat this section as the
tech-stack source of record for this unit.

| Decision | Choice | Source |
|---|---|---|
| TD-1 Hosting platform | GitHub Pages, first-party Actions deployment model | Q1a; fixed upstream (intent.md, A-1, OOS-3) |
| TD-2 CI/CD topology | Single workflow, two jobs: `build` → `deploy` (`needs: build`) | Q2a; FR-8, FR-9, NFR-1 |
| TD-3 Build runtime | Node.js 20 LTS via `actions/setup-node`, reusing CommonJS `app/src/data/products.js`; no bundler | Q3a; FR-1, NFR-2 |
| TD-4 Sub-path portability | Relative (base-path-aware) references; generation step normalizes the one root-absolute image path | Q4a; FR-7, NFR-4 |
| TD-5 Artifact boundary | Allowlist-assembled `dist/` (only `app/public/*` + generated `products.json`); upload only `dist/` | Q5a; FR-10 |
| TD-6 Pipeline hygiene | Least-privilege per job; pinned actions; `concurrency` group; no secrets in bundle | Q6a |
| TD-7 Environment + IaC | Single `github-pages` (production) environment; committed workflow YAML is the IaC; no Terraform/CDK | Q7a |

---

## NFR coverage (infrastructure implications)

Because `nfr-requirements.md` is absent, the NFRs with infrastructure
implications are taken from `requirements.md`. Each is addressed by a concrete
mechanism below or in `deployment-architecture.md`.

| NFR | Infrastructure mechanism | Where |
|---|---|---|
| NFR-1 Deploy-only-on-green (reliability) | `deploy` job declares `needs: build`; on a non-zero build the deploy job is skipped, nothing is uploaded/published, last good Pages deployment is retained | This doc (CI/CD Pipeline entry) + deployment-architecture (Deploy gating) |
| NFR-2 Single source of truth (maintainability) | Build step `require()`s `app/src/data/products.js` and serializes to `products.json`; no second catalogue copy is committed or hand-maintained | This doc (Build-Time Catalogue Generation entry) |
| NFR-3 No regression (correctness) | Pure static port — no infra rewrite of behaviour; Pages serves the same `app/public` HTML/CSS/JS unchanged plus generated `products.json` | This doc (runtime component entries) |
| NFR-4 Portability (root + `/<repo>/`) | Relative references throughout; generation step normalizes `/images/placeholder.svg` → relative; no build-time repo-name input required | This doc (Catalogue Data Provider + Build entries) |

Performance, Security, Scalability, Usability: "None identified" upstream
(`requirements.md` §3). For a CDN-served static site there are no compute,
storage, messaging, or autoscaling resources to size; this is noted explicitly
rather than left as an unaddressed gap.

---

## Component → infrastructure mapping

### Catalogue Data Provider (runtime, client-side)

- **Infrastructure service** — None of its own. Ships as static client JavaScript
  served by **GitHub Pages CDN**; executes in the visitor's browser. At runtime it
  fetches the generated `products.json` (also served by Pages) via a relative,
  base-path-aware URL.
- **Configuration** — No server-side configuration. Resolves `products.json`
  relative to the document base (no leading `/`), so it works at both domain root
  and `/<repo>/` (FR-7, NFR-4). The catalogue is the build-generated `products.json`
  (six products, FR-2).
- **Networking** — Public, read-only over HTTPS via the Pages CDN. No origin
  server, no `/api` endpoint at runtime (the legacy `GET /api/products[/:id]` calls
  are removed — FR-2).
- **Security** — Public static content; no authentication or authorisation
  (guest-only — `cross-cutting.md` authorisation model: none). HTTPS in transit
  provided by GitHub Pages. No secrets; nothing sensitive in the catalogue.
- **Observability** — None server-side. Client-side logging is logical only
  (`cross-cutting.md` taxonomy: `catalogue.load`, `product.lookup.miss`). No infra
  log sink is provisioned.
- **Cost estimate** — **$0/month.** Served from GitHub Pages free tier (public
  repo). No per-request or egress charge within Pages soft limits (~100 GB/month
  bandwidth, well above the expected sample-site load — no quantitative load target
  is stated upstream).
- **Rationale** — A static client reading a generated JSON artifact is the minimal
  realisation of FR-2/FR-3 with no runtime backend (TD-1, TD-3). Reference: TD-1,
  TD-4.
- **Platform assumptions** — GitHub Pages is enabled for the repo with source set
  to "GitHub Actions"; the repo is public (free Pages); the site is served under a
  project sub-path `/<repo>/` (A-1, OOS-3).

### Checkout / Order Simulation (runtime, client-side)

- **Infrastructure service** — None of its own. Static client JavaScript served by
  GitHub Pages CDN; runs entirely in the browser (ported from server order domain —
  FR-5, A-3).
- **Configuration** — No infra configuration. Computes total, generates a unique
  order id, enforces the empty-cart guard (FR-6), renders confirmation, clears the
  cart on success. Persists nothing (OOS-2).
- **Networking** — None at runtime. No `POST /api/orders` call (removed); no
  outbound network for checkout.
- **Security** — Public static code, no server surface, no persistence, no secrets.
- **Observability** — Client-side logical logging only
  (`checkout.success`, `checkout.rejected.empty-cart` — `cross-cutting.md`). No
  infra sink.
- **Cost estimate** — **$0/month** (part of the same Pages-served bundle).
- **Rationale** — Client-side simulation removes the only remaining server write
  path, completing the "no runtime server surface" goal (TD-1).
- **Platform assumptions** — Same Pages assumptions as above; browser
  `localStorage` available for the Cart dependency.

### Cart (runtime, client-side; unchanged — A-2)

- **Infrastructure service** — None of its own. Static client JavaScript
  (`app/public/js/cart.js`) served by GitHub Pages CDN; state persisted in browser
  `localStorage` (A-2). Reused unchanged.
- **Configuration** — No infra configuration. Persists cart contents client-side
  across sessions.
- **Networking** — None. Local browser storage only.
- **Security** — Public static code; cart data stays on the client device; no
  secrets.
- **Observability** — Client-side logical logging only (`cart.change`).
- **Cost estimate** — **$0/month** (part of the Pages bundle).
- **Rationale** — Out of scope for change (A-2); included so the deployment picture
  is complete. No infra of its own.
- **Platform assumptions** — Browser `localStorage` available; same Pages
  assumptions.

### Build-Time Catalogue Generation (build-time concern)

- **Infrastructure service** — A step in the **GitHub Actions `build` job** running
  on an `ubuntu-latest` runner with **Node.js 20** (`actions/setup-node`). It
  `require()`s `app/src/data/products.js` (CommonJS, `package.json` `type:
  "commonjs"`, `engines.node >=18`) and serializes the catalogue array to
  `dist/products.json`.
- **Configuration** — Node 20 LTS. Generation step reads the single authoritative
  source (`app/src/data/products.js`) and emits `products.json` (FR-1, NFR-2). It
  also **normalizes the root-absolute image path** in the data
  (`PLACEHOLDER_IMAGE = '/images/placeholder.svg'`) to a relative form so the
  emitted catalogue is sub-path portable (FR-7, NFR-4). No bundler, no transpile
  (TD-3).
- **Networking** — Runner-internal only during build; produces a file. No network
  dependency beyond fetching the pinned actions and Node toolchain.
- **Security** — Runs under the `build` job's **`contents: read`** token only
  (least privilege — TD-6); no write scope, no secrets consumed.
- **Observability** — Standard GitHub Actions build logs and run history (per-step
  logs, success/failure status, retained per repo Actions log retention).
- **Cost estimate** — **$0/month.** GitHub Actions minutes are free for public
  repos; a single short Node build per push to `main` is well within free
  allowances.
- **Rationale** — Reusing the existing CommonJS catalogue module keeps the
  catalogue single-source (FR-1/NFR-2) with the least machinery; no bundler is
  needed because `app/public` is already plain static assets (TD-3).
- **Platform assumptions** — `app/src/data/products.js` remains the authoritative
  catalogue source (A-4); Node 20 is available via `actions/setup-node`; the
  runner can `require()` the CommonJS module without extra dependencies (no
  `npm install` required for generation, since the module has no runtime deps).

### CI/CD Pipeline (GitHub Actions)

- **Infrastructure service** — **GitHub Actions**, one workflow at repo root
  (`.github/workflows/`), `ubuntu-latest` runner. Two jobs: `build` (checkout,
  setup-node, generate `products.json`, assemble `dist/`, `configure-pages`,
  `upload-pages-artifact`) and `deploy` (`deploy-pages`, `needs: build`).
- **Configuration**
  - Trigger: `push` to `main` (FR-8); optional `workflow_dispatch` for manual
    re-runs is permissible but not required.
  - `build` job permissions: workflow default **`contents: read`**.
  - `deploy` job permissions: adds **`pages: write`** and **`id-token: write`**
    (OIDC handoff for `deploy-pages`).
  - `concurrency` group (e.g. `group: pages`) so overlapping pushes do not produce
    clobbering deploys; serializes Pages publishes (TD-6).
  - All actions **pinned** (released major version or SHA): `actions/checkout`,
    `actions/setup-node`, `actions/configure-pages`,
    `actions/upload-pages-artifact`, `actions/deploy-pages`.
- **Networking** — Runner fetches pinned actions and Node from GitHub; uploads the
  Pages artifact to GitHub's Pages artifact store; `deploy-pages` publishes to the
  Pages CDN. No inbound exposure.
- **Security** — Least privilege per job (TD-6): the build job can only read the
  repo; only the deploy job holds the Pages write + OIDC id-token. No long-lived
  tokens, no third-party deploy action, no secrets baked into the artifact (the
  site is fully static). Pinned actions reduce supply-chain drift.
- **Observability** — GitHub Actions run history (per-run, per-job, per-step
  status and logs); the `github-pages` environment records deployment history.
- **Cost estimate** — **$0/month.** Actions minutes free on public repos.
- **Rationale** — The two-job `needs: build` topology is the canonical GitHub
  Pages pattern and structurally enforces deploy-only-on-green (FR-9/NFR-1) while
  isolating elevated permissions to the deploy job (TD-2, TD-6).
- **Platform assumptions** — Repo Actions enabled; Pages source set to "GitHub
  Actions"; default branch is `main`; repo is public (free Actions + Pages).

### GitHub Pages hosting (deploy target)

- **Infrastructure service** — **GitHub Pages** (first-party deployment model),
  published via `actions/deploy-pages` to the **`github-pages` environment**.
  Content delivered over GitHub's Pages **CDN** (Fastly-backed) over HTTPS.
- **Configuration** — Pages source = "GitHub Actions" (not legacy branch publish).
  Project site served under the repository sub-path `/<repo>/` (A-1, OOS-3). The
  published artifact is exactly the uploaded `dist/`.
- **Networking** — Public read-only HTTPS via the Pages CDN; no origin compute.
  GitHub provides the TLS certificate for the `*.github.io` domain (no custom
  domain — OOS-3).
- **Security** — HTTPS enforced by Pages; public content; no auth. The
  `github-pages` environment provides an audit trail and optional protection rules
  (e.g. limit which branches can deploy).
- **Observability** — `github-pages` environment deployment history (who/when/which
  commit), plus the workflow run logs.
- **Cost estimate** — **$0/month** on the free tier for public repos (within Pages
  soft limits: ~1 GB published size, ~100 GB/month bandwidth — far above the
  expected static sample-site load; no quantitative load target stated upstream).
- **Rationale** — GitHub Pages is the fixed upstream hosting constraint (TD-1); the
  first-party model needs no third-party action or long-lived token and gives an
  auditable environment.
- **Platform assumptions** — Pages enabled with Actions source; public repo;
  sub-path hosting (A-1).

---

## Boundary note — retained-but-excluded Express server

The existing Express server (`app/server.js`) and `/api` routes
(`app/src/routes/api.js`), `app/test`, and `node_modules` are **retained in the
repository for local development** but are **never copied into `dist/`** and thus
never published (OOS-1, FR-10, Q6). They have no deployed infrastructure under
this design. The allowlist-by-construction assembly (TD-5) is what guarantees the
FR-10 boundary: only `app/public/*` plus the generated `products.json` are placed
in `dist/`, so server code, API routes, tests, and `node_modules` cannot leak
into the published artifact.

---

## Inter-unit integration

**None.** `static-frontend` is the sole unit of this intent; there is no
`units-of-work-dependency.md` and no `external-dependencies.md` (omitted upstream
— the deployed artifact is a self-contained client with no runtime API or
external integration). There are therefore no infrastructure-level connections to
other units to design. (Consistent with `components.md` conditional-artifact
omissions and the empty dependency picture.)
