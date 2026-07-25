// ================================================================
// BARK TECHNOLOGIES - PRODUCTION SCHEMA v5
// Machinery catalog + leads/RFQ + invoicing + CMS + news +
// Ad campaigns via Claude Ads MCP + creative design via Canva MCP
// Conventions: UTC DATETIME, DECIMAL for money, soft review workflow
//
// Auth model:
//   - JWT access + refresh tokens with family-based rotation
//   - RBAC: admin (full access) / client (own data only)
//   - API scopes for external integrations (Claude Ads MCP, etc.)
//   - Agent invoice tools use scopes invoices:read / invoices:write
//     (native LangGraph tools → InvoiceService; PDF on-demand WeasyPrint)
//
// Roles:
//   admin  — full CRUD on every resource, user management, exports,
//            AI chat with create_invoice + generate_invoice_pdf tools
//   client — can view own profile, own inquiries, own invoices;
//            can submit RFQs, download datasheets, chat with AI
// ================================================================

// 1. AUTH, RBAC & JWT ---------------------------------------------

// -- ROLES --------------------------------------------------------

roles {
  id          INT           PK
  name        VARCHAR(50)   UQ  *
  description VARCHAR(200)  ??
  is_active   BOOLEAN       *  [default: true]
  created_at  DATETIME      *  [default: now()]
}

// -- PERMISSIONS --------------------------------------------------
// Granular permissions using resource:action naming.
// 'module' groups permissions for admin UI display.
// Invoice agent tools require: invoices:read, invoices:write
// (create_invoice / generate_invoice_pdf / get_invoice_stats).

permissions {
  id          INT           PK
  code        VARCHAR(100)  UQ  *
  module      VARCHAR(50)   *
  description VARCHAR(200)  ??
  is_active   BOOLEAN       *  [default: true]
  created_at  DATETIME      *  [default: now()]
}

// -- ROLE <-> PERMISSION (M:M) ------------------------------------

role_permissions {
  role_id       INT      PK  [ref: > roles.id]
  permission_id INT      PK  [ref: > permissions.id]
  created_at    DATETIME *   [default: now()]
}

// -- USERS --------------------------------------------------------

users {
  id             INT           PK
  email          VARCHAR(200)  UQ  *
  phone          VARCHAR(20)   UQ  ??
  password_hash  VARCHAR(200)  ??
  full_name      VARCHAR(200)  *
  role_id        INT           *  [ref: > roles.id]
  is_active      BOOLEAN       *  [default: true]
  is_verified    BOOLEAN       *  [default: false]
  avatar_url     VARCHAR(500)  ??
  company        VARCHAR(200)  ??
  google_id      VARCHAR(100)  UQ  ??
  last_login_at  DATETIME      ??
  created_at     DATETIME      *  [default: now()]
  updated_at     DATETIME      *  [default: now()]
}

// -- USER <-> ROLE (M:M) ------------------------------------------
// Allows a user to hold multiple roles if needed in future.

user_roles {
  user_id    INT       PK  [ref: > users.id]
  role_id    INT       PK  [ref: > roles.id]
  created_at DATETIME  *   [default: now()]
}

// -- SESSIONS (browser / mobile) ----------------------------------

user_sessions {
  id          INT           PK
  user_id     INT           FK  [ref: > users.id]
  token_hash  VARCHAR(200)  UQ  *
  ip_address  VARCHAR(45)   ??
  user_agent  VARCHAR(500)  ??
  expires_at  DATETIME      *
  revoked_at  DATETIME      ??
  created_at  DATETIME      *  [default: now()]
}

// -- JWT ACCESS + REFRESH TOKENS ----------------------------------
// Flow:
//   1. Login  -> access_token + refresh_token issued, row inserted
//   2. Access expires -> client uses refresh_token to get new pair
//   3. On refresh: old row revoked, new row created (same family)
//   4. If a revoked refresh token is reused -> entire family revoked

jwt_tokens {
  id              INT           PK
  user_id         INT           FK  [ref: > users.id]
  token_hash      VARCHAR(200)  UQ  *
  token_type      VARCHAR(10)   *  [note: "access|refresh"]
  token_version   INT           *  [default: 1]
  token_family    VARCHAR(100)  *
  ip_address      VARCHAR(45)   ??
  user_agent      VARCHAR(500)  ??
  scopes          JSON          ??
  expires_at      DATETIME      *
  revoked_at      DATETIME      ??
  replaced_by     INT           ??  [ref: > jwt_tokens.id]
  created_at      DATETIME      *  [default: now()]
}

// -- VERIFICATION TOKENS ------------------------------------------

verification_tokens {
  id         INT           PK
  user_id    INT           FK  [ref: > users.id]
  token_hash VARCHAR(200)  UQ  *
  type       VARCHAR(30)   *  [note: "email_verify|phone_verify|password_reset|otp"]
  expires_at DATETIME      *
  used_at    DATETIME      ??
  created_at DATETIME      *  [default: now()]
}

// -- API TOKENS (external integrations) ---------------------------

api_tokens {
  id              INT           PK
  name            VARCHAR(100)  *
  token_hash      VARCHAR(200)  UQ  *
  user_id         INT           ??  [ref: > users.id]
  role_id         INT           ??  [ref: > roles.id]
  ip_whitelist    JSON          ??
  rate_limit      INT           [default: 1000]
  expires_at      DATETIME      ??
  last_used_at    DATETIME      ??
  revoked_at      DATETIME      ??
  is_active       BOOLEAN       *  [default: true]
  created_at      DATETIME      *  [default: now()]
  updated_at      DATETIME      *  [default: now()]
}

// -- API TOKEN <-> SCOPE (M:M) ------------------------------------

api_token_scopes {
  token_id    INT           PK  [ref: > api_tokens.id]
  scope_code  VARCHAR(100)  PK  [ref: > permissions.code]
  granted_at  DATETIME      *   [default: now()]
}

// 2. PRODUCT CATALOG ----------------------------------------------

categories {
  id         INT           PK
  name       VARCHAR(200)  *
  slug       VARCHAR(200)  UQ  *
  parent_id  INT           ??  [ref: > categories.id]
  sort_order INT           [default: 0]
  is_active  BOOLEAN       *  [default: true]
}

products {
  id               INT           PK
  category_id      INT           ??  [ref: > categories.id]
  name             VARCHAR(300)  *
  slug             VARCHAR(300)  UQ  *
  models           VARCHAR(500)  ??
  summary          TEXT          *
  description      TEXT          ??
  lead_time_days   VARCHAR(50)   ??
  warranty_months  INT           ??
  published        BOOLEAN       *  [default: false]
  published_at     DATETIME      ??
  meta_title       VARCHAR(300)  ??
  meta_description VARCHAR(500)  ??
  review_status    VARCHAR(20)   *  [default: "draft", note: "draft|in_review|approved|rejected"]
  review_notes     TEXT          ??
  reviewed_by      INT           ??  [ref: > users.id]
  reviewed_at      DATETIME      ??
  llm_extracted_data JSON        ??
  created_by       INT           ??  [ref: > users.id]
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

product_specs {
  id         INT           PK
  product_id INT           FK  [ref: > products.id]
  spec_key   VARCHAR(200)  *
  spec_value TEXT          *
  unit       VARCHAR(50)   ??
  sort_order INT           [default: 0]
}

product_media {
  id               INT           PK
  product_id       INT           FK  [ref: > products.id]
  media_type       VARCHAR(10)   *  [note: "image|video"]
  provider         VARCHAR(20)   *  [default: "upload", note: "upload|youtube|vimeo"]
  url              VARCHAR(500)  *
  thumbnail_url    VARCHAR(500)  ??
  title            VARCHAR(200)  ??
  alt_text         VARCHAR(300)  ??
  duration_seconds INT           ??
  is_primary       BOOLEAN       [default: false]
  sort_order       INT           [default: 0]
  is_active        BOOLEAN       *  [default: true]
  created_at       DATETIME      *  [default: now()]
}

product_documents {
  id              INT           PK
  product_id      INT           FK  [ref: > products.id]
  title           VARCHAR(300)  ??
  file_url        VARCHAR(500)  *
  doc_type        VARCHAR(50)   [default: "datasheet", note: "datasheet|manual|brochure|certificate"]
  file_size_bytes INT           ??
  language        VARCHAR(10)   [default: "en"]
  sort_order      INT           [default: 0]
  download_count  INT           *  [default: 0]
}

related_products {
  product_id INT  PK  [ref: > products.id]
  related_id INT  PK  [ref: > products.id]
}

site_settings {
  key   VARCHAR(100)  PK
  value TEXT          ??
}

// 3. LEADS / RFQ ---------------------------------------------------

inquiries {
  id           INT           PK
  name         VARCHAR(200)  *
  email        VARCHAR(200)  *
  phone        VARCHAR(50)   ??
  company      VARCHAR(200)  ??
  city         VARCHAR(100)  ??
  product_id   INT           ??  [ref: > products.id]
  message      TEXT          ??
  source       VARCHAR(20)   *  [default: "web_form", note: "web_form|rfq|ai_chat|whatsapp|phone|email|ad_campaign"]
  status       VARCHAR(20)   [default: "new", note: "new|contacted|quoted|won|lost|spam"]
  priority     VARCHAR(20)   [default: "normal", note: "low|normal|high|urgent"]
  subject      VARCHAR(300)  ??
  quantity     INT           ??
  utm_source   VARCHAR(100)  ??
  utm_medium   VARCHAR(100)  ??
  utm_campaign VARCHAR(200)  ??
  assigned_to  INT           ??  [ref: > users.id]
  extra_data   JSON          ??
  created_at   DATETIME      *  [default: now()]
  updated_at   DATETIME      *  [default: now()]
}

rfq_items {
  id           INT           PK
  inquiry_id   INT           FK  [ref: > inquiries.id]
  product_id   INT           ??  [ref: > products.id]
  product_name VARCHAR(300)  ??
  quantity     INT           *
  notes        TEXT          ??
  created_at   DATETIME      *  [default: now()]
}

// 4. INVOICES ------------------------------------------------------
// PDF generation: on-demand via Python InvoiceService.generate_pdf
// (WeasyPrint + Jinja2). No PDF blob column required.
// Agent path: native LangGraph tools create_invoice + generate_invoice_pdf
// return a download URL — not Invoice MCP. Optional pdf_url caches last render.

invoices {
  id               INT           PK
  invoice_number   VARCHAR(50)   UQ  *
  inquiry_id       INT           ??  [ref: > inquiries.id]
  customer_name    VARCHAR(200)  *
  customer_email   VARCHAR(200)  ??
  customer_phone   VARCHAR(50)   ??
  customer_company VARCHAR(200)  ??
  customer_address TEXT          ??
  customer_gst     VARCHAR(20)   ??
  ship_to_address  TEXT          ??
  mode_of_delivery VARCHAR(100)  ??
  dispatch_from    VARCHAR(100)  ??
  transport_details VARCHAR(200) ??
  delivery_basis   VARCHAR(200)  ??  [note: "e.g. TRANSPORT TO PAY BASIS R/O"]
  ref_attended_by  VARCHAR(200)  ??
  currency         CHAR(3)       *  [default: "INR"]
  subtotal         DECIMAL(12,2) *  [default: 0]
  gst_amount       DECIMAL(12,2) *  [default: 0]
  total            DECIMAL(12,2) *  [default: 0]
  amount_in_words  VARCHAR(500)  ??
  bank_name        VARCHAR(200)  ??
  bank_address     VARCHAR(300)  ??
  bank_account_no  VARCHAR(100)  ??
  bank_ifsc_code   VARCHAR(50)   ??
  bank_swift_code  VARCHAR(50)   ??
  status           VARCHAR(20)   [default: "draft", note: "draft|sent|paid|partially_paid|overdue|cancelled"]
  notes            TEXT          ??
  terms            TEXT          ??
  due_date         DATETIME      ??
  paid_at          DATETIME      ??
  pdf_url          VARCHAR(500)  ??  [note: "optional cached S3/R2 or app path after generate_invoice_pdf"]
  pdf_generated_at DATETIME      ??
  created_by       INT           ??  [ref: > users.id]
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

invoice_items {
  id          INT           PK
  invoice_id  INT           FK  [ref: > invoices.id]
  product_id  INT           ??  [ref: > products.id]
  description VARCHAR(500)  *
  hsn_code    VARCHAR(20)   ??
  quantity    DECIMAL(10,2) *  [default: 1]
  unit_price  DECIMAL(12,2) *  [default: 0]
  gst_rate    DECIMAL(5,2)  *  [default: 0]
  amount      DECIMAL(12,2) *  [default: 0]
  sort_order  INT           [default: 0]
}

invoice_sequences {
  year        INT  PK
  last_number INT  [default: 0]
}

// 5. STOCK / INVENTORY ----------------------------------------------

product_stocks {
  id              INT           PK
  product_id      INT           UQ  FK  [ref: > products.id]
  quantity        INT           *  [default: 0]
  unit            VARCHAR(20)   [default: "units"]
  min_stock       INT           [default: 5]
  max_stock       INT           [default: 1000]
  location        VARCHAR(200)  ??
  notes           TEXT          ??
  last_updated_by INT           ??  [ref: > users.id]
  updated_at      DATETIME      *  [default: now()]
  created_at      DATETIME      *  [default: now()]
}

stock_logs {
  id              INT           PK
  stock_id        INT           FK  [ref: > product_stocks.id]
  action          VARCHAR(20)   *  [note: "add|remove|adjust|reserve|release"]
  quantity_change INT           *
  reason          VARCHAR(300)  ??
  performed_by    INT           ??  [ref: > users.id]
  created_at      DATETIME      *  [default: now()]
}

// 6. CMS / CONTENT ------------------------------------------------

case_studies {
  id               INT           PK
  title            VARCHAR(300)  *
  slug             VARCHAR(300)  UQ  *
  client_name      VARCHAR(200)  ??
  location         VARCHAR(200)  ??
  industry         VARCHAR(100)  ??
  summary          TEXT          ??
  content          TEXT          ??
  image_url        VARCHAR(500)  ??
  page_slug        VARCHAR(200)  ??  [note: "links to a site page instead of a specific product"]
  review_status    VARCHAR(20)   *  [default: "draft", note: "draft|in_review|approved|rejected"]
  review_notes     TEXT          ??
  reviewed_by      INT           ??  [ref: > users.id]
  reviewed_at      DATETIME      ??
  published        BOOLEAN       *  [default: false]
  published_at     DATETIME      ??
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

case_study_products {
  case_study_id INT  PK  [ref: > case_studies.id]
  product_id    INT  PK  [ref: > products.id]
}

news_articles {
  id               INT           PK
  title            VARCHAR(300)  *
  slug             VARCHAR(300)  UQ  *
  news_type        VARCHAR(30)   *  [default: "company", note: "company|press_release|industry|event|award"]
  excerpt          TEXT          ??
  content          TEXT          ??
  cover_image_url  VARCHAR(500)  ??
  source_url       VARCHAR(500)  ??
  author_id        INT           ??  [ref: > users.id]
  tags             VARCHAR(500)  ??
  page_slug        VARCHAR(200)  ??  [note: "links to a site page instead of a specific product"]
  review_status    VARCHAR(20)   *  [default: "draft", note: "draft|in_review|approved|rejected"]
  review_notes     TEXT          ??
  reviewed_by      INT           ??  [ref: > users.id]
  reviewed_at      DATETIME      ??
  published        BOOLEAN       *  [default: false]
  published_at     DATETIME      ??
  meta_title       VARCHAR(300)  ??
  meta_description VARCHAR(500)  ??
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

news_article_products {
  news_article_id INT  PK  [ref: > news_articles.id]
  product_id      INT  PK  [ref: > products.id]
}

blog_posts {
  id               INT           PK
  title            VARCHAR(300)  *
  slug             VARCHAR(300)  UQ  *
  excerpt          TEXT          ??
  content          TEXT          ??
  author_id        INT           ??  [ref: > users.id]
  image_url        VARCHAR(500)  ??
  tags             VARCHAR(500)  ??
  product_id       INT           ??  [ref: > products.id]
  page_slug        VARCHAR(200)  ??  [note: "links to a site page instead of a specific product"]
  review_status    VARCHAR(20)   *  [default: "draft", note: "draft|in_review|approved|rejected"]
  review_notes     TEXT          ??
  reviewed_by      INT           ??  [ref: > users.id]
  reviewed_at      DATETIME      ??
  published        BOOLEAN       *  [default: false]
  published_at     DATETIME      ??
  meta_title       VARCHAR(300)  ??
  meta_description VARCHAR(500)  ??
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

faqs {
  id          INT           PK
  category_id INT           ??  [ref: > categories.id]
  product_id  INT           ??  [ref: > products.id]
  question    VARCHAR(500)  *
  answer      TEXT          *
  sort_order  INT           [default: 0]
  is_active   BOOLEAN       *  [default: true]
  created_at  DATETIME      *  [default: now()]
}

offices {
  id         INT            PK
  name       VARCHAR(200)   *
  city       VARCHAR(100)   *
  state      VARCHAR(100)   ??
  country    VARCHAR(50)    [default: "India"]
  address    TEXT           ??
  phone      VARCHAR(50)    ??
  email      VARCHAR(255)   ??
  latitude   NUMERIC(10,7)  ??
  longitude  NUMERIC(10,7)  ??
  is_active  BOOLEAN        *  [default: true]
  sort_order INT            [default: 0]
  created_at DATETIME       *  [default: now()]
}

pages {
  id               INT           PK
  slug             VARCHAR(200)  UQ  *
  title            VARCHAR(300)  *
  content          TEXT          ??
  meta_title       VARCHAR(300)  ??
  meta_description VARCHAR(500)  ??
  published        BOOLEAN       *  [default: false]
  created_at       DATETIME      *  [default: now()]
  updated_at       DATETIME      *  [default: now()]
}

// 7. INSTALLATION SHOWCASE ----------------------------------------

product_installations {
  id              INT           PK
  title           VARCHAR(200)  *
  description     TEXT          ??
  location        VARCHAR(200)  ??
  client_name     VARCHAR(200)  ??
  installed_on    DATETIME      ??
  cover_image_url VARCHAR(500)  ??
  video_url       VARCHAR(500)  ??
  thumbnail_url   VARCHAR(500)  ??
  video_type      VARCHAR(20)   [default: "youtube", note: "youtube|vimeo|upload"]
  product_id      INT           ??  [ref: > products.id]
  sort_order      INT           *  [default: 0]
  is_active       BOOLEAN       *  [default: true]
  created_at      DATETIME      *  [default: now()]
  updated_at      DATETIME      *  [default: now()]
}

installation_media {
  id              INT           PK
  installation_id INT           FK  [ref: > product_installations.id]
  media_type      VARCHAR(10)   *  [note: "image|video"]
  url             VARCHAR(500)  *
  caption         VARCHAR(300)  ??
  sort_order      INT           [default: 0]
}

// 8. AD CAMPAIGNS (Claude Ads MCP) --------------------------------
//
// Social media publishing, ad campaign management, metrics tracking,
// and promotions are handled externally via Claude Ads MCP.
// Creative assets are designed via Canva MCP.
//
// content_posts = INTERNAL content planning layer (what to say).
// Actual publishing, metrics, and promotions live inside Claude Ads.

content_posts {
  id              INT           PK
  post_type       VARCHAR(30)   *  [default: "general", note: "new_product|new_machine|installation_complete|news|case_study|blog|general"]
  title           VARCHAR(300)  ??
  content_text    TEXT          *
  link_url        VARCHAR(500)  ??
  hashtags        VARCHAR(500)  ??
  product_id      INT           ??  [ref: > products.id]
  installation_id INT           ??  [ref: > product_installations.id]
  news_article_id INT           ??  [ref: > news_articles.id]
  case_study_id   INT           ??  [ref: > case_studies.id]
  blog_post_id    INT           ??  [ref: > blog_posts.id]
  page_slug       VARCHAR(200)  ??  [note: "links to an arbitrary site page instead of a product"]
  content_hash    VARCHAR(64)   ??  [note: "SHA-256 of normalize(title + content_text); used for near-duplicate detection"]
  scheduled_at    DATETIME      ??  [note: "null = publish immediately when approved; set = hold until this UTC time"]
  created_via     VARCHAR(30)   *  [default: "admin_form", note: "agent_chat|admin_form|import"]
  review_status   VARCHAR(20)   *  [default: "draft", note: "draft|in_review|approved|rejected"]
  review_notes    TEXT          ??
  reviewed_by     INT           ??  [ref: > users.id]
  reviewed_at     DATETIME      ??
  created_by      INT           ??  [ref: > users.id]
  created_at      DATETIME      *  [default: now()]
  updated_at      DATETIME      *  [default: now()]
}

// INDEX: content_posts(content_hash, post_type, created_at)
// Near-duplicate detection: query "same hash + same type within 7 days"
// efficiently without full table scan.

// 9. SOCIAL MEDIA PUBLISH LOGS --------------------------------------
// Per-platform publication records for content_posts.
// A single content_post can succeed on one platform but fail on another
// (wrong aspect ratio, expired token, etc.). Per-platform rows avoid
// adding 4x columns to content_posts and gracefully support a 5th
// platform without schema migration.
//
// Idempotency: each attempt generates idempotency_key = SHA256(content_post_id + platform + attempt_number).
// Before making any platform API call, check for an existing 'published'
// row with the same content_post_id + platform to prevent re-posting.
//
// Retry policy:
//   - Auth error (401/403): mark failed, NEVER auto-retry
//   - Validation error (400): mark failed, retry only after content changes
//   - Transient error (5xx/timeout): retrying -> retry once (30s, 60s) -> failed
//   - Rate limit (429): retry after platform's retry-after header
//
// Webhook timeout: if no webhook within 15 minutes, mark as 'unknown'

social_publish_logs {
  id              INT           PK
  content_post_id INT           FK  [ref: > content_posts.id]
  platform        VARCHAR(20)   *  [note: "facebook|instagram|linkedin|twitter"]
  status          VARCHAR(20)   *  [default: "queued", note: "queued|publishing|published|failed|retrying|unknown"]
  platform_post_id VARCHAR(200) ??  [note: "ID assigned by the platform after publish"]
  platform_post_url VARCHAR(500) ?? [note: "URL of the published post on the platform"]
  error_message   TEXT          ??
  retry_count     INT           *  [default: 0]
  idempotency_key VARCHAR(200)  UQ  *  [note: "SHA256(content_post_id + platform + attempt_number)"]
  attempted_at    DATETIME      ??
  published_at    DATETIME      ??
  created_at      DATETIME      *  [default: now()]
  updated_at      DATETIME      *  [default: now()]
}

// INDEX: social_publish_logs(content_post_id, platform)
// Fast lookup for "find publish status of this post on this platform"
// and for idempotency check before re-posting.

// 10. ANALYTICS & SEARCH -------------------------------------------

analytics_events {
  id             INT           PK
  event_type     VARCHAR(50)   *
  event_category VARCHAR(50)   ??
  event_action   VARCHAR(100)  ??
  event_label    VARCHAR(300)  ??
  event_value    INT           ??
  page_url       VARCHAR(500)  ??
  referrer       VARCHAR(500)  ??
  user_agent     VARCHAR(500)  ??
  ip_address     VARCHAR(45)   ??
  session_id     VARCHAR(100)  ??
  user_id        VARCHAR(100)  ??
  extra_data     TEXT          ??
  created_at     DATETIME      *  [default: now()]
}

search_logs {
  id            INT           PK
  query         VARCHAR(200)  *
  results_count INT           [default: 0]
  source        VARCHAR(20)   [default: "header", note: "header|product_list|search_page"]
  ip_hash       VARCHAR(64)   ??
  created_at    DATETIME      *  [default: now()]
}

// 11. EMAIL AUTOMATION --------------------------------------------

email_subscribers {
  id              INT           PK
  email           VARCHAR(200)  UQ  *
  name            VARCHAR(200)  ??
  source          VARCHAR(50)   *  [default: "newsletter"]
  status          VARCHAR(20)   *  [default: "active", note: "active|unsubscribed|bounced"]
  double_opt_in   DATETIME      ??
  unsubscribed_at DATETIME      ??
  created_at      DATETIME      *  [default: now()]
}

email_sequences {
  id           INT           PK
  name         VARCHAR(100)  *
  trigger_type VARCHAR(50)   *  [note: "rfq_submit|datasheet_download|newsletter_signup"]
  is_active    BOOLEAN       *  [default: true]
  created_at   DATETIME      *  [default: now()]
}

email_sequence_logs {
  id               INT           PK
  subscriber_id    INT           FK  [ref: > email_subscribers.id]
  subscriber_email VARCHAR(200)  *
  sequence_id      INT           ??  [ref: > email_sequences.id]
  send_type        VARCHAR(20)   *  [default: "sequence", note: "sequence|ad_hoc"]
  triggered_by     VARCHAR(100)  ??  [note: "rfq_submit|admin_chat|manual"]
  template_name    VARCHAR(100)  *
  status           VARCHAR(20)   *  [default: "pending", note: "pending|sent|failed"]
  error_message    TEXT          ??
  scheduled_at     DATETIME      *
  sent_at          DATETIME      ??
  created_at       DATETIME      *  [default: now()]
}

// 12. CHAT / AI OBSERVABILITY -------------------------------------

chat_turn_logs {
  id                     INT          PK
  session_id             VARCHAR(64)  *
  user_message           TEXT         *
  assistant_reply        TEXT         *
  language               VARCHAR(10)  [default: "en"]
  intent                 VARCHAR(50)  ??
  latency_ms             FLOAT        ??
  token_count_prompt     INT          ??
  token_count_completion INT          ??
  tool_calls_summary     TEXT         ??
  matched_product_ids    TEXT         ??
  created_at             DATETIME     *  [default: now()]
}

tool_call_logs {
  id          INT           PK
  session_id  VARCHAR(64)   *
  turn_id     INT           ??  [ref: > chat_turn_logs.id]
  tool_name   VARCHAR(100)  *   [note: "e.g. create_invoice, generate_invoice_pdf, search_products"]
  tool_input  TEXT          ??
  tool_output TEXT          ??  [note: "for generate_invoice_pdf store download_url + filename, not PDF bytes"]
  latency_ms  FLOAT         ??
  success     BOOLEAN       [default: true]
  created_at  DATETIME      *  [default: now()]
}

// 13. AUDIT -------------------------------------------------------

audit_logs {
  id            INT           PK
  user_id       INT           ??  [ref: > users.id]
  action        VARCHAR(50)   *  [note: "create|update|delete|login|export|publish"]
  resource_type VARCHAR(50)   ??  [note: "product|inquiry|user|invoice|content_post|news_article|blog_post|case_study|product_installation|social_publish|email_send"]
  resource_id   INT           ??
  details       JSON          ??
  ip_address    VARCHAR(45)   ??
  user_agent    VARCHAR(500)  ??
  created_at    DATETIME      *  [default: now()]
}

// =================================================================
// SCENARIO & STORY FLOWS — DATABASE OPERATIONS
//
// This section describes how data flows through the database collections
// for every major user interaction. Each scenario shows which collections
// are read, written, or updated, and in what order.
// =================================================================

// ------------------------------------------------------------------
// SCENARIO: Content Creation (via Admin Form or AI Agent)
// ------------------------------------------------------------------
//
// USER INPUT: Admin creates a blog post via form, or asks AI agent to draft one.
//
// DATABASE FLOW:
//   1. Check content_posts for near-duplicate (content_hash + post_type + created_at index)
//   2. Write to blog_posts:
//      - title, slug (auto-generated), body, excerpt, product_id, page_slug
//      - review_status: "draft"
//      - created_via: "admin_form" or "agent_chat"
//   3. Write to audit_logs:
//      - action: "create"
//      - resource_type: "blog_post"
//      - resource_id: <blog_post_id>
//      - details: {title, content_type, created_via}
//
// COLLECTIONS TOUCHED: content_posts (read), blog_posts (write), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Content Review Workflow
// ------------------------------------------------------------------
//
// USER INPUT: Admin submits content for review, reviewer approves or rejects.
//
// DATABASE FLOW (Submit for Review):
//   1. Update blog_posts: review_status "draft" → "in_review"
//   2. Write to audit_logs: action "update", resource_type "blog_post"
//
// DATABASE FLOW (Approve):
//   1. Validate: current status is "in_review", reviewer ≠ creator
//   2. Update blog_posts: review_status "in_review" → "approved"
//   3. Write to audit_logs: action "approve", resource_type "blog_post"
//
// DATABASE FLOW (Reject):
//   1. Validate: reason is provided
//   2. Update blog_posts: review_status "in_review" → "rejected", review_notes set
//   3. Write to audit_logs: action "reject", resource_type "blog_post"
//
// COLLECTIONS TOUCHED: blog_posts (update), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Social Media Publishing
// ------------------------------------------------------------------
//
// USER INPUT: Admin publishes approved content to LinkedIn and Facebook.
//
// DATABASE FLOW:
//   1. Validate: content_posts.review_status == "approved"
//   2. Create social_publish_logs row for LinkedIn:
//      - content_post_id, platform: "linkedin", status: "queued"
//      - idempotency_key: SHA256(content_post_id + "linkedin" + 1)
//   3. Create social_publish_logs row for Facebook:
//      - content_post_id, platform: "facebook", status: "queued"
//      - idempotency_key: SHA256(content_post_id + "facebook" + 1)
//   4. Dispatch platform API calls (via BullMQ)
//   5. As each resolves, update social_publish_logs:
//      - status: "published" or "failed"
//      - platform_post_id, platform_post_url (on success)
//      - error_message (on failure)
//   6. Update content_posts: review_status → "published" (once ≥1 platform succeeds)
//   7. Write to audit_logs: action "publish", resource_type "social_publish"
//
// COLLECTIONS TOUCHED: content_posts (read, update), social_publish_logs (write, update), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Partial Platform Failure
// ------------------------------------------------------------------
//
// USER INPUT: Publish to 3 platforms; 1 fails.
//
// DATABASE FLOW:
//   1. Create 3 social_publish_logs rows (queued)
//   2. LinkedIn: status → "published"
//   3. Facebook: status → "published"
//   4. Twitter: status → "failed", error_message: "Caption exceeds 280 chars"
//   5. content_posts.review_status → "published" (≥1 succeeded)
//   6. Admin retries Twitter: new social_publish_logs row with incremented attempt_number
//   7. Twitter retry: status → "published"
//
// COLLECTIONS TOUCHED: social_publish_logs (write, update), content_posts (update)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Token Expiry / Auth Failure
// ------------------------------------------------------------------
//
// USER INPUT: Agent publishes to LinkedIn; token expired.
//
// DATABASE FLOW:
//   1. Create social_publish_logs row (queued)
//   2. LinkedIn API returns 401
//   3. Update social_publish_logs: status → "failed", error_message: "LinkedIn token expired"
//   4. NO auto-retry (auth errors are never retried)
//   5. Write to audit_logs: action "publish", resource_type "social_publish"
//
// COLLECTIONS TOUCHED: social_publish_logs (write, update), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Scheduled Publishing
// ------------------------------------------------------------------
//
// USER INPUT: Admin schedules content for future publishing.
//
// DATABASE FLOW:
//   1. Update content_posts: scheduled_at = "2026-07-28T09:00:00Z", review_status = "approved"
//   2. Scheduler runs every 60 seconds:
//      - Query content_posts WHERE review_status = "approved" AND scheduled_at <= now()
//   3. At scheduled time:
//      - Create social_publish_logs rows for each platform
//      - Dispatch platform API calls
//   4. If post was reverted to "in_review": skip, log missed_schedule in audit_logs
//
// COLLECTIONS TOUCHED: content_posts (update, read), social_publish_logs (write), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Ad-Hoc Email Send
// ------------------------------------------------------------------
//
// USER INPUT: Admin sends email to segment of subscribers.
//
// DATABASE FLOW:
//   1. Query email_subscribers with segment filter
//   2. Exclude: status = "unsubscribed" OR status = "bounced"
//   3. Return resolved count (e.g., 338 of 500)
//   4. On confirm: create email_sequence_logs rows for each recipient:
//      - subscriber_id, subscriber_email, send_type: "ad_hoc"
//      - triggered_by: "admin_chat" or "manual"
//      - template_name, status: "sent" or "failed"
//   5. Send emails via Resend MCP
//   6. Write to audit_logs: action "create", resource_type "email_send"
//
// COLLECTIONS TOUCHED: email_subscribers (read), email_sequence_logs (write), audit_logs (write)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Content Duplicate Detection
// ------------------------------------------------------------------
//
// USER INPUT: Agent drafts content similar to recent draft.
//
// DATABASE FLOW:
//   1. Compute content_hash = SHA256(normalize(title + content_text))
//   2. Query content_posts using compound index (content_hash, post_type, created_at)
//   3. Find matching hash + same post_type within 7 days
//   4. Return existing items as soft warning (not hard block)
//   5. Admin chooses: update existing or create new
//
// COLLECTIONS TOUCHED: content_posts (read via index)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// SCENARIO: Audit Trail for Content Lifecycle
// ------------------------------------------------------------------
//
// FULL AUDIT TRAIL FOR A BLOG POST:
//
//   1. CREATE:  audit_logs { action: "create",  resource_type: "blog_post", details: {title, created_via} }
//   2. EDIT:    audit_logs { action: "update",  resource_type: "blog_post", details: {before, after} }
//   3. SUBMIT:  audit_logs { action: "update",  resource_type: "blog_post", details: {review_status: "in_review"} }
//   4. APPROVE: audit_logs { action: "approve", resource_type: "blog_post", details: {review_status: "approved"} }
//   5. PUBLISH: audit_logs { action: "publish", resource_type: "social_publish", details: {platforms: [...]} }
//
// Every action creates an audit_logs row with user_id, action, resource_type, resource_id, details, timestamp.
//
// COLLECTIONS TOUCHED: audit_logs (write × 5)
// ------------------------------------------------------------------


// =================================================================
// 14. AGENT-SPECIFIC DATA STRUCTURES --------------------------------
// These structures are used by the Python AI agent system (FastAPI on :8000).
// They are NOT separate collections — they map to the existing collections above.

// -- PRODUCT AGENT TOOLS --------------------------------------------
// Agent tools write to the SAME MongoDB collections the Node.js backend reads from.
// Products created via agent appear on /admin/products and /products immediately.
//
// Tool: create_product
//   - Writes to: products collection
//   - Slug auto-generated from name (URL-safe, unique via counter suffix)
//   - Defaults: published=false, reviewStatus="draft"
//   - Returns: {product_id, name, slug}
//
// Tool: get_product
//   - Reads from: products collection (by ObjectId or slug)
//   - Includes: category name lookup via categories collection
//   - Returns: full product JSON with {product_id, category, specs, media, llmExtractedData}
//
// Tool: update_product
//   - Writes to: products collection (partial update)
//   - Only applies non-empty/non-None fields
//   - Sets publishedAt when published=true
//
// Tool: delete_product
//   - Deletes from: products collection (hard delete)
//   - Requires prior HITL confirmation via <DELETE_CONFIRM> tag
//
// Tool: list_products
//   - Reads from: products collection
//   - Supports: regex search, category filter, published_only, featured_only
//   - Returns: paginated product summaries
//
// Tool: upload_product_media
//   - Uploads file to S3/R2 via Media MCP (presign_media_upload + get_media_public_url)
//   - Appends {url, alt} to product's media array
//   - Supports: images, videos, PDF/DOCX spec sheets
//
// Tool: extract_product_info
//   - Takes: file_text (from PDF/DOCX), product_id
//   - Sends to: LLM (DeepSeek v4 Flash via OpenRouter)
//   - Stores result in: product's llmExtractedData field
//   - Returns: {name, summary, description, models, leadTimeDays, warrantyMonths,
//              categoryGuess, specs: [{key, value}], confidence}
//
// Product Card Format (Agent → Frontend):
//   <PRODUCT_CARD>
//   {"product_id": "...", "name": "...", "slug": "...", "category": "...",
//    "published": true/false, "is_featured": true/false, "shortDescription": "...",
//    "description": "...", "models": "...", "leadTimeDays": 0, "warrantyMonths": 0,
//    "specs": [...], "media": [...], "llmExtractedData": null}
//   </PRODUCT_CARD>
//
// Delete Confirmation Format (Agent → Frontend):
//   <DELETE_CONFIRM>product:{product_id}:{product_name}</DELETE_CONFIRM>
//   Frontend parses this and renders Confirm/Cancel buttons.
//   On confirm, frontend sends: DELETE_PRODUCT_CONFIRM: {product_id}:{product_name}

// -- INVOICE AGENT TOOLS --------------------------------------------
// Agent tools write to the SAME MongoDB collections the Node.js backend reads from.
// Invoices created via agent appear on /admin/invoices immediately.
//
// Tool: create_invoice
//   - Writes to: invoices + invoice_items collections
//   - Auto-generates invoice_number (BARK{YY}{QQ}{SEQ} format)
//   - Calculates: subtotal, gst_amount, total, amount_in_words
//
// Tool: get_invoice
//   - Reads from: invoices + invoice_items collections
//   - Returns: full invoice with line items
//
// Tool: update_invoice
//   - Writes to: invoices + invoice_items collections (partial update)
//
// Tool: delete_invoice
//   - Deletes from: invoices + invoice_items collections
//   - Requires prior HITL confirmation via <DELETE_CONFIRM> tag
//
// Tool: list_invoices
//   - Reads from: invoices collection
//   - Supports: regex search, status filter
//
// Tool: generate_invoice_pdf
//   - Uses: InvoiceService (WeasyPrint + Jinja2)
//   - Returns: {download_url, filename, invoice_number}
//   - PDF stored at: /admin/invoices/{id}/pdf or /api/v1/invoices/{id}/pdf
//
// Invoice Card Format (Agent → Frontend):
//   <INVOICE_CARD>
//   {"invoice_id": "...", "invoice_number": "...", "customer_name": "...", ...}
//   </INVOICE_CARD>
//
// Delete Confirmation Format (Agent → Frontend):
//   <DELETE_CONFIRM>invoice:{invoice_id}:{invoice_number}</DELETE_CONFIRM>

// -- AGENT FASTAPI ENDPOINTS ----------------------------------------
// These endpoints are exposed by the Python FastAPI agent service on :8000.
// They are NOT part of the Node.js backend API.
//
// POST /agent/admin/chat        — Admin AI chat (SSE streaming)
// POST /agent/client/chat       — Client AI chat (SSE streaming)
// POST /agent/extract-product-info   — Direct extract_product_info invocation
// POST /agent/upload-product-media   — Direct upload_product_media invocation
// POST /agent/extract-from-upload    — Server-side PDF/DOCX extraction + LLM
// GET  /agent/health            — Health check


// =================================================================
// COMPLETED IMPLEMENTATION STATUS
// Last updated: 2026-07-25
//
// This section documents which collections and schemas have been
// implemented in the Node.js backend (Mongoose models) and Python
// agent (MongoDB driver), and their current state.
// =================================================================

// -- COLLECTIONS IMPLEMENTED IN NODE.JS BACKEND (Mongoose) ----------
//
// ✅ users              — User accounts with auth, roles, profile
// ✅ user_sessions      — Browser/mobile session tracking
// ✅ jwt_tokens         — JWT access + refresh token family rotation
// ✅ verification_tokens — Email/phone/password reset tokens
// ✅ api_tokens         — External integration API tokens
// ✅ roles              — RBAC roles (admin, client)
// ✅ permissions        — Granular permissions (resource:action format)
// ✅ role_permissions   — Role-permission mapping (M:M)
// ✅ user_roles         — User-role mapping (M:M)
// ✅ api_token_scopes   — API token scope mapping (M:M)
// ✅ categories         — Product categories (hierarchical)
// ✅ products           — Product catalog with review workflow
// ✅ product_specs      — Product specifications (key-value)
// ✅ product_media      — Product images/videos/documents
// ✅ product_documents  — Product datasheets/manuals/brochures
// ✅ related_products   — Product cross-references (M:M)
// ✅ site_settings      — Global site configuration (key-value)
// ✅ inquiries          — Customer inquiries/RFQ with UTM tracking
// ✅ rfq_items          — RFQ line items
// ✅ invoices           — Tax invoices with GST calculations
// ✅ invoice_items      — Invoice line items
// ✅ invoice_sequences  — Auto-incrementing invoice numbers
// ✅ product_stocks     — Inventory levels per product
// ✅ stock_logs         — Stock change audit trail
// ✅ case_studies       — Client success stories
// ✅ case_study_products — Case study-product mapping (M:M)
// ✅ news_articles      — Industry/company news
// ✅ news_article_products — News-product mapping (M:M)
// ✅ blog_posts         — Technical blog posts
// ✅ faqs               — Frequently asked questions
// ✅ offices            — Office locations with geolocation
// ✅ pages              — CMS static pages
// ✅ product_installations — Installation showcase entries
// ✅ installation_media — Installation images/videos
// ✅ content_posts      — Social media content planning
// ✅ social_publish_logs — Per-platform publish records with idempotency
// ✅ analytics_events   — Page views, product views, interactions
// ✅ search_logs        — Search query tracking
// ✅ email_subscribers  — Newsletter/email subscribers
// ✅ email_sequences    — Automated email sequences
// ✅ email_sequence_logs — Email send records
// ✅ chat_turn_logs     — AI chat conversation logs
// ✅ tool_call_logs     — Agent tool invocation records
// ✅ audit_logs         — System-wide audit trail

// -- COLLECTIONS ACCESSED BY PYTHON AGENT (Direct MongoDB) ----------
//
// The Python agent reads/writes the SAME collections as Node.js:
//
// ✅ products            — CRUD via native LangGraph tools
// ✅ categories          — Read for product lookups
// ✅ invoices            — CRUD via native LangGraph tools
// ✅ invoice_items       — CRUD via native LangGraph tools
// ✅ invoice_sequences   — Read for auto-numbering
// ✅ inquiries           — CRUD via CRM agent
// ✅ rfq_items           — Read via CRM agent
// ✅ product_stocks      — Read/write via Inventory agent
// ✅ stock_logs          — Write via Inventory agent
// ✅ content_posts       — CRUD via Content agent
// ✅ blog_posts          — CRUD via Content agent
// ✅ news_articles       — CRUD via Content agent
// ✅ case_studies        — CRUD via Content agent
// ✅ chat_turn_logs      — Write for observability
// ✅ tool_call_logs      — Write for observability
// ✅ users               — Read for auth context

// -- NEW COLLECTIONS ADDED IN THIS SESSION -------------------------
//
// ✅ social_publish_logs — Per-platform publish tracking
//    Added for social media publishing with:
//    - Idempotency keys (SHA-256)
//    - Per-platform status (queued/publishing/published/failed)
//    - Retry logic with error categorization
//    - Platform post IDs and URLs
//
// ✅ content_post → product/installation/news/case_study/blog FKs
//    content_posts now references:
//    - product_id (optional)
//    - installation_id (optional)
//    - news_article_id (optional)
//    - case_study_id (optional)
//    - blog_post_id (optional)
//    - page_slug (optional, links to arbitrary site page)

// -- MONGOOSE MODELS IMPLEMENTED -----------------------------------
//
// Backend models (src/models/):
// ✅ user.ts            — User schema with auth fields
// ✅ blogPost.ts        — Blog post schema with review workflow
// ✅ caseStudy.ts       — Case study schema
// ✅ chatLog.ts         — Chat turn and tool call logs
// ✅ contentPost.ts     — Content post schema (NEW)
// ✅ invoice.ts         — Invoice + line items schema
// ✅ newsArticle.ts     — News article schema
// ✅ product.ts         — Product + specs + media schema
// ✅ lead.ts            — Lead/inquiry schema
// ✅ stock.ts           — Stock + logs schema
// ✅ socialPublishLog.ts — Social publish log schema (NEW)

// -- AGENT RESPONSE FORMATS (XML Tags) -----------------------------
//
// These are the structured formats agents use to communicate
// with the frontend via SSE streaming:
//
// Product Card:
//   <PRODUCT_CARD>{"product_id":"...","name":"...","slug":"...",...}</PRODUCT_CARD>
//
// Invoice Card:
//   <INVOICE_CARD>{"invoice_id":"...","invoice_number":"...",...}</INVOICE_CARD>
//
// Lead Card:
//   <LEAD_CARD>{"lead_id":"...","name":"...","email":"...",...}</LEAD_CARD>
//
// Content Card:
//   <CONTENT_CARD>{"content_id":"...","title":"...","type":"blog",...}</CONTENT_CARD>
//
// Delete Confirmation:
//   <DELETE_CONFIRM>product:{id}:{name}</DELETE_CONFIRM>
//   <DELETE_CONFIRM>invoice:{id}:{number}</DELETE_CONFIRM>
//
// Multi Result:
//   <MULTI_RESULT>[{...},{...}]</MULTI_RESULT>
//
// Table:
//   <TABLE>{"headers":["Col1","Col2"],"rows":[["val1","val2"]]}</TABLE>

// -- INDEXES IMPLEMENTED -------------------------------------------
//
// Products:
//   ✅ products.slug (unique)
//   ✅ products.category_id
//   ✅ products.review_status
//   ✅ products.published
//
// Invoices:
//   ✅ invoices.invoice_number (unique)
//   ✅ invoices.status
//   ✅ invoices.customer_name (text index)
//
// Leads:
//   ✅ inquiries.status
//   ✅ inquiries.source
//   ✅ inquiries.created_at
//
// Content:
//   ✅ content_posts.content_hash + post_type + created_at (compound)
//   ✅ content_posts.review_status
//   ✅ content_posts.scheduled_at
//
// Social:
//   ✅ social_publish_logs.content_post_id + platform (compound)
//   ✅ social_publish_logs.idempotency_key (unique)
//
// Stock:
//   ✅ product_stocks.product_id (unique)
//
// Chat:
//   ✅ chat_turn_logs.session_id
//   ✅ chat_turn_logs.created_at
//
// Audit:
//   ✅ audit_logs.user_id
//   ✅ audit_logs.resource_type + resource_id
//   ✅ audit_logs.created_at

// -- CLOUD DATABASE CONNECTIONS ------------------------------------
//
// ✅ MongoDB Atlas — MONGODB_URI from .env (production cluster)
// ✅ Upstash Redis — REDIS_URL from .env (cloud Redis)
// ✅ Backblaze B2  — S3_ENDPOINT_URL + credentials (S3-compatible)
//
// All three services are connected and verified.
