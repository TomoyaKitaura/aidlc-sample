/* Static data-access client: reads the build-generated products.json and
 * simulates order placement entirely client-side (intent-002-static-frontend,
 * unit: static-frontend).
 *
 * No server / no /api: fetchProducts and fetchProduct read the static
 * products.json via a relative, base-path-aware URL so the site works at the
 * domain root and under a GitHub Pages repo sub-path /<repo>/ (FR-2, FR-7,
 * NFR-4). placeOrder is a verbatim port of app/src/domain/order.js business
 * logic — it computes the order client-side, persists nothing (FR-5, FR-6,
 * BR-7..BR-11, NFR-3). Public shape, async signatures, null-not-found semantics
 * and dual browser/CommonJS export are preserved unchanged (Q4, Q5, Q7, NFR-3).
 */

const Api = (() => {
  // Resolve products.json relative to the document base so it loads correctly
  // under both the domain root and a /<repo>/ sub-path (FR-7, NFR-4). No leading
  // slash. document.baseURI is the current page's URL; in non-browser contexts
  // (CommonJS export path) fall back to the bare relative string.
  function catalogueUrl() {
    if (typeof document !== 'undefined' && document.baseURI) {
      return new URL('products.json', document.baseURI).toString();
    }
    return 'products.json';
  }

  // FR-2: load the full catalogue from the static products.json (W-1/BR-1).
  async function fetchProducts() {
    const res = await fetch(catalogueUrl());
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  }

  // FR-3/FR-4: look up one product by id; return null when absent
  // (W-2/BR-2/BR-3 — no throw for an unknown id).
  async function fetchProduct(id) {
    const res = await fetch(catalogueUrl());
    if (!res.ok) throw new Error('Failed to load product');
    const products = await res.json();
    const product = products.find((p) => p.id === id);
    return product ? product : null;
  }

  // Ported from app/src/domain/order.js — calculateTotal (BR-7, BR-8).
  function calculateTotal(items) {
    if (!Array.isArray(items)) return 0;
    const total = items.reduce((sum, it) => {
      const unit = typeof it.unitPrice === 'number' ? it.unitPrice : it.price;
      const qty = it.quantity;
      return sum + (Number(unit) || 0) * (Number(qty) || 0);
    }, 0);
    return Number(total.toFixed(2));
  }

  // Ported from app/src/domain/order.js — generateOrderId (BR-9).
  function generateOrderId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${ts}-${rand}`;
  }

  // FR-5/FR-6: client-side order simulation. Verbatim port of buildOrder's
  // logic (BR-9 id, BR-7/BR-8 total, BR-10 empty-cart guard). Keeps accepting
  // { customer, items } so checkout.html is unchanged (Q4), ignores customer,
  // and returns { orderId, items, total } per domain-entities.md. Persists
  // nothing (OOS-2). The caller clears the cart on success (BR-11, FR-5).
  async function placeOrder({ customer, items } = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Cannot place an order with an empty cart.');
    }
    return {
      orderId: generateOrderId(),
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : it.price,
        quantity: it.quantity,
      })),
      total: calculateTotal(items),
    };
  }

  return { fetchProducts, fetchProduct, placeOrder };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
