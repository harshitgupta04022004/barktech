# Strategy: Inconsistent Main Navigation

## Objective

Identical nav on every page from shared template/component.

## Standard nav (recommended)

```
Home | About Us | All Products | Creasing Matrix | News | Contact
```

## Remove

- **Quick Buy** — replace with **Get a Quote** in header OR remove entirely (quote via product pages)
- Fix `quick-buy.html` 404 — either build page or delete all links

## Implementation

- Single `Header.tsx` or CMS "site settings" nav array
- CI test: nav HTML identical across all routes

## Effort

**Low** (1 hour static) / **Included** in rebuild
