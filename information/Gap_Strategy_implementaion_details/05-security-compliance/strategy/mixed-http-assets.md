# Strategy: Mixed HTTP and Insecure Asset References

## Objective

All assets HTTPS; HSTS enabled on production.

## Actions

1. Audit: `grep -r 'http://' site/` — replace with `https://` or relative paths
2. Cloudflare SSL: Full (strict)
3. Enable HSTS header: `max-age=31536000; includeSubDomains`
4. Self-host fonts and critical third-party CSS

## CSP (Content-Security-Policy)

Start with report-only mode, then enforce:
- `script-src` allowlist: self, gtag, WATI, chat provider only

## Effort

**Low**
