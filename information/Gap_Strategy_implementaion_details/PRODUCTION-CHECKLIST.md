# Production-Readiness Checklist

Track progress toward production launch. Each item links to gap/strategy docs where applicable.

## Infrastructure & hosting

- [ ] CMS or app framework with real backend → `01-technology-architecture/gap/static-html-no-cms.md`
- [ ] HTTPS enforced site-wide
- [ ] CDN (Cloudflare) → `11-performance-devops/gap/no-cdn-hosting.md`
- [ ] Staging + Git version control → `11-performance-devops/gap/no-staging-ci-cd.md`
- [ ] Automated DB + asset backups
- [ ] Uptime monitoring
- [ ] Error logging (Sentry)

## Security

- [ ] Security headers (CSP, HSTS, etc.) → `05-security-compliance/gap/no-security-headers.md`
- [ ] Form spam protection → `05-security-compliance/gap/no-spam-protection.md`
- [ ] API rate limiting (AI endpoints)
- [ ] SPF, DKIM, DMARC for `@barktechnologies.in` → `07-operations-integration/gap/email-dmarc-spf-dkim.md`

## Performance

- [ ] WebP/AVIF images + srcset → `11-performance-devops/gap/slow-legacy-assets.md`
- [ ] Lazy-load below-fold images
- [ ] Core Web Vitals pass (LCP &lt; 2.5s)
- [ ] Minify/bundle CSS and JS

## SEO & discoverability

- [ ] Unique meta title + description per page → `02-seo-discoverability/gap/empty-meta-descriptions.md`
- [ ] schema.org structured data → `02-seo-discoverability/gap/no-structured-data.md`
- [ ] sitemap.xml + robots.txt → `02-seo-discoverability/gap/missing-sitemap-robots.md`
- [ ] Fix all internal dead links → `02-seo-discoverability/gap/internal-dead-links.md`
- [ ] Alt text on all product images
- [ ] Google Business Profile verified

## Content & trust

- [ ] Grammar/spelling + remove duplicates → `03-content-ux/gap/typos-trust-issues.md`
- [ ] Quantified scale signals → `10-competitive-positioning/gap/installed-base-counter.md`
- [ ] Case studies (3–5 minimum) → `03-content-ux/gap/no-case-studies.md`
- [ ] PDF spec sheets per product → `06-b2b-product-experience/gap/no-datasheet-downloads.md`
- [ ] Honest certifications display
- [ ] Dynamic copyright year
- [ ] Single CTA pattern → `04-conversion-sales/gap/inconsistent-cta-labels.md`
- [ ] Fix model/spec mismatches → `03-content-ux/gap/model-number-spec-mismatch.md`
- [ ] Remove Chinese leftover spec text → `03-content-ux/gap/chinese-leftover-spec-text.md`

## Conversion

- [ ] Send Inquiry functional → `04-conversion-sales/gap/send-inquiry-dead-cta.md`
- [ ] Homepage product links fixed → `04-conversion-sales/gap/homepage-dead-product-links.md`
- [ ] Forms wired to CRM/email → `04-conversion-sales/gap/forms-not-connected.md`
- [ ] WhatsApp with product context → `04-conversion-sales/gap/whatsapp-not-integrated.md`

## Legal / compliance

- [ ] Privacy Policy + Terms → `05-security-compliance/gap/missing-privacy-legal.md`
- [ ] Cookie consent banner
- [ ] Form data-handling statement

## Analytics

- [ ] GA4 with conversion goals
- [ ] Heatmap/session tool → `07-operations-integration/gap/heatmap-session-analytics.md`

## AI & data

- [ ] Product database live → `09-database-backend/gap/no-product-database.md`
- [ ] AI assistant MVP → `08-agentic-ai/gap/no-ai-product-advisor.md`

## Polish

- [ ] Custom 404 page → `11-performance-devops/gap/custom-404-page.md`
- [ ] Favicon + web app manifest
- [ ] Consistent navigation → `03-content-ux/gap/inconsistent-navigation.md`
