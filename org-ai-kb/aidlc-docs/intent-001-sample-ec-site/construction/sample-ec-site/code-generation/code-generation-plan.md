# Code Generation Plan — sample-ec-site

Intent: intent-001-sample-ec-site
Unit: `sample-ec-site`
State key: `code-generation:sample-ec-site`

## Approach

Single all-in-one **Node.js + Express** app (Q1=a) using a lightweight
**Layered / MVC** style (Q2=a). One Express process serves a static
HTML/CSS/vanilla-JS frontend AND an in-process mock JSON API. Mock product
catalogue is an in-memory module; product images are locally-served SVG
placeholders (Q3=a). Error handling is minimal — empty-cart guard, 404/400
responses, console logging, plain UI messages (Q4=a). Cart state lives
client-side; the mock API is stateless apart from minting an order ID at
checkout (Q5=a).

### Where code lives

All application source code is generated in the **workspace** under
`/Users/tomoyakitaura/src/github.com/tomoyakitaura/aidlc-sample/app/`.
This planning document and `CODE_SUMMARY.md` remain in aidlc-docs (validation
rule 6 — never mix app code with documentation artifacts). Paths below are
relative to the `app/` root.

### Run & verify (whole app)

```
cd app
npm install
npm start          # → http://localhost:3000
npm test           # business-logic unit tests
```

Core flow to verify (NFR-3): browse listing → product detail → add to cart →
view cart (update qty / remove) → checkout (name/email/address) → place order →
confirmation screen with order ID and items → cart emptied.

---

## Layer 0 — Project scaffold

Bootstrap a runnable Node project: dependency manifest and run docs. Establishes
the workspace so later layers have a place to live and a way to boot.

- [x] **create** `app/package.json` — declares `express` dependency, `start`
  script (`node server.js`) and `test` script (`node --test`); name, version,
  engines. Enables `npm install && npm start`. _(NFR-1, NFR-2 — self-contained
  local app, single dependency, no external services)_
- [x] **create** `app/README.md` — run instructions (`npm install && npm start`
  → http://localhost:3000), core-flow walkthrough, note that data is mock /
  in-memory and not persisted. _(NFR-1, NFR-3, A-1, A-5)_
- [x] **create** `app/.gitignore` — ignore `node_modules/`. _(scaffold hygiene)_

**Verification:** `package.json` is valid JSON (`node -e "require('./app/package.json')"`); `npm install` in `app/` succeeds and installs only `express`.

**Checkpoint:** ✅ Layer 0 — package.json valid JSON; `npm install` succeeded, express installed, 0 vulnerabilities.

---

## Layer 1 — Models / mock data

In-memory domain data and pure domain helpers. No Express, no DOM — importable in
isolation so it can be unit-tested by Layer 2.

- [x] **create** `app/src/data/products.js` — fixed in-memory product catalogue
  (array of `{ id, name, price, image, description }`); exports
  `getAllProducts()` and `getProductById(id)`. Each product references a local
  SVG placeholder under `/images/`. _(FR-1, FR-2, FR-4, FR-10 — every product
  always orderable, no stock check; A-2, A-4, A-6)_
- [x] **create** `app/src/domain/cart.js` — pure cart-domain helpers operating on
  a plain cart item list: `addItem`, `setQuantity`, `removeItem`, `isEmpty`,
  `lineItems` (each with name, unit price, quantity). No persistence; pure
  functions over passed-in state. _(FR-6, FR-7, FR-8, FR-9 data shape)_

**Verification:** `node -c app/src/data/products.js` and
`node -c app/src/domain/cart.js` pass; `node -e "const p=require('./app/src/data/products');console.log(p.getAllProducts().length, p.getProductById(p.getAllProducts()[0].id).name)"` prints a non-zero count and a name.

**Checkpoint:** ✅ Layer 1 — `node -c` passed for both modules; smoke printed `count: 6 first: Aurora Desk Lamp`.

---

## Layer 2 — Business logic + unit test

Order/cart business rules independent of HTTP. Co-located unit test (validation
rule 4 — tests in same layer as the code they test).

- [x] **create** `app/src/domain/order.js` — `calculateTotal(items)` (sum of
  unit price × quantity), `generateOrderId()` (unique per call, e.g.
  timestamp + random suffix), `buildOrder({ customer, items })` which rejects an
  empty item list (empty-cart guard) and returns
  `{ orderId, items, total, customer }`. _(FR-9 total, FR-14 unique order ID,
  FR-16/17 — empty-cart rejection feeds clearing + block; FR-13 simulated, no
  payment)_
- [x] **create** `app/test/order.test.js` — `node --test` unit tests:
  `calculateTotal` math; `generateOrderId` uniqueness across calls;
  `buildOrder` throws / errors on empty cart (FR-17); `buildOrder` returns id +
  items + total for a valid cart. _(FR-9, FR-14, FR-17 verification)_

**Verification:** `npm test` (from `app/`) runs and all `order.test.js` cases
pass; `node -c app/src/domain/order.js` passes.

**Checkpoint:** ✅ Layer 2 — `npm test` ran `node --test`: 6 tests, 6 pass, 0 fail.

---

## Layer 3 — API (Express routes) + static serving

The Express server wiring: mock JSON API over Layers 1–2, static frontend
serving, and minimal error handling. Depends only on already-generated layers.

- [x] **create** `app/server.js` — creates the Express app, serves static files
  from `app/public/` (frontend + SVG images), mounts the API router under
  `/api`, minimal 404 + JSON error handler (console logging), listens on
  port 3000. _(FR-1..FR-5 served, FR-11..FR-15 served, NFR-1, NFR-4 in-memory
  fast responses, Q4 minimal error handling)_
- [x] **create** `app/src/routes/api.js` — Express router:
  `GET /api/products` (list, FR-1/2), `GET /api/products/:id` (detail, 404 if
  unknown, FR-4/5), `POST /api/orders` (validates non-empty cart → 400 if empty
  per FR-17; mints order ID via `order.js`; returns confirmation payload with
  order ID + ordered items, FR-13/14/15). Stateless apart from id minting (Q5).
  _(FR-1, FR-2, FR-4, FR-10, FR-11, FR-12 guest no-auth, FR-13, FR-14, FR-15,
  FR-17)_

**Verification:** `node -c app/server.js` and `node -c app/src/routes/api.js`
pass; server boots (`npm start`) without error; manual/`curl` smoke:
`GET /api/products` returns the catalogue, `GET /api/products/<id>` returns one
product (and 404 for a bad id), `POST /api/orders` with items returns an order
ID and 400 with an empty cart.

**Checkpoint:** ✅ Layer 3 — `node -c` passed for server.js & api.js; server booted; curl smoke: `GET /api/products` 200 (6 items), `GET /api/products/p1` 200, `GET /api/products/nope` 404, `POST /api/orders` with items 200 (returned orderId+total), empty cart 400.

---

## Layer 4a — Frontend foundation, API client, cart state, images

Shared frontend foundation under `app/public/`: layout/styles, thin fetch API
client, client-side cart state module, and SVG placeholder image(s). Pages in
Layer 4b consume these.

- [x] **create** `app/public/css/styles.css` — shared layout, navigation, and
  page styles giving visible feedback on actions. _(NFR-3 usable flow, NFR-5
  visible responses)_
- [x] **create** `app/public/js/api.js` — thin fetch client:
  `fetchProducts()`, `fetchProduct(id)`, `placeOrder(payload)` calling the
  Layer-3 API. _(FR-1, FR-2, FR-4, FR-14, FR-15)_
- [x] **create** `app/public/js/cart.js` — client-side cart state held in
  `localStorage`/in-memory: add, change quantity, remove, read line items +
  total, clear after order. _(FR-6, FR-7, FR-8, FR-9, FR-16; Q5 client-side
  cart)_
- [x] **create** `app/public/images/placeholder.svg` — local SVG placeholder
  product image (no network). _(FR-2, FR-4, A-4)_

**Verification:** `node -c app/public/js/api.js` and
`node -c app/public/js/cart.js` pass (plain JS syntax check);
`GET /images/placeholder.svg` and `GET /css/styles.css` are served by the
running server.

**Checkpoint:** ✅ Layer 4a — `node -c` passed for api.js & cart.js; server served `/css/styles.css`, `/js/api.js`, `/js/cart.js`, `/images/placeholder.svg` all 200.

---

## Layer 4b — Frontend pages

The user-facing pages composing the full core flow, each wired to the
Layer-4a client + cart modules. (Listing, detail, cart, checkout, and
confirmation; checkout + confirmation co-located on one page kept thin to
respect the 5–8 file budget.)

- [x] **create** `app/public/index.html` — product listing page: renders all
  products with name, price, image, short description; each links to its detail
  page; add-to-cart from the listing; cart link/badge. _(FR-1, FR-2, FR-3,
  FR-6, FR-9, NFR-4, NFR-5)_
- [x] **create** `app/public/product.html` — product detail page (reads `?id=`):
  shows name, price, image, description; add-to-cart control. _(FR-4, FR-5,
  FR-6)_
- [x] **create** `app/public/cart.html` — cart view: lists each item with name,
  unit price, quantity; change quantity; remove item; shows total; proceed to
  checkout (disabled/blocked when empty per FR-17). _(FR-7, FR-8, FR-9, FR-17,
  NFR-5)_
- [x] **create** `app/public/checkout.html` — guest checkout form (name, email,
  shipping address); place-order button disabled/rejected when cart empty;
  POSTs to `/api/orders`; on success renders the order confirmation (order ID +
  ordered items) and empties the cart. _(FR-11, FR-12, FR-13, FR-14, FR-15,
  FR-16, FR-17, NFR-3, NFR-5)_

**Verification:** server running; manual walkthrough of the full core flow
(listing → detail → add to cart → cart edit/remove → checkout → place order →
confirmation shows order ID + items → cart emptied), and empty-cart checkout is
blocked (FR-17). Each page renders under 1s locally (NFR-4).

**Checkpoint:** ✅ Layer 4b — server served `/`, `/index.html`, `/product.html`, `/cart.html`, `/checkout.html` all 200; full-flow order POST returned orderId + items + total (94.48). Empty-cart checkout blocked client-side (FR-17) and rejected server-side (400).

---

## FR / NFR coverage matrix

| Req | Covered by |
|---|---|
| FR-1 | products.js, api.js (route), index.html, public/js/api.js |
| FR-2 | products.js, index.html, product.html, placeholder.svg |
| FR-3 | index.html |
| FR-4 | products.js, api.js (route), product.html |
| FR-5 | product.html |
| FR-6 | cart.js (domain), public/js/cart.js, index.html, product.html |
| FR-7 | cart.js (domain), public/js/cart.js, cart.html |
| FR-8 | cart.js (domain), public/js/cart.js, cart.html |
| FR-9 | cart.js, order.js (total), cart.html, index.html |
| FR-10 | products.js (no stock check) |
| FR-11 | api.js (route), checkout.html |
| FR-12 | api.js (route, no auth), checkout.html |
| FR-13 | order.js, api.js (route), checkout.html |
| FR-14 | order.js (generateOrderId), api.js (route), public/js/api.js |
| FR-15 | api.js (route), checkout.html, public/js/api.js |
| FR-16 | public/js/cart.js (clear), checkout.html |
| FR-17 | order.js (guard), api.js (400), order.test.js, cart.html, checkout.html |
| NFR-1 | package.json, server.js, README.md |
| NFR-2 | package.json (express only), products.js (in-memory) |
| NFR-3 | README.md, styles.css, full page set (4b) |
| NFR-4 | server.js (in-memory), all pages |
| NFR-5 | styles.css, cart.html, checkout.html, index.html |

All FR-1..FR-17 and NFR-1..NFR-5 map to at least one file/layer.

## File count summary

- Layer 0 — 3 files
- Layer 1 — 2 files
- Layer 2 — 2 files (incl. 1 unit test)
- Layer 3 — 2 files
- Layer 4a — 4 files
- Layer 4b — 4 files

**Total: 17 files** across 6 layers; every layer ≤ 8 files; tests co-located
with their layer (Layer 2).
