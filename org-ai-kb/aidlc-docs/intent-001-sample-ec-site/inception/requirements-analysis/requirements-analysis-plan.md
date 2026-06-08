# Requirements Analysis — Plan

Intent: intent-001-sample-ec-site (greenfield, minimal sample EC site)
Output artifact: `requirements.md` (this directory)

## Goal

Produce `requirements.md` for a minimal, locally-runnable sample EC site whose
backend returns MOCK DATA (no real DB, payment, or external services). Cover the
four core capabilities — product listing, product detail, cart, checkout — using
the 6 accepted question answers as the source of truth. All 5 mandatory sections
per the skill Output and validation-spec.

## How inputs map into requirements.md

- intent.md → Intent summary (type, scope, complexity, greenfield, affected repos).
- Q1 (product attributes: name, price, one image, short description) → product listing + detail FRs.
- Q2 (no stock tracking) → assumption + an FR stating products are always orderable.
- Q3 (cart: add, change quantity, remove) → cart FRs.
- Q4 (checkout captures name, email, shipping address; simulated, guest-only) → checkout FRs.
- Q5 (success = confirmation screen with order ID + items, then empty cart; mock/in-memory) → order-placement FR + assumption.
- Q6 (out-of-scope list + no real backend/DB/external services) → Out of scope section.
- Local/mock constraint (header of questions file) → project-wide assumption + NFR framing.

## Plan checklist

- [x] **Section 1 — Intent summary.** State: type = new feature (greenfield new build); scope = small single web application (frontend + mock backend); complexity = low/minimal; classification = greenfield (no existing codebase / no affected repos in RE-kb). Note the overarching local/mock-data constraint.
- [x] **Section 2 — Functional requirements (FR-<n>, each pass/fail verifiable).** Draft the minimal set:
  - Product listing: display catalogue with name, price, image, short description.
  - Product detail: view a single product's full attributes; navigate from listing.
  - Cart: add item to cart; change item quantity; remove item; view cart contents and total.
  - Products always orderable (no stock checks).
  - Checkout: capture name, email, shipping address (guest, no real payment).
  - Place order: generate an order ID, show a confirmation screen listing ordered items, then empty the cart.
  - Verify every intent capability + Q1–Q5 answer is traceable to at least one FR (validation rule 2).
- [x] **Section 3 — Non-functional requirements (measurable where possible).** Keep minimal and scope-appropriate: runs locally as a self-contained app; backend serves mock/in-memory data only; basic usability (core flow completable without instructions); responsive page interactions. Add quantified criteria where sensible (e.g., page/data response targets) and avoid tech-stack specifics (deferred to construction).
- [x] **Section 4 — Assumptions (flagged as assumptions).** Local-only run with mock data / no persistence beyond session; no stock tracking; guest-only, simulated checkout; placeholder image assets; order data in-memory only.
- [x] **Section 5 — Out of scope.** Per Q6: user accounts/login, real payment, order history/retrieval, admin/product management, search/filter, reviews, discounts/coupons, shipping/tax calculation; plus real/persistent backend, real database, external/real services.
- [x] **Final pass.** Confirm all 5 sections present (none empty — use "None identified" if so), FRs numbered `FR-<n>` and pass/fail, assumptions explicitly flagged, no construction-phase (tech/framework/DB) decisions leaked in.
