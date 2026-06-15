'use strict';

/**
 * Static-site build script (intent-002-static-frontend-github-pages-ci,
 * unit: static-frontend).
 *
 * Responsibilities (infrastructure-design TD-3/TD-4/TD-5,
 * deployment-architecture build steps 3-4):
 *   1. Build-Time Catalogue Generation: require the single source of truth
 *      (app/src/data/products.js) and serialize getAllProducts() to
 *      dist/products.json (FR-1, FR-2, NFR-2). Normalize each product's
 *      root-absolute image path (/images/placeholder.svg) to a relative form
 *      (images/placeholder.svg) so the catalogue is sub-path portable
 *      (FR-7, NFR-4).
 *   2. dist/ assembly by allowlist construction: copy only app/public/** into
 *      app/dist/ (TD-5, FR-10). server.js, src/, test/, node_modules are never
 *      copied.
 *   3. Normalize root-absolute in-site references in copied *.html to relative
 *      so the site works under a GitHub Pages repo sub-path /<repo>/ (Q1, FR-7,
 *      NFR-4). No build-time repo-name input is required (TD-4).
 *
 * Dependency-free CommonJS, Node 20 fs APIs. Brownfield conventions: 'use
 * strict', 2-space indent, single quotes, semicolons (Q7).
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = __dirname;
const PUBLIC_DIR = path.join(APP_DIR, 'public');
const DIST_DIR = path.join(APP_DIR, 'dist');

const { getAllProducts, PLACEHOLDER_IMAGE } = require('./src/data/products.js');

/**
 * Normalize a root-absolute, in-site reference value to a relative one so it
 * resolves correctly under a sub-path. Leaves external (http/https///,
 * protocol-relative, mailto, anchors) and already-relative references alone.
 * A bare root link ('/') becomes 'index.html'.
 * @param {string} value the raw href/src value
 * @returns {string}
 */
function normalizeRef(value) {
  if (value === '/') return 'index.html';
  // Only rewrite same-origin root-absolute references ("/..." but not "//...").
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value.slice(1);
  }
  return value;
}

/**
 * Rewrite root-absolute in-site references in an HTML document (both static
 * markup and the href/src strings built inside inline scripts) to relative
 * form. Matches double- and single-quoted href= and src= attributes and the
 * string-concatenated equivalents used by the inline scripts (e.g.
 * 'href="/product.html?id='). (Q1; FR-7, NFR-4.)
 * @param {string} html
 * @returns {string}
 */
function normalizeHtml(html) {
  // Match href= / src= followed by an opening quote and a root-absolute value.
  // The value runs until the next quote of EITHER type. This handles both
  // ordinary attributes (`href="/cart.html"`, closed by the same quote) and the
  // string-concatenated attributes inside inline scripts
  // (`'<a href="/product.html?id=' + ...`, where the attribute value's closing
  // boundary is the JS string literal's quote of the other type). The trailing
  // quote is not consumed, so the original closing/boundary quote is preserved.
  return html.replace(
    /\b(href|src)=(["'])(\/[^"']*)/g,
    (match, attr, quote, value) => attr + '=' + quote + normalizeRef(value),
  );
}

/** Recursively remove a directory if it exists. */
function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Recursively copy app/public into dist by allowlist construction (only the
 * public tree is ever read), normalizing *.html references during the copy.
 * @param {string} srcDir
 * @param {string} destDir
 */
function copyPublic(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyPublic(srcPath, destPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, normalizeHtml(html));
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Serialize the catalogue to dist/products.json, normalizing each product's
 * root-absolute image path to a relative form on serialization only (Q2; the
 * source module stays the single source of truth — FR-1, NFR-2).
 */
function writeCatalogue() {
  const products = getAllProducts().map((p) => ({
    ...p,
    image: normalizeRef(p.image),
  }));
  fs.writeFileSync(
    path.join(DIST_DIR, 'products.json'),
    JSON.stringify(products, null, 2) + '\n',
  );
  return products;
}

function main() {
  cleanDir(DIST_DIR);
  copyPublic(PUBLIC_DIR, DIST_DIR);
  const products = writeCatalogue();
  // eslint-disable-next-line no-console
  console.log(
    'Build complete: assembled ' +
      path.relative(APP_DIR, DIST_DIR) +
      '/ with products.json (' +
      products.length +
      ' products). PLACEHOLDER_IMAGE source=' +
      PLACEHOLDER_IMAGE +
      ' -> ' +
      normalizeRef(PLACEHOLDER_IMAGE) +
      '.',
  );
}

main();
