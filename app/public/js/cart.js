/* Client-side cart state, persisted in localStorage
 * (FR-6, FR-7, FR-8, FR-9, FR-16; Q5 client-side cart). */

const Cart = (() => {
  const KEY = 'sample-ec-cart';

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    return items;
  }

  // Add a product, or bump quantity if already present (FR-6).
  function add(product, quantity = 1) {
    const qty = Math.max(1, Math.floor(quantity) || 1);
    const items = read();
    const existing = items.find((it) => it.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
      });
    }
    return write(items);
  }

  // Set the quantity of an item; 0 or less removes it (FR-7).
  function setQuantity(id, quantity) {
    const qty = Math.floor(quantity);
    let items = read();
    if (!Number.isFinite(qty) || qty <= 0) {
      items = items.filter((it) => it.id !== id);
    } else {
      items = items.map((it) => (it.id === id ? { ...it, quantity: qty } : it));
    }
    return write(items);
  }

  // Remove an item (FR-8).
  function remove(id) {
    return write(read().filter((it) => it.id !== id));
  }

  // Display line items with unit price, quantity and subtotal (FR-9).
  function lineItems() {
    return read().map((it) => ({
      id: it.id,
      name: it.name,
      image: it.image,
      unitPrice: it.price,
      quantity: it.quantity,
      subtotal: Number((it.price * it.quantity).toFixed(2)),
    }));
  }

  function total() {
    return Number(
      read().reduce((sum, it) => sum + it.price * it.quantity, 0).toFixed(2)
    );
  }

  function count() {
    return read().reduce((sum, it) => sum + it.quantity, 0);
  }

  function isEmpty() {
    return read().length === 0;
  }

  // Empty the cart after a successful order (FR-16).
  function clear() {
    localStorage.removeItem(KEY);
  }

  return { add, setQuantity, remove, lineItems, total, count, isEmpty, clear, read };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cart;
}
