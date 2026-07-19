# Strategy: Duplicate jQuery Libraries

## Objective

Single jQuery version on interim static site; zero jQuery on new site.

## Interim fix (static site)

1. Remove `jquery-1.8.2.js` from all HTML files
2. Keep only `jquery-1.12.4.min.js` before dependent plugins
3. Test: carousel, meanmenu, form-validator, venobox

## Long-term fix

Eliminate jQuery in Next.js rebuild (preferred).

## Verification

- Browser console: no `$` conflicts
- All interactive features work on mobile menu and sliders

## Effort

**Low** (1–2 hours interim) / **Included** in full rebuild
