# Strategy: Weak Title Tags and Heading Structure

## Objective

SEO-optimized, unique `<title>` and single H1 per page.

## Title formula

```
{Product Name} {Model} | Bark Technologies — {Category}
```

Example: `Automatic Die Cutting Machine MY-1500A | Bark Technologies — Post Press`

## Heading rules

- One H1 per page = primary keyword
- H2 for sections: Specifications, Features, Applications, Request Quote
- Model number in H1 or first paragraph

## CMS enforcement

- Required fields: `seo_title`, `h1`, max length validators
- Preview SERP snippet in admin

## Effort

**Low** (content + CMS fields)

## Status

**Implemented** — All pages have unique `<title>` tags following pattern "{Page Name} | Bark Technologies". Product pages use `product.meta_title` with fallback to product.name. Each page has a single H1 tag. Heading structure follows H1 > H2 hierarchy. Model numbers included in product titles where available.
