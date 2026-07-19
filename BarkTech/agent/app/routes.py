"""Agent API routes — chat endpoints for client and admin agents.

Per architecture spec:
- Client chat: POST /chat (JWT auth — any authenticated user)
- Admin chat: POST /admin/chat (JWT auth with admin role)
- Both use LangGraph checkpointer for conversation persistence
- Both save chat logs to MongoDB for observability
"""

import logging
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from app.auth.middleware import authenticate_client, authenticate_admin
from app.graph.client_agent import run_client_agent
from app.graph.admin_agent import run_admin_agent
from app.config import config

logger = logging.getLogger(__name__)

router = APIRouter()
admin_router = APIRouter(prefix="/admin", tags=["admin"])


# Chat log saver
async def _save_chat_log(
    session_id: str,
    user_message: str,
    assistant_reply: str,
    source: str = "client",
    user_email: str = "",
    user_name: str = "",
    model: str = "",
    latency_ms: float = 0,
    input_tokens: int = 0,
    output_tokens: int = 0,
    total_tokens: int = 0,
    cost: float = 0,
    tool_calls: list = None,
):
    """Save a chat log entry to MongoDB chat_logs collection.

    Token usage and cost data is captured from OpenRouter API responses.
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(config.mongodb_uri)
        db = client[config.mongodb_db]
        await db.chat_logs.insert_one(
            {
                "sessionId": session_id,
                "userEmail": user_email,
                "userName": user_name,
                "source": source,
                "userMessage": user_message,
                "assistantReply": assistant_reply,
                "model": model or config.admin_model,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "totalTokens": total_tokens,
                "cost": cost,
                "toolCalls": tool_calls or [],
                "latencyMs": latency_ms,
            }
        )
    except Exception as e:
        logger.error(f"Failed to save chat log: {e}")


# Request / Response models
class ChatMessage(BaseModel):
    message: str
    thread_id: Optional[str] = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: str


class AdminChatMessage(BaseModel):
    message: str
    thread_id: Optional[str] = None


# Client-facing agent (requires JWT auth — any role)
@router.post("/chat", response_model=ChatResponse)
async def client_chat(body: ChatMessage, user: dict = Depends(authenticate_client)):
    """Client-facing chat — product questions, RFQ, FAQ.

    JWT is verified via LangGraph's auth middleware. User context
    (role, scopes, email) is passed to the agent for scope-aware tool access.
    """
    thread_id = body.thread_id or f"client-{user.get('user_id', 'anonymous')}"
    start = time.time()
    result, usage_data = await run_client_agent(
        body.message,
        thread_id,
        user_context=user,
    )
    latency = (time.time() - start) * 1000
    await _save_chat_log(
        session_id=thread_id,
        user_message=body.message,
        assistant_reply=result,
        source="client",
        user_email=user.get("email", ""),
        user_name=user.get("name", ""),
        model=config.client_model,
        latency_ms=latency,
        input_tokens=usage_data.get("input_tokens", 0),
        output_tokens=usage_data.get("output_tokens", 0),
        total_tokens=usage_data.get("total_tokens", 0),
        cost=usage_data.get("cost", 0),
    )
    return ChatResponse(response=result, thread_id=thread_id)


@router.post("/chat/stream")
async def client_chat_stream(body: ChatMessage, user: dict = Depends(authenticate_client)):
    """SSE streaming chat for client widget."""
    thread_id = body.thread_id or f"client-{user.get('user_id', 'anonymous')}"

    async def event_generator():
        start = time.time()
        result, usage_data = await run_client_agent(
            body.message,
            thread_id,
            user_context=user,
        )
        latency = (time.time() - start) * 1000
        await _save_chat_log(
            session_id=thread_id,
            user_message=body.message,
            assistant_reply=result,
            source="client",
            user_email=user.get("email", ""),
            user_name=user.get("name", ""),
            model=config.client_model,
            latency_ms=latency,
            input_tokens=usage_data.get("input_tokens", 0),
            output_tokens=usage_data.get("output_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
            cost=usage_data.get("cost", 0),
        )
        yield f"data: {result}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Admin agent (requires JWT auth with admin role)
@admin_router.post("/chat", response_model=ChatResponse)
async def admin_chat(body: AdminChatMessage, user: dict = Depends(authenticate_admin)):
    """Admin chat — operational queries, analytics, management.

    JWT is verified via LangGraph's auth middleware. Admin scopes
    bind via closure to tools for scope-aware access.
    """
    thread_id = body.thread_id or f"admin-{user['user_id']}"
    start = time.time()
    result, usage_data = await run_admin_agent(
        body.message,
        thread_id,
        user_context=user,
    )
    latency = (time.time() - start) * 1000
    await _save_chat_log(
        session_id=thread_id,
        user_message=body.message,
        assistant_reply=result,
        source="admin",
        user_email=user.get("email", ""),
        user_name=user.get("name", ""),
        model=config.admin_model,
        latency_ms=latency,
        input_tokens=usage_data.get("input_tokens", 0),
        output_tokens=usage_data.get("output_tokens", 0),
        total_tokens=usage_data.get("total_tokens", 0),
        cost=usage_data.get("cost", 0),
    )
    return ChatResponse(response=result, thread_id=thread_id)


@admin_router.post("/chat/stream")
async def admin_chat_stream(body: AdminChatMessage, user: dict = Depends(authenticate_admin)):
    """SSE streaming chat for admin dashboard."""
    thread_id = body.thread_id or f"admin-{user['user_id']}"

    async def event_generator():
        start = time.time()
        result, usage_data = await run_admin_agent(
            body.message,
            thread_id,
            user_context=user,
        )
        latency = (time.time() - start) * 1000
        await _save_chat_log(
            session_id=thread_id,
            user_message=body.message,
            assistant_reply=result,
            source="admin",
            user_email=user.get("email", ""),
            user_name=user.get("name", ""),
            model=config.admin_model,
            latency_ms=latency,
            input_tokens=usage_data.get("input_tokens", 0),
            output_tokens=usage_data.get("output_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
            cost=usage_data.get("cost", 0),
        )
        yield f"data: {result}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
