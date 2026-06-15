# Deployment Architecture — static-frontend

Intent: intent-002-static-frontend-github-pages-ci
Stage: infrastructure-design (construction)
Unit: static-frontend
State key: `infrastructure-design:static-frontend`

System-level view of how the unit's infrastructure (GitHub Actions CI + GitHub
Pages) fits together. Per-component service mapping, technology decisions, NFR
coverage, and cost notes live in `infrastructure-design.md`. This is a **design
artifact** — it describes the deployment topology; the actual workflow YAML is
produced later in code-generation.

---

## Topology

Trigger and flow (single workflow, two jobs):

```
push to `main`
      │
      ▼
┌──────────────────────────── GitHub Actions workflow ─────────────────────────┐
│                                                                               │
│  build  (ubuntu-latest, permissions: contents: read)                          │
│    1. actions/checkout            — fetch repo source                         │
│    2. actions/setup-node (Node 20)— provision build runtime                   │
│    3. generate products.json      — require() app/src/data/products.js,       │
│                                      serialize catalogue → dist/products.json, │
│                                      normalize /images/... → relative (FR-7)   │
│    4. assemble dist/              — copy app/public/* (allowlist) + products.json
│    5. actions/configure-pages     — Pages build context                       │
│    6. actions/upload-pages-artifact (path: dist/) — upload publish dir        │
│                                                                               │
│            │  needs: build   (deploy unreachable if build fails — FR-9)       │
│            ▼                                                                   │
│  deploy (permissions: pages: write + id-token: write,                         │
│          environment: github-pages, concurrency: pages)                       │
│    7. actions/deploy-pages        — publish artifact to GitHub Pages          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────┬─┘
                                                                              ▼
                                                          GitHub Pages CDN (HTTPS)
                                                          served at /<repo>/  (A-1)
                                                                              ▼
                                                          Visitor browser:
                                                          - Catalogue Data Provider
                                                          - Checkout / Order Simulation
                                                          - Cart (localStorage)
```

Traffic flow at runtime: the visitor's browser loads HTML/CSS/JS and
`products.json` from the Pages CDN over HTTPS using **relative references**
(base-path aware), so the same artifact works at a domain root and under
`/<repo>/` (FR-7, NFR-4). There is **no origin server and no `/api`** at runtime.

---

## Build steps (detail)

1. **checkout** (`actions/checkout`, pinned) — fetch repo source.
2. **setup-node** (`actions/setup-node`, pinned) — Node.js 20 LTS. No `npm
   install` is required for catalogue generation because `app/src/data/products.js`
   is a dependency-free CommonJS module (only the optional Express dep exists in
   `package.json`, and it is not used by the build).
3. **generate `products.json`** — `require()` `app/src/data/products.js`,
   serialize the catalogue array to `dist/products.json`. Normalize the one
   root-absolute image path (`'/images/placeholder.svg'`) to a relative form so
   the emitted data is sub-path portable (FR-1, FR-7, NFR-2, NFR-4). This keeps the
   catalogue single-source (the JS module is the only authoritative copy).
4. **assemble `dist/`** — copy `app/public/*` (HTML, CSS, client JS, images) plus
   the generated `products.json` into a clean `dist/` publish directory. This is an
   **allowlist by construction** (TD-5): nothing else is copied in. Any
   root-absolute references inside the copied HTML/JS that would break under
   `/<repo>/` are normalized to relative during assembly (FR-7).
5. **configure-pages** (`actions/configure-pages`, pinned) — establish the Pages
   build context for the deployment model.
6. **upload-pages-artifact** (`actions/upload-pages-artifact`, pinned) — upload
   **only** `dist/` as the single Pages artifact.

## Deploy step (detail)

7. **deploy-pages** (`actions/deploy-pages`, pinned) — publish the uploaded
   artifact to the **`github-pages`** environment / Pages CDN. The job declares
   `needs: build`, so it runs **only** when the build job succeeds.

### Deploy gating — FR-9 / NFR-1 guarantee

The `deploy` job's `needs: build` makes it **unreachable** when the build job
exits non-zero: no artifact is uploaded and `deploy-pages` never executes, so
**nothing is published and the previously published site stays intact** (FR-9,
NFR-1 — "deploy runs in zero cases where the build fails"). The two-job split is
the canonical GitHub Pages pattern and also confines the elevated `pages: write` /
`id-token: write` permissions to the deploy job (least privilege).

---

## Environments

- **Single environment: `github-pages` (production).** GitHub Pages serves one
  project site per repo; there is no staging requirement upstream, so dev/staging
  parity is **N/A**.
- No per-environment sizing, replica, or feature-flag differences exist (static
  CDN content, no compute tiers).
- Local development continues to use the retained Express server
  (`app/server.js`) outside this pipeline (OOS-1) — it is not an environment of the
  deployed unit and is never published.

---

## Scaling strategy

- **No application scaling.** The site is static content served by the GitHub
  Pages CDN; there is no compute, no autoscaling trigger, no min/max replica, and
  no cooldown to configure.
- Capacity is the Pages CDN itself; load is absorbed by the CDN edge. No
  quantitative scalability target is stated upstream (`requirements.md` §3:
  Scalability "None identified"), so no thresholds are defined. This is recorded
  explicitly rather than left as an unaddressed NFR.
- Build scaling: one short job per push to `main`; `concurrency: pages` serializes
  overlapping deploys so a newer push supersedes an in-flight one cleanly.

---

## Failover and recovery

- **No formal RTO/RPO is defined upstream** (nfr-assessment was skipped; no
  availability target in `requirements.md`). Gap noted explicitly: there is no
  numeric RTO/RPO to map mechanisms to.
- **Availability** — provided by the GitHub Pages CDN (GitHub-managed,
  multi-edge). No self-managed failover is designed; this is inherent to the
  managed platform.
- **Recovery** — two complementary mechanisms:
  1. The `github-pages` environment **retains the last successful deployment**; a
     failed build never overwrites it (FR-9/NFR-1), so a bad change does not take
     the live site down.
  2. To roll forward, push a fix (or use `workflow_dispatch` if enabled) to
     re-run the workflow; to roll back, revert the offending commit on `main` and
     let the pipeline republish the prior content. Source of truth is git, so the
     site is fully reproducible from any commit.
- **Backup** — none required as discrete infrastructure: the published artifact is
  deterministically regenerable from the repository (catalogue from
  `app/src/data/products.js`, assets from `app/public`).

---

## Deployed-artifact boundary (FR-10)

The published artifact is exactly the uploaded `dist/`, assembled by **allowlist**
(TD-5): only `app/public/*` plus the generated `products.json`. Excluded by
construction — never copied into `dist/`:

- Express server `app/server.js`
- `/api` route files `app/src/routes/api.js`
- tests under `app/test`
- `node_modules`

Because the artifact is built from an explicit allowlist rather than an exclude
list, server code, API routes, tests, and dependencies **cannot** leak into the
published output (FR-10 pass criterion). No secrets are present in the bundle (the
site is fully static).

---

## Inter-unit connectivity

**None.** `static-frontend` is the sole unit of the intent. There is no
`units-of-work-dependency.md`, no other unit to reach, and no runtime API exposed
to or consumed from another unit (the legacy `/api` is removed from the runtime
path; `external-dependencies.md` was omitted upstream as the deployed artifact has
no external runtime integration). No service discovery, DNS, or message routing is
required.

---

## Deployment pipeline summary

- **Repo → running:** `git push` to `main` → `build` job (generate + assemble +
  upload) → `deploy` job (`needs: build`) → GitHub Pages CDN.
- **Approval gates:** none required by default (publish-on-green to a single
  production site). The `github-pages` environment can optionally carry protection
  rules (e.g. restrict deploying branches) without changing the topology.
- **Rollback strategy:** revert the commit on `main` and let the pipeline
  republish; the last good deployment remains live until a new green build
  succeeds.

---

## Infrastructure-as-code notes

- **IaC tool:** the **committed GitHub Actions workflow YAML** at the repository
  root (`.github/workflows/<name>.yml`) **is** the unit's infrastructure-as-code
  (TD-7). It declaratively defines the runner, build/deploy jobs, permissions,
  `concurrency`, the `github-pages` environment binding, and pinned action
  versions.
- **No general-purpose IaC** (Terraform / CDK / Pulumi / CloudFormation). GitHub
  Pages is a repository setting plus an Actions deployment, not a provisionable
  cloud resource graph; a general IaC tool would add overhead with no meaningful
  resources to manage. This is consistent with the recorded technology decisions in
  `infrastructure-design.md` (TD-1, TD-7) — there is no conflicting
  `tech-stack-decisions.md`.
- **Stack boundary:** a **single stack** — one workflow file plus the repository's
  Pages setting (source = "GitHub Actions"). There are no separate networking,
  data, or compute stacks to bound.
- **Note:** the workflow YAML itself is **produced in code-generation**, not in
  this design stage. This document specifies its required topology, jobs,
  permissions, and gating; the concrete file is the code-generation deliverable.
