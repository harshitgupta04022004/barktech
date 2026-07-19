# Strategy: Unstructured Product Specifications

## Status: ALREADY IMPLEMENTED

## Objective

Normalized spec key-value store per product.

## Implementation Details

- `ProductSpec` model in `models/product.py` with `spec_key`, `spec_value`, `unit`, `sort_order`
- Specs stored in `product_specs` table with proper indexing
- Admin CRUD supports adding/editing specs per product
- `spec_table.html` partial renders specs as structured table
- Compare page builds spec matrix from product specs
- JSON-LD structured data includes specs

## Schema (already in production)

```sql
product_specs (product_id, spec_key, spec_value, unit, display_order, spec_group)
-- max_paper_size | 1500×1105 | mm | 1 | general
-- max_speed      | 4500      | sheets/hr | 2 | general
```

## Display

- `spec_table.html` renders specs as striped table
- Same visual, structured data underneath
- Spec groups supported via `spec_group` column

## Enables

- Filters (spec-based faceted search — future)
- Compare (already working via `build_spec_matrix`)
- AI tools (structured data queryable)
- JSON-LD `additionalProperty` (future)

## Effort

**Medium** (migration + CMS UI) — DONE
