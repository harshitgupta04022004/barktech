# Strategy: WhatsApp Not Integrated With Product Context

## Objective

WhatsApp opens with pre-filled message including product, page URL, and model.

## Implementation

```html
<a href="https://wa.me/918810597980?text=Hi%2C%20I%20need%20a%20quote%20for%20{productName}%20({model})%20-%20{pageUrl}">
```

## Product page

- Dynamic `messageText` in WATI config from CMS: `Hello, I have a question about {{product_name}} model {{model}}`
- Keep WATI or replace with direct `wa.me` links + CRM logging via UTM

## Log leads

- On click: `POST /api/events` { type: 'whatsapp_click', productSlug }

## UI fix

- Social sidebar `bottom: 110px`; WhatsApp `z-index` above sidebar

## Effort

**Low**

---

## Status: COMPLETED

### What was done

- WhatsApp links now include product context in pre-filled message:
  - Format: `Hi, I need a quote for {product.name} - {page_url}`
  - Applied on CTA bar (product pages) and sticky mobile CTA
- Generic WhatsApp link on social float for homepage/general contact
- Product-specific WhatsApp messages help sales identify which machine buyer wants
- No more generic "Message Us" without product context on product pages

### Files modified

- `bark/app/templates/partials/cta_bar.html` — Product context in WhatsApp URL
- `bark/app/templates/partials/sticky_cta.html` — Product context in mobile WhatsApp link
- `bark/app/templates/partials/social_float.html` — General WhatsApp link (unchanged)
