# Strategy: Static HTML With No CMS

## Objective

Single content source for all pages; non-developers can update products.

## Recommended approach

1. **Adopt headless CMS** — Strapi (self-hosted) or Sanity for products, pages, blog, FAQs
2. **Rebuild front end** — Next.js 15 with dynamic routes: `/products/[slug]`, `/blog/[slug]`
3. **Migrate content** — Script to parse existing HTML spec tables into CMS entries (one-time)

## Implementation steps

| Step | Action | Owner |
|------|--------|-------|
| 1 | Define content types: Product, Category, Page, BlogPost, CaseStudy | Tech |
| 2 | Import 20+ products from current HTML | Tech |
| 3 | Build layout components (Header, Footer, RFQ bar) once | Tech |
| 4 | Retire duplicate HTML files after parity check | Tech + Sales |

## Success criteria

- New product publishable in &lt; 30 minutes without code deploy
- Header/footer change applies site-wide from one place

## Effort

**Medium** (2–3 weeks with Next.js + Strapi)

## Dependencies

- Database schema (see `09-database-backend`)
