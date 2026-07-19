# Gap: Legacy Frontend Stack

## Current state

- Bootstrap **3.3.5/3.3.6** (2015-era)
- jQuery **1.8.2** and **1.12.4** loaded on same pages
- Multiple unused or overlapping plugins: owl.carousel, isotope, stellar, venobox, magnific

## Evidence

From `index.html`:
- `css/bootstrap.min.css`
- `js/jquery-1.8.2.js` and `js/vendor/jquery-1.12.4.min.js`
- 15+ script/CSS includes in `<head>`

## Impact

| Area | Severity |
|------|----------|
| Performance | Medium–High |
| Security (old deps) | Medium |
| Developer hiring | Hard to find jQuery/Bootstrap3 skills |
| Mobile UX | Suboptimal vs modern CSS |

## Production blocker?

**No** for launch, **Yes** for long-term maintainability
