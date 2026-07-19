# Strategy: No Spare Parts or Consumables Catalog

## Status: IMPLEMENTED

## Objective

Consumables section with RFQ or light e-commerce.

## Implementation Details

- Created `/spare-parts` page with consumables catalog and machine-specific spares
- 6 consumable categories: Creasing Matrix, Cutting Blades, Rubber Strips, Electrical, Mechanical, Adhesives
- Each category has: icon, description, feature list, RFQ button
- "How to Order" 3-step guide section
- Machine-specific spare parts section (lists all products with links to detail pages)
- Contact CTA section for help finding parts

## Files Created/Modified

- `app/templates/spare_parts.html` — NEW: Spare parts catalog page
- `app/routers/pages.py` — Added `/spare-parts` route
- `app/templates/partials/navbar.html` — Added to Products dropdown
- `app/templates/partials/footer.html` — Added spare parts link

## What Was Done

1. Consumables catalog with 6 categories (matrix, blades, rollers, electrical, mechanical, adhesives)
2. Each category has RFQ button (integrates with existing RFQ modal)
3. "How to Order" guide with 3 steps
4. Machine-specific spares section listing all products
5. Contact CTA for help finding parts
6. Integrated with existing RFQ system

## Phase 2 (Future)

- Link spare parts to parent machine: "Spares for MY-1500A"
- BOM PDF per machine for service teams
- Customer portal: reorder matrix by past PO number
- `Product.type` = `machine` | `consumable` | `spare_part`
- `parent_product_id` for spares

## Effort

**Medium** (Phase 1 low)
