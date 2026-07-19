# Strategy: Slow Legacy Assets and Core Web Vitals

## Objective

LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1 on mobile.

## Interim (static site)

- Defer non-critical JS
- Remove duplicate jQuery
- Convert images to WebP; add `width`/`height`
- Self-host fonts with `font-display: swap`
- Enable Cloudflare compression + Brotli

## Production (Next.js)

- `next/image` automatic optimization
- Route-level code splitting
- Font: `next/font` for Montserrat/Open Sans

## Monitoring

- Lighthouse CI on every deploy
- Real User Monitoring (Vercel Analytics or Cloudflare)

## Effort

**Low** (interim) / **Built-in** (Next.js)
