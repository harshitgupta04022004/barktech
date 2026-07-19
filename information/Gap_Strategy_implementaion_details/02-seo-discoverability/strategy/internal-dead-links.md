# Strategy: Internal Dead Links Hurt SEO and UX

## Objective

Zero broken internal links on production.

## Phase 0

```bash
# Install linkinator or use Screaming Frog
npx linkinator http://localhost:8080 --recurse
```

Fix list prioritized:
1. Send Inquiry → RFQ/contact with query params
2. Homepage `#` cards → correct pages or remove
3. Quick Buy → remove or replace
4. Social footer → absolute external URLs everywhere

## Ongoing

- CI: `linkinator` on staging before deploy; fail on 404
- Monthly GSC "Page indexing" + Crawl errors review

## Effort

**Low** (audit + fixes)

## Status

**Implemented** — All internal links use proper paths (e.g., `/products`, `/about`). No `href="#"` found. Social links use absolute URLs from site_settings (facebook_url, linkedin_url, etc.). Quick Buy page removed; Send Inquiry replaced with RFQ modal.
