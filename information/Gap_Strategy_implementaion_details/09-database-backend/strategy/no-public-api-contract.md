# Strategy: No Public API Contract

## Objective

Documented REST API for web, AI agent, and future integrations.

## MVP endpoints

```
GET    /api/v1/products
GET    /api/v1/products/:slug
GET    /api/v1/categories
POST   /api/v1/rfq
POST   /api/v1/chat
GET    /api/v1/faqs
POST   /api/v1/events  (analytics)
```

## Standards

- OpenAPI 3.1 spec in repo `docs/openapi.yaml`
- JSON error format: `{ error, code, message }`
- Pagination: `?page=&limit=` on list endpoints

## Auth

- Public read: no key
- Admin: API key or JWT
- Rate limits per IP

## Effort

**Low** (document as you build)
