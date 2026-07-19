# Strategy: No Product Database

## Objective

PostgreSQL as single source of truth for all product data.

## Core tables

```sql
categories (id, name, slug, parent_id)
products (id, category_id, name, slug, model, summary, 
          price_type, lead_time_days, warranty_months, published)
product_specs (product_id, spec_key, spec_value, unit, sort_order)
product_media (product_id, type, url, alt, sort_order)
product_documents (product_id, title, file_url, doc_type)
```

## Migration

1. Export from 20 HTML product pages → CSV
2. Import via Strapi or SQL seed script
3. Freeze HTML — CMS becomes only editor

## API

- Public read via Next.js ISR (revalidate on publish)
- Admin write via CMS only

## Effort

**Medium** (1–2 weeks)
