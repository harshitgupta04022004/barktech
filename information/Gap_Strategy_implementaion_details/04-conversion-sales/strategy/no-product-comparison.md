# Strategy: No Product Comparison Tool

## Objective

Compare up to 3 products on key specs with CTA to quote.

## UX

- Checkbox "Add to compare" on product cards
- Floating compare bar (1/3 selected)
- `/compare?ids=slug1,slug2` table view

## Compare rows (die cutting example)

- Model, max paper size, speed, power, price type, delivery time, warranty

## Data source

- `product_specs` table — same fields for all products in category

## AI synergy

- Agent can call `compare_products` tool and render same table in chat

## Effort

**Medium** (1 week front end + API)

---

## Status: COMPLETED

### What was done

- "Add to compare" checkbox on every product card
- Floating compare bar shows selected count with Clear/Compare buttons
- `/compare?slugs=slug1,slug2` page renders side-by-side spec table
- Up to 3 products compared with dynamic spec matrix (unified key set)
- Products stored in localStorage for persistence across pages
- Back to catalog link on compare page

### Files involved

- `bark/app/templates/partials/compare_bar.html` — Floating compare bar
- `bark/app/templates/partials/product_card.html` — Compare checkbox on cards
- `bark/app/templates/compare.html` — Comparison table template
- `bark/app/static/js/compare.js` — Client-side compare logic (localStorage, UI)
- `bark/app/routers/pages.py` — `/compare` route with spec matrix builder
- `bark/app/services/products.py` — `get_published_products_by_slugs()`, `build_spec_matrix()`
