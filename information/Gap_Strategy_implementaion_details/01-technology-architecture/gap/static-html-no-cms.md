# Gap: Static HTML With No CMS

## Current state

- ~22 hand-maintained `.html` files under `barktechnologies.in/`
- Each product page duplicates header, footer, nav, and scripts
- Adding or updating a machine requires editing multiple files manually

## Evidence

- Separate files: `automatic-die-cutting-and-creasing-machine.html`, `semi-automatic-flute-laminator-machine.html`, etc.
- Shared layout copied per page, not templated

## Impact

| Area | Severity |
|------|----------|
| Maintenance cost | High |
| Content consistency | High |
| Time to launch new product | Days instead of hours |
| Risk of broken links | High (seen after wget mirror) |

## Production blocker?

**Yes** — scaling product catalog without a CMS is not sustainable.
