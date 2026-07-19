# Strategy: Missing Sitemap and robots.txt

## Objective

Valid `robots.txt` + auto-generated `sitemap.xml`.

## robots.txt

```
User-agent: *
Allow: /
Sitemap: https://barktechnologies.in/sitemap.xml
```

## sitemap.xml

- Generate from CMS on build/deploy (Next.js `next-sitemap` plugin)
- Include: home, about, products, blog, contact, creasing matrix
- `lastmod` from CMS `updated_at`
- Priority: home 1.0, products 0.8, blog 0.6

## Steps

1. Add `public/robots.txt` or dynamic route
2. Submit sitemap in Google Search Console
3. Monitor Coverage report weekly

## Effort

**Low** (2–4 hours)

## Status

**Implemented** — `robots.txt` served via `/robots.txt` route with sitemap reference. `sitemap.xml` generated dynamically from database, includes all static pages and published products with lastmod and priority tags. Priority: home 1.0, products 0.8, other pages 0.6. Lastmod for static pages uses current date.
