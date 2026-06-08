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

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();

// Parse JSON request bodies (for POST /api/orders).
app.use(express.json());

// Mock JSON API.
app.use('/api', apiRouter);

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
