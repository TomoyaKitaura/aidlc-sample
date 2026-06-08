'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const order = require('../src/domain/order');

test('calculateTotal sums unit price x quantity (FR-9)', () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5.5, quantity: 3 },
  ];
  assert.strictEqual(order.calculateTotal(items), 36.5);
});

test('calculateTotal accepts unitPrice field and rounds to 2 decimals (FR-9)', () => {
  const items = [{ unitPrice: 14.5, quantity: 3 }];
  assert.strictEqual(order.calculateTotal(items), 43.5);
});

test('calculateTotal of empty list is 0', () => {
  assert.strictEqual(order.calculateTotal([]), 0);
});

test('generateOrderId returns unique ids across calls (FR-14)', () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i += 1) {
    ids.add(order.generateOrderId());
  }
  assert.strictEqual(ids.size, 1000);
});

test('buildOrder rejects an empty cart (FR-17)', () => {
  assert.throws(() => order.buildOrder({ customer: {}, items: [] }), /empty cart/i);
  assert.throws(() => order.buildOrder({ customer: {} }), /empty cart/i);
});

test('buildOrder returns order id, items and total for a valid cart (FR-14, FR-15, FR-9)', () => {
  const result = order.buildOrder({
    customer: { name: 'Ada', email: 'ada@example.com', address: '1 Loop St' },
    items: [
      { id: 'p1', name: 'Lamp', price: 39.99, quantity: 1 },
      { id: 'p3', name: 'Mug', price: 14.5, quantity: 2 },
    ],
  });
  assert.match(result.orderId, /^ORD-/);
  assert.strictEqual(result.items.length, 2);
  assert.strictEqual(result.total, 68.99);
  assert.strictEqual(result.customer.name, 'Ada');
  assert.strictEqual(result.items[0].unitPrice, 39.99);
});
