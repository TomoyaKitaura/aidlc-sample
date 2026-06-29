/* Pure client-side product search/filter logic (intent-003-product-search-filter,
 * unit: product-listing).
 *
 * Technology-agnostic, side-effect-free derivation of the displayed catalogue
 * from a search term + optional inclusive price bounds. No DOM, no I/O, no
 * mutation. Exposed as a dual browser-global / CommonJS module mirroring the
 * api.js convention so the same code is consumed by index.html's inline wiring
 * and by node:test (search-filter.test.js).
 *
 * Business rules implemented (see business-rules.md):
 *   BR-1  search-term normalisation (trim + simple-lowercase; internal
 *         whitespace verbatim; all-whitespace -> "").
 *   BR-2  name-only contiguous, case-insensitive substring match; empty term
 *         matches everything; description/id never consulted.
 *   BR-3  price-bound normalisation (trim; blank/absent -> no bound; else plain
 *         decimal parse; total function, no error path).
 *   BR-4  inclusive price-range predicate; absent bound = no constraint.
 *   BR-5  inverted range (min > max) yields no match as a literal consequence
 *         of BR-4 (no swap / special-casing).
 *   BR-6  AND-intersection of the search and price dimensions.
 *   BR-7  empty / identity criteria -> the full catalogue, in catalogue order.
 */

const SearchFilter = (() => {
  /**
   * BR-3 helper — normalise one raw price bound. Trim; a blank/absent value
   * means the bound is absent (returned as null = "no constraint on that
   * side"); otherwise parse as a plain decimal. Total function: an unparseable
   * value degrades to absent (null), never to an error.
   * @param {string|number|null|undefined} raw
   * @returns {number|null} the numeric bound, or null when absent
   */
  function normaliseBound(raw) {
    if (raw === null || raw === undefined) return null;
    const trimmed = String(raw).trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * BR-1 / BR-3 — build the immutable AppliedFilterCriteria value object from
   * the raw control values. searchTerm is trimmed + simple-lowercased with
   * internal whitespace preserved verbatim (all-whitespace -> ""); each price
   * bound is normalised per normaliseBound (blank/absent -> null).
   * @param {{searchTerm?: string, minPrice?: string|number, maxPrice?: string|number}} [raw]
   * @returns {{searchTerm: string, minPrice: number|null, maxPrice: number|null}}
   */
  function normaliseCriteria(raw = {}) {
    const rawTerm = raw.searchTerm === null || raw.searchTerm === undefined
      ? ''
      : String(raw.searchTerm);
    return {
      searchTerm: rawTerm.trim().toLowerCase(),
      minPrice: normaliseBound(raw.minPrice),
      maxPrice: normaliseBound(raw.maxPrice),
    };
  }

  /**
   * BR-2 — name-only contiguous, case-insensitive substring predicate. An empty
   * search term imposes no constraint (matches everything). Only product.name
   * is consulted; description and id are never matched.
   * @param {{name: string}} product
   * @param {string} searchTerm normalised (already lowercased) term
   * @returns {boolean}
   */
  function matchesSearch(product, searchTerm) {
    if (searchTerm === '' || searchTerm === null || searchTerm === undefined) {
      return true;
    }
    return String(product.name).toLowerCase().includes(searchTerm);
  }

  /**
   * BR-4 / BR-5 — inclusive price-range predicate. An absent (null/undefined)
   * bound imposes no constraint on that side; both ends are inclusive. An
   * inverted range (minPrice > maxPrice) is honoured literally, so no product
   * satisfies it (BR-5) — no swap or special-casing.
   * @param {{price: number}} product
   * @param {number|null} minPrice
   * @param {number|null} maxPrice
   * @returns {boolean}
   */
  function matchesPrice(product, minPrice, maxPrice) {
    const price = product.price;
    if (minPrice !== null && minPrice !== undefined && !(price >= minPrice)) {
      return false;
    }
    if (maxPrice !== null && maxPrice !== undefined && !(price <= maxPrice)) {
      return false;
    }
    return true;
  }

  /**
   * BR-6 / BR-7 — derive the FilteredCatalogue. Returns the products that pass
   * BOTH the search dimension (BR-2) AND the price dimension (BR-4), preserving
   * catalogue order. Empty / identity criteria yields the full catalogue
   * (BR-7). Pure: no mutation of catalogue or any product, no I/O.
   * @param {Array<{name: string, price: number}>} catalogue
   * @param {{searchTerm: string, minPrice: number|null, maxPrice: number|null}} criteria
   * @returns {Array<object>}
   */
  function filterCatalogue(catalogue, criteria) {
    if (!Array.isArray(catalogue)) return [];
    const c = criteria || {};
    const term = c.searchTerm === null || c.searchTerm === undefined ? '' : c.searchTerm;
    const min = c.minPrice === undefined ? null : c.minPrice;
    const max = c.maxPrice === undefined ? null : c.maxPrice;
    return catalogue.filter(
      (product) => matchesSearch(product, term) && matchesPrice(product, min, max),
    );
  }

  return { normaliseCriteria, matchesSearch, matchesPrice, filterCatalogue };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchFilter;
}
