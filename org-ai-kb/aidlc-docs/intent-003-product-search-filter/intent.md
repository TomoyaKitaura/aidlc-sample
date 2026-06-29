# Intent

## Prompt

商品検索・絞り込み機能を追加したい

## Summary

Add product search and filtering capability to the existing sample EC site (the `app/` codebase produced by intent-001-sample-ec-site). Today the catalogue is presented as a single flat list — the frontend fetches the full product set (via `GET /api/products` / the static data layer) and renders every product with no way to narrow it down. This intent adds the ability for shoppers to find products by searching (e.g. by name/keyword) and to filter/narrow the catalogue (e.g. by attributes such as price), so they can locate items of interest without scrolling the whole list. The work extends the existing product-listing experience and its supporting data access; the existing checkout/cart flows are unaffected.

## Slug

product-search-filter

## Type

feature
