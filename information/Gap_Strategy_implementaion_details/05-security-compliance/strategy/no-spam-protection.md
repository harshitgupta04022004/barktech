# Strategy: No Form Spam Protection

## Objective

Block bots without hurting real B2B users.

## Layers

1. **Cloudflare Turnstile** on RFQ and contact forms
2. **Honeypot field** `website` hidden via CSS
3. **Rate limit**: 5 submissions / IP / hour on `/api/rfq`
4. **Email validation** + disposable domain blocklist

## Monitoring

- Alert if &gt; 20 RFQs/hour (anomaly)

## Effort

**Low** (half day)
