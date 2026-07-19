# Database Schema Reference (from Audit §6)

Canonical schema for migration. Detail: `09-database-backend/`.

## Entity relationship

```
CATEGORIES ──< PRODUCTS ──< PRODUCT_SPECS
                ├──< PRODUCT_IMAGES
                ├──< PRODUCT_DOCUMENTS
                ├──< PRODUCT_VARIANTS (optional, multi-model pages)
                ├──< INQUIRIES
                └──< CASE_STUDIES (many-to-many via join table)

CUSTOMERS ──< INQUIRIES
```

## INQUIRIES.source values

Track lead channel (audit requirement):

| Value | Description |
|-------|-------------|
| `web_form` | Contact / callback form |
| `rfq` | Structured quote request |
| `ai_chat` | Agentic assistant |
| `whatsapp` | WhatsApp widget / API |
| `phone` | Manual entry from call |

## Key design: PRODUCT_SPECS as key/value

Prevents FMZ banner vs table mismatch — one row per spec, rendered everywhere.

## Stack (audit recommendation)

| Layer | Choice |
|-------|--------|
| DB | PostgreSQL + pgvector |
| CMS | Strapi or custom admin |
| Assets | Cloudflare R2 / S3 |
| API | Node (Fastify) or Go (Gin) |
| Cache | Redis (optional) |

## Migration

1. Parse 15+ HTML product pages → seed script
2. **Fix specs during import** (Chinese text, model mismatch)
3. Retire static HTML product files

See: `09-database-backend/strategy/no-product-database.md`
