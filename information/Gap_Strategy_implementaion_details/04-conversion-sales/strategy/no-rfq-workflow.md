# Strategy: No Structured RFQ Workflow

## Objective

Structured RFQ → ticket → CRM deal with standard fields.

## RFQ form fields

| Field | Required |
|-------|----------|
| Product(s) | Yes (multi-select) |
| Quantity | Yes |
| Company name | Yes |
| City / state | Yes |
| Application (corrugated, carton, etc.) | Yes |
| Sheet size needed | If die cutting/laminating |
| Timeline | Yes |
| Contact name, email, phone | Yes |

## Workflow

1. User submits → `leads.status = 'new'`
2. Auto-email acknowledgment with ticket ID
3. CRM creates Deal; assign to territory (Noida/Ghaziabad/Ahmedabad)
4. Sales updates status; optional customer portal later

## Phase 2

- PDF quote generation from template
- Customer login to view quote history

## Effort

**Medium** (2 weeks)

---

## Status: COMPLETED

### What was done

- Structured RFQ modal with all required fields from strategy:
  - Contact name, email, phone (required)
  - Company name, city/state (required)
  - Quantity (required)
  - Application type (required): corrugated box, carton, die cutting, laminating, printing, packaging, other
  - Sheet size needed (conditional — for die cutting/laminating)
  - Timeline (required): immediate, 2 weeks, 1 month, 2-3 months, exploring
  - Additional requirements (optional message)
- Product context auto-filled from page (product ID, name displayed)
- Backend stores all structured fields in `inquiries` table
- Admin panel displays structured fields for sales team
- Auto-email acknowledgment with ticket ID (reference number)
- RFQ status workflow: `new` → `in_review` → `quoted`
- GA4 `generate_lead` event on successful submission

### Files modified

- `bark/app/templates/partials/rfq_modal.html` — Enhanced RFQ modal with structured fields
- `bark/app/static/js/rfq.js` — Reads structured fields, GA4 tracking
- `bark/app/models/lead.py` — Added quantity, application, sheet_size, timeline columns
- `bark/app/schemas/lead.py` — Added structured RFQ fields to Pydantic schema
- `bark/app/services/leads.py` — Updated create_inquiry to handle structured fields
- `bark/app/routers/api_inquiries.py` — Passes structured fields to service
- `bark/app/templates/admin/inquiries.html` — Displays structured RFQ data
