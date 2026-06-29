# Workflow Composition — Clarification Questions

Intent: intent-003-product-search-filter — add product search and filtering to the existing EC site (`app/`).

Provisional workflow (recommendation): reverse-engineering (skipped) → **requirements analysis** → **functional design** (--unit product-listing) → **code generation** → **build and test**, with the **OWASP security lens** active. The questions below confirm the conditional stages (user stories, wireframes, reverse-engineering), the implementation target, the filter scope, and tailor the security lens.

---

### Q1: Where should search/filter behaviour be implemented?

The catalogue is served two ways today: the Express server (`GET /api/products` in `app/src/routes/api.js`) and a static GitHub Pages build (the browser reads a generated `products.json` via `app/public/js/api.js`, from intent-002). Search/filter can live in either or both.

a) Client-side only — filter/search in the browser over the already-loaded catalogue; works for both the server-served and the static (GitHub Pages) site with no API change.
b) Server-side only — add query parameters to `GET /api/products` (e.g. `?q=&minPrice=&maxPrice=`); the static GitHub Pages build would NOT get search/filter.
c) Both — server-side query support AND client-side filtering for the static build.

**Trade Offs:** The catalogue is tiny (6 products, fixed in-memory). Client-side (a) is the simplest, keeps the static GitHub Pages site working, and needs no API contract change — but all filtering logic lives in the frontend. Server-side (b) is a cleaner data-access story and matches a "real" EC site, but breaks parity with the static deployment that intent-002 established. (c) is the most complete but doubles the implementation and the surface to validate.

**Recommendation:** (a) Client-side only. It preserves the static-deployment capability added in intent-002, requires no API/contract changes (so application design stays out of scope), and matches the tiny fixed catalogue. The new matching logic is still real domain logic and is captured in functional design.

[Answer]: a) Client-side only.

---

### Q2: Should the "user stories" stage (inception) run?

The intent adds new user-facing behaviour (searching, narrowing the catalogue) but with a single actor (shopper) and a fairly obvious happy path.

a) Skip — fold the behaviour into requirements analysis and functional design.
b) Include — produce a small story map / personas for the search-and-filter experience.

**Trade Offs:** Search/filter is a single-actor, low-novelty extension of an existing listing page; requirements analysis can capture the acceptance criteria directly. A full story map adds ceremony with little new signal. Including it is cheap insurance if you expect the UX (empty-result states, combined search+filter, clearing filters) to need explicit narrative.

**Recommendation:** (a) Skip. Per the right-sizing principle this is a small feature add to an existing surface; requirements analysis plus functional design cover it. (Matches the catalogue's "small feature add to an existing service" pattern.)

[Answer]: a) Skip.

---

### Q3: Should the "wireframes" stage (inception) run?

The feature introduces new UI controls (a search box, filter controls such as a price range) on the existing listing page.

a) Skip — describe the UI controls in requirements/functional design; let code generation realise them against the existing page layout.
b) Include — produce wireframes for the search/filter controls and result states before coding.

**Trade Offs:** The UI surface is small and bolts onto an existing, already-styled listing page (`app/public/index.html` + `css/styles.css`). Wireframes add a visual contract for control placement and empty-result/no-match states, which can reduce rework if the layout is contentious — but for a search box plus a price filter on an existing page they are likely overkill.

**Recommendation:** (a) Skip, unless you want a visual sign-off on control placement and result states. The existing page provides the layout; requirements + functional design can specify the controls.

[Answer]: b) Include — the human wants wireframes for the search/filter controls and result states (search box, price-range control, no-match/empty-result states) before coding.

---

### Q4: Reverse-engineering — confirm skip?

RE-kb is missing (no `org-ai-kb/re-kb/`), and brownfield intents include reverse-engineering by default. However, bootstrap-context judged the in-scope surface small and well understood (`products.js`, `api.js`, `app/public/js/`, the listing page) and recommended skipping a formal RE step; downstream skills can read `app/` directly.

a) Skip the formal reverse-engineering stage — downstream skills read `app/` directly.
b) Run a lightweight scoped reverse-engineering pass on `aidlc-sample` (the `app/` surface) to seed RE-kb first.

**Trade Offs:** The affected code is a handful of small, readable files, so a formal RE pass yields little for this narrow change. Running it would, however, begin hydrating an RE-kb that does not exist yet, which benefits future intents.

**Recommendation:** (a) Skip for this intent. The surface is small and directly readable per bootstrap-context; the cost of a formal RE stage is not justified by this change. (Note: RE-kb remains unhydrated as a known gap.)

[Answer]: a) Skip the formal reverse-engineering stage — downstream skills read `app/` directly.

---

### Q5: What filter dimensions are in scope?

The product records today have `id`, `name`, `price`, `image`, `description` — there is no category, brand, tag, or rating field.

a) Search by name/keyword + filter by price (range) — using only fields that exist today.
b) (a) plus category/tag filtering — which requires adding a new field to every product in `app/src/data/products.js` (and the generated `products.json`).
c) Search by name/keyword only — no attribute filters.

**Trade Offs:** (a) works against the existing data shape with no data-model change. (b) is richer but introduces a data change (new attribute on the catalogue) and broadens scope. (c) is the narrowest. The intent text explicitly mentions "filter/narrow … by attributes such as price," which points at (a).

**Recommendation:** (a) Search by name/keyword plus a price filter, using existing fields only. This matches the intent wording and avoids a data-model change. If category filtering is wanted, choose (b) and we will scope the data change.

[Answer]: a) Search by name/keyword + filter by price (range), using only fields that exist today. No data-model change.

---

### Q6: Activate the OWASP security lens for this intent?

OWASP is a default-on lens. Even a client-side search introduces an input-validation / output-encoding surface: a user-supplied search term rendered into the DOM is a cross-site-scripting (A03 Injection) vector, and any server-side query parameters need validation.

a) Activate — apply the security lens across requirements, design, and code generation (default).
b) Deactivate — judge it unwarranted for this change.

**Trade Offs:** The feature is low-sensitivity (a public product catalogue, no auth, no PII) but does add a user-controlled input that flows into rendering. Keeping the lens active ensures the search term is safely encoded and any query params validated, at negligible cost. Deactivating it for a feature whose entire point is accepting user input would be hard to justify.

**Recommendation:** (a) Activate. The cost is low and the new user-input surface is exactly what the lens guards.

[Answer]: b) Deactivate — the human has chosen NOT to activate the OWASP lens for this intent. (Note: as a known gap, standard XSS/output-encoding hygiene for the search input is still expected to be handled in functional design and code generation as ordinary correctness, but no formal OWASP lens is injected.)

---

### Q7: OWASP lens tailoring — data sensitivity, exposure, and risk tolerance

If the lens is activated (Q6), these one-time answers tailor it to this intent. They are recorded in `lens-owasp-answers.md`.

a) Data sensitivity: **Public** — the product catalogue (name, price, description, placeholder image) is non-sensitive marketing data; the search/filter feature handles no PII, credentials, or financial data.
b) Authentication model: **None** — the listing and search are unauthenticated, matching the existing guest-only site (no auth anywhere in `app/`).
c) Exposure: **Internet-facing** — the static site is published to GitHub Pages (intent-002); the Express variant is a local sample.
d) Compliance requirements: **None** — sample application, no regulatory scope.
e) Primary threat for this feature: **A03 Injection / XSS** — a user-supplied search term reflected into the page must be output-encoded; any server-side query params must be validated. No SQL/command interpreter is involved (data is in-memory / static JSON).
f) Risk tolerance: **Balanced** — sample app, but apply standard input-validation and output-encoding hygiene for the new search input.

**Recommendation:** Adopt (a)-(f) as written. Confirm or correct any value — in particular whether the static GitHub Pages deployment should be treated as internet-facing (it is) for the lens's purposes.

[Answer]: n/a — OWASP lens deactivated in Q6, so no lens tailoring is recorded.
