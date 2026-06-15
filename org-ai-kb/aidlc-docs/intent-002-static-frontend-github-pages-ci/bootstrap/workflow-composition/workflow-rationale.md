# Workflow Composition Rationale

Intent: intent-002-static-frontend-github-pages-ci
Classification: brownfield (existing `app/` Express + `/api` application from intent-001)
Single construction unit: `static-frontend` (no microservice split — the whole change targets one repo, `aidlc-sample`, treated as one unit)

The intent has two pieces of novelty: (1) removing the server/`/api` runtime boundary so the frontend
runs standalone as static content, and (2) a brand-new CI/CD substrate — a static build published to
GitHub Pages via a GitHub Actions workflow on push to `main`. The composition is sized around exactly those
two concerns. Decisions follow the approved answers in `workflow-composition-questions.md` (Q1–Q6).

## Inception phase

- **reverse-engineering — SKIPPED.** RE-kb is missing, but the affected surface is small and directly
  readable: three endpoints (`GET /api/products`, `GET /api/products/:id`, `POST /api/orders` in
  `app/src/routes/api.js`) and a single client data-access file (`app/public/js/api.js`). Bootstrap context
  judged the code small and well understood; downstream skills read `app/` directly (Q1a). A scoped RE pass
  may still be inserted mid-flight (composition rule 5) if an unexpected `/api` consumer surfaces.
- **requirements-analysis — INCLUDED.** Always-on. Captures the static-ification scope, the static-data
  delivery model, the GitHub Pages + Actions deliverable, and the client-side order-stub decision (Q3a).
- **user-stories — SKIPPED.** No new actors or journeys; the static site preserves the existing
  browse / product-detail / order flows. The one real behavioural change (order submission with no server)
  is decided in Q3 and handled in functional-design, not via story mapping (Q2a).
- **wireframes — SKIPPED.** No new or changed UI; existing screens are preserved as static content.
- **application-design — INCLUDED.** The `/api` runtime boundary is being removed (server-backed →
  fully static). That is a component-boundary change: how the frontend sources data without a server must
  be specified before construction (Q4b).
- **units-generation — SKIPPED.** A single unit (one repo, one deliverable). Construction skills collapse
  into a single per-unit pass against `static-frontend` (composition rule 4).

## Construction phase (unit: static-frontend)

- **functional-design — INCLUDED.** Defines the technology-agnostic logic for sourcing product data from
  static data instead of `/api`, and the client-side order-stub behaviour (generate an order id, show the
  confirmation, persist nothing — Q3a).
- **nfr-assessment — SKIPPED.** A public static sample/demo with no sensitive data; default
  non-functional posture is adequate. No NFR shift to assess (Q4b).
- **nfr-design — SKIPPED.** No NFR design follows from a skipped nfr-assessment.
- **infrastructure-design — INCLUDED.** The headline deliverable: the GitHub Actions workflow that builds
  the static bundle and publishes it to GitHub Pages on push to `main`. This is genuinely new infrastructure
  for the repo and must be specified before code-generation (Q4b).
- **code-generation — INCLUDED.** Always-on. Implements the static data-access refactor, the order stub,
  the static build, and the GitHub Actions Pages-deploy workflow.
- **build-and-test — INCLUDED (with a caveat).** Always-on (right-sizing rule 2). The build-and-test
  concern for this intent is: a static build of the `app/` frontend plus the GitHub Actions deploy to
  GitHub Pages. **Caveat:** the catalogue marks `aidlc-build-and-test` as status 🚧 — there is no skill
  folder under `.claude/skills/`. The skill name does exist in the catalogue, so it is listed in
  `workflow.md` (with `--phase construction`, single-pass, since it is not per-unit) for completeness and
  to match the intent-001 precedent. A `# comment` block above the line documents that the folder is
  missing. Until the skill is implemented, build verification for this intent is covered as follows:
  - The GitHub Actions workflow produced by infrastructure-design / code-generation **is itself the build
    and deploy harness** — running the static build and the Pages deploy on push to `main` provides the
    de facto build-and-test gate.
  - code-generation includes the static build step and a local build verification in its CODE_SUMMARY.
  - When the orchestrator reaches the `build-and-test` line and finds no skill folder, it should either
    treat the CI workflow as the verification mechanism or pause and surface the gap to the human rather
    than failing silently. No placeholder skill folder is invented here.

## Lenses

- **owasp — DEACTIVATED.** Default-activation is `true`, but per Q5b this is treated as a public static
  sample/demo with no sensitive data and no meaningful server-side attack surface (no server, no auth, no
  PII/payment data — the order flow is a client-side stub per Q3a). The classic web-app risk classes
  largely fall away. The pipeline hygiene the lens would have enforced — pinned third-party actions,
  least-privilege `GITHUB_TOKEN` / Pages-deploy permissions, and no secrets baked into the published
  bundle — is adopted as ordinary engineering good practice during infrastructure-design and
  code-generation, just not enforced as a lens (Q5b, Q6 N/A). The `## Active Lenses` table is left empty
  and no `lens-owasp-answers.md` file is written.
