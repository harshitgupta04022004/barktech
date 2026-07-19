# Strategy: Weak CTA and Conversion Funnel

## Objective

Multi-step conversion path with tracked events.

## Funnel stages

| Stage | CTA | Action |
|-------|-----|--------|
| Awareness | Download datasheet | Email gate → nurture |
| Consideration | Compare models | Session + RFQ later |
| Decision | Get quote | Full RFQ form |
| Urgent | Call / WhatsApp | Click-to-call tracking |

## Per product page

- Sticky bar: `Get Quote for MY-1500A` | `WhatsApp` | `Download PDF`
- Exit-intent modal (optional): "Need specs emailed?"

## Analytics events (GA4)

- `generate_lead`, `click_call`, `download_datasheet`, `chat_started`

## Effort

**Medium** (UX + tracking)

---

## Status: COMPLETED

### What was done

- Multi-step conversion funnel with tracked events:
  - **Awareness:** Product cards link to detail pages with specs
  - **Consideration:** Compare tool for side-by-side spec evaluation
  - **Decision:** Structured RFQ form with product pre-fill
  - **Urgent:** Call (tel:) and WhatsApp with click tracking
- Sticky mobile CTA bar on product pages (Get Quote | Call | WhatsApp)
  - Appears when in-page CTA bar scrolls out of viewport
  - Uses IntersectionObserver for smart show/hide
- GA4 funnel events implemented:
  - `generate_lead` — on RFQ and contact form submissions
  - `click_call` — on call button clicks
  - `chat_started` — on WhatsApp button clicks
- Subscribe form in footer connected to API (was non-functional)

### Files modified

- `bark/app/templates/partials/sticky_cta.html` — Sticky mobile CTA bar (new)
- `bark/app/templates/partials/cta_bar.html` — GA4 event data attributes
- `bark/app/templates/product_detail.html` — Includes sticky CTA partial
- `bark/app/static/js/main.js` — Funnel tracking + sticky CTA IntersectionObserver
- `bark/app/static/js/rfq.js` — GA4 generate_lead event on RFQ submit
- `bark/app/static/css/theme.css` — Sticky CTA bar styles
