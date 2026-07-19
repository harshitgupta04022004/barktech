# Gap: Model Number Mismatch (Banner vs Spec Table)

## Current state

Product hero/summary shows different model numbers than the technical specification table on the same page.

## Evidence — `automatic-flute-laminator-machine.html`

| Location | Models listed |
|----------|---------------|
| Header bullet | FMZ-1260, FMZ-1450, FMZ-1700 |
| Spec table columns | FMZ-1450H, FMZ-1600H |

## Evidence — `high-speed-automatic-flute-laminator-machine.html`

| Location | Models listed |
|----------|---------------|
| Header bullet | FMZ-1450H, FMZ-1700H |
| Spec table | FMZ-1450H, FMZ-1700H (may align) but column headers inconsistent with standard line |

## Impact

- Capital-equipment buyers **will notice** — destroys manufacturer credibility
- Root cause: two hand-edited strings with no single source of truth

## Severity

**P0 — Critical** (trust / data integrity)
