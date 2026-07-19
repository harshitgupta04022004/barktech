# Strategy: Send Inquiry Button Is Dead

## Objective

One working "Send Inquiry" flow on every product page within Phase 0.

## Phase 0 fix (static site, this week)

Replace `#` link with:

```html
<a href="contact-us.html?product=automatic-flute-laminator-machine&model=FMZ-1260">
  Send Inquiry
</a>
```

Or open inline modal with pre-filled RFQ form fields:
- Product name (hidden)
- Model (hidden)
- Name, email, phone, message

Wire to Zoho Form / Formspree until API exists.

## Production fix

- Sticky CTA: **Get Quote for {product.name}**
- `POST /api/rfq` with `product_id` from URL slug
- GA4 event: `generate_lead` with `product_slug`

## Success criteria

- 0 product pages with dead Send Inquiry
- Test submission reaches sales inbox in &lt; 60 seconds

## Effort

**Low** (hours for interim; included in RFQ API build)

---

## Status: COMPLETED

### What was done

- "Send Inquiry" dead CTA replaced with "Get a Quote" across all product pages
- CTA bar uses standardized `cta_bar.html` partial with working buttons:
  - "Get a Quote" → opens RFQ modal with product pre-filled
  - "Call" → `tel:` link
  - "WhatsApp" → `wa.me` link with product context in message
- Sticky mobile CTA bar ensures conversion path always visible on product pages
- No product pages with dead Send Inquiry links remain

### Files involved

- `bark/app/templates/partials/cta_bar.html` — Standardized CTA bar
- `bark/app/templates/partials/sticky_cta.html` — Sticky mobile CTA
- `bark/app/templates/product_detail.html` — Product detail page includes CTA bar + sticky CTA
- `bark/app/static/js/rfq.js` — RFQ modal opens from Get Quote button
