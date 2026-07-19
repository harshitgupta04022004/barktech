# Implementation Phases (Cross-Category)

Aligned with [AUDIT-MASTER.md](./AUDIT-MASTER.md) §8.

---

## Phase 0 — This week (near-zero cost, no new infra)

**Goal:** Stop active trust and conversion damage on live static site.

| Priority | Category | Gap doc | Action |
|----------|----------|---------|--------|
| P0 | 04-conversion-sales | `send-inquiry-dead-cta` | Wire to contact/RFQ with product query param |
| P0 | 04-conversion-sales | `homepage-dead-product-links` | Fix or remove 5 dead `#` cards |
| P0 | 06-b2b-product-experience | `wrong-product-cross-links` | Fix stitching-machine wrong links |
| P0 | 03-content-ux | `model-number-spec-mismatch` | Reconcile FMZ models with sales team |
| P0 | 03-content-ux | `chinese-leftover-spec-text` | Remove 精度 and grep all CJK |
| P0 | 03-content-ux | `duplicated-about-paragraph` | Rewrite About + Motive sections |
| P0 | 03-content-ux | `typos-trust-issues` | Full copy pass + copyright 2026 |
| P0 | 03-content-ux | `inconsistent-navigation` | Remove Quick Buy; unify nav |
| P0 | 02-seo-discoverability | `empty-meta-descriptions` | Write meta for all pages |
| P0 | 02-seo-discoverability | `internal-dead-links` | Link audit + fix |
| P1 | 04-conversion-sales | `inconsistent-cta-labels` | Standardize to "Get a Quote" |
| P1 | 06-b2b-product-experience | `popular-products-sidebar-dead` | Fix sidebar links |
| P1 | 03-content-ux | `ecommerce-quantity-field` | Remove "Quantity: 1" |
| P1 | 07-operations-integration | `heatmap-session-analytics` | Install Microsoft Clarity |

**Exit criteria:** Zero `#` on primary CTAs; zero Chinese in specs; nav consistent.

---

## Phase 1 — 2–4 weeks (infrastructure foundation)

| Priority | Category | Gaps |
|----------|----------|------|
| P0 | 09-database-backend | `no-product-database`, `no-lead-storage`, `no-structured-content-model` |
| P0 | 01-technology-architecture | `static-html-no-cms`, `no-backend-api` |
| P0 | 04-conversion-sales | `forms-not-connected`, `no-rfq-workflow` |
| P1 | 05-security-compliance | `missing-privacy-legal`, `no-spam-protection`, `no-security-headers` |
| P1 | 07-operations-integration | `no-crm-integration`, `email-dmarc-spf-dkim` |
| P1 | 02-seo-discoverability | `missing-sitemap-robots`, `no-structured-data`, `no-canonical-hreflang` |
| P1 | 11-performance-devops | `no-cdn-hosting`, `slow-legacy-assets` |
| P1 | 09-database-backend | `no-public-api-contract` |

**Exit criteria:** Products in Postgres; RFQ in CRM; staging deploy pipeline.

---

## Phase 2 — 4–8 weeks (trust and content)

| Category | Gaps |
|----------|------|
| 03-content-ux | `no-case-studies`, `missing-media-assets` |
| 06-b2b-product-experience | `no-datasheet-downloads`, `flat-product-navigation`, `unstructured-specs`, `per-product-video-gallery` |
| 10-competitive-positioning | `installed-base-counter`, `dealer-agent-network-page`, `fengchi-onezim-benchmark` |
| 07-operations-integration | `no-email-automation` |
| 10-competitive-positioning | `no-multilingual-support` |
| 11-performance-devops | `custom-404-page` |

---

## Phase 3 — 8–12 weeks (AI assistant)

| Category | Gaps |
|----------|------|
| 08-agentic-ai | `no-ai-product-advisor`, `grounded-specs-enforcement`, `hindi-bilingual-ai` |
| 08-agentic-ai | `no-knowledge-base-rag`, `no-conversational-rfq` |
| 08-agentic-ai | `no-agent-observability` |
| 04-conversion-sales | `whatsapp-not-integrated` (formal API + CRM) |
| 07-operations-integration | `no-admin-dashboard` |

**AI build order (from audit):**
1. MVP — structured DB only, conversations logged, human handoff
2. + Vector KB for manuals/FAQs
3. + WhatsApp channel
4. + CRM lead routing

---

## Phase 4 — Ongoing

- SEO content marketing (blog, case studies like Fengchi/BOBST)
- Paid landing pages per product category
- AI accuracy iteration from logged queries
- 07-operations-integration: `no-erp-sync`
- 11-performance-devops: `no-staging-ci-cd` (harden)
- 10-competitive-positioning: `vs-global-oem-gaps`, `missing-digital-story`, `no-unique-differentiator`

---

## Quick reference: audit §2 → gap docs

| Audit finding | Gap doc |
|---------------|---------|
| Send Inquiry → `#` | `04-conversion-sales/gap/send-inquiry-dead-cta.md` |
| Homepage dead cards | `04-conversion-sales/gap/homepage-dead-product-links.md` |
| FMZ model mismatch | `03-content-ux/gap/model-number-spec-mismatch.md` |
| Chinese spec text | `03-content-ux/gap/chinese-leftover-spec-text.md` |
| Fengchi benchmark | `10-competitive-positioning/gap/fengchi-onezim-benchmark.md` |
| Never invent AI specs | `08-agentic-ai/gap/grounded-specs-enforcement.md` |

---

## Production-Ready Implementation Plans (July 2026)

Detailed planning documents created for full production deployment:

### Plan Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Frontend Design | `03-content-ux/FRONTEND-DESIGN-PLAN.md` | UI/UX redesign, design system, animations, PWA |
| Backend Architecture | `09-database-backend/BACKEND-ARCHITECTURE-PLAN.md` | Auth, APIs, admin, file uploads, email, e-commerce |
| Database Schema | `09-database-backend/DATABASE-SCHEMA-PLAN.md` | 23-table schema, migrations, indexing, backups |
| Deployment | `11-performance-devops/DEPLOYMENT-PLAN.md` | Docker, Railway/Render, CI/CD, Nginx, monitoring |
| Product Extension | `06-b2b-product-experience/PRODUCT-EXTENSION-PLAN.md` | Enhanced product pages, galleries, videos, RFQ |

### Implementation Priority

| Step | Task | Duration |
|------|------|----------|
| 1 | Add auth dependencies (python-jose, passlib) | 1 day |
| 2 | Create User model + migration | 1 day |
| 3 | Build JWT auth endpoints | 2 days |
| 4 | Switch to PostgreSQL (or harden SQLite) | 1 day |
| 5 | Set up Docker + deployment config | 1 day |
| 6 | Deploy to Railway/Render | 1 day |
| 7 | Connect custom domain + SSL | 1 day |
| 8 | UI redesign (design system first) | 2 weeks |
| 9 | Admin dashboard with JWT | 1 week |
| 10 | Email notifications | 1 day |
| 11 | Security hardening | 2 days |
| 12 | SEO + analytics | 2 days |

**Estimated Total:** 4-6 weeks for production-ready site

### Cost: $0-5/month

- Domain: Already purchased
- Hosting: Railway/Render free tier
- Database: SQLite or PostgreSQL free tier
- SSL: Included with hosting
- AI: Ollama (local, free)
