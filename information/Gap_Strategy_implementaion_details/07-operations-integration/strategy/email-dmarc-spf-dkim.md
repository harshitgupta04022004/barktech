# Strategy: No Email Deliverability (SPF, DKIM, DMARC)

## Objective

Quote and notification emails reach inbox reliably.

## DNS records (example — adjust per provider)

| Record | Purpose |
|--------|---------|
| SPF TXT | Authorize Resend/SendGrid/Zoho to send |
| DKIM | Cryptographic signing |
| DMARC | Policy `p=quarantine` or `p=none` initially |

## Providers

- **Resend** or **Zoho Mail** for transactional RFQ ack
- Use same domain: `noreply@barktechnologies.in`, `sales@barktechnologies.in`

## Verification

- mail-tester.com score ≥ 8/10
- Send test RFQ to Gmail + Outlook

## Effort

**Low** (DNS + provider setup, half day)
