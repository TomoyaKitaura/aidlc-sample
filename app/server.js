'use strict';

/**
 * Sample EC site server (NFR-1, NFR-2, NFR-4).
 *
 * One Express process serves:
 *   - the static frontend + local SVG images from public/
 *   - a mock, in-memory JSON API under /api
 *
 * No database, no payment gateway, no external services.
 */

const path = require('path');
const express = require('express');
const apiRouter = require('./src/routes/api');
const { getAllProducts } = require('./src/data/products');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();

// Parse JSON request bodies (for POST /api/orders).
app.use(express.json());

// Mock JSON API.
app.use('/api', apiRouter);

// Build-generated catalogue parity (NFR-2 / BR-14): the static frontend reads a
// relative products.json (app/build.js serialises getAllProducts() to
// dist/products.json for the GitHub Pages build). The static dir below has no
// products.json, so serve the live in-memory catalogue here — same path and
// shape the build emits — so the page loads under the Express server too. Each
// product's root-absolute image path is normalised to a relative form exactly
// as build.js does, keeping the two delivery modes equivalent. No data
// duplication: this reads the single source of truth in ./src/data/products.
// Placed before express.static so it wins over any (absent) static file.
app.get('/products.json', (req, res) => {
  const products = getAllProducts().map((p) => ({
    ...p,
    image: p.image && p.image.startsWith('/') && !p.image.startsWith('//')
      ? p.image.slice(1)
      : p.image,
  }));
  res.json(products);
});

// Static frontend (HTML/CSS/JS) and local SVG images.
app.use(express.static(PUBLIC_DIR));

// Minimal 404 handler (Q4 minimal error handling).
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('404 — Not found');
});

// Minimal JSON error handler with console logging (Q4).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err && err.message ? err.message : err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only listen when run directly, so the app can be imported in tests.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sample EC site running at http://localhost:${PORT}`);
  });
}

module.exports = app;
