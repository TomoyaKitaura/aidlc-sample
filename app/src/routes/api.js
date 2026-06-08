'use strict';

/**
 * Mock JSON API router over the domain layers (Layers 1-2).
 *
 * Stateless apart from minting an order id at checkout (Q5). No auth — checkout
 * is guest-only (FR-12). No real payment (FR-13).
 */

const express = require('express');
const products = require('../data/products');
const order = require('../domain/order');

const router = express.Router();

// GET /api/products — full catalogue (FR-1, FR-2).
router.get('/products', (req, res) => {
  res.json(products.getAllProducts());
});

// GET /api/products/:id — single product, 404 if unknown (FR-4, FR-5).
router.get('/products/:id', (req, res) => {
  const product = products.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST /api/orders — place an order (FR-11..FR-15, FR-17).
router.post('/orders', (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];

  // Empty-cart guard (FR-17).
  if (items.length === 0) {
    return res.status(400).json({ error: 'Cannot place an order with an empty cart.' });
  }

  const customer = {
    name: (body.customer && body.customer.name) || '',
    email: (body.customer && body.customer.email) || '',
    address: (body.customer && body.customer.address) || '',
  };

  try {
    // Simulated checkout — mint an order id (FR-13, FR-14).
    const placed = order.buildOrder({ customer, items });
    // Confirmation payload: order id + ordered items (FR-15).
    res.json(placed);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
