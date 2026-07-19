# Strategy: No Knowledge Base for RAG

## Objective

Vector-indexed knowledge base synced with CMS.

## Content sources

| Source | Chunk strategy |
|--------|----------------|
| Product specs | One chunk per product summary + spec table |
| PDF datasheets | Page-level chunks |
| FAQ | Q+A pairs |
| Sales playbook | "When to recommend semi vs auto" rules |
| Case studies | Per install story |

## Stack

- **Embeddings**: OpenAI `text-embedding-3-small`
- **Store**: pgvector in PostgreSQL
- **Sync**: On CMS publish → re-embed changed documents

## Quality

- Human review queue for AI answers with low confidence
- Monthly eval set: 50 real buyer questions + expected products

## Effort

**Medium** (2 weeks with product DB ready)
