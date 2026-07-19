# Strategy: No Backend or API Layer

## Objective

API layer for forms, products, chat, and admin.

## Recommended stack

- **API**: Next.js Route Handlers or NestJS
- **Database**: PostgreSQL (Supabase or Neon)
- **Auth**: Clerk or NextAuth for admin only (public site mostly open)

## Core endpoints (MVP)

```
GET  /api/products
GET  /api/products/:slug
POST /api/rfq
POST /api/chat
GET  /api/health
```

## Implementation steps

1. Provision PostgreSQL + connection pooling
2. Implement RFQ POST → insert `leads` + `rfq_items` → webhook to CRM
3. Add rate limiting (Upstash Redis or middleware)
4. Deploy API on same domain as site (`/api/*`)

## Success criteria

- Every form submission stored with timestamp and source page
- 99.9% API uptime on production

## Effort

**Medium** (1–2 weeks after DB schema exists)
