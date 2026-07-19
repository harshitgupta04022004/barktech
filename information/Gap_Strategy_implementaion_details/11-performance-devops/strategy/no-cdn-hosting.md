# Strategy: No CDN or Production Hosting Strategy

## Objective

Global CDN, 99.9% uptime, automated deploys.

## Recommended stack

| Layer | Service |
|-------|---------|
| DNS + CDN + WAF | Cloudflare |
| Front end | Vercel (Next.js) |
| API + DB | Railway / Supabase (Mumbai region if available) |
| Media | Cloudflare R2 or S3 + CDN |
| Email | Resend |

## Domain

- `barktechnologies.in` → production
- `staging.barktechnologies.in` → preview deploys

## SSL

- Cloudflare Full (strict) + auto-renew

## Effort

**Low** (1 day setup)
