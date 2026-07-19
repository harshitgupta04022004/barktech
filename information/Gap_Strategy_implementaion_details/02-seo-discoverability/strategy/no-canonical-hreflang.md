# Strategy: No Canonical URLs or hreflang

## Objective

One canonical URL per page; optional Hindi expansion.

## Canonical rules

- Prefer: `https://barktechnologies.in/products/die-cutting` (no `.html`, trailing slash policy consistent)
- 301 redirect all legacy `.html` URLs to clean URLs
- Canonical tag on every page pointing to preferred URL

## hreflang (Phase 2)

```
<link rel="alternate" hreflang="en" href="https://barktechnologies.in/en/..." />
<link rel="alternate" hreflang="hi" href="https://barktechnologies.in/hi/..." />
<link rel="alternate" hreflang="x-default" href="https://barktechnologies.in/..." />
```

## Implementation

1. Next.js middleware for redirects
2. CMS translations table for Hindi product names/descriptions
3. Start with top 5 products + homepage in Hindi

## Effort

**Low** (canonical) / **Medium** (hreflang + translations)

## Status

**Implemented (canonical) / Pending (hreflang Hindi)** — Canonical URLs added to all pages via `<link rel="canonical">` using path without query string. Legacy `.html` URLs redirect via 301. hreflang tags added for English and x-default (same URL). Hindi hreflang pending translation implementation.
