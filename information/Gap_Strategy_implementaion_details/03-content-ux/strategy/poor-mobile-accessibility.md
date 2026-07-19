# Strategy: Poor Mobile and Accessibility UX

## Objective

WCAG 2.1 AA compliance; mobile-first layout.

## Actions

1. Mobile menu: test all 22 pages on 375px viewport
2. Alt text rule: `{Product name} - {view}` required in CMS
3. Fix floating WhatsApp + social sidebar overlap (z-index, bottom offset)
4. Tap targets ≥ 44px for CTAs
5. Run axe DevTools + Lighthouse accessibility on every template

## Rebuild standards

- shadcn/ui components (accessible by default)
- Skip link, focus states, semantic landmarks

## Success criteria

- Lighthouse Accessibility ≥ 90
- No critical axe violations on homepage + product template

## Effort

**Medium** (included in Next.js rebuild)
