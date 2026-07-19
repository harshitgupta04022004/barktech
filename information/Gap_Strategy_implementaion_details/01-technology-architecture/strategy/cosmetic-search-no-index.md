# Strategy: Cosmetic Search With No Product Index

## Objective

Functional search across products, models, and spec keywords.

## MVP solution

1. **Client-side** (interim): JSON index of products embedded or fetched from `/api/products/search?q=`
2. **Production**: PostgreSQL full-text search or Algolia/Meilisearch

## Features

- Search by product name, model (MY-1500A), category (die cutting, laminator)
- Autocomplete in header
- Dedicated `/search?q=` results page

## Implementation

```sql
CREATE INDEX products_search_idx ON products
  USING gin(to_tsvector('english', name || ' ' || model || ' ' || summary));
```

## Success criteria

- "flute laminator" returns relevant machines in &lt; 200ms
- Search analytics logged for sales insights

## Effort

**Low** (Meilisearch) to **Medium** (custom API)
