# Infrastructure Design — Clarification Questions (unit: static-frontend)

Intent: intent-002-static-frontend-github-pages-ci
Stage: infrastructure-design (construction)
Unit: static-frontend

Auto-proceed mode: the human pre-authorized auto-proceeding with the builder's
recommended answers. Each `[Answer]:` line below is filled in by the builder with
its recommended option and rationale. State transitions
`clarification: pending → awaiting-human → answered → complete` were performed in
a single pass.

Upstream gap note: this workflow intentionally SKIPPED nfr-assessment and
nfr-design, so `nfr-requirements.md`, `tech-stack-decisions.md`, and the
nfr-design artifacts do not exist. Per builder protocol rule 5, the minimal
NFR/tech context is derived directly from `requirements.md` (FR-7..FR-10,
NFR-1..NFR-4). This is the first stage where concrete technology is named, so the
answers below also stand as the recorded technology decisions/assumptions.

---

### Q1: What hosting platform and deployment model should the deployed static site use?

a) GitHub Pages via the standard GitHub Actions deployment model (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) using the `github-pages` environment.
b) GitHub Pages via the legacy branch-based publish (push built output to a `gh-pages` branch with a third-party action).
c) A different static host (Netlify, Vercel, S3+CloudFront, Cloudflare Pages).
d) Other

**Trade Offs:** (a) is the GitHub-native, first-party model: no third-party action in the deploy path, OIDC-based artifact handoff, automatic `github-pages` environment with deployment history and protection rules, and a clean "build job → deploy job" split that naturally enforces deploy-only-on-green. (b) is older, requires a personal/deploy token or extra `contents: write`, mixes build output into git history, and relies on a third-party action. (c) contradicts the fixed upstream constraint that GitHub Pages is the deployment target (intent.md, A-1, OOS-3).

**Recommendation:** (a). GitHub Pages is a fixed upstream constraint, and the first-party Actions deployment model is the current GitHub-recommended path. It directly supports the headline requirements (FR-8 trigger, FR-9 deploy-only-on-green) and good pipeline hygiene (least-privilege, no long-lived tokens).

[Answer]: a — GitHub Pages with the first-party GitHub Actions deployment model (configure-pages / upload-pages-artifact / deploy-pages, `github-pages` environment). Rationale: GitHub Pages is fixed upstream (intent.md, A-1); the first-party model needs no third-party deploy action or long-lived token, gives an auditable `github-pages` environment, and structurally enforces FR-9 (deploy job depends on build job).

### Q2: How should the CI/CD topology be structured to guarantee deploy-only-on-green (FR-9 / NFR-1)?

a) Two jobs in one workflow: a `build` job that builds + uploads the Pages artifact, and a `deploy` job with `needs: build` that only runs if build succeeds.
b) A single job that builds and deploys sequentially in the same job.
c) Two separate workflows chained by `workflow_run`.
d) Other

**Trade Offs:** (a) is the canonical GitHub Pages pattern: `needs: build` means the deploy job is skipped entirely when the build job fails, so nothing is published and the previously published site stays intact — exactly FR-9/NFR-1. It also isolates the elevated `pages: write` / `id-token: write` permissions to the deploy job only (least privilege). (b) couples build and deploy; a mid-job failure is harder to reason about and the whole job carries deploy permissions. (c) adds cross-workflow indirection with no benefit here.

**Recommendation:** (a). It is the standard model, gives the cleanest FR-9 guarantee, and lets the build job run with only `contents: read`.

[Answer]: a — Two-job topology (`build` then `deploy` with `needs: build`) in one workflow on push to `main`. Rationale: `needs: build` makes deploy unreachable on a failed build (FR-9/NFR-1, fail-and-publish-nothing), and the split lets the build job hold only `contents: read` while elevated permissions stay on the deploy job (least privilege).

### Q3: What runtime/toolchain should the build job use to generate `products.json` and assemble the bundle?

a) Node.js LTS (Node 20) via `actions/setup-node`, reusing the repo's existing CommonJS module (`app/src/data/products.js`) to emit `products.json`; no extra build framework.
b) Introduce a bundler/static-site framework (Vite, webpack, Astro, etc.).
c) A shell/`jq`-only build with no Node.
d) Other

**Trade Offs:** (a) reuses the existing Node toolchain (`package.json` engines `>=18`, CommonJS) so the single-source-of-truth catalogue file can be `require()`d directly and serialized to JSON — minimal, no new dependency, satisfies FR-1/NFR-2 with the least machinery. The current `app/public` is already plain HTML/CSS/JS, so no bundling is required. (b) adds significant tooling and config for a site that needs no transpilation or bundling; over-engineering against NFR-2's simplicity intent. (c) cannot cleanly `require()` the JS catalogue module and would force a parallel parser, risking a second source of truth.

**Recommendation:** (a). Reuse Node LTS and the existing CommonJS catalogue module; emit `products.json` with a tiny generation step. No bundler needed because the frontend is already static assets.

[Answer]: a — Node.js 20 LTS via `actions/setup-node`, reusing `app/src/data/products.js` (CommonJS) to emit `products.json`; no bundler. Rationale: the catalogue module can be `require()`d directly so the catalogue stays single-source (FR-1/NFR-2); `app/public` is already plain static assets needing no transpile/bundle; minimal toolchain matches NFR-2.

### Q4: How should sub-path portability (FR-7 / NFR-4) be achieved at build time?

a) Make all in-page references relative (no leading `/`) and have the Catalogue Data Provider resolve `products.json` relative to the document base, so the bundle works at both domain root and `/<repo>/` with no build-time path rewriting.
b) Inject the repository name as a build-time base path and rewrite root-absolute references to `/<repo>/...`.
c) Use a `<base href>` tag computed at build time.
d) Other

**Trade Offs:** (a) is the most robust and host-agnostic: relative references resolve correctly under any sub-path with zero coupling to the repo name, satisfying NFR-4's "functions unchanged at root and under `/<repo>/`" in one mechanism, and requiring no secret or repo-name input in the build. Note the existing `products.js` uses a root-absolute image path (`/images/placeholder.svg`); under (a) the build's generation step normalizes such references to relative. (b) hard-codes the repo name into output, breaking the "works at root too" half of NFR-4 and adding a rewrite pass. (c) `<base href>` interacts awkwardly with in-page anchors and relative JS fetches and is brittle.

**Recommendation:** (a). Relative references are the simplest mechanism that satisfies both halves of NFR-4 and needs no repo-name input. The generation step normalizes the one root-absolute image path to a relative form.

[Answer]: a — Relative (base-path-aware, no leading `/`) references throughout, with `products.json` and assets resolved relative to the document; the generation step normalizes the existing root-absolute image path (`/images/placeholder.svg` → relative). Rationale: relative references satisfy both halves of NFR-4 (root and `/<repo>/`) with one mechanism and no repo-name/secret input (FR-7).

### Q5: What should the deployed-artifact boundary be, and how is the Express server excluded (FR-10 / Q6 / Q7)?

a) Build a clean publish directory (e.g. `dist/`) containing only `app/public` static assets (HTML/CSS/client JS/images) plus the generated `products.json`; upload only that directory as the Pages artifact. Server code, `/api` routes, tests, and `node_modules` are never copied in.
b) Upload `app/public` in place and rely on `.nojekyll`/ignore files to keep server code out.
c) Publish the repository root and exclude paths via the Pages config.
d) Other

**Trade Offs:** (a) is allowlist-by-construction: the artifact contains exactly the files explicitly assembled into `dist/`, so server code (`app/server.js`), `/api` routes (`app/src/routes/api.js`), `app/test`, and `node_modules` cannot leak in (FR-10 pass criterion). The Express server stays in the repo for local dev (OOS-1, Q6). (b)/(c) are denylist approaches — easy to under-exclude and fragile as the repo grows. The first-party `upload-pages-artifact` uploads a single specified directory, which fits (a) perfectly.

**Recommendation:** (a). Assemble an explicit `dist/` publish directory and upload only it. Allowlisting is the safest way to meet FR-10 and is the natural shape for `upload-pages-artifact`.

[Answer]: a — Assemble an explicit `dist/` publish directory (copy `app/public/*` + generated `products.json`) and upload only `dist/` as the Pages artifact; the Express server, `/api` routes, tests, and `node_modules` are never copied and remain in the repo for local dev (OOS-1/Q6). Rationale: allowlist-by-construction guarantees the FR-10 boundary (no server code/tests/node_modules in output) and matches `upload-pages-artifact`'s single-directory model.

### Q6: What workflow permissions and pipeline-hygiene controls should be applied (good practice even though the OWASP lens is off)?

a) Least-privilege per job: workflow default `contents: read`; the deploy job additionally `pages: write` and `id-token: write`. Pin all actions to a released major/SHA, set `concurrency` to serialize Pages deploys, no secrets in the build, and `permissions` declared explicitly.
b) Repo-wide broad token (`permissions: write-all`) for convenience.
c) Default GITHUB_TOKEN permissions, unscoped.
d) Other

**Trade Offs:** (a) follows least privilege: the build job only reads the repo; only the deploy job gets the Pages write + OIDC id-token needed by `deploy-pages`. Pinned action versions reduce supply-chain drift, `concurrency` prevents overlapping deploys clobbering each other, and since the site is fully static there are no secrets to bake into the bundle. (b)/(c) grant more than needed and weaken the pipeline with no benefit for a static publish.

**Recommendation:** (a). Even with OWASP off, these are ordinary pipeline hygiene defaults and the headline target explicitly calls for them.

[Answer]: a — Least-privilege permissions (workflow default `contents: read`; deploy job adds `pages: write` + `id-token: write`), pinned action versions, a `concurrency` group to serialize Pages deploys, no secrets baked into the bundle. Rationale: ordinary pipeline hygiene that the headline target mandates; scopes elevated permissions to the deploy job only and avoids supply-chain drift.

### Q7: What environment strategy and IaC approach should be recorded for this unit?

a) Single deployment environment (`github-pages`, production) defined entirely in the committed GitHub Actions workflow YAML, which is the infrastructure-as-code for this unit; no separate Terraform/CDK stack.
b) Multiple environments (dev/staging/prod) with separate Pages sites.
c) A general-purpose IaC tool (Terraform/CDK/Pulumi) to provision the hosting.
d) Other

**Trade Offs:** (a) matches the reality of GitHub Pages: there is one published project site, and the only declarative infrastructure is the workflow file plus the repo's Pages setting; the workflow YAML committed to the repo IS the IaC. (b) is unwarranted — no staging requirement exists and GitHub Pages offers one site per repo by default. (c) general IaC tools do not meaningfully provision GitHub Pages (it is a repo setting + Actions); adding Terraform/CDK here is pure overhead.

**Recommendation:** (a). One `github-pages` production environment; the committed workflow YAML is the IaC. No Terraform/CDK.

[Answer]: a — Single `github-pages` (production) environment; the committed GitHub Actions workflow YAML is the unit's infrastructure-as-code; no Terraform/CDK/Pulumi. Rationale: GitHub Pages is one site per repo configured by a repo setting + Actions, so the workflow file is the appropriate (and only meaningful) declarative artifact; no staging requirement exists.
