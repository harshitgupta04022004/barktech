# Strategy: No Structured Data (JSON-LD)

## Objective

Valid JSON-LD on all key page types.

## Schemas to implement

| Page | Schema |
|------|--------|
| Home | `Organization` + `LocalBusiness` |
| Product | `Product` with `brand`, `sku` (model), `offers` (price on request) |
| Contact | `LocalBusiness` with address, phone |
| FAQ / AI page | `FAQPage` |
| Breadcrumbs | `BreadcrumbList` |

## Example Product JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Automatic Die Cutting and Creasing Machine",
  "sku": "MY-1500A",
  "brand": { "@type": "Brand", "name": "Bark Technologies" },
  "manufacturer": { "@type": "Organization", "name": "Bark Technologies" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://barktechnologies.in/products/automatic-die-cutting-and-creasing-machine"
  }
}
```

## Validation

- Google Rich Results Test
- CMS auto-inject from product fields

## Effort

**Medium** (2–3 days with CMS integration)

## Status

**Implemented** — JSON-LD structured data added for Organization (homepage), LocalBusiness (contact page), Product (product pages with brand, sku, manufacturer, offers), and BreadcrumbList (product pages). FAQPage not implemented (no FAQ page). All JSON-LD validated with schema.org syntax.
