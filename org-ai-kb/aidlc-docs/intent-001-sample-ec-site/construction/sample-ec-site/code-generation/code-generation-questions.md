# Code Generation — Clarification Questions

Unit: `sample-ec-site` (construction / code-generation)

> NOTE: Upstream design stages (application-design, functional-design, nfr-assessment, nfr-design, infrastructure-design) were intentionally SKIPPED in this workflow. Code-generation normally inherits tech-stack and architecture decisions from those stages. Because they do not exist, per builder protocol rule 5 (gap handling) the missing decisions are surfaced here as clarification questions, each with a recommended answer tuned for "the simplest thing that runs locally with mock data." The only upstream input is `inception/requirements-analysis/requirements.md` (FR-1..FR-17, NFR-1..NFR-5). Hard constraints: run locally on one machine, no external dependencies, mock/in-memory data only, guest-only simulated checkout, no persistence beyond session.

> **Human decision (recorded by orchestrator): ALL recommendations accepted (Q1=a, Q2=a, Q3=a, Q4=a, Q5=a).** Proceed with the simplest locally-runnable stack.

---

### Q1: What tech stack / runtime should the locally-runnable EC site use, and how is it started?

a) Single all-in-one full-stack app — one Node.js + Express server that serves both a static HTML/CSS/vanilla-JS frontend AND a tiny in-process mock JSON API, started with one command (`npm install && npm start`), open `http://localhost:3000`.
b) Separate frontend framework (React/Vite) + separate mock API server — two processes, two commands.
c) Heavier all-in-one framework (e.g., Next.js) with API routes.
d) Other.

**Recommendation:** (a) — single Node.js + Express app.

[Answer]: (a) — single Node.js + Express app serving static frontend + in-process mock JSON API. Run with `npm install && npm start`, open http://localhost:3000. Confirmed.

---

### Q2: Which architecture / layering style should be applied?

a) Lightweight Layered / MVC — backend split into routes (API), a small service/data module (mock catalogue + order logic), and frontend split into pages + a thin API-client module.
b) Hexagonal / Clean / Ports-and-Adapters.
c) Frontend-only layering (Foundation / Pages / Features / Shared) with a trivial backend.

**Recommendation:** (a) — Lightweight Layered / MVC.

[Answer]: (a) — Lightweight Layered/MVC: mock-data module → cart/order service → Express routes; frontend pages + thin fetch API client. Confirmed.

---

### Q3: How should mock data be provided, and how are product images handled?

a) Mock products as an in-memory JS module / JSON fixture loaded at server start; product images as locally-served SVG/placeholder assets (no network call).
b) External image URLs / external placeholder service over the network.
c) Real image files sourced/downloaded per product.

**Recommendation:** (a) — in-memory mock data + local SVG placeholders.

[Answer]: (a) — small fixed in-memory product catalogue served from the mock API; product images are locally-served SVG placeholders (no external service/network). Confirmed.

---

### Q4: What level of error handling and logging is appropriate for this sample?

a) Minimal — basic input guards (reject empty-cart order per FR-17, clear HTTP status for unknown product/route), `console` logging, plain user-facing messages.
b) Production-grade — structured logging, centralized error middleware, observability.

**Recommendation:** (a) — Minimal.

[Answer]: (a) — Minimal: empty-cart rejection (FR-17), 404/400 for bad requests, console logging, plain UI messages. Confirmed.

---

### Q5: How should cart and order state be managed within a session (no persistence)?

a) Client-side in-memory/browser state — cart held in the browser; order POSTed to the mock API which generates the order ID (FR-14) and returns the confirmation payload (FR-15); cart cleared client-side after order (FR-16); nothing persisted server-side.
b) Server-side in-memory session store keyed per session.
c) Real persistence (database / file).

**Recommendation:** (a) — client-side cart, stateless mock API.

[Answer]: (a) — client-side in-memory/session cart; mock API stateless apart from minting an order ID at checkout. No persistence beyond session (A-1, A-5). Confirmed.
