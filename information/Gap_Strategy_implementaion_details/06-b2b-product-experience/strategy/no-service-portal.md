# Strategy: No Service Portal

## Status: IMPLEMENTED

## Objective

Self-service support hub for installed base customers.

## Implementation Details

- Created `/support` page with service request form, FAQ, and contact info
- Service request form submits to existing inquiry API (`/api/v1/inquiries`)
- Form includes: name, email, phone, machine model, request type, location, issue description
- Service types: Repair, Maintenance, Installation, Training, Parts, Warranty, Other
- Quick contact card with phone, email, WhatsApp
- Service hours display
- Service regions with office locations (Ghaziabad, Noida, Ahmedabad)
- FAQ accordion with warranty, maintenance, spare parts, training, manuals

## Files Created/Modified

- `app/templates/support.html` — NEW: Full service portal page
- `app/routers/pages.py` — Added `/support` route
- `app/templates/partials/navbar.html` — Added "Support" nav link
- `app/templates/partials/footer.html` — Added support link

## What Was Done

1. Service request form with honeypot spam protection
2. Form submits to existing inquiry system (source: "service_portal")
3. 5 FAQ items covering warranty, maintenance, delivery, training, manuals
4. Service hours and contact information
5. Service regions with office locations
6. Phone, email, and WhatsApp contact options
7. Success/error feedback on form submission

## Phase 2 (Future)

- Customer login: machine serial, warranty expiry, ticket history
- AMC renewal reminders via email
- Zoho Desk or Freshdesk integration
- Manual PDF downloads by machine model

## Effort

**Medium** (MVP 1–2 weeks)
