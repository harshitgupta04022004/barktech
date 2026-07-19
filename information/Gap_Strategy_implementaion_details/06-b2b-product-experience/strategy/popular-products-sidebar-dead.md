# Strategy: Popular Products Sidebar Dead Links

## Status: ALREADY FIXED

## Objective

Sidebar shows 3–5 related products with working links.

## Implementation Details

- `get_related_products()` in `products.py` service handles related products
- First checks `RelatedProduct` table for explicit relationships
- Falls back to same-category products if no explicit relations
- Product detail template renders related products as cards with working links
- Cards use `product.slug` for URLs — no dead `#` links

## How It's Fixed

- `product_detail.html` includes related products section at bottom
- `product_service.get_related_products(db, product)` returns 3 related products
- Each card uses `partials/product_card.html` with proper link
- Alt text uses `product.name` from database

## Production

```sql
-- related products by category
SELECT * FROM products 
WHERE category_id = :current_category 
AND id != :current_id 
LIMIT 4;
```

CMS field: `related_product_ids[]` for manual override (via `RelatedProduct` model).

## Also fixed

- Thumbnail `alt` text with product name
- Related products section only shows when products exist

## Effort

**Low** (static fix) / **Low** (dynamic with CMS)
