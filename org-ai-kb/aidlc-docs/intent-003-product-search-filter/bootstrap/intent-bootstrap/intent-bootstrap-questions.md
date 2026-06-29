# Intent Bootstrap — Clarifying Questions

> human-clarification: "false" — answers below are the builder's own recommended answers, filled in for traceability. No human was consulted; the orchestrator supplied the determining context.

### Q1: Intent slug

The auto-generated kebab-case slug for this intent is `product-search-filter`. Do you want to use it or override?

a) Use `product-search-filter` (auto-generated)
b) Override with a custom slug

**Recommendation:** (a) `product-search-filter` — ASCII kebab-case capturing the two load-bearing concepts of the Japanese prompt 「商品検索・絞り込み機能」: product search and filtering/narrowing.

[Answer]: a) Use `product-search-filter`. It is a clear, ASCII kebab-case rendering of 商品検索 (product search) and 絞り込み (filtering/narrowing).

### Q2: Intent type

How should this intent be classified by type?

a) feature
b) bug fix
c) migration
d) refactor
e) prototype

**Recommendation:** (a) feature — the intent ("商品検索・絞り込み機能を追加したい" / "I want to add product search and filtering") explicitly adds new user-facing capability to the existing catalogue experience.

[Answer]: a) feature. The prompt requests adding a new capability (search + filter) to the existing EC site.

### Q3: Classification (greenfield / brownfield / mixed)

Is there an existing codebase or repository in scope for this intent?

a) greenfield — brand-new build, no existing repos
b) brownfield — extend/modify existing repos
c) mixed

**Recommendation:** (b) brownfield — the feature extends the existing EC site at `app/` (Express server + static frontend, product catalogue served via `GET /api/products` and the frontend data layer). Search/filter is added on top of the existing product-listing surface.

[Answer]: b) brownfield. The work extends the existing `app/` EC site (intent-001-sample-ec-site) — its product catalogue and listing UI — rather than building from scratch.

### Q4: Repos in scope

Which repositories are in scope for this intent?

a) This single repository (aidlc-sample), containing `app/`
b) Multiple repositories
c) None

**Recommendation:** (a) — the orchestrator scopes the `app/` directory of this single repository. Search/filter logic and UI live within `app/`.

[Answer]: a) This single repository: `aidlc-sample`. The in-scope code is the `app/` EC site (product data, API routes, and the static frontend listing page).

### Q5: RE-kb status / reverse-engineering need

Do you have an existing reverse-engineering knowledge base (RE-kb) for the repos in scope, or do you want to reverse-engineer them now?

a) RE-kb exists and is hydrated
b) No RE-kb; reverse-engineer now as a workflow step
c) No RE-kb; codebase is small and directly readable — defer the formal reverse-engineering step and let downstream skills read the code directly

**Recommendation:** (c) — there is no `org-ai-kb/re-kb/` directory at all, so no RE-kb exists for the app. The in-scope surface is small and well understood: the product catalogue (`app/src/data/products.js`), the API route exposing it (`app/src/routes/api.js`: `GET /api/products`), and the static frontend listing page (`app/public/index.html` + `app/public/js/`). Downstream skills can read these directly; a full reverse-engineering pass would be disproportionate to the scope. workflow-composition retains discretion to add a lightweight scoped reverse-engineering step if it judges one necessary.

[Answer]: c) No RE-kb exists (no `org-ai-kb/re-kb/` directory). The codebase is small and directly readable — defer the formal reverse-engineering step; downstream skills read `app/` directly. RE-kb status = missing for this repo. (workflow-composition retains discretion to add a scoped reverse-engineering step.)

### Q6: org-ai-kb location

Where should the org-ai-kb live?

**Recommendation:** Use the existing org-ai-kb at `<workspace-root>/org-ai-kb/`, which already contains intent-001 and intent-002.

[Answer]: Existing `org-ai-kb/` at the workspace root is used; this intent is created as `intent-003-product-search-filter` alongside `intent-001-sample-ec-site` and `intent-002-static-frontend-github-pages-ci`. No human question was required.
