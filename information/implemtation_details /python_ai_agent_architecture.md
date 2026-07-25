# Bark Technologies AI Agent Architecture

This architecture reimagines BarkTech's AI assistant as a **decentralized, event-driven multi-agent system** built on LangGraph and the Model Context Protocol (MCP). Each specialized agent (e.g. **CRM/Leads Agent**, **Sales/Invoice Agent**, **Content/Marketing Agent**, **Inventory/Stock Agent**, **Installation/Scheduling Agent**, etc.) has its own dedicated responsibilities, tools, and data sources. Agents communicate via an event bus rather than synchronous calls, enabling loose coupling, parallelism, and resilience. Below is the updated architecture overview and design focused on the MCP layer and agent tool integration.

## Architecture Overview

- **Event-Driven Workflow:** All domain activities emit events (e.g. `LeadCreated`, `InvoicePaid`, `ProductUpdated`, `StockLow`, `InquiryReceived`, `ContentPublished`, etc.) to a message broker (Redis Streams). Specialist agents subscribe to relevant event topics. For example, a *LeadAgent* listens for `LeadCreated`, an *InvoiceAgent* listens for `InvoicePaid`, a *ContentAgent* listens for `ContentRequested` or `BlogDraftRequested`, etc. This **publish/subscribe (pub-sub)** approach ensures loose coupling: one event can trigger multiple agents without a central orchestrator. Agents can also emit events (e.g. "QuotationSent", "StockReordered") for other agents to consume or for audit logging.

- **Horizontal Multi-Agent System:** Instead of one monolithic agent, we deploy **multiple specialized agents** that run concurrently. Each agent is optimized for its domain with tailored instructions and tools. An orchestration "supervisor" agent can exist to route tasks or aggregate results, but day-to-day operations are handled by peers collaborating via events. This modular approach avoids a single agent becoming a "jack-of-all-trades" and improves maintainability.

- **Memory Systems:** Agents have **short-term memory** (session-specific context) and **long-term memory**. Short-term memory (conversation history, intermediate data) is managed by LangGraph's state (per-thread checkpoints, persisted to Redis or a database). Long-term memory (customer preferences, past outcomes) is stored in a vector database or knowledge base (e.g. a MongoDB collection). Agents can recall relevant memories on demand for personalization or continuity.

- **Reasoning & Planning:** A central **Reasoning Engine** (LLM) guides agents. We use an LLM (e.g. GPT-5 via OpenRouter API) as the "brain". The **Sequential Thinking** MCP tool is included so agents can break complex tasks into steps and plan multi-step strategies, improving reliability on multi-hop tasks.

- **Safety & Governance:** All tool invocations go through MCP servers with scoped permissions. Destructive tools (e.g. delete operations) are marked "human-approval required" in metadata and disabled by default. Agents operate under the principle of least privilege. We log every action via an audit event bus. Human overseers can pause/resume agents or inspect their event log (LangGraph checkpoints, event stream replay) to provide guardrails.

The overall flow is illustrated below:

```mermaid
flowchart LR
  subgraph Backend
    BE[(Node.js API & DB)] 
    BE -->|emits events| EventBus
  end
  subgraph EventBus
    E1[(Redis Streams)]
  end
  subgraph Agents
    CRM[CRM / Lead Agent]
    Sales[Sales / Invoice Agent]
    Content[Content / Marketing Agent]
    Inventory[Inventory / Stock Agent]
    Schedule[Installation / Calendar Agent]
    Research[Research Agent]
  end
  EventBus --> CRM
  EventBus --> Sales
  EventBus --> Content
  EventBus --> Inventory
  EventBus --> Schedule
  EventBus --> Research

  CRM -->|calls| MongoDB_MCP
  CRM -->|calls| Resend_MCP
  Sales -->|calls| MongoDB_MCP
  Sales -->|calls| Storage_MCP
  Content -->|calls| MongoDB_MCP
  Content -->|calls| DuckDuckGo_MCP
  Content -->|calls| Canva_MCP
  Content -->|calls| Storage_MCP
  Schedule -->|calls| Calendar_MCP
  Inventory -->|calls| MongoDB_MCP
  Inventory -->|calls| Storage_MCP
  Inventory -->|calls| Resend_MCP

  subgraph "MCP Servers"
    MongoDB_MCP[/MongoDB/]
    Storage_MCP[/Backblaze B2/]
    DuckDuckGo_MCP[/DuckDuckGo/]
    Playwright_MCP[/Playwright/]
    Canva_MCP[/Canva/]
    Resend_MCP[/Resend/]
    Calendar_MCP[/Google Calendar/]
    Thinking_MCP[/Sequential Thinking/]
    Invoice_MCP[/Custom Invoice/]
  end
```

## System Components & MCP Tools

Each agent has a focused **toolset** (via MCP servers). Below is a mapping of typical agents to their MCP tools:

- **CRM / Inquiry Agent:** Manages customers, leads, inquiries. Tools: MongoDB (for CRM data), Resend (for email follow-ups), Calendar (scheduling demos), DuckDuckGo (background research on leads), Sequential Thinking (planning multi-step outreach).

- **Sales / Invoice Agent:** Generates quotes and invoices. Tools: MongoDB (for account and product data), Storage (Backblaze B2 via S3 MCP for PDF invoices and docs), Resend (email invoices/notifications), Custom Invoice MCP (domain-specific logic for invoice data).

- **Content / Marketing Agent:** Generates blog posts, social media posts, and creatives. Tools: MongoDB (store content metadata), DuckDuckGo (SEO research, competitor content), Canva (generate images, banners, brochures), Storage (store images, publishable assets), Resend (email newsletters), Google Calendar (schedule posts/campaigns).

- **Inventory / Stock Agent:** Manages stock levels and orders. Tools: MongoDB (inventory data), Storage (images/specs), Resend (order emails), DuckDuckGo (market research on parts/prices).

- **Installation / Scheduling Agent:** Coordinates service installations. Tools: MongoDB (customer orders), Google Calendar (book installation slots, reminders), Resend (confirmations), Playwright (if automated portal login needed).

- **Research Agent:** Assists all others with data. Tools: DuckDuckGo (general web search), Playwright (for complex web scraping or CAPTCHA-protected sites), Sequential Thinking.

### Available MCP Servers

We use **official or well-maintained open-source MCP servers** wherever possible:

- **MongoDB MCP (Official)** – Connects to Atlas/Cloud or on-prem MongoDB. Provides query, find, insert, update tools. Use a dedicated read/write user with least privileges (one database, needed collections only). During development, run in read-only mode by default.
- **Storage MCP (Backblaze B2/S3)** – Use Apache OpenDAL MCP (`mcp-server-opendal`). It exposes tools like `listBuckets`, `uploadFile`, `listFiles`, `deleteFile`, etc. Use environment vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT_URL`, `S3_BUCKET`) to configure.
- **DuckDuckGo MCP** – DuckDuckGo Search MCP (Python). Provides `duckduckgo_search` (return results) and `fetch_url` (get webpage text). No API keys needed and supports LLM-friendly output with rate-limiting built-in.
- **Playwright MCP** – Official Playwright MCP (Node) for browser automation (if needed). Use for tasks like logging into vendor portals, filling forms, taking screenshots, generating PDFs from web apps. Optional; only include if necessary.
- **Canva MCP** – Community-run MCP. Provides tools for creating designs, listing/exporting templates, uploading assets to Canva. Supports design creation, brand assets, and exporting images/PDFs. Requires OAuth credentials (`CANVA_APP_ID`, `CANVA_API_KEY`).
- **Resend MCP (Official)** – Resend's own MCP (TypeScript). Full-featured email platform integration: sending emails, managing contacts, templates, broadcasts, logs, etc. Use for transactional emails (invoices, notifications) and newsletters. Configure with `RESEND_API_KEY`.
- **Google Calendar MCP (Community)** – Community Python server (guinacio/mcp-google-calendar). Allows listing and managing calendar events, availability checks, scheduling. Requires OAuth2 config (`GOOGLE_CLIENT_ID`, `GOOGLE_CALENDAR_API_KEY`). Useful for booking installations, meetings, or reminders.
- **Sequential Thinking MCP** – Official Sequential Thinking server (npm) for multi-step planning. Helps break down tasks. Include in all agent bundles by default.
- **Custom Invoice MCP** – Custom FastMCP server for invoice-specific operations. Wraps Node.js backend invoice API.

**Tools Categorization:** We define each tool as read-only, write, etc. For example:

| Tool (MCP)         | Read | Write | Dangerous | Notes                        |
|--------------------|:----:|:-----:|:---------:|------------------------------|
| MongoDB MCP        | ✅   | ✅    | ❌        | Use least privilege          |
| Storage (B2/S3)    | ✅   | ✅    | ❌        | Bucket scope limited         |
| DuckDuckGo MCP     | ✅   | ❌    | ❌        | Safe web search              |
| Playwright MCP     | ✅   | ✅    | ⚠️        | Can automate site actions    |
| Canva MCP          | ✅   | ✅    | ❌        | (Design export)              |
| Resend MCP         | ✅   | ✅    | ❌        | Email sending                |
| Google Calendar MCP| ✅   | ✅    | ⚠️        | Modify events (protected by OAuth) |
| Sequential Thinking| ✅   | ❌    | ❌        | Planning tool                |
| Invoice MCP        | ✅   | ✅    | ⚠️        | Custom domain logic          |

Tools marked **Dangerous** or **Write** should be whitelisted only for agents with explicit need, and can require human approval.

## MCP Layer & MultiServerMCPClient

We implement a **shared MCP registry** with `MultiServerMCPClient`, but **do not** expose all tools to every agent. Instead, we define **agent-specific tool bundles**. Each agent gets its own `MultiServerMCPClient` instance (or a scoped view of one) configured only with the needed MCP servers (principle of least privilege).

For example:

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

# Shared configuration dictionary (no secrets hard-coded)
COMMON_MCP_CONFIG = {
    "mongodb": {
        "transport": "stdio",
        "command": "npx", "args": ["mongodb-mcp-server@latest"],
        "env": {"MDB_MCP_CONNECTION_STRING": os.getenv("MONGODB_URI")},
    },
    "storage": {
        "transport": "stdio",
        "command": "uvx", "args": ["mcp-server-opendal"],
        "env": {
            "OPENDAL_B2_TYPE": "s3",
            "OPENDAL_B2_BUCKET": os.getenv("S3_BUCKET"),
            "OPENDAL_B2_REGION": os.getenv("AWS_REGION"),
            "OPENDAL_B2_ENDPOINT": os.getenv("S3_ENDPOINT_URL"),
            "OPENDAL_B2_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
            "OPENDAL_B2_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
        },
    },
    "duckduckgo": {
        "transport": "stdio",
        "command": "uvx", "args": ["duckduckgo-mcp-server"],
    },
    "playwright": {
        "transport": "stdio",
        "command": "npx", "args": ["@playwright/mcp"],
    },
    "canva": {
        "transport": "stdio",
        "command": "node", "args": ["canva-mcp-server"],
        "env": {"CANVA_API_KEY": os.getenv("CANVA_API_KEY"), "CANVA_APP_ID": os.getenv("CANVA_APP_ID")},
    },
    "resend": {
        "transport": "stdio",
        "command": "npx", "args": ["resend-mcp"],
        "env": {"RESEND_API_KEY": os.getenv("RESEND_API_KEY")},
    },
    "calendar": {
        "transport": "stdio",
        "command": "uvx", "args": ["mcp-google-calendar"],
        "env": {"GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"), "GOOGLE_CALENDAR_API_KEY": os.getenv("GOOGLE_CALENDAR_API_KEY")},
    },
    "thinking": {
        "transport": "stdio",
        "command": "npx", "args": ["@modelcontextprotocol/server-sequential-thinking"],
    },
    "invoice": {
        "transport": "stdio",
        "command": "python", "args": ["invoice_mcp.py"],
    },
}

# Example: CRM Agent only needs mongodb, resend, calendar, ddg, thinking
crm_mcp_config = {k: COMMON_MCP_CONFIG[k] for k in ["mongodb","resend","calendar","duckduckgo","thinking"]}
crm_client = MultiServerMCPClient(crm_mcp_config)

# Sales Agent needs mongodb, storage, resend, thinking
sales_mcp_config = {k: COMMON_MCP_CONFIG[k] for k in ["mongodb","storage","resend","thinking"]}
sales_client = MultiServerMCPClient(sales_mcp_config)

# Content Agent needs mongodb, storage, duckduckgo, canva, thinking
content_mcp_config = {k: COMMON_MCP_CONFIG[k] for k in ["mongodb","storage","duckduckgo","canva","thinking"]}
content_client = MultiServerMCPClient(content_mcp_config)
```

**Key Points in Configuration:**

- **Centralized Config Registry:** We maintain one dictionary of all MCP server configs. Agents pick only their needed keys.
- **Lazy Loading:** MCPClient will only start servers and load tools when the agent actually calls `get_tools()` or a tool. Unused servers do not run.
- **Env Var Injection:** No secrets in code; credentials come from environment (`.env` or secrets manager). For example, `MONGODB_URI`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CANVA_API_KEY`, `RESEND_API_KEY`, etc.
- **Health Checks & Retry:** In production, each MCP server (especially HTTP servers like Resend or Calendar) can be wrapped with a health-checker. LangGraph agents can be configured with retry policies (e.g. 3 tries, 5s timeout) for tool calls. If an MCP server is down, the agent should handle it gracefully (log error, pause processing of that event, DLQ it, etc.).
- **Startup Order:** Some MCPs depend on others (e.g. Invoice MCP might need DB ready). Ensure the database is reachable before starting agents. We can use a simple health-check loop in each agent before handling events.

## MCP Folder Structure

Organize the MCP layer in its own directory (separate from backend/frontend):

```
mcp/
├── clients/             # Client factories and MultiServerMCPClient setups
├── configs/             # Example MCP configs (JSON/yaml) for agents
├── discovery/           # Scripts/utilities for registering and discovering MCP tools
├── health/              # Health-check scripts for each MCP server
├── permissions/         # Tool allowlists/deny-lists and RBAC rules
├── schema/              # JSON Schemas of MCP tools (for documentation)
├── servers/
│   ├── mongodb/         # MongoDB MCP config files
│   ├── storage/         # OpenDAL/Backblaze MCP config
│   ├── duckduckgo/
│   ├── playwright/
│   ├── canva/
│   ├── resend/
│   ├── calendar/
│   ├── thinking/
│   └── invoice/
├── startup/             # Orchestration scripts to launch servers
└── docs/                # Documentation on MCP usage, environment, keys
```

- **clients/**: Code to instantiate `MultiServerMCPClient` instances per agent.
- **configs/**: Example config templates per environment.
- **permissions/**: Define which tools each agent type may call (e.g. CRM agent cannot call `deleteUser` on Resend, etc.).
- **startup/**: If using Docker or init scripts, commands to start local MCP servers for development.
- **docs/**: Contains architecture docs (like this file) as well as developer guides.

## Environment Variables (12-Factor Config)

All secrets and environment-specific config come from the environment. Example `.env` entries:

```ini
# MongoDB
MONGODB_URI=mongodb+srv://bark_mcp:SecurePass@cluster0.mongodb.net/barkcrm
MONGODB_DB=BarkTech

# Message Bus (Redis Streams)
REDIS_URL=redis://:password@redis-cluster.upstash.io:6379/0

# LLM (OpenRouter for GPT-5)
OPENROUTER_API_KEY=<secret>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Google Calendar OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CALENDAR_API_KEY=...SN4R2DAO0zsAROndQI

# Canva
CANVA_APP_ID=<your_canva_app_id>
CANVA_API_KEY=<your_canva_secret>

# Backblaze B2 (S3)
AWS_REGION=us-east-005
AWS_ACCESS_KEY_ID=AKIAXXXX...
AWS_SECRET_ACCESS_KEY=XXXXXXXXX...
S3_BUCKET=barkTech
S3_ENDPOINT_URL=https://s3.us-east-005.backblazeb2.com

# Node/Backend (for completeness)
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
JWT_SECRET=<secret>

# (Any other service credentials go here)
```

No credentials are hardcoded. In production, these come from a secrets manager (AWS Secrets Manager, Vault, etc.).

## Security & Governance

- **Least Privilege:** Each MCP server is given minimal permissions. E.g. MongoDB user limited to certain collections, S3 user limited to a single bucket, Resend API key scoped appropriately.
- **Read-Only by Default:** MCP servers start in read-only mode. Write operations (delete, update) require an explicit flag/override or a different credential. This prevents accidental mutations.
- **Tool Whitelisting:** Agents are only given access to the tools they need. Remove unnecessary tools from their allowed list.
- **Human Approval:** Critical operations (e.g. "DeleteUser", "DeleteInvoice") require a manual confirmation step outside the agent, or a special "Approval Agent" that notifies admins and waits for OK.
- **Logging & Auditing:** All events and tool calls are logged. The event bus acts as an audit trail. Use observability tools (LangSmith, OpenTelemetry) to trace agent decisions and tool usage.
- **Version Pinning:** In production, pin MCP server versions (e.g. `mongodb-mcp-server@1.2.3`) to avoid untested updates.
- **Dependency Management:** Run MCP servers as isolated processes (Docker or VM). Use a firewall or network policy so only the AI service can reach them.
- **Secrets Management:** Environment variables never printed in logs. Audit access to secrets. Rotate keys regularly.

## Startup and Health

- **Service Startup:** On AI service startup, each agent's MCP servers should be available. Use health-check endpoints or simple ping tools. For example, verify the MongoDB MCP responds or that S3 listBuckets works before enabling task processing. If a server is down, the agent should queue events (or move them to a dead-letter queue) and retry.
- **Discovery & Registration:** Agents discover MCP tools via the `MultiServerMCPClient.get_tools()` call. Optionally maintain a service registry so health info is centralized.
- **Health Checks:** For HTTP/SSE servers (Resend, Calendar), we can poll their `/health` endpoint. For stdio servers (Mongo, DuckDuckGo), the client can attempt a lightweight tool (e.g. `ping`).
- **Failure Recovery:** If an MCP server fails, the agent logs the error and could either stop processing or switch to a degraded mode. For example, if the email server is down, the agent might still create an "EmailPending" event for manual processing later.

## Event Bus Implementation (Redis Streams)

We use **Redis Streams** (via Upstash Redis Cloud) as the event bus. Redis Streams provide:
- Consumer groups for parallel processing
- Message acknowledgment (at-least-once delivery)
- Dead letter queues for failed messages
- Persistent message history

### Event Types

| Event | Publisher | Subscribers | Description |
|-------|-----------|-------------|-------------|
| `LeadCreated` | Backend API | CRM Agent | New lead/inquiry submitted |
| `LeadUpdated` | CRM Agent | Analytics Agent | Lead status changed |
| `InvoiceCreated` | Sales Agent | Comms Agent, Analytics Agent | New invoice generated |
| `InvoicePaid` | Backend API | Sales Agent, Comms Agent | Invoice payment received |
| `ProductUpdated` | Backend API | Inventory Agent, Content Agent | Product data changed |
| `StockLow` | Inventory Agent | CRM Agent, Comms Agent | Stock below threshold |
| `ContentRequested` | Admin | Content Agent | Blog/post creation requested |
| `ContentPublished` | Content Agent | Analytics Agent | Content went live |
| `InstallationScheduled` | Scheduling Agent | Comms Agent | Installation date confirmed |
| `InquiryReceived` | Backend API | CRM Agent | Customer inquiry received |

### Redis Streams Code Pattern

```python
import redis.asyncio as redis

class EventBus:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    async def publish(self, stream: str, event: dict):
        """Publish an event to a Redis Stream."""
        await self.redis.xadd(stream, event)

    async def subscribe(self, stream: str, group: str, consumer: str):
        """Subscribe to events using a consumer group."""
        try:
            await self.redis.xgroup_create(stream, group, id="0", mkstream=True)
        except redis.ResponseError:
            pass  # Group already exists

        while True:
            try:
                messages = await self.redis.xreadgroup(
                    group, consumer, {stream: ">"}, count=1, block=5000
                )
                for stream_name, entries in messages:
                    for msg_id, data in entries:
                        yield msg_id, data
                        await self.redis.xack(stream, group, msg_id)
            except Exception as e:
                logger.error(f"Event bus error: {e}")
                await asyncio.sleep(1)
```

## Migration Plan

To move from the current backend-driven design to this MCP-based multi-agent system:

1. **Deploy Message Bus:** Set up Redis Streams (Upstash). Modify backend to publish domain events. Example: after creating a lead in API, publish `LeadCreated`. Remove direct calls to agent from backend.

2. **Launch Core MCP Servers:** Stand up MongoDB MCP, Storage MCP, DuckDuckGo MCP, Resend MCP, Calendar MCP, etc. Test each in isolation using MCP client (e.g. Claude Desktop or simple Python script) to verify connectivity.

3. **Build MultiServerMCPClient Config:** As above, create config files and instantiate per-agent clients.

4. **Implement Agents:** For each domain, write an agent program (using LangGraph's React agent or custom loop). On startup, each agent subscribes to its events and waits. For example:

   ```python
   # Example pseudo-code for LeadAgent
   client = MultiServerMCPClient(crm_mcp_config)
   tools = await client.get_tools()
   llm = ChatOpenAI(model="gpt-5")
   lead_agent = create_agent(llm, tools, memory=Memory(), agent_config=...)
   # Subscribe to Redis channel "LeadCreated"
   for event in redis_subscribe("LeadCreated"):
       result = await lead_agent.ainvoke({"messages":[{"role":"user","content": event.payload}]})
       # handle result, possibly emit new events
   ```

5. **Feature Parity:** Gradually migrate logic. E.g. for sending invoices, instead of HTTP call, the SalesAgent uses Resend MCP to send email. Once stable, remove old code from backend and rely on agent responses/events.

6. **Test & Iterate:** Use the event log for debugging. Employ human-in-the-loop for early iterations to approve risky actions.

7. **Rollout:** Once all agents are handling their domains and backend simply emits events, the system will be fully decentralized. The backend's role becomes just data API and event publishing, and the frontend interacts normally with the backend.

## Observability

- **Event Logs:** The sequence of events serves as an audit trail. Retain logs in a time-series store or append-only log.
- **Agent Tracing:** Use LangGraph's checkpoints + LangSmith to trace each conversation and tool call. Structured logging per agent helps correlate with domain events.
- **MCP Metrics:** Monitor MCP server health (CPU, memory) and tool invocation latencies. Flag timeouts.
- **Alerting:** Set up alerts for failing events (e.g. backlog growth, repeated errors).

## Summary

This new architecture transforms BarkTech's agent system into a horizontally scalable, event-driven platform. Specialist agents communicate via a message bus and invoke tools through standardized MCP servers. By using existing open-source MCPs (MongoDB, S3, DuckDuckGo, Resend, etc.), we avoid bespoke wrappers. The design emphasizes **modularity, security, and observability**. Each agent is simple and focused, yet together they cover CRM, sales, content, and operations. This decoupled setup makes the system robust: new agents can be added by subscribing to events, and tools can be swapped by reconfiguring the MCP layer without rewriting agent logic.

**Sources:** Official MCP documentation and libraries, and studies on event-driven multi-agent architectures.

---

## Completed Implementation Status

> Last updated: 2026-07-25

This section documents all work that has been **implemented and verified** in the Python AI agent system.

### Core Architecture

| Component | Status | File(s) |
|-----------|--------|---------|
| **Event-Driven Direct Routing** | Completed | `app/agents/event_router.py` |
| **Orchestrator (User Chat)** | Completed | `app/agents/supervisor.py` |
| **Structured Responses (Pydantic)** | Completed | `app/agents/responses.py` |
| **XML Tag Serializer** | Completed | `app/agents/serializer.py` |
| **Base Agent Class** | Completed | `app/agents/base.py` |
| **Event Bus (Redis Streams + Pub/Sub)** | Completed | `app/events/bus.py` |
| **Event Types** | Completed | `app/events/types.py` |
| **Checkpointer (Redis)** | Completed | `app/checkpointer.py` |
| **Cost Tracking** | Completed | `app/utils/cost.py` |
| **Observability Service** | Completed | `app/services/observability.py` |

### Dual-Path Architecture (Implemented)

**Path 1: Event-Driven Direct Routing (Backend → Agent → Backend)**

When the Node.js backend publishes an event (e.g. `LeadCreated`, `InvoicePaid`, `ProductUpdated`), the `EventRouter` dispatches directly to the specialized agent — **bypassing the orchestrator**. The agent processes the event, generates a structured response, and publishes it to a Redis Pub/Sub channel (`agent:response:{event_type}`) for the Node.js backend to consume.

```
Node.js Backend → Redis Stream Event → EventRouter → Specialized Agent
                                                              ↓
Node.js Backend ← Redis Pub/Sub ← Structured Response (XML-tagged)
```

Implemented event-to-agent mappings:
- `LeadCreated` / `InquiryReceived` → CRM Agent
- `InvoicePaid` / `InvoiceCreated` → Sales Agent
- `ProductUpdated` → Inventory Agent
- `ContentRequested` / `BlogDraftRequested` → Content Agent
- `InstallationScheduled` → Scheduling Agent
- `StockLow` → Inventory Agent (triggers reorder notification)

**Path 2: Orchestrator for User Chat (User → Orchestrator → Agent → User)**

When a user interacts with the AI chat interface, the `Orchestrator` manages the full lifecycle:
1. Parses user intent from the message
2. Delegates to specialized sub-agents as needed
3. **Verifies and fixes** agent outputs before composing the final response
4. Returns a structured response (text, table, product card, invoice card, etc.)

### Specialized Agents (All Implemented)

| Agent | Purpose | File | Tools |
|-------|---------|------|-------|
| **CRM Agent** | Lead management, inquiry processing, customer research | `app/agents/crm_agent.py` | MongoDB, Email (Brevo SMTP), DuckDuckGo |
| **Sales Agent** | Invoice generation, GST calculations, PDF creation | `app/agents/sales_agent.py` | MongoDB, Invoice MCP, Email (Brevo SMTP) |
| **Content Agent** | Blog/news/case study drafting, social media content | `app/agents/content_agent.py` | MongoDB, DuckDuckGo, Email (Brevo SMTP) |
| **Inventory Agent** | Stock management, reorder alerts, product catalog | `app/agents/inventory_agent.py` | MongoDB, Media MCP (S3) |
| **Scheduling Agent** | Installation scheduling, calendar management | `app/agents/scheduling_agent.py` | Google Calendar MCP |
| **Research Agent** | Web research, competitor analysis, data gathering | `app/agents/research_agent.py` | DuckDuckGo, Playwright |
| **Supervisor/Orchestrator** | Task delegation, verification, response composition | `app/agents/supervisor.py` | All agent tools (delegated) |

### Structured Response Types (Pydantic Models)

All agent responses use structured Pydantic schemas serialized into XML tags for frontend rendering:

| Response Type | Pydantic Model | XML Tag | Frontend Component |
|---------------|----------------|---------|-------------------|
| Product Card | `ProductCardResponse` | `<PRODUCT_CARD>` | `InlineProductCard` |
| Invoice Card | `InvoiceCardResponse` | `<INVOICE_CARD>` | `InlineInvoiceCard` |
| Lead Summary | `LeadSummaryResponse` | `<LEAD_CARD>` | `InlineLeadCard` |
| Content Card | `ContentCardResponse` | `<CONTENT_CARD>` | `InlineContentCard` |
| Stock Alert | `StockAlertResponse` | `<STOCK_ALERT>` | `InlineStockAlert` |
| Delete Confirm | `DeleteConfirmResponse` | `<DELETE_CONFIRM>` | Confirm/Cancel buttons |
| Multi Result | `MultiResultResponse` | `<MULTI_RESULT>` | Grouped result cards |
| Table | `TableResponse` | `<TABLE>` | Data table renderer |
| Chart | `ChartResponse` | `<CHART>` | Recharts component |
| Email Layout | `EmailLayoutResponse` | `<EMAIL_LAYOUT>` | Email preview card |

### MCP Integrations (All Verified)

| MCP Server | Transport | Status | Used By |
|------------|-----------|--------|---------|
| **Brevo Email (SMTP)** | SMTP relay (`smtp-relay.brevo.com:587`) | Working | Email Agent, Sales Agent, CRM Agent |
| **Brevo Email (API v3)** | HTTP (fallback) | Working | Email Agent |
| **Brevo MCP** | HTTP (`mcp.brevo.com`) | Connected | Email Agent |
| **WhatsApp Graph API** | HTTP (Direct API) | Working | Notification Agent |
| **Media/S3 (Backblaze B2)** | S3 API | Working | Inventory Agent, Content Agent |
| **DuckDuckGo Search** | stdio (uvx) | Working | Research Agent, CRM Agent |
| **Google Calendar** | stdio (uvx) | Configured | Scheduling Agent |
| **Invoice Service** | Custom FastMCP (Python) | Working | Sales Agent |

### Email Integration (Brevo SMTP)

The email system uses **Brevo SMTP relay** as the primary transport with Brevo API v3 as fallback:

```python
# Primary: SMTP via smtp-relay.brevo.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=b341f9001@smtp-brevo.com  # Brevo SMTP login (NOT account email)
SMTP_PASS=xsmtpsib-...              # Brevo SMTP key

# Fallback: Brevo API v3
BREVO_API_KEY=...                   # Decoded from BREVO_MCP_TOKEN
```

**Flow:**
1. Agent calls `send_email(to, subject, html)`
2. Tries SMTP via `smtplib` with TLS
3. If SMTP fails → falls back to Brevo API v3 (`POST /v3/smtp/email`)
4. Returns `{success, email_id, message}`

### Event Bus Implementation

Redis is used for both **Streams** (event publishing/consuming) and **Pub/Sub** (real-time agent responses):

- **Streams**: `bus.publish(stream, event)` → `XADD` for domain events (LeadCreated, InvoicePaid, etc.)
- **Pub/Sub**: `bus.publish_channel(channel, data)` → `PUBLISH` for agent responses back to Node.js
- **Subscribe**: `bus.subscribe(stream, group, consumer)` → `XREADGROUP` with consumer groups
- **Rate-limited error logging**: Stream subscription errors logged at most once per 60 seconds per stream

### MCP Client Configuration

Centralized in `app/mcp/clients/mcp_config.py`:

```python
MCP_SERVERS = {
    "brevo_email": {"transport": "http", "url": "https://mcp.brevo.com/v1/brevo/mcp", ...},
    "whatsapp": {"transport": "http", "url": "https://graph.facebook.com/v18.0/...", ...},
    "duckduckgo": {"transport": "stdio", "command": "uvx", "args": ["duckduckgo-mcp-server"]},
    "google_calendar": {"transport": "stdio", "command": "uvx", "args": ["mcp-google-calendar"], ...},
    "media_s3": {"transport": "http", "url": "http://localhost:8000/mcp/media", ...},
    "web_research": {"transport": "stdio", "command": "uvx", "args": ["mcp-server-web-research"]},
    "sequential_thinking": {"transport": "stdio", "command": "npx", "args": ["@modelcontextprotocol/server-sequential-thinking"]},
    "invoice_service": {"transport": "stdio", "command": "python", "args": ["mcp/invoice_mcp.py"]},
}
```

Each agent gets only the MCP servers it needs (principle of least privilege).

### FastAPI Endpoints (Implemented)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agent/admin/chat` | POST (SSE) | Admin AI chat with orchestrator |
| `/agent/client/chat` | POST (SSE) | Client AI chat (ReAct agent) |
| `/agent/health` | GET | Health check |
| `/agent/extract-from-upload` | POST | Server-side PDF/DOCX extraction + LLM |
| `/agent/events/publish` | POST | Publish event to Redis Stream |
| `/agent/events/subscribe` | POST | Subscribe to event stream |

### Python Dependencies (requirements.txt)

Key packages installed:
- `langchain`, `langchain-openai`, `langchain-mcp-adapters` — Agent framework + MCP integration
- `langgraph` — Multi-agent orchestration with state management
- `fastapi`, `uvicorn` — Web framework
- `redis[hiredis]` — Async Redis client
- `motor` — Async MongoDB driver
- `pymongo` — MongoDB driver
- `python-dotenv` — Environment variable loading
- `httpx` — Async HTTP client (Brevo API)
- `pydantic` — Data validation and structured responses
- `openai` — LLM API client

### Tests

| Test File | Purpose |
|-----------|---------|
| `tests/test_event_router.py` | Event-direct routing verification |
| `tests/test_orchestrator.py` | Orchestrator delegation and verification |

### What's Working End-to-End

1. **Email sending**: Agent sends email via Brevo SMTP relay → email delivered to recipient
2. **Event routing**: Backend publishes event → EventRouter dispatches to agent → agent returns structured response via Redis Pub/Sub
3. **User chat**: User sends message → Orchestrator delegates to agents → structured response rendered in chat UI
4. **Product CRUD via chat**: Admin asks agent to create/edit/delete products → agent uses native tools → product card rendered in chat
5. **Invoice CRUD via chat**: Admin asks agent to create invoices → agent calculates GST → invoice card with PDF download rendered
6. **S3 media**: Agent uploads files to Backblaze B2 via presigned URLs → returns public URLs
7. **Web research**: Agent uses DuckDuckGo MCP for real-time web search
8. **Structured responses**: All agent outputs use Pydantic models serialized to XML tags → frontend parses and renders rich UI components
