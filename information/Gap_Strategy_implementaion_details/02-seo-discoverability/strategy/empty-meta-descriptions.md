# Strategy: Empty Meta Descriptions

## Objective

Unique, keyword-rich meta description (150–160 chars) on every indexable page.

## Template per product page

```
{Product Name} by Bark Technologies — {key spec}. Manufacturer & supplier in India. 
Warranty, specs & quote. Call +91 8810597980.
```

## Example

**Automatic Die Cutting Machine (MY-1500A)**  
`Automatic die cutting & creasing machine MY-1500A, max sheet 1500×1105mm. Bark Technologies, Ghaziabad. Get price & delivery quote.`

## Implementation

1. CMS field: `seo_description` required before publish
2. Backfill all 22 pages from product summary + top spec
3. Validate with Screaming Frog or Lighthouse SEO audit

## Success criteria

- 0 pages with empty meta description
- Organic CTR improvement tracked in GSC after 90 days

## Effort

**Low** (1 day content work + CMS validation)

## Status

**Implemented** — All templates have unique meta descriptions via `{% block meta_description %}`. Product pages use `product.meta_description` with fallback to `product.summary`. Validation ensures meta_title and meta_description are required before publish.
