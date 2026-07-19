# Strategy: Inconsistent Product Naming

## Objective

Canonical product name, slug, and SKU in one database record.

## Naming standard

```
Display name: Semi-Automatic Flute Laminator Machine
Slug: semi-automatic-flute-laminator-machine
Model: [from spec table]
Category: Flute Laminating
```

## Rules

- Title Case for display; kebab-case for URLs
- One image folder path pattern: `/media/products/{slug}/`
- Redirect map for all legacy `.html` URLs

## Deliverable

`products.json` or CMS export as naming authority for marketing, website, and AI agent.

## Effort

**Low** (with CMS migration)
