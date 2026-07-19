# Strategy: No Security Headers or Hardening

## Objective

OWASP-recommended headers on all responses.

## Headers (via Cloudflare or Next.js config)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=()
Content-Security-Policy: [see mixed-http strategy]
```

## Admin panel

- Separate subdomain `admin.barktechnologies.in`
- MFA required for CMS users
- Role-based access (editor vs admin)

## Effort

**Low**
