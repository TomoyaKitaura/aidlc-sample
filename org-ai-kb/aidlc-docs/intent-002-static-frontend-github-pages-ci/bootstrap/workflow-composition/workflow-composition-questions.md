# Workflow Composition — Clarification Questions

Intent: intent-002-static-frontend-github-pages-ci
Type: feature (CI/CD pipeline plus brownfield refactor to static-host the existing frontend)
Classification: brownfield (existing `app/` Express+`/api` application)

These questions decide which skills run in this intent's workflow, which lenses are active, and how the OWASP lens is tailored. Answer each by replacing the blank `[Answer]:` line. You may answer in chat or edit this file directly.

---

### Q1: Should a lightweight reverse-engineering stage run for the `aidlc-sample` repo?

a) No — skip reverse-engineering. Bootstrap judged the code surface small and well understood (Express `/api` routes, the frontend `/api` data-access layer in `app/public/js/api.js`, static assets under `app/public`); downstream skills read `app/` directly.
b) Yes — run one scoped reverse-engineering pass on `aidlc-sample` to formally capture the existing API contracts and frontend data-access layer before refactoring, since no RE-kb exists yet.

**Trade Offs:** RE produces durable RE-kb artifacts (api-contracts, components, code-structure) that help future intents and reduce the risk of missing a `/api` consumer. But it adds a full stage cycle for a codebase the bootstrap context already summarizes accurately and that is small enough to read inline. The static-ification work is mechanical: enumerate the three `/api` endpoints and their consumers, then replace them with static data.

**Recommendation:** (a) Skip. The affected surface is three endpoints (`GET /api/products`, `GET /api/products/:id`, `POST /api/orders`) and a single client data-access file — small enough for downstream skills to read directly, matching the bootstrap context's judgement. Reserve the option to insert a scoped RE pass mid-flight if an unexpected `/api` dependency surfaces (composition rule 5).

[Answer]: (a) Skip reverse-engineering. The affected surface is small and directly readable; downstream skills read `app/` directly.

---

### Q2: Should the user stories stage run?

a) No — skip. There is no new user-facing behaviour. The static site must preserve the existing product-list / product-detail / order flows; the change is to the delivery substrate (static hosting) and the data source (static JSON instead of live `/api`), not to what the user does.
b) Yes — run user stories to capture the user-visible consequences of static-ification (e.g. order submission no longer hits a server, browse-only behaviour).

**Trade Offs:** Static-ification can change behaviour at the edges — most notably `POST /api/orders` has no server in a static site, so "place an order" must either be stubbed client-side, removed, or redirected. If that behavioural decision is significant, stories help pin it down. If the team treats it as a known mechanical substitution, stories add ceremony.

**Recommendation:** (a) Skip, but see Q3 — the order-submission behaviour is the one real behavioural question and is better handled as an explicit clarification / functional-design concern than a full story-mapping stage. No new actors or journeys are introduced.

[Answer]: (a) Skip user stories. No new actors or journeys; the one behavioural decision is captured in Q3.

---

### Q3: How should the `POST /api/orders` (order creation) flow behave once the site is fully static (no server)?

a) Stub client-side — keep the order UI, simulate a successful order entirely in the browser (e.g. show a confirmation with a generated order id), persist nothing server-side.
b) Disable / hide — remove the checkout/order action for the static deployment; the site becomes browse-only (products list + detail).
c) External form / service — submit orders to a third-party form or serverless endpoint (e.g. a hosted form service) rather than the removed `/api`.
d) Other — specify.

**Trade Offs:** This is the single place where static-ification changes real behaviour, so it shapes functional-design and code-generation. (a) preserves the demo flow with no backend but stores no data. (b) is the simplest and most honest for a static demo. (c) reintroduces an integration target and its own security/availability concerns.

**Recommendation:** (a) Stub client-side — preserves the existing UX of the sample EC site as a static demo with the least surprise, and keeps the change purely front-end. This is the assumption downstream functional-design and code-generation will follow unless you choose otherwise.

[Answer]: (a) Stub client-side. Keep the order UI and simulate a successful order entirely in the browser (generate an order id, show the confirmation); persist nothing.

---

### Q4: Which skills should make up the workflow? (the overall right-sizing decision)

a) Minimal — requirements-analysis → functional-design → code-generation → build-and-test. (Refactor the `/api` data-access layer to static data, add the static build + GitHub Actions Pages deploy.)
b) Recommended — requirements-analysis → application-design → functional-design → infrastructure-design → code-generation → build-and-test. Adds application-design (the `/api` runtime boundary is being removed — a component-boundary change) and infrastructure-design (the GitHub Pages + GitHub Actions deploy pipeline is genuinely new infrastructure for this repo).
c) Fuller — also add user stories and/or nfr-assessment + nfr-design.

**Trade Offs:** The intent has two distinct pieces of novelty: (1) removing the server/`/api` boundary so the frontend runs standalone (an application-design concern), and (2) a brand-new CI/CD deployment substrate — static build artifact published to GitHub Pages via GitHub Actions on push to `main` (an infrastructure-design concern). Skipping application-design risks under-specifying how the frontend sources data without a server. Skipping infrastructure-design leaves the core deliverable (the CI workflow + Pages deployment) unspecified before code-generation. nfr-assessment/nfr-design add little for a static public demo. user stories add little (Q2/Q3 cover the one behavioural question).

**Recommendation:** (b) Recommended. requirements-analysis (always-on) + application-design (component boundary change: server-backed → static) + functional-design (the static data sourcing and order-stub logic) + infrastructure-design (GitHub Pages + GitHub Actions pipeline — the headline deliverable) + code-generation + build-and-test. Skip reverse-engineering (Q1), user stories (Q2/Q3), units-generation (single unit), nfr-assessment, nfr-design, wireframes (no new UI). Construction skills run single-pass (`--phase construction`) since this is one unit.

[Answer]: (b) Recommended. requirements-analysis → application-design → functional-design → infrastructure-design → code-generation → build-and-test. Skip reverse-engineering, user stories, units-generation (single unit), nfr-assessment, nfr-design, wireframes.

---

### Q5: Should the OWASP security lens be active for this intent? (default-activation: true)

a) Yes — keep OWASP active (the catalogue default). Even a static public demo has real security surface: GitHub Actions CI with deploy permissions to GitHub Pages (workflow token scope, supply-chain / pinned-action concerns — OWASP A05/A06/A08), and the embedded static data (ensure no secrets or sensitive data are baked into the published bundle — A02).
b) No — deactivate. Treat this as a documentation-grade public static site with no sensitive data and no meaningful attack surface.

**Trade Offs:** The frontend itself becomes static public content with no server and no auth, so classic web-app risks (injection, broken access control) largely fall away. But the CI/CD pipeline is a real, security-relevant asset: a misconfigured GitHub Actions workflow with write/deploy permissions and unpinned third-party actions is a genuine supply-chain risk. Keeping the lens active focuses that scrutiny on the pipeline and on what data ends up in the published bundle.

**Recommendation:** (a) Yes. The static frontend is low-risk, but the new CI/CD deploy pipeline and the question of what data is embedded in the public bundle warrant the lens. Its tailoring (Q6) scopes the attention appropriately.

[Answer]: (b) No — deactivate the OWASP lens for this intent. Treated as a public static sample/demo with no sensitive data. (Pipeline hygiene — pinned actions, least-privilege token — will still be applied as ordinary good practice during infrastructure-design/code-generation, just not enforced as a lens.)

---

### Q6: OWASP lens tailoring — data sensitivity, compliance, auth model, exposure, threat actors, and risk tolerance for this intent.

This single question gathers the OWASP lens's one-time tailoring inputs. Adjust any part of the recommended answer below.

a) Accept the recommended profile (see Recommendation).
b) Provide your own values for any of: data sensitivity / compliance / authentication model / exposure / threat actors / risk tolerance.

**Recommendation (recommended profile):**
- **Data sensitivity:** Public only. The site serves sample EC product data and a client-side order stub; no PII, credentials, or financial data. Key control: ensure no secrets (tokens, API keys) or internal data are baked into the published static bundle (OWASP A02).
- **Compliance:** None. Sample/demo application; no GDPR/PCI-DSS/HIPAA obligations (no real personal or payment data is collected — see Q3).
- **Authentication model:** None for the published site (static, anonymous, browse-only public content). For the pipeline: GitHub Actions uses the repo-scoped `GITHUB_TOKEN` / Pages deployment permissions — apply least-privilege workflow permissions.
- **Exposure:** Internet-facing (GitHub Pages is public). The CI pipeline is the privileged surface.
- **Threat actors / vectors:** Primarily supply-chain (compromised or unpinned GitHub Actions — A06/A08) and CI misconfiguration (over-broad workflow permissions — A05). The static content itself is a low-value target.
- **Risk tolerance:** Balanced — appropriate for a public sample/demo. No data-breach exposure given no sensitive data; reasonable care on pipeline hygiene (pinned actions, least-privilege token, no leaked secrets).

[Answer]: N/A — OWASP lens deactivated in Q5, so no lens tailoring profile is recorded. The profile's good-practice items (no secrets in the bundle, pinned actions, least-privilege workflow permissions) are adopted as ordinary engineering practice during infrastructure-design and code-generation.

---
