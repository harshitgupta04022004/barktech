# Bark Technologies — Frontend System Architecture

## Overview

This document defines the complete frontend architecture for Bark Technologies' web application. It covers **two distinct frontend surfaces**:

1. **Public Website** — Customer-facing product catalog, inquiry forms, and AI chat
2. **Admin Dashboard** — Internal management panel for products, leads, invoices, inventory, CMS, and AI observability

Both surfaces share the same backend API (Node.js on port 3000), the AI agent system (Python FastAPI on port 8000 with **native LangGraph tools** + **external MCP**), and **MongoDB** as the primary database. Invoices are native (no payment gateway). External MCP covers WhatsApp, Email, Media (S3/R2), Calendar, Claude Ads, Canvas, and Web Research — surfaced in admin AI chat (HITL where needed). The frontend talks to Node.js for REST and to the Python agent for AI chat via SSE.

**Important**: The Node.js backend is documented in `nodeJs_backned_System_architecture.md`. The AI agent layer is documented in `python_ai_agent_architecture.md`. This document covers ONLY the frontend.

---



## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Project Structure](#4-project-structure)
5. [Public Website Architecture](#5-public-website-architecture)
6. [Admin Dashboard Architecture](#6-admin-dashboard-architecture)
7. [Authentication Flow](#7-authentication-flow)
8. [API Integration Patterns](#8-api-integration-patterns)
9. [AI Chat Widget (Client-Facing)](#9-ai-chat-widget-client-facing)
10. [Admin AI Chat Interface](#10-admin-ai-chat-interface)
11. [Forms & Validation](#11-forms--validation)
12. [Data Tables (Admin)](#12-data-tables-admin)
13. [PDF Generation (Invoices)](#13-pdf-generation-invoices)
14. [File Upload Architecture](#14-file-upload-architecture)
15. [State Management](#15-state-management)
16. [Routing Architecture](#16-routing-architecture)
17. [Styling Architecture](#17-styling-architecture)
18. [Performance Optimization](#18-performance-optimization)
19. [Available Templates & Starting Points](#19-templates--starting-points)
20. [Deployment Architecture](#20-deployment-architecture)
21. [Security Considerations](#21-security-considerations)
22. [Implementation Roadmap](#22-implementation-roadmap)

---



## 1. Architecture Principles



### Core Design Decisions


| Principle        | Decision                             | Rationale                                                     |
| ---------------- | ------------------------------------ | ------------------------------------------------------------- |
| **UI Framework** | React 19 + TypeScript                | Component-based, vast ecosystem, strong typing                |
| **Styling**      | Tailwind CSS v4 + shadcn/ui          | Utility-first, zero-runtime, copy-paste components, dark mode |
| **Build Tool**   | Vite                                 | 10-100x faster HMR than Webpack, native ESM                   |
| **Routing**      | React Router v7 (or TanStack Router) | File-based or declarative routing, data loaders               |
| **Forms**        | React Hook Form + Zod                | Performant validation, minimal re-renders, type-safe          |
| **Tables**       | TanStack Table v8                    | Headless, sortable, filterable, paginated, no UI lock-in      |
| **Charts**       | Recharts                             | Declarative, composable, responsive                           |
| **PDF**          | @react-pdf/renderer                  | React components to PDF, vector quality, no headless browser  |
| **State**        | TanStack Query + Zustand             | Server state caching + lightweight client state               |
| **Icons**        | Lucide React                         | Tree-shakeable, consistent, 1500+ icons                       |
| **Theming**      | shadcn/ui theming + CSS variables    | Light/dark mode, customizable brand colors                    |




### Why React + Vite Over Next.js

For this project, a **Vite-based React SPA** (or Vite + React Router) is preferred over Next.js because:

- **No SSR needed** — The public website is primarily a product catalog with SEO handled via meta tags; no dynamic server-rendered pages required
- **Simpler deployment** — Static files served from Nginx/CDN, no Node.js runtime for the frontend
- **Faster DX** — Vite HMR is near-instant; no cold starts
- **Lower complexity** — No App Router confusion, no server components, no RSC boundaries
- **API separation** — Backend is a separate Fastify server; no need for Next.js API routes

> **Exception**: If the team wants SSR for SEO (product pages, blog), migrate to Next.js later. The component code is portable.



### Why shadcn/ui Over Material UI or Ant Design

- **No runtime CSS-in-JS** — Tailwind + CSS variables = zero JS overhead for styling
- **Copy-paste ownership** — Components live in your codebase, not in node_modules. Full control
- **Accessible** — Built on Radix UI primitives (WAI-ARIA compliant)
- **Customizable** — Change any component's markup, styles, and behavior
- **Dark mode** — Built-in light/dark theme with CSS variables
- **TypeScript-first** — Every component fully typed
- **Small bundle** — Only ships what you use; no unused component bloat

---



## 2. Technology Stack



### Core Dependencies


| Category           | Package                      | Purpose                                 |
| ------------------ | ---------------------------- | --------------------------------------- |
| **Framework**      | react 19.x                   | UI library                              |
| **Build**          | vite 7.x                     | Dev server + bundler                    |
| **Language**       | typescript 5.x               | Type safety                             |
| **Routing**        | react-router-dom 7.x         | Client-side routing                     |
| **UI Components**  | shadcn/ui (Radix + Tailwind) | Accessible component library            |
| **Styling**        | tailwindcss 4.x              | Utility-first CSS                       |
| **Forms**          | react-hook-form 7.x          | Performant form management              |
| **Validation**     | zod 3.x                      | Schema validation (shared with backend) |
| **Tables**         | @tanstack/react-table 8.x    | Headless data tables                    |
| **Data Fetching**  | @tanstack/react-query 5.x    | Server state caching, pagination        |
| **State**          | zustand 5.x                  | Lightweight client state                |
| **Charts**         | recharts 2.x                 | Declarative chart components            |
| **PDF**            | @react-pdf/renderer 4.x      | Invoice PDF generation                  |
| **Icons**          | lucide-react                 | SVG icon library                        |
| **Date**           | date-fns                     | Date formatting/manipulation            |
| **HTTP**           | fetch API (native)           | API calls (no axios needed)             |
| **Markdown**       | react-markdown + remark-gfm  | Render AI chat markdown                 |
| **Code Highlight** | prism-react-renderer         | Syntax highlighting for code blocks     |




### Dev Dependencies


| Package                         | Purpose                |
| ------------------------------- | ---------------------- |
| @vitejs/plugin-react            | Vite React plugin      |
| eslint + prettier               | Linting and formatting |
| @tanstack/react-query-devtools  | Query debugging        |
| tailwindcss-animate             | Animation utilities    |
| @types/node, @types/react       | TypeScript definitions |
| vitest + @testing-library/react | Unit/integration tests |
| cypress                         | E2E testing            |




### Package.json Template

```json
{
  "name": "bark-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "test:e2e": "cypress open"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "zustand": "^5.0.0",
    "recharts": "^2.0.0",
    "@react-pdf/renderer": "^4.0.0",
    "lucide-react": "^0.0.0",
    "date-fns": "^4.0.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "cypress": "^13.0.0"
  }
}
```



### Environment Variables

```bash
# -- API -------------------------------------------------
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AGENT_BASE_URL=http://localhost:8000

# -- Auth ------------------------------------------------
VITE_JWT_STORAGE_KEY=bark_access_token
VITE_REFRESH_STORAGE_KEY=bark_refresh_token

# -- File Storage ----------------------------------------
VITE_S3_PUBLIC_URL=https://media.barktechnologies.in

# -- Feature Flags ---------------------------------------
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_ANALYTICS=true
```

---



## 3. System Architecture Diagram

```
+-------------------------------------------------------------------+
|                          Browser                                   |
|  +------------------+  +------------------+  +------------------+  |
|  | Public Website   |  | Admin Dashboard  |  | AI Chat Widget   |  |
|  | React SPA        |  | React SPA        |  | Floating+Full    |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
+-----------|---------------------|----------------------|-----------+
            |                     |                      |
            v                     v                      v
+-------------------------------------------------------------------+
|                    CDN / Static Hosting                            |
|  +----------------------------+  +------------------------------+ |
|  | Nginx                      |  | Cloudflare CDN               | |
|  | Static Files + Reverse     |  | Assets + Caching             | |
|  | Proxy                       |  |                              | |
|  +----------------------------+  +------------------------------+ |
+-------------------------------------------------------------------+
            |                     |                      |
            v                     v                      v
+-------------------------------------------------------------------+
|                         Backend APIs                               |
|  +----------------------------+  +------------------------------+ |
|  | Node.js Backend            |  | Python Agent                 | |
|  | :3000 Fastify+TypeScript  |  | :8000 FastAPI+LangGraph     | |
|  +----------------------------+  +------------------------------+ |
+-------------------------------------------------------------------+
            |                     |                      |
            v                     v                      v
+-------------------------------------------------------------------+
|                     Shared Infrastructure                          |
|  +-------------+  +-------------+  +-----------------------------+ |
|  | MongoDB      |  | Redis       |  | S3 / R2                     | |
|  | Collections  |  | Cache/Sess  |  | Media + PDFs                | |
|  +-------------+  +-------------+  +-----------------------------+ |
+-------------------------------------------------------------------+
```



### Data Flow

1. **Public user** visits barktechnologies.in -> Nginx serves static React SPA from CDN
2. **React app** fetches product data via `GET /api/v1/products` -> Node.js -> MongoDB
3. **User opens AI chat** -> connects to Python agent via SSE -> tokens stream back
4. **Admin logs in** -> receives JWT -> all subsequent requests carry Bearer token
5. **Admin creates invoice (form)** -> React form -> `POST /api/v1/invoices` -> backend -> MongoDB
6. **Admin generates PDF (UI)** -> `GET /api/v1/invoices/:id/pdf` -> Python `InvoiceService.generate_pdf` (WeasyPrint) -> download / optional S3
7. **Admin creates invoice via AI chat** -> HITL confirm -> native LangGraph tools `create_invoice` + `generate_invoice_pdf` -> agent returns download URL (not PDF bytes; no Invoice MCP / no payment gateway)
8. **Admin emails invoice via AI chat** -> Email MCP (`send_email` / `send_template_email`) after PDF URL exists
9. **Admin uploads product media** -> Media MCP `presign_upload` or Node REST presign -> direct PUT to S3/R2
10. **Admin schedules installation/demo** -> Calendar MCP `create_event` (HITL) from admin AI chat or Installations UI
11. **Admin publishes campaign** -> Claude Ads MCP (+ optional Canvas MCP creatives, Media MCP assets)
12. **Lead agent researches RFQ** -> Web Research MCP (`fetch_url` / `search_web`) then native lead tools to update MongoDB

---



## 4. Project Structure

```
bark-frontend/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── images/
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   │
│   ├── api/                       # API client layer
│   │   ├── client.ts              # Fetch wrapper with auth headers
│   │   ├── auth.ts                # Auth API
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── inquiries.ts
│   │   ├── invoices.ts
│   │   ├── stock.ts
│   │   ├── cms.ts
│   │   ├── analytics.ts
│   │   ├── chat.ts
│   │   ├── audit.ts
│   │   ├── upload.ts              # File upload (presigned URL)
│   │   └── agent.ts               # AI agent SSE streaming
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts             # AI chat SSE streaming
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   ├── usePresignedUpload.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── uiStore.ts
│   │   └── invoiceDraftStore.ts
│   │
│   ├── lib/                       # Shared utilities
│   │   ├── utils.ts               # cn(), formatCurrency, formatDate
│   │   ├── validators.ts          # Zod schemas
│   │   ├── constants.ts
│   │   └── gst.ts                 # GST calculation, amount-in-words
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── layout/                # Layout shells
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── AdminHeader.tsx
│   │   ├── data-table/            # TanStack Table wrapper
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   ├── DataTableFilter.tsx
│   │   │   └── DataTableColumnHeader.tsx
│   │   ├── charts/
│   │   ├── forms/
│   │   │   ├── FileUpload.tsx
│   │   │   └── InvoiceItemRow.tsx
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   └── ProductCard.tsx
│   │   └── pdf/
│   │       ├── InvoicePDF.tsx
│   │       ├── InvoiceHeader.tsx
│   │       ├── InvoiceLineItems.tsx
│   │       └── InvoiceFooter.tsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── CategoryPage.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── About.tsx
│   │   │   ├── CaseStudies.tsx
│   │   │   ├── CaseStudyDetail.tsx
│   │   │   ├── News.tsx
│   │   │   ├── NewsDetail.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── BlogDetail.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── Installations.tsx
│   │   │   ├── SpareParts.tsx
│   │   │   ├── InquiryForm.tsx
│   │   │   ├── DatasheetDownload.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   └── VerifyEmail.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── products/          # ProductList, Create, Edit, Detail, Review
│   │   │   ├── categories/        # CategoryList, CategoryForm
│   │   │   ├── inquiries/         # InquiryList, Detail, Stats
│   │   │   ├── invoices/          # InvoiceList, Create, Edit, Detail, Review, Stats
│   │   │   ├── stock/             # StockList, Edit, Logs
│   │   │   ├── cms/               # CaseStudy, News, Blog, FAQ, Office, Page forms
│   │   │   ├── installations/     # InstallationList, Form
│   │   │   ├── campaigns/         # CampaignList, Form
│   │   │   ├── social/            # PlatformList, PublishForm, Analytics, CaptionGenerator
│   │   │   ├── analytics/         # Overview, PageViews, ProductViews, Search, Funnel
│   │   │   ├── users/             # UserList, Form, Roles
│   │   │   ├── email/             # SubscriberList, SequenceList
│   │   │   ├── chat/              # ChatHistory, ChatInterface, Stats
│   │   │   ├── observability/     # TraceList, TraceDetail, Stats
│   │   │   ├── audit/             # AuditLogList, Export
│   │   │   └── settings/          # Profile, SiteSettings
│   │   │
│   │   └── client/
│   │       ├── ClientDashboard.tsx
│   │       ├── ClientInquiries.tsx
│   │       ├── ClientInvoices.tsx
│   │       └── ClientProfile.tsx
│   │
│   └── types/                     # TypeScript type definitions
│       ├── api.ts
│       ├── product.ts
│       ├── inquiry.ts
│       ├── invoice.ts
│       ├── user.ts
│       ├── cms.ts
│       ├── analytics.ts
│       └── chat.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── components.json
```

---



## 5. Public Website Architecture



### Pages Overview


| Page               | Route                      | Purpose                                    |
| ------------------ | -------------------------- | ------------------------------------------ |
| Home               | `/`                        | Hero, featured products, case studies, CTA |
| Products           | `/products`                | Filterable product catalog                 |
| Product Detail     | `/products/:slug`          | Single product with specs, media, docs     |
| Category           | `/products/category/:slug` | Products in a category                     |
| Contact            | `/contact`                 | Contact form, office locations, map        |
| About              | `/about`                   | Company overview, team, mission            |
| Case Studies       | `/case-studies`            | Client success stories                     |
| News               | `/news`                    | Industry and company news                  |
| Blog               | `/blog`                    | Technical blog posts                       |
| FAQ                | `/faq`                     | Frequently asked questions                 |
| Installations      | `/installations`           | Project showcase with video                |
| Spare Parts        | `/spare-parts`             | Spare parts inquiry form                   |
| RFQ                | `/inquiry`                 | Request for quotation form                 |
| Datasheet Download | `/download/:productId`     | Download product datasheets                |
| Reset Password     | `/reset-password`          | Password reset form                        |
| Verify Email       | `/verify-email`            | Email verification                         |




### Public Layout Structure

```
+------------------------------------------------------+
|                    NAVBAR                             |
|  Logo | Products | Solutions | Resources |           |
|  Contact | Search | Login/Register                    |
+------------------------------------------------------+
|                                                      |
|                   PAGE CONTENT                        |
|                                                      |
+------------------------------------------------------+
|                    FOOTER                             |
|  Company Info | Products | Resources | Social Links  |
|  Newsletter Signup | Copyright                        |
+------------------------------------------------------+
                    |
  +---------------------------------------------+
  |          FLOATING AI CHAT WIDGET             |
  |          (Bottom-right corner)               |
  +---------------------------------------------+
```



### Navigation Architecture

**Mega Dropdown Menus** for products and solutions:

- **Products** -> Categories tree (hierarchical) with product count per category
- **Solutions** -> Case studies grouped by industry
- **Resources** -> Blog, News, FAQ, Datasheets
- **Contact** -> Contact form, office locations, WhatsApp link

**Mobile Navigation** -> Slide-out hamburger menu with accordion sub-menus.

### Product Catalog Features

- **Search**: Debounced search bar with autocomplete suggestions
- **Category Filter**: Sidebar category tree (hierarchical, collapsible)
- **Sort**: By name, relevance, newest
- **Grid/List Toggle**: Switch between card grid and list view
- **Pagination**: URL-driven (page in query params) for SEO
- **Responsive**: 3 columns desktop, 2 tablet, 1 mobile



### Home Page Sections

1. **Hero Section**: Full-width hero with headline, subtext, CTA buttons
2. **Featured Products**: 3-4 highlighted products in a carousel or grid
3. **Why Choose Us**: 4-6 value propositions with icons
4. **Case Studies Preview**: 2-3 recent case studies
5. **Industries We Serve**: Industry icons/cards
6. **Stats Counter**: Products delivered, clients served, years in business
7. **Latest News**: 2-3 recent news articles
8. **Newsletter Signup**: Email subscription form
9. **CTA Section**: "Get a Quote" call-to-action

---



## 6. Admin Dashboard Architecture



### Admin Layout Structure

```
+------------------------------------------------------------------+
|  +----------+  +----------------------------------------------+  |
|  |          |  |  HEADER: Search | Notifications | Profile     |  |
|  | SIDEBAR  |  +----------------------------------------------+  |
|  |          |  |                                              |  |
|  | Dashboard|  |                                              |  |
|  | Products |  |              PAGE CONTENT                     |  |
|  | Categories|  |                                              |  |
|  | Inquiries|  |                                              |  |
|  | Invoices |  |                                              |  |
|  | Stock    |  |                                              |  |
|  | CMS      |  |                                              |  |
|  | Analytics|  |                                              |  |
|  | Users    |  |                                              |  |
|  | Email    |  |                                              |  |
|  | Chat     |  |                                              |  |
|  | Audit    |  |                                              |  |
|  | Settings |  |                                              |  |
|  | AI Chat  |  |                                              |  |
|  +----------+  +----------------------------------------------+  |
+------------------------------------------------------------------+
```



### Admin Sidebar Navigation


| Section       | Sub-items                                      |
| ------------- | ---------------------------------------------- |
| Dashboard     | Overview, Revenue Stats                        |
| Products      | All Products, Add Product, Categories          |
| Inquiries     | All Inquiries, RFQ Items, Stats                |
| Invoices      | All Invoices, Create Invoice, Revenue          |
| Stock         | Inventory Levels, Stock Logs, Low Stock Alert  |
| CMS           | Case Studies, News, Blog, FAQs, Pages, Offices |
| Installations | All Installations, Add Installation            |
| Campaigns     | Content Posts, Campaign History                |
| Social Media  | Platforms, Publish, Analytics, AI Captions     |
| Analytics     | Overview, Page Views, Product Views, Search    |
| Users         | All Users, Roles and Permissions               |
| Email         | Subscribers, Sequences                         |
| Chat          | History, AI Interface, Stats                   |
| Observability | Traces, Agent Stats, Cost Tracking             |
| Audit         | Activity Logs, Export                          |
| Settings      | Profile, Site Settings                         |
| AI Chat       | Open admin AI chat panel                       |




### Dashboard Overview Page

**Summary Cards Row:**

- Total Inquiries (today / this week / this month) with trend arrow
- Total Revenue (this month) with trend arrow
- Active Products count
- Pending Reviews (products, blog posts, content posts)

**Charts Section:**

- Line chart: Inquiries over time (last 30 days)
- Bar chart: Revenue by month (last 12 months)
- Pie chart: Inquiries by source (web_form, rfq, ai_chat, etc.)
- Bar chart: Top 5 most viewed products

**Recent Activity Table:**

- Last 10 inquiries with status, source, assigned_to
- Last 5 invoices with status, amount

**Quick Actions:**

- Create Invoice button
- Add Product button
- View Low Stock items



### Admin Reusable Components


| Component         | Used In                         | Features                               |
| ----------------- | ------------------------------- | -------------------------------------- |
| `StatCard`        | Dashboard, module pages         | Icon, value, trend, label, color       |
| `DataTable`       | All list pages                  | Sort, filter, paginate, select, export |
| `StatusBadge`     | Inquiry, Invoice, Product lists | Color-coded status indicator           |
| `ConfirmDialog`   | Delete/cancel operations        | Warning message, confirm/cancel        |
| `FormField`       | All forms                       | Label, input, error message            |
| `FileUpload`      | Product media, documents        | Drag-and-drop, progress, preview       |
| `SearchInput`     | Lists, dashboard                | Debounced search with clear            |
| `DateRangePicker` | Analytics, invoice filters      | Calendar with range selection          |
| `EmptyState`      | Empty lists                     | Icon, message, action button           |
| `LoadingSpinner`  | All pages                       | Skeleton loader or spinner             |
| `Toast`           | All operations                  | Success/error/info notifications       |


---



## 7. Authentication Flow



### JWT Token Management

```
Login Form --POST--> Node.js /auth/login --Query--> MongoDB users
                                                         |
JWT Tokens returned: access (30min) + refresh (7day)     |
         |                                                |
    +----+----+--------+                                 |
    |         |        |                                 |
    v         v        v                                 |
Zustand   localStorage  HTTP Headers                     |
 Store    (backup)     (Authorization: Bearer)            |
```



### Auth Flow Steps

**Login:**

1. User enters email + password on login form
2. `POST /api/v1/auth/login` with credentials
3. Backend returns `{ access_token, refresh_token }`
4. Frontend stores tokens in Zustand store + localStorage
5. Every subsequent API call includes `Authorization: Bearer <access_token>` header
6. API client automatically attaches token to all requests

**Token Refresh:**

1. API client detects 401 response (token expired)
2. Client calls `POST /api/v1/auth/refresh` with refresh token
3. Backend revokes old refresh, issues new access + refresh pair
4. Client retries original request with new access token
5. If refresh fails, redirect to login page, clear all tokens

**Logout:**

1. User clicks logout
2. `POST /api/v1/auth/logout` with refresh token (revokes it server-side)
3. Frontend clears Zustand store + localStorage
4. Redirect to home page



### Role-Based UI Rendering

- **Public users**: See product catalog, inquiry forms, AI chat widget
- **Client users**: See client portal (own inquiries, invoices, profile)
- **Admin users**: See full admin dashboard with all modules

UI elements (buttons, menu items, pages) are conditionally rendered based on the user's role and permissions.

---



## 8. API Integration Patterns



### TanStack Query Integration

Every data-fetching operation uses TanStack Query:


| Feature                | Implementation                                   |
| ---------------------- | ------------------------------------------------ |
| **Caching**            | Automatic cache with stale-while-revalidate      |
| **Deduplication**      | Concurrent requests for same data are deduped    |
| **Background Refetch** | Data refreshes on window focus, reconnect        |
| **Pagination**         | `useInfiniteQuery` or `useQuery` with page param |
| **Mutations**          | `useMutation` with cache invalidation            |
| **Optimistic Updates** | UI updates before server confirms                |
| **Error Handling**     | Centralized error callbacks                      |
| **Loading States**     | `isLoading`, `isFetching`, `isPending`           |




### Query Keys Convention

```typescript
['products']                    // All products
['products', { category: 1 }]   // Products in category 1
['products', slug]              // Single product by slug
['invoices']                    // All invoices
['invoices', id]                // Single invoice
['invoices', id, 'items']       // Invoice line items
['analytics', 'dashboard']      // Dashboard stats
['social', 'platforms']         // Connected social platforms
['social', 'publish', id]       // Publish status for a post
['social', 'analytics']         // Cross-platform analytics
```



### Social Media API Integration

The frontend integrates with the backend's social media publishing API (`/api/v1/social`). Key features:

| Feature | API Endpoint | Description |
|---------|-------------|-------------|
| Platform Status | `GET /social/platforms` | Shows connected platforms + auth status |
| Publish | `POST /social/publish` | Publish to one or more platforms |
| Publish Status | `GET /social/publish/:id/status` | Track publish progress per platform |
| Analytics | `GET /social/analytics/overview` | Cross-platform metrics dashboard |
| AI Caption | `POST /social/caption/generate` | Generate platform-specific captions |
| Settings | `PUT /social/settings` | Configure approval workflow |

```typescript
// src/api/social.ts
import { apiClient } from './client';

export interface SocialPlatform {
  platform: 'linkedin' | 'instagram' | 'facebook' | 'whatsapp' | 'twitter' | 'reddit';
  connected: boolean;
  last_publish?: string;
  status: 'active' | 'error' | 'disconnected';
}

export interface PublishRequest {
  content_post_id: number;
  platforms: string[];
  caption_overrides?: Record<string, string>;
  schedule_at?: string;
}

export interface PublishResult {
  platform: string;
  status: 'pending' | 'published' | 'failed';
  post_id?: string;
  post_url?: string;
  error?: string;
}

export const socialApi = {
  getPlatforms: () => apiClient.get<SocialPlatform[]>('/social/platforms'),
  publish: (data: PublishRequest) => apiClient.post<{ id: string; results: PublishResult[] }>('/social/publish', data),
  getPublishStatus: (id: string) => apiClient.get<{ id: string; results: PublishResult[] }>(`/social/publish/${id}/status`),
  getAnalytics: (platform?: string) => apiClient.get(`/social/analytics${platform ? `/${platform}` : '/overview'}`),
  generateCaption: (data: { setup_title: string; platforms: string[] }) => apiClient.post('/social/caption/generate', data),
};
```



### API Response Shapes

```typescript
// Success - single resource
{ "data": Product, "message": "Success" }

// Success - list with pagination
{ "data": Product[], "total": 150, "page": 1, "per_page": 20 }

// Error
{ "error": "Not found", "message": "Product does not exist", "code": 404 }
```



### Error Handling Strategy


| HTTP Status | Frontend Action                                   |
| ----------- | ------------------------------------------------- |
| 200-299     | Success, update cache                             |
| 400         | Show validation errors in form fields             |
| 401         | Attempt token refresh, if fails redirect to login |
| 403         | Show "Unauthorized" message, redirect if needed   |
| 404         | Show "Not Found" page or empty state              |
| 429         | Show rate limit message, retry after delay        |
| 500+        | Show generic error toast, log to console          |


---



## 9. AI Chat Widget (Client-Facing)



### Architecture

The client-facing AI chat is a **floating widget** on the public website that connects to the Python agent system via SSE (Server-Sent Events).

```
+------------------------------------------+
|  Chat Widget (Floating, bottom-right)    |
|  +------------------------------------+  |
|  | Header: "Bark AI Assistant" | Close|  |
|  +------------------------------------+  |
|  |                                    |  |
|  |  [User message bubble]             |  |
|  |                                    |  |
|  |  [AI response - streaming tokens]  |  |
|  |  +------------------------------+  |  |
|  |  | Product cards (if applicable)|  |  |
|  |  +------------------------------+  |  |
|  |                                    |  |
|  |  [Typing indicator...]             |  |
|  |                                    |  |
|  +------------------------------------+  |
|  | [Input field]          [Send]        |  |
|  +------------------------------------+  |
+------------------------------------------+
```



### SSE Streaming Implementation

**Connection Flow:**

1. User types message and clicks Send
2. Frontend creates `POST` request to `http://localhost:8000/api/client/chat`
3. Request body: `{ message: "...", session_id: "..." }`
4. Backend returns `Content-Type: text/event-stream`
5. Frontend reads response body as `ReadableStream`
6. Each SSE chunk contains a token from the LLM
7. Tokens are appended to the current assistant message in state
8. UI updates in real-time as tokens arrive

**Key Implementation Details:**

- Use `fetch()` API (NOT `EventSource`) because we need POST with a request body
- Use `AbortController` for cancellation support
- Parse `data: {...}\n\n` SSE format
- Handle `[DONE]` sentinel to know when streaming is complete
- Support retry with exponential backoff on connection failure
- Show typing indicator before first token arrives
- Disable send button while streaming



### Chat Widget States


| State         | UI Behavior                                      |
| ------------- | ------------------------------------------------ |
| **Idle**      | Floating button with icon, click to expand       |
| **Expanded**  | Chat window visible, empty or with history       |
| **Loading**   | Typing indicator, send button disabled           |
| **Streaming** | Tokens appearing one by one, stop button visible |
| **Error**     | Error message with retry button                  |
| **Offline**   | "AI assistant unavailable" message               |




### Chat Features

- **Markdown Rendering**: AI responses may contain markdown (bold, lists, links, code)
- **Product Cards**: When AI references products, render interactive product cards
- **Session Persistence**: Chat history stored in localStorage, loaded on revisit
- **Anonymous Users**: No login required, session tracked by generated session_id
- **Logged-in Users**: Chat linked to user account, history accessible from client portal
- **Copy Message**: Click to copy AI response to clipboard
- **Feedback**: Thumbs up/down on AI responses



### Dedicated Chat Page

In addition to the floating widget, a full-page chat interface is available at `/chat` for logged-in users who want a larger conversation area. Same component, different layout (full viewport instead of floating widget).

---



## 10. Admin AI Chat Interface



### Architecture

The admin AI chat is a **full-featured chat panel** within the admin dashboard that connects to the multi-agent admin system. It includes human-in-the-loop interactions.

**Tools the UI should expect (by delivery):**

| Kind | Examples | UI behavior |
|------|----------|-------------|
| Native LangGraph | `create_invoice`, `generate_invoice_pdf`, `search_products`, `update_lead_status` | Show draft cards / PDF download links |
| WhatsApp MCP | `send_notification` | Confirm recipient + message preview (HITL) |
| Email MCP | `send_email`, `send_template_email` | Confirm To/Subject; show “email queued” |
| Media MCP | `presign_upload`, `get_public_url` | Show upload progress / CDN link |
| Calendar MCP | `create_event` | Show date picker / event summary card |
| Ads / Canvas MCP | `publish_post`, `generate_design` | Preview creative; confirm publish |
| Web Research MCP | `fetch_url`, `search_web` | Collapsible “sources” citations in the reply |

Never render raw MCP credentials. Invoice PDF remains a **download URL**, not bytes.

```
+--------------------------------------------------------------+
|  Admin AI Chat                                    [Full Screen]|
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  [Admin message: "Create invoice for Raj Industries"]    ||
|  |                                                          ||
|  |  [Invoice Agent — HITL, then native tools]               ||
|  |  +----------------------------------------------------+  ||
|  |  | Invoice Draft Preview (card)                       |  ||
|  |  | Customer: Raj Industries | Items: 3 | Total: Rs.X  |  ||
|  |  | [Confirm create]  [Cancel]                         |  ||
|  |  +----------------------------------------------------+  ||
|  |                                                          ||
|  |  [After create_invoice + generate_invoice_pdf]           ||
|  |  +----------------------------------------------------+  ||
|  |  | Invoice BT-2026-0042 created                       |  ||
|  |  | [Download PDF]  <- URL from tool result            |  ||
|  |  +----------------------------------------------------+  ||
|  |                                                          ||
|  |  [Human-in-the-Loop Question]                            ||
|  |  +----------------------------------------------------+  ||
|  |  | Warning: This invoice has 2 items with missing HSN |  ||
|  |  | codes. How would you like to proceed?              |  ||
|  |  |                                                    |  ||
|  |  | ( ) Auto-fill HSN from product catalog             |  ||
|  |  | ( ) Skip HSN codes (not required)                  |  ||
|  |  | (*) Edit manually (recommended)                    |  ||
|  |  |                                                    |  ||
|  |  |                    [Submit Choice]                  |  ||
|  |  +----------------------------------------------------+  ||
|  |                                                          ||
|  +----------------------------------------------------------+|
|  | [Input field]                    [Send] [Stop] [Clear]   ||
|  +----------------------------------------------------------+|
+--------------------------------------------------------------+
```

**Agent invoice PDF (UI contract):** When tool `generate_invoice_pdf` returns `{ download_url, filename }`, render a download/open control. Do not expect PDF bytes in the SSE payload. Invoice tools are **native LangGraph tools** wrapping Python `InvoiceService` (WeasyPrint) — not Invoice MCP. See `python_ai_agent_architecture.md`.



### Human-in-the-Loop UI Components


| Component            | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `HumanQuestionCard`  | Displays agent's question with choices (radio buttons) |
| `ConfirmationDialog` | Yes/No confirmation with impact assessment             |
| `ChoiceSelector`     | Multiple choice with descriptions and default          |
| `ImpactBanner`       | Shows what will be affected by the action              |
| `ApprovalPending`    | Visual indicator that agent is waiting for input       |


---



## 11. Forms & Validation



### React Hook Form + Zod Pattern

All forms use React Hook Form for state management and Zod for validation. Zod schemas are **shared with the backend** for consistency.

### Key Forms in the System


| Form                   | Module | Complexity |
| ---------------------- | ------ | ---------- |
| **Inquiry/RFQ Form**   | Public | Medium     |
| **Contact Form**       | Public | Low        |
| **Newsletter Signup**  | Public | Low        |
| **Product Form**       | Admin  | High       |
| **Invoice Form**       | Admin  | Very High  |
| **Category Form**      | Admin  | Low        |
| **Inquiry Update**     | Admin  | Medium     |
| **Stock Update**       | Admin  | Low        |
| **CMS Content Form**   | Admin  | Medium     |
| **User Form**          | Admin  | Medium     |
| **Installation Form**  | Admin  | Medium     |
| **Campaign Post Form** | Admin  | Medium     |




### Invoice Form (Most Complex)

The invoice form requires:

1. **Multi-section layout**: Customer info, delivery info, bank details, line items, notes
2. **Dynamic line items**: Add/remove rows, each with description, HSN, quantity, unit price, GST rate
3. **Auto-calculations**: Line amount, subtotal, GST amount, total, amount in words
4. **Invoice number validation**: Real-time uniqueness check as admin types
5. **LLM review integration**: "Submit for AI Review" button, show LLM suggestions, accept/reject per field
6. **Draft auto-save**: Form state persisted to localStorage, restored on revisit
7. **PDF preview**: Live preview of how the invoice will look as PDF



### Zod Schema Example (Conceptual)

```typescript
const InvoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number required"),
  customer_name: z.string().min(1, "Customer name required"),
  customer_email: z.string().email("Invalid email").optional(),
  customer_phone: z.string().optional(),
  customer_company: z.string().optional(),
  customer_address: z.string().optional(),
  customer_gst: z.string().optional(),
  currency: z.string().default("INR"),
  due_date: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, "At least one item required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc_code: z.string().optional(),
});

const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  hsn_code: z.string().optional(),
  quantity: z.number().positive("Must be positive"),
  unit_price: z.number().positive("Must be positive"),
  gst_rate: z.number().min(0).max(100),
});
```

---



## 12. Data Tables (Admin)



### TanStack Table Integration

All admin list pages use a shared `DataTable` component built on TanStack Table.

### DataTable Features


| Feature               | Description                                 |
| --------------------- | ------------------------------------------- |
| **Column Sorting**    | Click column header to sort asc/desc        |
| **Column Filtering**  | Filter by specific column values            |
| **Global Search**     | Search across all visible columns           |
| **Pagination**        | Page controls with page size selector       |
| **Row Selection**     | Checkbox selection for bulk operations      |
| **Column Visibility** | Show/hide columns via dropdown              |
| **Export**            | Export visible data as CSV                  |
| **Responsive**        | Horizontal scroll on mobile, hidden columns |




### Server-Side vs Client-Side Tables


| Scenario           | Approach                                                            |
| ------------------ | ------------------------------------------------------------------- |
| **< 200 rows**     | Client-side: fetch all, paginate/filter in browser                  |
| **> 200 rows**     | Server-side: `manualPagination`, `manualSorting`, `manualFiltering` |
| **Real-time data** | Server-side with polling or WebSocket updates                       |


Most admin tables use **server-side** mode since the backend supports pagination, sorting, and filtering via query parameters.

### Table Configurations


| Table       | Server-Side | Key Filters                          |
| ----------- | ----------- | ------------------------------------ |
| Products    | Yes         | Category, Review Status, Published   |
| Inquiries   | Yes         | Status, Source, Priority, Date Range |
| Invoices    | Yes         | Status, Date Range, Amount Range     |
| Stock       | Yes         | Low Stock, Location                  |
| Users       | Yes         | Role, Active Status                  |
| Audit Logs  | Yes         | Action, Resource Type, Date Range    |
| Chat Traces | Yes         | Agent, Status, Date Range            |


---



## 13. PDF Generation (Invoices)



### Three PDF Generation Paths


| Path                    | When                              | How                                                                 |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------- |
| **Client-side Preview** | Admin wants instant form preview  | Optional: `@react-pdf/renderer` blob in browser                     |
| **Server-side Final**   | Admin clicks "Generate PDF" on UI | Python `InvoiceService.generate_pdf` (WeasyPrint + Jinja2 template) |
| **Agent-driven**        | Admin asks AI to create invoice   | Native tools `create_invoice` → `generate_invoice_pdf` → download URL in chat |

**Canonical final PDF** is always WeasyPrint in Python (same template as admin UI). Agent does not use Invoice MCP; it calls the same service and returns a URL such as `/admin/invoices/{id}/pdf` or `/api/v1/invoices/{id}/pdf`.




### Invoice PDF Components

```
InvoicePDF (Document)
  InvoiceHeader
    Company Logo
    Invoice Number + Date
    Invoice Status Badge
  CustomerSection
    Bill To (name, address, GST)
    Ship To (if different)
  InvoiceLineItems (Table)
    Table Header (Description, HSN, Qty, Price, GST, Amount)
    Table Rows (dynamic, from form data)
  InvoiceSummary
    Subtotal
    GST Amount
    Total
  AmountInWords
  BankDetails
    Bank Name, Account, IFSC, SWIFT
    QR Code (optional)
  TermsAndConditions
  Footer
    Page number
    "Generated by Bark Technologies"
```



### PDF Generation Flow

**UI (form) path:**

1. Admin fills invoice form
2. Admin clicks "Preview PDF" (optional client-side preview)
3. Admin clicks "Generate Final PDF"
4. Frontend calls `GET /api/v1/invoices/:id/pdf`
5. Python `InvoiceService.generate_pdf` renders Jinja2 → WeasyPrint → PDF bytes
6. Response is streamed as download (optional: upload to S3/R2 and return URL)
7. Frontend shows download link

**Agent path:**

1. Admin: "Create invoice for Raj Industries, 2× BT-120…"
2. HITL confirm in chat
3. Native tool `create_invoice` persists row
4. Native tool `generate_invoice_pdf` returns `{ download_url, filename, invoice_number }`
5. Chat UI renders [Download PDF] from that URL (no PDF bytes in SSE)

---



## 14. File Upload Architecture



### Presigned URL Flow

All file uploads use presigned URLs for direct S3/R2 upload (no backend proxy):

1. Frontend calls `POST /api/v1/upload/presigned-url` with filename, MIME type
2. Backend validates: MIME type allowed? File size within limit? User authorized?
3. Backend generates presigned upload URL (5-minute expiry)
4. Frontend uploads file directly to S3/R2 using the presigned URL (PUT request)
5. Frontend notifies backend: `POST /api/v1/upload/confirm` with filename, size, S3 key
6. Backend saves file metadata to database



### File Validation Rules


| Content Type   | Allowed MIME Types                  | Max Size |
| -------------- | ----------------------------------- | -------- |
| Product Images | image/jpeg, image/png, image/webp   | 10 MB    |
| Product Videos | video/mp4, video/webm               | 100 MB   |
| Documents      | application/pdf, application/msword | 50 MB    |
| User Avatars   | image/jpeg, image/png, image/webp   | 5 MB     |




### Upload Component

The `FileUpload` component provides:

- Drag-and-drop zone
- Click to browse
- File type and size validation (client-side)
- Upload progress bar
- Preview (for images)
- Remove/replace button
- Error messages

---



## 15. State Management



### State Categories


| Category         | Tool            | Examples                                               |
| ---------------- | --------------- | ------------------------------------------------------ |
| **Server State** | TanStack Query  | Products, inquiries, invoices, analytics, chat history |
| **Client State** | Zustand         | Auth tokens, UI state, chat messages, form drafts      |
| **URL State**    | React Router    | Pagination, filters, search query, active tab          |
| **Form State**   | React Hook Form | Form values, validation errors, dirty fields           |




### Zustand Stores


| Store               | Purpose                                    | Persisted?         |
| ------------------- | ------------------------------------------ | ------------------ |
| `authStore`         | User info, tokens, login/logout actions    | Yes (localStorage) |
| `chatStore`         | Chat messages, session ID, streaming state | Yes (localStorage) |
| `uiStore`           | Sidebar collapsed, theme, active modals    | Yes (localStorage) |
| `invoiceDraftStore` | Invoice form auto-save                     | Yes (localStorage) |




### Why This Split

- **Server state** (TanStack Query): Automatically handles caching, refetching, deduplication. No manual state management needed for API data.
- **Client state** (Zustand): Lightweight, no boilerplate. Good for auth, UI toggles, chat messages.
- **URL state**: Filters and pagination in URL for shareability and browser back/forward.
- **Form state**: React Hook Form manages form internals; only submit data goes to server state.

---



## 16. Routing Architecture



### Route Configuration

```
/                           PublicLayout > Home
/products                   PublicLayout > Products
/products/:slug             PublicLayout > ProductDetail
/products/category/:slug    PublicLayout > CategoryPage
/contact                    PublicLayout > Contact
/about                      PublicLayout > About
/case-studies               PublicLayout > CaseStudies
/case-studies/:slug         PublicLayout > CaseStudyDetail
/news                       PublicLayout > News
/news/:slug                 PublicLayout > NewsDetail
/blog                       PublicLayout > Blog
/blog/:slug                 PublicLayout > BlogDetail
/faq                        PublicLayout > FAQ
/installations              PublicLayout > Installations
/spare-parts                PublicLayout > SpareParts
/inquiry                    PublicLayout > InquiryForm
/download/:productId        PublicLayout > DatasheetDownload
/chat                       PublicLayout > ChatPage
/login                      AuthLayout > Login
/register                   AuthLayout > Register
/forgot-password            AuthLayout > ForgotPassword
/reset-password             AuthLayout > ResetPassword
/verify-email               AuthLayout > VerifyEmail

/dashboard                  AdminLayout > Dashboard (admin only)
/admin/login                AdminLayout > Login
/admin/products             AdminLayout > ProductList
/admin/products/new         AdminLayout > ProductCreate
/admin/products/:id         AdminLayout > ProductDetail
/admin/products/:id/edit    AdminLayout > ProductEdit
/admin/categories           AdminLayout > CategoryList
/admin/inquiries            AdminLayout > InquiryList
/admin/inquiries/:id        AdminLayout > InquiryDetail
/admin/invoices             AdminLayout > InvoiceList
/admin/invoices/new         AdminLayout > InvoiceCreate
/admin/invoices/:id         AdminLayout > InvoiceDetail
/admin/invoices/:id/edit    AdminLayout > InvoiceEdit
/admin/stock                AdminLayout > StockList
/admin/cms/*                AdminLayout > CMS pages
/admin/analytics            AdminLayout > Analytics pages
/admin/users                AdminLayout > UserList
/admin/chat                 AdminLayout > ChatInterface
/admin/observability        AdminLayout > TraceList
/admin/audit                AdminLayout > AuditLogList
/admin/settings             AdminLayout > Settings

/client                     ClientLayout > ClientDashboard (client only)
/client/inquiries           ClientLayout > ClientInquiries
/client/invoices            ClientLayout > ClientInvoices
/client/profile             ClientLayout > ClientProfile
```



### Route Guards


| Guard             | Logic                                          |
| ----------------- | ---------------------------------------------- |
| **Public**        | No auth required, accessible to all            |
| **Authenticated** | Requires valid JWT, redirects to /login if not |
| **Admin**         | Requires admin role, redirects to / if client  |
| **Client**        | Requires client or admin role                  |


---



## 17. Styling Architecture



### Tailwind CSS v4 Configuration

Brand colors are defined as CSS variables for theme switching:

- **Primary**: Blue (#1565c0) — Navigation, buttons, links
- **Secondary**: Green (#2e7d32) — Success states, CTAs
- **Accent**: Orange (#ef6c00) — Highlights, badges, alerts
- **Destructive**: Red (#dc2626) — Errors, delete actions

Dark mode is supported via CSS variable overrides on `.dark` class.

### Responsive Breakpoints


| Breakpoint | Width  | Usage            |
| ---------- | ------ | ---------------- |
| `sm`       | 640px  | Mobile landscape |
| `md`       | 768px  | Tablet           |
| `lg`       | 1024px | Small desktop    |
| `xl`       | 1280px | Desktop          |
| `2xl`      | 1536px | Large desktop    |


---



## 18. Performance Optimization



### Code Splitting

- Route-level code splitting with `React.lazy()` and `<Suspense>`
- Separate bundles for: Public pages, Admin pages, Chat widget, PDF components
- Dynamic imports for heavy components (charts, tables, PDF)



### Asset Optimization

- Images: Use `loading="lazy"`, WebP format, responsive `srcset`
- Fonts: Self-host Inter (or similar), use `font-display: swap`
- CSS: Tailwind purges unused classes, no unused CSS



### Caching Strategy

- **Static assets**: CDN cache with long TTL (1 year for hashed assets)
- **API responses**: TanStack Query cache with stale-while-revalidate
- **JWT tokens**: Zustand store + localStorage (survives page reload)
- **Chat history**: localStorage with 30-day TTL



### Bundle Targets

- Public pages: < 200KB gzipped for initial load
- Admin bundle: ~350KB gzipped (acceptable for authenticated users)
- PDF components: Lazy-loaded only when invoice page is accessed

---



## 19. Templates & Starting Points



### Recommended Admin Dashboard Templates


| Template                          | Stack                               | License | Best For                                       |
| --------------------------------- | ----------------------------------- | ------- | ---------------------------------------------- |
| **shadcn-admin** (satnaing)       | React + Vite + shadcn/ui + Tailwind | MIT     | Admin dashboard base with sidebar, auth, theme |
| **TailAdmin**                     | React 19 + Tailwind v4              | MIT     | Admin dashboard with 500+ components           |
| **next-shadcn-dashboard-starter** | Next.js 16 + shadcn/ui              | MIT     | If migrating to Next.js later                  |




### How to Adapt These Templates

1. **Clone the template** as a starting point
2. **Strip out demo pages** you don't need
3. **Keep the core layout** (sidebar, header, auth flow)
4. **Add your own pages** following the module structure
5. **Customize the theme** with Bark Technologies brand colors
6. **Integrate API calls** using the TanStack Query patterns



### Public Website Templates

For the public website, consider these starting points:


| Template      | Stack                         | Price |
| ------------- | ----------------------------- | ----- |
| **Xbuild**    | React + Next.js + Bootstrap 5 | $29   |
| **Industril** | React + Next.js + Bootstrap 5 | $29   |
| **Matrik**    | React + Next.js + SCSS        | $29   |


> **Note**: Since Bark uses Tailwind CSS (not Bootstrap), it may be cleaner to build the public pages from scratch using shadcn/ui components, which already provide all the patterns needed (hero sections, product cards, contact forms, etc.).

---



## 20. Deployment Architecture



### Build & Deploy Pipeline

```
Developer pushes code -> GitHub -> GitHub Actions CI/CD
                                          |
                    +---------------------+---------------------+
                    v                                           v
            npm run build (Vite)                        Tests Pass (Vitest)
            Static files (dist/)                              |
                    |                                         |
                    +---------------------+-------------------+
                                          v
                              Static files deployed to:
                    +-------------------+-------------------+
                    v                   v                   v
                Vercel            Cloudflare Pages     Nginx + VPS
               (auto)              (auto)            (manual SCP)
```



### Deployment Options


| Option               | Best For                    | Setup                            |
| -------------------- | --------------------------- | -------------------------------- |
| **Vercel**           | Fastest setup, free tier    | Connect GitHub repo, auto-deploy |
| **Netlify**          | Static sites, form handling | Connect GitHub, configure build  |
| **Cloudflare Pages** | CDN + edge performance      | Connect GitHub, configure build  |
| **Nginx + VPS**      | Full control, custom domain | Build locally, SCP to server     |
| **Docker**           | Consistent environments     | Multi-stage Dockerfile           |




### Nginx Configuration (for VPS)

Key configuration for serving the SPA and proxying API requests:

- **Static files**: Serve from `/var/www/bark-frontend/dist`
- **SPA fallback**: `try_files $uri $uri/ /index.html`
- **API proxy**: `/api/` proxied to `http://localhost:3000`
- **SSE proxy**: `/api/client/chat` and `/api/admin/chat` proxied to `http://localhost:8000` with `proxy_buffering off` and `chunked_transfer_encoding off`
- **SSL**: Let's Encrypt certificates
- **Caching**: 1 year cache for hashed assets in `/assets/`



### Docker Configuration

Multi-stage build:

- **Stage 1 (Builder)**: Node 22 Alpine, install deps, `npm run build`
- **Stage 2 (Serve)**: Nginx Alpine, copy `dist/` to Nginx html directory, custom nginx.conf

---



## 21. Security Considerations



### Frontend Security Layers


| Layer            | Measure                                                         |
| ---------------- | --------------------------------------------------------------- |
| **Input**        | Zod validation on all forms, HTML sanitization for user content |
| **Auth**         | JWT in memory (Zustand) + localStorage backup, auto-refresh     |
| **Transport**    | HTTPS enforced, CORS configured, no mixed content               |
| **XSS**          | React auto-escapes by default, sanitize markdown output         |
| **CSRF**         | SameSite cookies, no state-changing GET requests                |
| **Storage**      | No secrets in localStorage, only tokens and UI preferences      |
| **Dependencies** | npm audit, Dependabot for vulnerability scanning                |




### Token Security

- Access tokens stored in memory (Zustand) — cleared on page close
- Refresh tokens stored in localStorage — longer-lived
- Tokens never logged to console in production
- Tokens excluded from error reports

---



## 22. Implementation Roadmap



### Phase 1: Foundation (Weeks 1-2)

- Project scaffolding (Vite + React + TypeScript)
- Tailwind CSS v4 setup + shadcn/ui installation
- shadcn-admin template adaptation (sidebar, auth, theme)
- API client layer with auth interceptors
- Zustand stores (auth, UI, chat)
- React Router configuration (all routes)
- Login/Register pages
- JWT token management (login, refresh, logout)
- Protected route guards (admin, client)
- Basic layout components (PublicLayout, AdminLayout)



### Phase 2: Public Website (Weeks 3-4)

- Home page (hero, featured products, CTA sections)
- Product catalog page (grid, filters, search, pagination)
- Product detail page (specs, media gallery, documents)
- Category page
- Contact page (form, office locations)
- About page
- Navbar + Footer (responsive)
- SEO meta tags
- 404 page



### Phase 3: Admin Dashboard Core (Weeks 5-6)

- Dashboard overview (stat cards, charts, recent activity)
- Product CRUD (list, create, edit, detail, review workflow)
- Category CRUD
- File upload component (presigned URL flow)
- DataTable component (reusable, server-side pagination)
- Form components (FormField, FileUpload)
- Confirmation dialogs, toast notifications
- Inquiry list + detail + status management
- User management (list, create, edit, roles)



### Phase 4: Business Logic (Weeks 7-8)

- Invoice form (multi-section, dynamic line items, auto-calculations)
- Invoice LLM review integration
- Invoice PDF preview (client-side @react-pdf/renderer)
- Invoice PDF generation trigger (server-side)
- Invoice status recording (paid / partially_paid) — no payment gateway; admin marks cash/bank payment manually
- Stock management (CRUD, reservation, logs)
- GST calculation utilities
- Amount-in-words conversion



### Phase 5: Content and AI (Weeks 9-10)

- CMS modules (case studies, news, blog, FAQs, pages, offices)
- Blog review workflow
- Installations showcase
- Campaign content posts
- Social media admin pages (platform connection, publish UI, analytics dashboard, AI caption generator)
- Social media API client integration
- Client-facing AI chat widget (floating)
- AI chat SSE streaming integration
- Admin AI chat interface (multi-agent + human-in-the-loop)
- Admin AI MCP action cards (email send, WhatsApp notify, calendar event, campaign publish, media upload)
- Chat history viewer (include MCP tool names in tool chain)



### Phase 6: Analytics and Email (Weeks 11-12)

- Analytics dashboard (page views, product views, search trends)
- Conversion funnel visualization
- Email subscriber management
- Email sequence viewer
- AI observability dashboard (traces, cost, latency)
- Trace detail view (tool chain, token breakdown)



### Phase 7: Polish and Deploy (Weeks 13-14)

- Dark mode implementation
- Loading states, skeletons, empty states
- Error boundaries
- Responsive testing (mobile, tablet, desktop)
- Performance audit (Lighthouse, bundle analysis)
- E2E tests (Cypress for critical flows)
- SEO audit
- Accessibility audit (WAI-ARIA, keyboard navigation)
- Deployment (Vercel or Nginx + VPS)
- Documentation

---



## Appendix A: Key Design Patterns



### Pattern 1: Container/Presentational

- **Container**: Handles data fetching (TanStack Query), state management, business logic
- **Presentational**: Pure UI component receiving data and callbacks as props



### Pattern 2: Compound Components

Used for complex UI like DataTable, ChatWidget, FormField. Parent component manages state, children access it via context.

### Pattern 3: Custom Hooks for Reusable Logic

- `useAuth()` — Login, logout, user info, token refresh
- `useChat()` — SSE streaming, message history, session management
- `usePresignedUpload()` — File upload flow with progress tracking
- `usePagination()` — URL-driven pagination state

---



## Appendix B: API Endpoint Mapping (Frontend to Backend)


| Frontend Page     | API Endpoint                             | Method     |
| ----------------- | ---------------------------------------- | ---------- |
| Login             | `/api/v1/auth/login`                     | POST       |
| Register          | `/api/v1/auth/register`                  | POST       |
| Refresh Token     | `/api/v1/auth/refresh`                   | POST       |
| Product List      | `/api/v1/products?page=&sort=&category=` | GET        |
| Product Detail    | `/api/v1/products/:slug`                 | GET        |
| Create Product    | `/api/v1/products`                       | POST       |
| Update Product    | `/api/v1/products/:id`                   | PUT        |
| Delete Product    | `/api/v1/products/:id`                   | DELETE     |
| Submit for Review | `/api/v1/products/:id/submit-review`     | POST       |
| Approve Product   | `/api/v1/products/:id/approve`           | POST       |
| Inquiry List      | `/api/v1/inquiries?status=&source=`      | GET        |
| Create Inquiry    | `/api/v1/inquiries`                      | POST       |
| Update Inquiry    | `/api/v1/inquiries/:id`                  | PUT        |
| Invoice List      | `/api/v1/invoices?status=&date=`         | GET        |
| Create Invoice    | `/api/v1/invoices`                       | POST       |
| Validate Invoice  | `/api/v1/invoices/:id/validate`          | POST       |
| Generate PDF      | `/api/v1/invoices/:id/pdf` (same URL agent tool returns) | GET        |
| Agent create+PDF  | Admin chat → native `create_invoice` + `generate_invoice_pdf` | SSE/tools |
| Mark Paid         | `/api/v1/invoices/:id/mark-paid`         | POST       |
| Stock List        | `/api/v1/stock?low_stock=`               | GET        |
| Update Stock      | `/api/v1/stock/:productId`               | PUT        |
| Dashboard Stats   | `/api/v1/analytics/dashboard`            | GET        |
| Chat History      | `/api/v1/chat/history/:sessionId`        | GET        |
| Audit Logs        | `/api/v1/audit/logs?action=&date=`       | GET        |
| AI Chat (Client)  | `http://localhost:8000/api/client/chat`  | POST (SSE) |
| AI Chat (Admin)   | `http://localhost:8000/api/admin/chat`   | POST (SSE) |
| Agent MCP (indirect) | via admin chat tools only — no direct browser→MCP | WhatsApp / Email / Media / Calendar / Ads / Canvas / Web Research |


---

*Document version: 1.0 | Last updated: 2026-07-17*
*See also:* `nodeJs_backned_System_architecture.md` *for the Node.js backend*
*See also:* `python_ai_agent_architecture.md` *for the AI agent layer*
*See also:* `databse_schema.txt` *for complete database schema*