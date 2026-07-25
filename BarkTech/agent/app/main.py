"""Bark Technologies — AI Agent Service (FastAPI on port 8000).

Event-driven multi-agent system with:
- LangGraph + LangChain for agent orchestration
- MCP servers for external tool integration
- Redis Streams for inter-agent event bus
- Specialized agents: CRM, Sales, Content, Inventory, Scheduling, Research
- Event Router: direct event-to-agent routing (no supervisor overhead)
- Orchestrator: user chat delegation with verification

Run: uvicorn app.main:app --reload --port 8000
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
from app.routes import router, admin_router
from app.routes_product import product_router
from app.routes_invoice import invoice_router

logger = logging.getLogger(__name__)

# Background tasks for event loops
_background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup/shutdown hooks."""
    logger.info("Starting Bark Technologies AI Agent service...")

    # MongoDB connection
    app.state.mongo_client = AsyncIOMotorClient(config.mongodb_uri)
    app.state.mongo_db = app.state.mongo_client[config.mongodb_db]

    # Initialize LangGraph checkpointer (MongoDB-backed conversation persistence)
    from app.checkpointer import setup_checkpointer, setup_store, cleanup_checkpointer, cleanup_store
    app.state.checkpointer = await setup_checkpointer()
    logger.info("LangGraph checkpointer initialized")

    # Initialize LangGraph Store (long-term cross-thread memory)
    app.state.store = await setup_store()
    logger.info("LangGraph store initialized")

    # Initialize Event Bus (Redis Streams for inter-agent communication)
    try:
        from app.events.bus import init_event_bus
        app.state.event_bus = await init_event_bus()
        logger.info("Event bus (Redis Streams) initialized")

        # Start Event Router (direct event-to-agent routing, no supervisor)
        from app.agents.event_router import run_event_router_loop
        event_router_task = asyncio.create_task(run_event_router_loop())
        _background_tasks.append(event_router_task)
        logger.info("Event Router started (direct event-to-agent routing)")

        # Start individual agent event loops (for backward compatibility)
        from app.agents.supervisor import get_supervisor
        supervisor = get_supervisor()
        event_loop_tasks = await supervisor.start_event_loops()
        logger.info(f"Started {len(event_loop_tasks)} agent event loops")

    except Exception as e:
        logger.warning(f"Event bus not available (Redis not configured): {e}")
        app.state.event_bus = None

    yield

    logger.info("Shutting down AI Agent service...")

    # Cancel background tasks
    for task in _background_tasks:
        if not task.done():
            task.cancel()
    _background_tasks.clear()

    # Stop agent event loops
    try:
        from app.agents.supervisor import get_supervisor
        supervisor = get_supervisor()
        await supervisor.stop_event_loops()
    except Exception:
        pass

    # Disconnect event bus
    try:
        from app.events.bus import shutdown_event_bus
        await shutdown_event_bus()
    except Exception:
        pass

    # Cleanup MCP clients
    try:
        from app.mcp.clients.mcp_client_factory import cleanup_mcp_clients
        await cleanup_mcp_clients()
    except Exception:
        pass

    await cleanup_checkpointer()
    await cleanup_store()
    app.state.mongo_client.close()


app = FastAPI(
    title="Bark Technologies — AI Agent",
    description="Client-facing + Admin AI agent service with LangGraph",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────
# Allow frontend origin + localhost for development
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://barktechnologies.in").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────
app.include_router(router)
app.include_router(admin_router)
app.include_router(invoice_router)
app.include_router(product_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bark-agent"}
