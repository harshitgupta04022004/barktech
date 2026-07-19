# Strategy: Model Number Mismatch (Banner vs Spec Table)

## Objective

One canonical model list per product; banner and table render from same data.

## Phase 0 (manual cleanup)

1. Sales/engineering confirms correct models per machine
2. Update header `<ul>` and spec table to match
3. Split into separate product pages if FMZ-1450H and FMZ-1600H are truly different SKUs

## Production (structural fix)

```
products (id, name, slug)
product_variants (product_id, model_code, ...)  -- optional if multi-model page
product_specs (variant_id OR product_id, spec_key, spec_value)
```

Template renders:
- Banner: `variants.map(v => v.model_code).join(', ')`
- Table: columns from `variants`, rows from `product_specs`

## AI rule

Agent must read `product_specs` + `variants` — never paraphrase from marketing copy alone.

## Verification

- Content QA checklist before publish: "banner models ⊆ spec table models"

## Effort

**Low** (manual fix) / **Included** in DB migration
