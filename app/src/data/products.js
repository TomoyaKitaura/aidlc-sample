'use strict';

/**
 * Mock product catalogue — fixed, in-memory data (FR-1, FR-2, FR-4, FR-10).
 *
 * Every product is permanently orderable; there is no stock or inventory
 * concept (FR-10, A-2). Images reference a local SVG placeholder served from
 * /images/ so the app needs no network (FR-2, FR-4, A-4).
 *
 * A single fixed catalogue is sufficient for the sample (A-6).
 */

const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

const PRODUCTS = [
  {
    id: 'p1',
    name: 'Aurora Desk Lamp',
    price: 39.99,
    image: PLACEHOLDER_IMAGE,
    description: 'A warm, dimmable LED desk lamp with a minimalist aluminium body.',
  },
  {
    id: 'p2',
    name: 'Nimbus Wireless Headphones',
    price: 129.0,
    image: PLACEHOLDER_IMAGE,
    description: 'Over-ear headphones with active noise cancellation and 30h battery.',
  },
  {
    id: 'p3',
    name: 'Terra Ceramic Mug',
    price: 14.5,
    image: PLACEHOLDER_IMAGE,
    description: 'Hand-glazed 350ml ceramic mug, microwave and dishwasher safe.',
  },
  {
    id: 'p4',
    name: 'Drift Cotton Throw Blanket',
    price: 49.95,
    image: PLACEHOLDER_IMAGE,
    description: 'Soft 100% cotton throw, 130x170cm, woven in a herringbone pattern.',
  },
  {
    id: 'p5',
    name: 'Pulse Mechanical Keyboard',
    price: 89.0,
    image: PLACEHOLDER_IMAGE,
    description: 'Compact 75% mechanical keyboard with hot-swappable tactile switches.',
  },
  {
    id: 'p6',
    name: 'Verde Succulent Trio',
    price: 24.0,
    image: PLACEHOLDER_IMAGE,
    description: 'A set of three low-maintenance succulents in matte stone pots.',
  },
];

/**
 * Return the full product catalogue (FR-1).
 * @returns {Array<object>} copies of the product records.
 */
function getAllProducts() {
  return PRODUCTS.map((p) => ({ ...p }));
}

/**
 * Return a single product by id, or null if unknown (FR-4).
 * @param {string} id
 * @returns {object|null}
 */
function getProductById(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  return product ? { ...product } : null;
}

module.exports = { getAllProducts, getProductById, PLACEHOLDER_IMAGE };
