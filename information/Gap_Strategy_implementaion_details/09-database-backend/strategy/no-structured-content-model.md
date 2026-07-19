# Strategy: No Structured Content Model

## Objective

Unified content types in CMS linked to products.

## Content types

| Type | Relations |
|------|-----------|
| Product | category, specs, media, documents |
| CaseStudy | products[], location, client_name |
| BlogPost | optional product tags |
| FAQ | category, product optional |
| Office | city, address, phone (for locator) |
| Page | about, legal, landing |

## Benefits

- One API for website + AI RAG + future mobile app
- Version history and draft/publish workflow

## Effort

**Medium** (CMS schema design — 3–5 days)
