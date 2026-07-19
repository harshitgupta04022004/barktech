# Bark Technologies — Project Context for AI Agents

Read this file at the start of any session working on this repository.

## Project

Rebuild **barktechnologies.in** from a static HTML mirror into a production B2B machinery website with PostgreSQL, CRM integration, and an agentic AI product assistant.

- Mirrored static site: `barktechnologies.in/`
- Gap analysis & strategies: `Gap/` (see `Gap/README.md`, `Gap/PHASES.md`, `Gap/AUDIT-MASTER.md`)

## Owner skill level

The developer knows:

- **HTML, CSS, JavaScript** (basics)
- **Node.js** (basics — not the primary backend choice)
- **SQL**

Prefer explanations and code that build on these skills. Avoid assuming deep React/TypeScript expertise unless the user asks for that stack.

## Stack decision (mandatory)

Use a **Python backend** for all server-side work on this project.

| Layer | Choice | Notes |
|-------|--------|--------|
| **Backend** | **FastAPI** (preferred) or Django | REST API, RFQ, AI chat, admin hooks |
| **Database** | **PostgreSQL** | SQL the user knows; use raw SQL or SQLAlchemy |
| **ORM / migrations** | SQLAlchemy 2 + Alembic, or Django ORM | Match framework choice |
| **Frontend** | **HTML + CSS + JS** the user already knows | Jinja2 templates served by FastAPI, or static pages calling `/api/*` |
| **Optional frontend boost** | HTMX or Alpine.js | Small progressive enhancement without heavy React |
| **AI assistant** | Python: LangGraph or LangChain + tool calls | Grounded on product DB; never invent specs |
| **Vector search** | **pgvector** in PostgreSQL | Same DB, no separate vector DB required at first |
| **CRM** | Zoho CRM webhooks | India-friendly |
| **Assets** | Local `static/` or S3-compatible storage | Product images, PDF datasheets |

### Do not default to

- Next.js / Node.js API as primary backend (Node basics only — OK for tiny tooling if needed)
- Go/Gin (mentioned in audit docs as optional — **superseded by Python** for this project)

## Implementation priorities

Follow `Gap/PHASES.md`:

1. **Phase 0** — Fix dead CTAs, specs, copy on static mirror
2. **Phase 1** — FastAPI + PostgreSQL + working RFQ + product API
3. **Phase 2** — Case studies, PDFs, Hindi content
4. **Phase 3** — Agentic AI widget (Python orchestration)

## Python project layout (target)

```
bark_technology/
  AGENTS.md                 # this file
  barktechnologies.in/      # legacy static mirror (reference)
  Gap/                      # gap + strategy docs
  backend/
    app/
      main.py               # FastAPI entry
      api/                  # routes: products, rfq, chat
      models/               # SQLAlchemy models
      services/             # CRM, email, AI agent
    alembic/                # migrations
    requirements.txt
  frontend/                 # or templates/ inside backend
    static/                 # css, js, images
    templates/              # Jinja2 HTML
```

## Conventions

- Match existing Bark brand colors: `#243559`, `#db2017`
- Product data: single source of truth in PostgreSQL (`Gap/09-database-backend/SCHEMA-REFERENCE.md`)
- Every RFQ and AI conversation: log `source` (`web_form`, `rfq`, `ai_chat`, `whatsapp`)
- AI must **only** state specs from database tool results (`Gap/08-agentic-ai/gap/grounded-specs-enforcement.md`)

## Benchmarks (content/competitive)

Fengchi/ONEZIM, BOBST, BHS Corrugated — see `Gap/AUDIT-MASTER.md`
