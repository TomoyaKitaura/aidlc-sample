/* Thin fetch client over the mock JSON API (FR-1, FR-2, FR-4, FR-14, FR-15). */

const Api = (() => {
  async function fetchProducts() {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  }

  async function fetchProduct(id) {
    const res = await fetch('/api/products/' + encodeURIComponent(id));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to load product');
    return res.json();
  }

  // payload: { customer: {name,email,address}, items: [{id,name,price,quantity}] }
  async function placeOrder(payload) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to place order');
    }
    return data;
  }

  return { fetchProducts, fetchProduct, placeOrder };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
