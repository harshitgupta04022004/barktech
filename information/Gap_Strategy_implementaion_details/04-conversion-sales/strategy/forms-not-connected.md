# Strategy: Forms Not Connected to Backend

## Objective

Every form submission creates a lead record and notifies sales within 60 seconds.

## MVP (interim — static site)

| Option | Use when |
|--------|----------|
| Zoho Forms embed | Fastest, ties to Zoho CRM |
| Formspree / Getform | Quick API, email notification |
| Google Apps Script | Free, custom to Sheets + email |

## Production

```typescript
// POST /api/rfq
{ name, email, phone, message, productSlug, sourcePage, utm }
→ INSERT leads
→ Zoho CRM webhook
→ Email to sales1@ + service@
→ Optional WhatsApp to rep via Twilio/WATI API
```

## Required fields

- Product context (auto-fill from page URL)
- GDPR/consent checkbox
- honeypot + Turnstile CAPTCHA

## Success criteria

- 0 lost submissions in 30-day test
- Sales confirms receipt &lt; 1 min

## Effort

**Low** (interim) / **Medium** (full API)

---

## Status: COMPLETED

### What was done

- Contact form (`/contact`) submits via `fetch()` to `POST /api/v1/inquiries` with proper payload
- RFQ modal submits via `POST /api/v1/inquiries` with source=`rfq` and structured fields
- Subscribe form in footer submits to same API
- Honeypot field included on all forms for bot protection
- Backend creates `Inquiry` record in PostgreSQL
- Client-side feedback with reference ID display
- Rate limiting: 10 inquiries/hour per IP

### Files modified

- `bark/app/static/js/main.js` — Contact + subscribe form handlers
- `bark/app/static/js/rfq.js` — RFQ modal with structured fields
- `bark/app/routers/api_inquiries.py` — Backend API endpoint
- `bark/app/services/leads.py` — Lead creation service
- `bark/app/models/lead.py` — Inquiry model with RFQ fields
- `bark/app/schemas/lead.py` — Pydantic validation schema
