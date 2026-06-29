'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const SearchFilter = require('../public/js/search-filter');

// Inline fixture mirroring the products.js shape ({ id, name, price,
// image, description }) so the tests have no external data coupling. Prices
// chosen to exercise the boundary cases; names mirror the real catalogue so the
// documented "e" AND price<=50 -> 4 products example is exact.
const CATALOGUE = [
  { id: 'p1', name: 'Aurora Desk Lamp', price: 39.99, description: 'A warm desk lamp.' },
  { id: 'p2', name: 'Nimbus Wireless Headphones', price: 129.0, description: 'Noise cancelling.' },
  { id: 'p3', name: 'Terra Ceramic Mug', price: 14.5, description: 'Hand-glazed mug.' },
  { id: 'p4', name: 'Drift Cotton Throw Blanket', price: 49.95, description: 'Cotton throw.' },
  { id: 'p5', name: 'Pulse Mechanical Keyboard', price: 89.0, description: 'Hot-swappable switches.' },
  { id: 'p6', name: 'Verde Succulent Trio', price: 24.0, description: 'Three succulents.' },
];

const ids = (products) => products.map((p) => p.id);

/* ---- BR-1 — search-term normalisation ---- */

test('BR-1 normaliseCriteria trims and simple-lowercases the term', () => {
  assert.strictEqual(normTerm('  Aurora  '), 'aurora');
  assert.strictEqual(normTerm('LAMP'), 'lamp');
});

test('BR-1 normaliseCriteria preserves internal whitespace verbatim', () => {
  assert.strictEqual(normTerm('  Desk   Lamp  '), 'desk   lamp');
});

test('BR-1 normaliseCriteria maps an all-whitespace term to the empty string', () => {
  assert.strictEqual(normTerm('     '), '');
  assert.strictEqual(normTerm('\t \n'), '');
});

test('BR-1/BR-3 normaliseCriteria absent/blank fields produce identity criteria', () => {
  const c = SearchFilter.normaliseCriteria({});
  assert.strictEqual(c.searchTerm, '');
  assert.strictEqual(c.minPrice, null);
  assert.strictEqual(c.maxPrice, null);
});

function normTerm(raw) {
  return SearchFilter.normaliseCriteria({ searchTerm: raw }).searchTerm;
}

/* ---- BR-3 — price-bound normalisation ---- */

test('BR-3 normaliseCriteria parses plain decimals and treats blank as absent', () => {
  const c = SearchFilter.normaliseCriteria({ minPrice: ' 10.5 ', maxPrice: '   ' });
  assert.strictEqual(c.minPrice, 10.5);
  assert.strictEqual(c.maxPrice, null);
});

/* ---- BR-2 — name-only contiguous case-insensitive substring ---- */

test('BR-2 matchesSearch is case-insensitive on the name', () => {
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'aurora'), true);
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'AURORA'.toLowerCase()), true);
});

test('BR-2 matchesSearch matches a multi-word contiguous substring only', () => {
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'desk lamp'), true);
  // Out-of-order / non-contiguous does not match.
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'lamp desk'), false);
});

test('BR-2 matchesSearch consults name only, never description or id', () => {
  // "warm" appears in the description but not the name -> no match.
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'warm'), false);
  // "p1" is the id but not in the name -> no match.
  assert.strictEqual(SearchFilter.matchesSearch(CATALOGUE[0], 'p1'), false);
});

test('BR-2 matchesSearch with empty term matches every product', () => {
  for (const p of CATALOGUE) {
    assert.strictEqual(SearchFilter.matchesSearch(p, ''), true);
  }
});

/* ---- BR-4 — inclusive price range, absent bounds, exact boundaries ---- */

test('BR-4 matchesPrice is inclusive at the exact min boundary', () => {
  assert.strictEqual(SearchFilter.matchesPrice({ price: 14.5 }, 14.5, null), true);
});

test('BR-4 matchesPrice is inclusive at the exact max boundary', () => {
  assert.strictEqual(SearchFilter.matchesPrice({ price: 49.95 }, null, 49.95), true);
});

test('BR-4 matchesPrice excludes prices outside an active bound', () => {
  assert.strictEqual(SearchFilter.matchesPrice({ price: 13 }, 14.5, null), false);
  assert.strictEqual(SearchFilter.matchesPrice({ price: 60 }, null, 49.95), false);
});

test('BR-4 matchesPrice with both bounds absent matches any price', () => {
  assert.strictEqual(SearchFilter.matchesPrice({ price: 0 }, null, null), true);
  assert.strictEqual(SearchFilter.matchesPrice({ price: 9999 }, null, null), true);
});

/* ---- BR-5 — inverted range yields no match ---- */

test('BR-5 matchesPrice with an inverted range (min > max) matches nothing', () => {
  for (const p of CATALOGUE) {
    assert.strictEqual(SearchFilter.matchesPrice(p, 100, 10), false);
  }
});

test('BR-5 filterCatalogue with an inverted range yields an empty result', () => {
  const criteria = SearchFilter.normaliseCriteria({ minPrice: '100', maxPrice: '10' });
  assert.deepStrictEqual(SearchFilter.filterCatalogue(CATALOGUE, criteria), []);
});

/* ---- BR-6 — AND-intersection of the two dimensions ---- */

test('BR-6 filterCatalogue excludes a name match that is out of the price range', () => {
  // "headphones" matches p2 (129.0) but max 50 excludes it -> empty.
  const criteria = SearchFilter.normaliseCriteria({ searchTerm: 'headphones', maxPrice: '50' });
  assert.deepStrictEqual(ids(SearchFilter.filterCatalogue(CATALOGUE, criteria)), []);
});

test('BR-6 filterCatalogue excludes an in-range product that fails the name match', () => {
  // p3 (14.5) is within <=50 but does not contain "lamp" -> only p1 remains.
  const criteria = SearchFilter.normaliseCriteria({ searchTerm: 'lamp', maxPrice: '50' });
  assert.deepStrictEqual(ids(SearchFilter.filterCatalogue(CATALOGUE, criteria)), ['p1']);
});

test('BR-2/BR-4/BR-6 documented example: name contains "e" AND price <= 50 -> 4 products', () => {
  const criteria = SearchFilter.normaliseCriteria({ searchTerm: 'e', maxPrice: '50' });
  const result = SearchFilter.filterCatalogue(CATALOGUE, criteria);
  assert.deepStrictEqual(ids(result), ['p1', 'p3', 'p4', 'p6']);
});

/* ---- BR-7 — full-catalogue default + order preservation ---- */

test('BR-7 filterCatalogue with empty criteria returns the full catalogue in order', () => {
  const criteria = SearchFilter.normaliseCriteria({});
  const result = SearchFilter.filterCatalogue(CATALOGUE, criteria);
  assert.deepStrictEqual(ids(result), ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
});

test('BR-7 filterCatalogue with an all-whitespace term and blank bounds returns the full catalogue', () => {
  const criteria = SearchFilter.normaliseCriteria({ searchTerm: '   ', minPrice: '', maxPrice: '' });
  const result = SearchFilter.filterCatalogue(CATALOGUE, criteria);
  assert.deepStrictEqual(ids(result), ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
});

test('BR-6/BR-7 filterCatalogue preserves catalogue order in a narrowed result', () => {
  const criteria = SearchFilter.normaliseCriteria({ minPrice: '20', maxPrice: '90' });
  // p1 39.99, p4 49.95, p5 89.0, p6 24.0 -> in catalogue order p1, p4, p5, p6.
  assert.deepStrictEqual(ids(SearchFilter.filterCatalogue(CATALOGUE, criteria)), ['p1', 'p4', 'p5', 'p6']);
});

test('filterCatalogue does not mutate the input catalogue', () => {
  const snapshot = JSON.parse(JSON.stringify(CATALOGUE));
  SearchFilter.filterCatalogue(CATALOGUE, SearchFilter.normaliseCriteria({ searchTerm: 'mug' }));
  assert.deepStrictEqual(CATALOGUE, snapshot);
});
