# Strategy: Wrong Product Cross-Links

## Status: ALREADY FIXED

## Objective

Zero cross-links where product A card opens product B page.

## Implementation Details

- Product cards are now rendered dynamically from database via `product_card.html` partial
- Each card links to `/products/{{ product.slug }}` — no manual href wiring possible
- Product list, homepage, and related products all use the same dynamic partial
- Sidebar in product detail page uses `get_related_products()` which queries by category

## How It's Fixed

- `index.html` renders products from `product_service.list_published_products()`
- `product_list.html` renders from same service with pagination
- `product_detail.html` related products section uses `get_related_products()`
- All links generated from `product.slug` — no hardcoded cross-links

## Prevention (production)

- Product cards rendered from CMS by `slug` — impossible to wire wrong URL manually
- CI check: crawl internal links, fail build on 404

## QA checklist

- [x] Every homepage product card opens matching product page title
- [x] Popular Products sidebar links verified (uses get_related_products)
- [x] No card points to `#`

## Effort

**Low** (1–2 hours)
