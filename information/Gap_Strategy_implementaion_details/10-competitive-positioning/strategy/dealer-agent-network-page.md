# Strategy: No Dealer / Agent Network Page

## Objective

`/where-we-serve` or `/service-network` page with map and offices.

## Content (start honest)

| Location | Type | Contact |
|----------|------|---------|
| Ghaziabad | Head office + factory | SF-03, Shushat Aquapolis |
| Noida | Branch | F-41, Sec 9 |
| Ahmedabad / Vadodara | Service accommodation | Per about page |

## Enhancements

- Interactive India map with pins
- "Neighbouring countries served" list (if true)
- "Become a dealer" form for future channel partners

## CMS

- `offices` table with lat/lng for map component

## Effort

**Low** (1 page, 2–3 days)

## Status

**COMPLETED** — Implemented as `/where-we-serve` page with:
- Office cards for Ghaziabad, Noida, Ahmedabad/Vadodara
- Google Maps embed
- Installation cities list (11 cities)
- Service promise section (Phone, On-Site, Spare Parts, AMC)
- "Become a Dealer" CTA section
- Route registered in `pages.py`
- Linked from navbar, footer, and homepage
