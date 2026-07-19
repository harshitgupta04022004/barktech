# Strategy: No AI Product Advisor

## Objective

"Ask Bark AI" widget — guides buyers to correct product(s) with cited specs.

## Agent capabilities

1. Clarifying questions (sheet size, material, speed, budget tier)
2. Recommend 1–3 products with reasoning
3. Compare models on request
4. Create RFQ with conversation context
5. Hand off to human with transcript

## Architecture

```
Chat UI → POST /api/chat (SSE stream)
       → LangGraph agent + tools
       → PostgreSQL products + pgvector RAG (manuals/FAQs)
       → create_rfq tool → CRM
```

## Guardrails

- Never invent prices — "on request" only
- Cite spec source: "Per MY-1500A datasheet: max sheet 1500×1105mm"
- Escalation keyword: "talk to engineer"

## Effort

**High** (3–4 weeks MVP)

## Dependencies

- Structured product DB (`09-database-backend`)
- FAQ + datasheet text in vector index
