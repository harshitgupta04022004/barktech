# Strategy: No Lead and Conversation Storage

## Objective

Persist all business-critical interactions.

## Tables

```sql
leads (id, name, email, phone, company, city, source, 
       status, utm_json, created_at)
rfq_items (lead_id, product_id, quantity, notes)
conversations (id, session_id, lead_id, channel, started_at)
messages (conversation_id, role, content, tool_calls_json, created_at)
```

## Retention

- Leads: indefinite (CRM sync)
- Chat logs: 24 months (GDPR/DPDP review)
- PII encryption at rest (Supabase default)

## Backups

- Daily automated backups; test restore monthly

## Effort

**Low** (with API layer)
