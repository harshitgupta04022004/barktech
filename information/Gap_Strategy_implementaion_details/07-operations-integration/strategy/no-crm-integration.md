# Strategy: No CRM Integration

## Objective

Every digital lead auto-creates CRM record with full context.

## Recommended CRM

**Zoho CRM** (India pricing, UDYAM businesses) or HubSpot free tier to start

## Webhook mapping

| Website field | Zoho field |
|---------------|------------|
| name | Lead Name |
| email | Email |
| phone | Phone |
| productSlug | Product Interest (custom) |
| message | Description |
| sourcePage | Lead Source |
| utm_campaign | Campaign |

## Workflows

- New lead → assign by city (Ghaziabad vs Noida vs Ahmedabad)
- SLA: first contact within 4 business hours
- Lost reason codes for reporting

## Effort

**Low–Medium** (2–3 days setup)
