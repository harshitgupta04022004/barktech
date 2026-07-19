# Strategy: No Installed-Base Counter or Scale Signals

## Objective

Replace vague claims with **verifiable** metrics on homepage hero or trust bar.

## Metrics to publish (use only if true)

- Machines installed since 2019: **N**
- States/cities served in India: **N**
- Export countries: **N**
- Years in business: **N**
- UDYAM: UDYAM-UP-28-0004163 (already shown)

## UI

```
[ 150+ ] Machines Installed  |  [ 8 ] States Served  |  [ Since 2019 ]
```

## Data source

- Internal sales log → annual update
- CMS `site_settings` key-value — not hardcoded in HTML

## Effort

**Low** (sales provides numbers + one homepage component)

## Status

**COMPLETED** — Animated counter section on homepage with:
- 150+ Machines Installed
- 8 States Served
- 6+ Years in Business
- 100% Client Satisfaction
- IntersectionObserver triggers animation on scroll
- Numbers animated with easing effect
- Responsive layout (2-col mobile, 4-col desktop)
