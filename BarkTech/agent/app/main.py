"""Bark Technologies — AI Agent Service (FastAPI on port 8000).

Run: uvicorn app.main:app --reload --port 8000
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
from app.routes import router, admin_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup/shutdown hooks."""
    logger.info("Starting Bark Technologies AI Agent service...")

    # MongoDB connection
    app.state.mongo_client = AsyncIOMotorClient(config.mongodb_uri)
    app.state.mongo_db = app.state.mongo_client[config.mongodb_db]

    # Initialize LangGraph checkpointer (MongoDB-backed conversation persistence)
    from app.checkpointer import setup_checkpointer
    app.state.checkpointer = await setup_checkpointer()
    logger.info("LangGraph checkpointer initialized")

    yield

    logger.info("Shutting down AI Agent service...")
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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bark-agent"}
