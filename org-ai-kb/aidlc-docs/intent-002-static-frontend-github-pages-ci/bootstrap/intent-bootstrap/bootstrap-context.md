# Bootstrap Context

## Classification

**brownfield**

Rationale: The intent targets the existing application at `app/`, produced by intent-001-sample-ec-site. That app is a Node.js/Express server serving a static frontend from `app/public` and backed by a mock JSON API under `/api` (`app/src/routes/api.js`: `GET /api/products`, `GET /api/products/:id`, `POST /api/orders`; consumed by `app/public/js/api.js`). The work modifies this existing codebase — replacing the `/api` runtime dependency with static data / client-side logic so the frontend can run on static hosting — and adds a new GitHub Actions CI workflow that builds the static bundle and publishes it to GitHub Pages on push to `main`. Because it extends and modifies existing code rather than building from scratch, it is brownfield.

## Repos in scope

- `aidlc-sample` — this single repository. The application code lives at `app/` and the CI workflow (`.github/workflows/`) targets this repo's GitHub Pages.

## RE-kb status

missing — no reverse-engineering knowledge base exists under `org-ai-kb/re-kb/` for this repository. The in-scope code surface is small and directly readable.

## Reverse-engineering

not needed as a formal step — the relevant code surface is small and well understood (Express API routes, the frontend's `/api` data-access layer, and static assets under `app/public`). Downstream skills can read `app/` directly. workflow-composition retains discretion to add a lightweight scoped reverse-engineering step if it judges one necessary.
