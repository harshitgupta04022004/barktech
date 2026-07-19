# Strategy: Homepage Dead Product Card Links

## Objective

Every homepage product card links to a real product page or is removed until page exists.

## Phase 0 actions

| Product | Action |
|---------|--------|
| Has no page yet | Create stub page with image, summary, "Request quote" OR remove from homepage until ready |
| Wrong cross-link | Fix `href` to correct slug |
| Dead `#` | Replace with `our-products.html#{anchor}` or dedicated URL |

## Audit script

```bash
grep -n 'href="#"' barktechnologies.in/index.html
grep -n 'semi-automatic-stitching' barktechnologies.in/index.html
```

## Production

- Homepage pulls from CMS — only `published: true` products appear
- No manual HTML card maintenance

## New product workflow

Don't list on homepage until: page + specs + CTA + image exist.

## Effort

**Low** (1 day content + links) / **Structural fix** with CMS

---

## Status: COMPLETED

### What was done

- All product cards on homepage use database-driven `product_card.html` partial
- Every card links to `/products/{{ product.slug }}` — no dead `#` links
- Products pulled from PostgreSQL via `list_published_products()` service
- Only published products with valid slugs appear on homepage
- No static HTML card maintenance required

### Files involved

- `bark/app/templates/index.html` — Homepage renders products from DB
- `bark/app/templates/partials/product_card.html` — Card partial with correct links
- `bark/app/routers/pages.py` — Home route queries published products
- `bark/app/services/products.py` — Product catalog service
