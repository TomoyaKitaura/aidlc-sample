# Sample EC Site

A self-contained sample e-commerce site. It runs entirely on a single machine
with **mock, in-memory data** — no database, no payment gateway, no external
services. (intent-001-sample-ec-site)

## Run

```bash
cd app
npm install      # installs only express
npm start        # → http://localhost:3000
```

Then open http://localhost:3000 in a browser.

## Tests

```bash
cd app
npm test         # business-logic unit tests (node --test)
```

## Core flow

1. **Listing** (`/`) — browse all products (name, price, image, short description).
2. **Detail** (`/product.html?id=…`) — view a single product and add it to the cart.
3. **Cart** (`/cart.html`) — change item quantity, remove items, see the total.
4. **Checkout** (`/checkout.html`) — guest checkout: enter name, email, and
   shipping address, then place the order. No real payment is processed.
5. **Confirmation** — after placing the order you see a unique order ID and the
   list of ordered items; the cart is then emptied.

If the cart is empty, the place-order action is blocked (FR-17).

## Notes

- All product data is mock and in-memory (`src/data/products.js`). Product
  images are local SVG placeholders.
- The cart lives in the browser (`localStorage`). Placed orders are **not
  persisted** — they exist only for the lifetime of the confirmation and are not
  retrievable later.
- The backend is stateless apart from minting an order ID at checkout.
