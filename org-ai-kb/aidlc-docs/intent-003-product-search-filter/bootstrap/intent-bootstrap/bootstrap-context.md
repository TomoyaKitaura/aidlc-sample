# Bootstrap Context

## Classification

**brownfield**

Rationale: The intent 「商品検索・絞り込み機能を追加したい」 (add product search and filtering) extends the existing EC site application at `app/`, originally produced by intent-001-sample-ec-site. That app is a Node.js/Express application (`app/server.js`) with a fixed in-memory product catalogue (`app/src/data/products.js`), a mock JSON API (`app/src/routes/api.js`, notably `GET /api/products` returning the full catalogue), and a static frontend under `app/public` (catalogue rendered by `index.html` and the scripts under `app/public/js`). intent-002 additionally added a static build path so the frontend can be hosted on GitHub Pages. Today the catalogue is a single flat list with no search or narrowing. This intent adds search and filter behaviour on top of that existing product-listing surface and its data access — modifying/extending existing code rather than building from scratch — so it is brownfield.

## Repos in scope

- `aidlc-sample` — this single repository. The in-scope code is the EC site under `app/`: the product catalogue data (`app/src/data/products.js`), the API route exposing it (`app/src/routes/api.js`), and the static frontend listing page and scripts (`app/public/index.html`, `app/public/js/`).

## RE-kb status

missing — there is no `org-ai-kb/re-kb/` directory and therefore no reverse-engineering knowledge base for this repository or the `app/` codebase. The in-scope code surface is small and directly readable.

## Reverse-engineering

not needed as a formal step — the relevant code surface is small and well understood: the product catalogue (`app/src/data/products.js`), the catalogue API (`app/src/routes/api.js`: `GET /api/products`), and the static frontend listing assets under `app/public`. Downstream skills can read `app/` directly. workflow-composition retains discretion to add a lightweight scoped reverse-engineering step if it judges one necessary.
