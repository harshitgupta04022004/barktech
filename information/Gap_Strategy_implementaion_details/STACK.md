# Technology Stack — Project Decision

**Decided:** July 2026  
**Supersedes:** Node/Go options mentioned in `AUDIT-MASTER.md` §5–6

## Why Python

Project owner develops full-stack with **Python backend**, building on existing **HTML, CSS, JS, and SQL** skills (Node known at basics level only).

## Approved stack

```
┌─────────────────────────────────────────┐
│  Browser: HTML + CSS + JavaScript       │
│  (Jinja templates and/or static + fetch)│
└──────────────────┬──────────────────────┘
                   │ HTTP /api/*
┌──────────────────▼──────────────────────┐
│  FastAPI (Python)                       │
│  - products, RFQ, chat, admin           │
│  - LangGraph agent + tools              │
└──────────────────┬──────────────────────┘
                   │ SQLAlchemy / asyncpg
┌──────────────────▼──────────────────────┐
│  PostgreSQL + pgvector                  │
└─────────────────────────────────────────┘
```

## Package starting point

```txt
# requirements.txt (initial)
fastapi
uvicorn[standard]
sqlalchemy
alembic
asyncpg
psycopg2-binary
pydantic-settings
python-multipart
jinja2
httpx
```

Add later for AI: `langgraph`, `langchain-openai` (or anthropic), `pgvector`.

## Frontend options (pick one for Phase 1)

| Option | Best for |
|--------|----------|
| **A. FastAPI + Jinja2** | One repo, server-rendered pages, minimal JS |
| **B. Static HTML/JS + FastAPI API** | Keep current HTML look; replace forms with `fetch()` |
| **C. Django** | If admin CMS + ORM in one framework is preferred |

**Recommendation:** Option **A** or **B** — matches HTML/CSS/JS comfort.

## What stays from audit docs

- PostgreSQL schema (`SCHEMA-REFERENCE.md`)
- Phase 0–4 roadmap (`PHASES.md`)
- AI principles (grounded specs, Hindi, CRM routing)
- Gap/strategy docs — apply strategies using **Python** implementations

## Persistent memory

- `AGENTS.md` (repo root)
- `.cursor/rules/bark-python-stack.mdc` (Cursor always-on rule)
