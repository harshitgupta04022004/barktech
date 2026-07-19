# Strategy: Inconsistent CTA Labels and Behavior

## Objective

One primary CTA + one secondary CTA site-wide.

## Standard pattern

| Priority | Label | Action |
|----------|-------|--------|
| Primary | **Get a Quote** | RFQ form (product pre-filled) |
| Secondary | **Call +91 8810597980** | `tel:` link |
| Tertiary | **WhatsApp** | `wa.me` with product in message |

Retire: "Send Inquiry" as separate label — merge into **Get a Quote**.

## Design spec

- Red button (`#db2017`), same size on product cards and detail pages
- Sticky mobile bar on product pages: Quote | Call | WhatsApp

## Rollout

1. Update component/template once
2. CMS enforces CTA block — not editable per page arbitrarily

## Effort

**Low** (design decision + template update)

---

## Status: COMPLETED

### What was done

- Standardized CTA pattern across all product pages and cards:
  - **Primary:** "Get a Quote" (red accent `#db2017`) → opens RFQ modal with product pre-filled
  - **Secondary:** "Call +91 8810597980" → `tel:` link
  - **Tertiary:** "WhatsApp" → `wa.me` link with product context
- Single `cta_bar.html` partial used on all product detail pages
- Same CTA buttons in navbar (Get Quote) and topbar (Call Now)
- Sticky mobile CTA bar on product pages for thumb-reachable conversion
- "Send Inquiry" as separate label retired — merged into "Get a Quote"

### Files modified

- `bark/app/templates/partials/cta_bar.html` — Standardized CTA bar with product context
- `bark/app/templates/partials/sticky_cta.html` — Sticky mobile CTA bar (new)
- `bark/app/templates/partials/navbar.html` — Nav "Get Quote" button
- `bark/app/static/css/theme.css` — Sticky CTA styles
