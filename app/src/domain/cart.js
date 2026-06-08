'use strict';

/**
 * Pure cart-domain helpers (FR-6, FR-7, FR-8, FR-9 data shape).
 *
 * These functions operate on a plain cart-item list and contain NO persistence
 * and NO side effects — they take a cart array in and return a new cart array
 * out. A cart item has the shape:
 *   { id, name, price, image, quantity }
 * where `price` is the unit price.
 */

/**
 * Add a product to the cart, or increase its quantity if already present (FR-6).
 * @param {Array<object>} items current cart items
 * @param {object} product a product record ({ id, name, price, image, ... })
 * @param {number} [quantity=1] how many to add (must be >= 1)
 * @returns {Array<object>} a new cart-item list
 */
function addItem(items, product, quantity = 1) {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  const existing = items.find((it) => it.id === product.id);
  if (existing) {
    return items.map((it) =>
      it.id === product.id ? { ...it, quantity: it.quantity + qty } : it
    );
  }
  return [
    ...items,
    {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
    },
  ];
}

/**
 * Set the quantity of an item already in the cart (FR-7).
 * A quantity of 0 or less removes the item.
 * @param {Array<object>} items
 * @param {string} id
 * @param {number} quantity
 * @returns {Array<object>} a new cart-item list
 */
function setQuantity(items, id, quantity) {
  const qty = Math.floor(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return removeItem(items, id);
  }
  return items.map((it) => (it.id === id ? { ...it, quantity: qty } : it));
}

/**
 * Remove an item from the cart (FR-8).
 * @param {Array<object>} items
 * @param {string} id
 * @returns {Array<object>} a new cart-item list
 */
function removeItem(items, id) {
  return items.filter((it) => it.id !== id);
}

/**
 * Whether the cart has no items (FR-17 guard, FR-16 after clear).
 * @param {Array<object>} items
 * @returns {boolean}
 */
function isEmpty(items) {
  return !Array.isArray(items) || items.length === 0;
}

/**
 * Produce display line items: name, unit price, quantity and line subtotal (FR-9).
 * @param {Array<object>} items
 * @returns {Array<object>} [{ id, name, unitPrice, quantity, subtotal }]
 */
function lineItems(items) {
  return items.map((it) => ({
    id: it.id,
    name: it.name,
    unitPrice: it.price,
    quantity: it.quantity,
    subtotal: Number((it.price * it.quantity).toFixed(2)),
  }));
}

module.exports = { addItem, setQuantity, removeItem, isEmpty, lineItems };
