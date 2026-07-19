# Gap: No Email Deliverability (SPF, DKIM, DMARC)

## Current state

No documented email authentication for `@barktechnologies.in`.

## Impact

Once RFQ/quote emails send from website:
- May land in spam without SPF/DKIM/DMARC
- Sales misses leads silently

## Severity

**High** (when forms go live)
