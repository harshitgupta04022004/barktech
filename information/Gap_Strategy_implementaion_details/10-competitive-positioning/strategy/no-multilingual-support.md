# Strategy: No Multilingual Support

## Objective

English + Hindi in Phase 1; expand based on export focus.

## Implementation

- Next.js i18n: `/en/products/...`, `/hi/products/...`
- CMS: translatable fields for name, summary, description
- Hindi product names for key machines (sales team input)
- hreflang tags (see SEO strategy)

## Priority pages in Hindi

1. Homepage
2. Top 5 products by revenue
3. Contact + RFQ form labels

## Effort

**Medium** (translation + CMS setup)

## Status

**PARTIALLY COMPLETED** — Foundation implemented:
- Language switcher (EN/HI) in navbar with dropdown
- localStorage-based language persistence
- Hindi translations dictionary for navigation elements
- hreflang tags added to base.html (`en`, `hi`, `x-default`)
- SEO service generates Hindi hreflang URLs
- `data-i18n` attribute system for translating elements
- **TODO**: Full Hindi page translations (homepage, products, contact)
- **TODO**: Hindi product names from sales team input
