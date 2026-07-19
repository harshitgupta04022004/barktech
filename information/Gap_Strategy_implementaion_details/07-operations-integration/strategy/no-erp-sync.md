# Strategy: No ERP or Inventory Sync

## Objective

Accurate lead times and order status from business system.

## Options for Indian SMB

| ERP | Integration |
|-----|-------------|
| Tally | Export + manual / third-party connector |
| Zoho Books | Native Zoho CRM sync |
| SAP B1 | API for larger scale |

## Website display

- `lead_time_days` from ERP or manual override in CMS with `as_of` date
- Phase 2: customer portal order status

## When to implement

After CRM + 50+ monthly digital RFQs

## Effort

**High** (depends on ERP)
