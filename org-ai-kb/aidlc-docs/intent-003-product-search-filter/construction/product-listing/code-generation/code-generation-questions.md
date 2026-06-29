# Code Generation — Clarification Questions

Intent: intent-003-product-search-filter
Unit: product-listing
Skill: code-generation
Step: clarification
Generated: 2026-06-29

These questions cover only genuine code-generation decisions that the upstream
design artifacts (`business-logic-model.md`, `domain-entities.md`,
`business-rules.md`), the wireframes, and the locked scope do **not** already
settle. The locked scope is honoured throughout and is not re-litigated
(client-side only; no API/contract/data-model change; static GitHub Pages build
AND Express server must both keep working; name-only case-insensitive contiguous
substring search + optional inclusive numeric min/max price filter, AND-combined,
on explicit submit; full catalogue when no controls active; distinct empty-state
vs load-error; Clear shown only when a control is active; no persistence;
numeric-only price inputs `min=0`; output-encoding on rendered fields per FR-10;
horizontal full-width filter bar below `<h1>Products</h1>`).

---

### Q1: Where should the search/filter logic and the filter-bar DOM wiring live?

a) **Extract a new `app/public/js/search-filter.js` module** holding the pure
   `filterCatalogue` / `matchesSearch` / `matchesPrice` functions and the criteria
   normalisation (BR-1, BR-3), using the SAME dual-export IIFE pattern as
   `app/public/js/api.js` (browser global + `module.exports`). The thin DOM wiring
   (read controls, render grid/empty-state, conditional Clear) extends the existing
   inline `<script>` in `index.html` and calls into that module via a `<script>` tag.
b) Put EVERYTHING — pure logic and DOM wiring — inside the existing inline
   `<script>` in `index.html`. No new file.
c) Other.

**Trade Offs:**
- (a) keeps the pure, deterministic filter logic in a standalone module that mirrors
  the repo's existing convention (`api.js` already uses the
  `const X = (() => { ... })(); if (module.exports) ...` dual-export pattern), and —
  critically — makes the pure functions importable under `node --test` (see Q3). The
  static `build.js` already copies the whole `public/` tree, so a new `js/` file ships
  to GitHub Pages automatically AND is served by Express via `express.static` — both
  delivery modes keep working with no build change. Slight cost: one more `<script>`
  tag in `index.html`.
- (b) is the smallest diff but leaves the pure logic untestable (trapped in an inline
  script with no export surface), which blocks Q3's testing option and mixes pure
  logic with DOM concerns.

**Recommendation:** (a). It matches the existing `api.js` convention, enables unit
testing of the pure filter, and requires no build change. The filter-bar markup and
the render/Clear/submit wiring stay in `index.html`'s inline script (Frontend "Pages"
layer); the pure derivation moves to the module (a small "Shared/Features" layer).

[Answer]: a) Extract a new `app/public/js/search-filter.js` module (dual-export IIFE like api.js); DOM wiring extends index.html's inline script.

---

### Q2: How should FR-10 output-encoding be satisfied for the rendered card fields?

The current `card()` in `index.html` builds card markup via `innerHTML`, interpolating
`p.name` and `p.description` UNescaped. The locked scope requires output-encoding for
rendered fields (FR-10 / BR-12). The user's search term is itself never echoed into the
page in the current design (it stays in the input), so the live FR-10 exposure is the
existing unescaped product-field interpolation.

a) **Refactor `card()` to build the DOM with `document.createElement` + `textContent`**
   for all text fields (`name`, `description`, price) and set `img.src` / link `href`
   via properties — eliminating the `innerHTML` interpolation entirely.
b) Keep `innerHTML` but pass every interpolated field through an HTML-escape helper
   (escape `& < > " '`).
c) Leave `card()` as-is (product data is trusted, server-controlled) and only ensure
   the new filter code introduces no new unencoded interpolation.
d) Other.

**Trade Offs:**
- (a) is the most robust and idiomatic safe-DOM approach, structurally precludes
  injection for ALL fields, and reads cleanly. It is a meaningful rewrite of the one
  `card()` function (a brownfield modification requiring a diff in the plan).
- (b) is a smaller diff but escaping in string concatenation is easy to get subtly
  wrong (attribute vs text context) and leaves the `innerHTML` pattern in place.
- (c) is the minimal interpretation — strictly, no user-controlled string is rendered
  today — but it leaves a known unsafe pattern that the wireframe-guidance explicitly
  flags, and FR-10/BR-12 are listed in this unit's owned requirements.

**Recommendation:** (a). The functional-design owns FR-10/BR-12 for this unit and the
wireframe-guidance calls out the existing `innerHTML` interpolation directly; safe DOM
construction via `textContent` satisfies it cleanly and is the right place to do it
while this code is already being touched. This is a brownfield edit to `index.html`'s
inline `card()` — the plan will present the diff for approval before writing.

[Answer]: a) Refactor `card()` to build the DOM with `document.createElement` + `textContent` for all text fields; set img.src/href via properties; eliminate innerHTML interpolation.

---

### Q3: Should automated tests be generated for the pure filter logic, and how?

The repo tests via `node --test` (`app/test/*.test.js`, e.g. `order.test.js`). If Q1=(a),
the pure functions (`filterCatalogue`, `matchesSearch`, `matchesPrice`, criteria
normalisation) are CommonJS-importable and directly testable without a browser/DOM.
The validation-spec requires unit tests co-located with the layer they test (Rule 4).

a) **Add `app/test/search-filter.test.js`** that `require()`s the new module and covers
   the business rules: name substring case-insensitivity (BR-2), contiguous/multi-word
   substring, inclusive bounds incl. exact-boundary (BR-4), absent-bound semantics,
   inverted-range → empty (BR-5), AND-combination (BR-6), empty/identity → full
   catalogue (BR-7), and search-term normalisation incl. all-whitespace → `""` (BR-1).
   The DOM-wiring (submit, Clear visibility, render) stays untested by `node --test`
   (no DOM harness in the repo) and is verified manually / by the wireframe states.
b) No automated tests — rely on manual verification against the wireframe states only.
c) Other (e.g. add a DOM test harness / new dev dependency).

**Trade Offs:**
- (a) follows the existing `node --test` convention and the validation-spec's co-located
  unit-test rule, with zero new dependencies, and gives high-value coverage of exactly
  the pure business logic where regressions would be silent. It does not cover DOM wiring
  — acceptable, since the repo has no DOM test harness and adding one (jsdom etc.) would
  introduce a dependency, which conflicts with the "only dep is express" convention.
- (b) leaves the core derivation (the riskiest, rule-dense part) unverified.
- (c) (a DOM harness) adds a dependency and is out of proportion for a ~6-product
  client-side feature.

**Recommendation:** (a). Test the pure module under `node --test`; do not add a DOM
harness. This depends on Q1=(a) (the module must be importable); if Q1=(b) is chosen,
testing falls back to (b) here since inline-script logic is not importable.

[Answer]: a) Add `app/test/search-filter.test.js` under `node --test` covering BR-1/BR-2/BR-4/BR-5/BR-6/BR-7; no new dependency, no DOM harness. (Q1=a confirmed, so the module is importable.)

---

### Q4: The filter-bar styling — `styles.css` edit vs inline?

The wireframe-guidance says the real `styles.css` is "reused unchanged" (no EXISTING
rule is altered) but also specifies NEW additive classes `.filter-bar`,
`.filter-bar .search`, `.filter-bar .price` plus the 720px responsive column behaviour.
`.empty-state`, `.notice`, `button.secondary`, and the design tokens already exist in
`styles.css` and are reused as-is.

a) **Append the new additive classes to `app/public/css/styles.css`** (the existing
   rules untouched), referencing only the existing tokens (`--card`, `--line`,
   `--radius`, `--muted`, accent). The inline "preview only" style block in the
   wireframe HTML is NOT copied; it becomes real classes here. `build.js` copies the
   stylesheet to `dist/` unchanged, so both delivery modes pick it up.
b) Inline the filter-bar styles in `index.html` (`<style>` or inline attributes) and
   leave `styles.css` completely untouched.
c) Other.

**Trade Offs:**
- (a) matches the wireframe-guidance's explicit instruction ("move it into styles.css as
  real classes instead"), keeps styling in the one stylesheet shared across pages and
  delivery modes, and only ADDS rules (no existing rule changed, honouring "reused
  unchanged" in its intended sense). It is a brownfield append to `styles.css`.
- (b) avoids touching `styles.css` literally but contradicts the wireframe-guidance and
  scatters styling, with no real benefit.

**Recommendation:** (a). Append the additive classes to `styles.css`; do not edit any
existing rule. This is a brownfield edit — the plan will show the appended block as a
diff for approval. ("Reused unchanged" is interpreted as the guidance states: existing
rules untouched, new additive classes added.)

[Answer]: a) Append the new additive classes (.filter-bar, .filter-bar .search, .filter-bar .price, 720px responsive) to `app/public/css/styles.css`, referencing only existing tokens; no existing rule altered.

---

### Q5: Confirm the static build (`build.js`) needs NO change.

`build.js` assembles `dist/` by copying the entire `app/public/**` tree (HTML
reference-normalised, other files copied verbatim) and serialising the catalogue to
`dist/products.json`. The feature is purely client-side and adds only client-side files
under `public/` (the new `js/` module if Q1=(a), the `index.html` edits, the `styles.css`
append). No catalogue-shape, API, or reference-resolution change is involved.

a) **Confirm: no `build.js` change.** The new `public/js/search-filter.js`, the
   `index.html` edits, and the `styles.css` append are all picked up automatically by the
   existing allowlist copy; the static build and Express server behave identically (NFR-2,
   BR-14).
b) `build.js` does need a change (please specify what).

**Recommendation:** (a). Nothing in this feature touches the catalogue shape, the
reference-normalisation, or the dist-assembly allowlist, so the existing build covers the
new client-side files with no modification.

[Answer]: a) Confirmed — no `build.js` change. The new `public/js/search-filter.js`, the index.html edits, and the styles.css append are picked up by the existing allowlist copy; static build and Express behave identically.
