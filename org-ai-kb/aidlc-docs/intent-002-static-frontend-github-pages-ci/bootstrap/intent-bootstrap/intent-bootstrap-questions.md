# Intent Bootstrap — Clarifying Questions

> human-clarification: "false" — answers below are the builder's own recommended answers, filled in for traceability. No human was consulted.

### Q1: Intent slug

The auto-generated kebab-case slug for this intent is `static-frontend-github-pages-ci`. Do you want to use it or override?

a) Use `static-frontend-github-pages-ci` (auto-generated)
b) Override with a custom slug

**Recommendation:** (a) `static-frontend-github-pages-ci` — ASCII kebab-case capturing the three load-bearing concepts of the intent: static frontend build, GitHub Pages deployment, and CI automation.

[Answer]: a) Use `static-frontend-github-pages-ci`. It is a clear, ASCII kebab-case derivation covering static build + GitHub Pages + CI.

### Q2: Intent type

How should this intent be classified by type?

a) feature
b) bug fix
c) migration
d) refactor
e) prototype

**Trade Offs:** The work has two facets: (1) adding a brand-new CI/CD pipeline (GitHub Actions to build and publish to GitHub Pages) and (2) refactoring the existing frontend to remove its `/api` runtime dependency so it can be statically hosted. "migration" would over-emphasise a platform move; the application logic is not moving platforms so much as gaining a new deployment target. "refactor" alone undersells the new CI capability being added.

**Recommendation:** (a) feature — primarily delivers a new capability (automated static build + GitHub Pages deployment) and is best treated as a feature build that also includes a brownfield refactor of the frontend's data layer.

[Answer]: a) feature (CI/CD pipeline plus a brownfield refactor to static-host the existing frontend). The dominant outcome is a new automated deployment capability.

### Q3: Classification (greenfield / brownfield / mixed)

Is there an existing codebase or repository in scope for this intent?

a) greenfield — brand-new build, no existing repos
b) brownfield — extend/modify existing repos
c) mixed

**Recommendation:** (b) brownfield — the intent explicitly targets the existing `app/` produced by intent-001 (Express server serving a static frontend with a mock `/api`). The work modifies that existing code to make it statically hostable and adds CI on top of it.

[Answer]: b) brownfield. The existing `app/` (intent-001-sample-ec-site) is modified to remove `/api` runtime dependency and a GitHub Actions CI workflow is added to the same repository.

### Q4: Repos in scope

Which repositories are in scope for this intent?

a) This single repository (aidlc-sample), containing `app/`
b) Multiple repositories
c) None

**Recommendation:** (a) — the orchestrator states this single repository is in scope; `app/` lives within it and the GitHub Actions workflow will be added to this same repo's `.github/workflows/`.

[Answer]: a) This single repository: `aidlc-sample` (the app lives at `app/`; CI workflow targets this repo's GitHub Pages).

### Q5: RE-kb status / reverse-engineering need

Do you have an existing reverse-engineering knowledge base (RE-kb) for the repos in scope, or do you want to reverse-engineer them now?

a) RE-kb exists and is hydrated
b) No RE-kb; reverse-engineer now as a workflow step
c) No RE-kb; codebase is small and directly readable — defer the formal reverse-engineering step and let downstream skills read the code directly

**Recommendation:** (c) — no RE-kb exists for this repo, but the in-scope surface is small and well understood: the Express routes (`app/src/routes/api.js`), the frontend data-access layer (`app/public/js/api.js` calling `GET /api/products`, `GET /api/products/:id`, `POST /api/orders`), and the static assets under `app/public`. Downstream skills can read these directly; a full reverse-engineering pass would add overhead disproportionate to the scope. workflow-composition may still choose to scope a lightweight reverse-engineering step if it judges it necessary.

[Answer]: c) No RE-kb exists; the codebase is small and directly readable. Defer the formal reverse-engineering step — downstream skills read `app/` directly. RE-kb status = missing for this repo. (workflow-composition retains discretion to add a scoped reverse-engineering step.)

### Q6: org-ai-kb location

Where should the org-ai-kb live?

**Recommendation:** Use the existing org-ai-kb at `<workspace-root>/org-ai-kb/`, which already contains intent-001.

[Answer]: Existing `org-ai-kb/` at the workspace root is used; this intent is created as `intent-002-...` alongside `intent-001-sample-ec-site`. No question to a human was required.
