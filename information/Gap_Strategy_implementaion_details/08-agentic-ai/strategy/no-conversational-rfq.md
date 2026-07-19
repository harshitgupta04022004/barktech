# Strategy: No Conversational RFQ from Chat

## Objective

User completes quote request inside AI chat; sales gets structured payload.

## Flow

1. Agent qualifies: product, qty, city, timeline
2. Agent calls `create_rfq({ ... })`
3. User confirms contact details
4. CRM deal + email to sales with **full chat transcript**

## Tool definition

```json
{
  "name": "create_rfq",
  "parameters": {
    "product_ids": ["uuid"],
    "quantity": 1,
    "company": "string",
    "city": "string",
    "phone": "string",
    "email": "string",
    "notes": "string"
  }
}
```

## Replace vs augment WATI

- Phase 1: Keep WATI for WhatsApp; add web AI for product Q&A
- Phase 2: Unified inbox (Zoho + web chat + WhatsApp)

## Effort

**Medium** (with agent MVP)
