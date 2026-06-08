'use strict';

/**
 * Order business rules, independent of HTTP (FR-9 total, FR-13 simulated,
 * FR-14 unique order ID, FR-16/17 empty-cart guard).
 */

/**
 * Sum of unit price x quantity across all items (FR-9).
 * @param {Array<object>} items [{ price|unitPrice, quantity }]
 * @returns {number} total, rounded to 2 decimals
 */
function calculateTotal(items) {
  if (!Array.isArray(items)) return 0;
  const total = items.reduce((sum, it) => {
    const unit = typeof it.unitPrice === 'number' ? it.unitPrice : it.price;
    const qty = it.quantity;
    return sum + (Number(unit) || 0) * (Number(qty) || 0);
  }, 0);
  return Number(total.toFixed(2));
}

/**
 * Generate a unique order ID (FR-14). Combines a timestamp with a random
 * suffix so consecutive calls never collide.
 * @returns {string}
 */
function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

/**
 * Build an order from a customer and a non-empty item list.
 * Rejects an empty cart (FR-17) — checkout is simulated, no payment (FR-13).
 * @param {{ customer: object, items: Array<object> }} input
 * @returns {{ orderId: string, items: Array<object>, total: number, customer: object }}
 * @throws {Error} when the item list is empty
 */
function buildOrder({ customer, items } = {}) {
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
    customer: customer || {},
  };
}

module.exports = { calculateTotal, generateOrderId, buildOrder };
