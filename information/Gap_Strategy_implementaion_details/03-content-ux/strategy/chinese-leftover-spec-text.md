# Strategy: Chinese Leftover Text in Spec Tables

## Objective

English-only (or Hindi) spec labels; professional industrial terminology.

## Phase 0

1. `grep -r '精度\|[\u4e00-\u9fff]' barktechnologies.in/` across all HTML
2. Replace with clean labels: `Lamination Accuracy`, `Precision`, etc.
3. Sales review full spec table for other OEM artifacts

## Production

- CMS spec keys use English `spec_key` + optional `spec_label_hi`
- Publish blocked if spec value matches regex for CJK characters (unless intentionally bilingual doc)

## Broader cleanup

- Remove Alibaba-style formatting
- Standardize units: mm, kW, sheets/hr, gsm

## Effort

**Low** (1–2 hours grep + edit)
