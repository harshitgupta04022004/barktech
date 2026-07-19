# Strategy: Legacy Frontend Stack

## Objective

Modern, maintainable UI with smaller bundle and better Core Web Vitals.

## Recommended approach

| Current | Replace with |
|---------|--------------|
| Bootstrap 3 | Tailwind CSS 4 + shadcn/ui |
| jQuery plugins | React components (carousel: Embla; lightbox: native dialog) |
| Static HTML | Next.js App Router |

## Migration path

1. **Phase A**: New site in Next.js; keep old site live at subdomain during build
2. **Phase B**: Port visual design (colors: `#243559`, `#db2017`) to Tailwind theme
3. **Phase C**: Remove jQuery entirely; audit JS bundle &lt; 200KB gzipped

## Success criteria

- Lighthouse Performance ≥ 85 mobile
- Zero jQuery on production
- One CSS framework only

## Effort

**High** (3–4 weeks, overlaps CMS rebuild)

## Quick win (interim)

Minify, defer non-critical JS, remove duplicate jQuery on current static site
