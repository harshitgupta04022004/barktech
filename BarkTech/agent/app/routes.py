"""Agent API routes — chat endpoints for client and admin agents.

Per architecture spec:
- Client chat: POST /chat (JWT auth — any authenticated user)
- Admin chat: POST /admin/chat (JWT auth with admin role)
- Admin file upload: POST /admin/upload (multipart/form-data)
- Admin sessions: GET /admin/sessions, DELETE /admin/sessions/:id
- Both use LangGraph checkpointer for conversation persistence
- Both save chat logs to MongoDB for observability
"""

import base64
import json
import logging
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List

from app.auth.middleware import authenticate_client, authenticate_admin
from app.graph.client_agent import run_client_agent
from app.graph.admin_agent import run_admin_agent
from app.checkpointer import get_checkpointer
from app.config import config
from app.tools.file_processing import process_uploaded_file, format_file_context, build_multimodal_content, SUPPORTED_TYPES, MAX_FILE_SIZE_BYTES
from app.utils.cost import calculate_cost

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

        # Process tool calls to ensure they match the expected schema
        processed_tool_calls = []
        if tool_calls:
            for tc in tool_calls:
                processed_tool_calls.append({
                    "name": tc.get("name", "unknown"),
                    "input": str(tc.get("input", ""))[:500],
                    "output": str(tc.get("output", ""))[:500],
                    "success": tc.get("success", True),
                })

        await db.chatlogs.insert_one(
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
                "toolCalls": processed_tool_calls,
                "latencyMs": latency_ms,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
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
    files: Optional[List[dict]] = None  # Processed file data from frontend upload


class FileUploadResponse(BaseModel):
    files: List[dict]  # Processed file data


@admin_router.post("/upload", response_model=FileUploadResponse)
async def upload_files(
    files: List[UploadFile] = File(...),
    user: dict = Depends(authenticate_admin),
):
    """Upload files for chat attachment processing.

    Accepts images (JPEG, PNG, GIF, WebP), PDFs, and text files.
    Returns processed file data ready for inclusion in chat messages.
    """
    processed_files = []

    for upload_file in files:
        # Read file content
        content = await upload_file.read()

        # Validate size
        if len(content) > MAX_FILE_SIZE_BYTES:
            processed_files.append({
                "error": f"File {upload_file.filename} too large ({len(content) / 1024 / 1024:.1f}MB). Max is 20MB.",
                "filename": upload_file.filename,
            })
            continue

        # Process the file
        result = process_uploaded_file(content, upload_file.filename)
        processed_files.append(result)

    return FileUploadResponse(files=processed_files)


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
    cost = calculate_cost(
        config.client_model,
        usage_data.get("input_tokens", 0),
        usage_data.get("output_tokens", 0),
        api_cost=usage_data.get("cost", 0),
    )
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
        cost=cost,
        tool_calls=usage_data.get("tool_calls", []),
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
        cost = calculate_cost(
            config.client_model,
            usage_data.get("input_tokens", 0),
            usage_data.get("output_tokens", 0),
            api_cost=usage_data.get("cost", 0),
        )
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
            cost=cost,
            tool_calls=usage_data.get("tool_calls", []),
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
    cost = calculate_cost(
        config.admin_model,
        usage_data.get("input_tokens", 0),
        usage_data.get("output_tokens", 0),
        api_cost=usage_data.get("cost", 0),
    )
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
        cost=cost,
        tool_calls=usage_data.get("tool_calls", []),
    )
    return ChatResponse(response=result, thread_id=thread_id)


@admin_router.post("/chat/stream")
async def admin_chat_stream(body: AdminChatMessage, user: dict = Depends(authenticate_admin)):
    """SSE streaming chat for admin dashboard.

    Returns Server-Sent Events with:
    - type: content_delta — streaming text chunks
    - type: tool_call — tool invocation events
    - type: done — completion signal with usage data
    """
    thread_id = body.thread_id or f"admin-{user['user_id']}"

    async def event_generator():
        start = time.time()
        result, usage_data = await run_admin_agent(
            body.message,
            thread_id,
            user_context=user,
            files=body.files,
        )
        latency = (time.time() - start) * 1000
        cost = calculate_cost(
            config.admin_model,
            usage_data.get("input_tokens", 0),
            usage_data.get("output_tokens", 0),
            api_cost=usage_data.get("cost", 0),
        )
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
            cost=cost,
            tool_calls=usage_data.get("tool_calls", []),
        )
        # Send content as a single chunk (non-streaming backend response)
        yield f"data: {json.dumps({'type': 'content_delta', 'content': result})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'thread_id': thread_id, 'usage': usage_data})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Session Management Endpoints ──────────────────────

class SessionInfo(BaseModel):
    thread_id: str
    title: str
    last_message_at: str
    message_count: int


@admin_router.get("/sessions")
async def list_sessions(user: dict = Depends(authenticate_admin)):
    """List all conversation threads for the authenticated admin user.

    Returns threads from the LangGraph checkpointer, sorted by last activity.
    """
    user_id = user.get("user_id", "default")
    thread_prefix = f"admin-{user_id}"

    checkpointer = get_checkpointer()
    if checkpointer is None:
        return {"sessions": []}

    try:
        # Search MongoDB checkpoints collection for this user's threads
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(config.mongodb_uri)
        db = client[config.mongodb_db]

        # Query checkpoints collection for threads matching this user
        pipeline = [
            {"$match": {"thread_id": {"$regex": f"^{thread_prefix}"}}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$thread_id",
                "last_message_at": {"$first": "$created_at"},
                "message_count": {"$sum": 1},
            }},
            {"$sort": {"last_message_at": -1}},
            {"$limit": 50},
        ]

        results = await db["langgraph_checkpoints"].aggregate(pipeline).to_list(length=50)

        sessions = []
        for r in results:
            thread_id = r["_id"]
            # Extract title from the first user message in the thread
            title = "New Conversation"
            try:
                checkpoint = await checkpointer.aget({"configurable": {"thread_id": thread_id}})
                if checkpoint and checkpoint.get("channel_values"):
                    messages = checkpoint["channel_values"].get("messages", [])
                    for msg in messages:
                        if hasattr(msg, "type") and msg.type == "human" and hasattr(msg, "content"):
                            title = msg.content[:80] + ("..." if len(msg.content) > 80 else "")
                            break
            except Exception:
                pass

            sessions.append(SessionInfo(
                thread_id=thread_id,
                title=title,
                last_message_at=r.get("last_message_at", datetime.utcnow().isoformat() + "Z"),
                message_count=r.get("message_count", 0),
            ))

        return {"sessions": [s.model_dump() for s in sessions]}
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        return {"sessions": []}


@admin_router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, user: dict = Depends(authenticate_admin)):
    """Fetch conversation messages for a specific thread.

    Returns messages from the LangGraph checkpointer, formatted for frontend display.
    """
    user_id = user.get("user_id", "default")
    expected_prefix = f"admin-{user_id}"

    if not session_id.startswith(expected_prefix):
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    checkpointer = get_checkpointer()
    if checkpointer is None:
        return {"messages": []}

    try:
        checkpoint = await checkpointer.aget({"configurable": {"thread_id": session_id}})
        if not checkpoint or not checkpoint.get("channel_values"):
            return {"messages": []}

        raw_messages = checkpoint["channel_values"].get("messages", [])
        formatted = []
        for msg in raw_messages:
            role = "assistant"
            content = ""
            if hasattr(msg, "type"):
                if msg.type == "human":
                    role = "user"
                elif msg.type == "ai":
                    role = "assistant"
                elif msg.type == "system":
                    role = "system"

            if hasattr(msg, "content"):
                if isinstance(msg.content, str):
                    content = msg.content
                elif isinstance(msg.content, list):
                    # Multimodal content — extract text parts
                    text_parts = []
                    for part in msg.content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            text_parts.append(part.get("text", ""))
                    content = " ".join(text_parts)

            if content:
                formatted.append({
                    "role": role,
                    "content": content,
                })

        return {"messages": formatted}
    except Exception as e:
        logger.error(f"Failed to fetch session messages: {e}")
        return {"messages": []}


@admin_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(authenticate_admin)):
    """Delete a conversation thread and all its checkpoints.

    Only allows deleting threads belonging to the authenticated admin user.
    """
    user_id = user.get("user_id", "default")
    expected_prefix = f"admin-{user_id}"

    if not session_id.startswith(expected_prefix):
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(config.mongodb_uri)
        db = client[config.mongodb_db]

        # Delete all checkpoints for this thread
        result = await db["langgraph_checkpoints"].delete_many({"thread_id": session_id})

        return {"deleted": True, "checkpoints_removed": result.deleted_count}
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")


@admin_router.post("/sessions/{session_id}/clear")
async def clear_session(session_id: str, user: dict = Depends(authenticate_admin)):
    """Clear conversation history for a thread (keeps the thread but removes history).

    Only allows clearing threads belonging to the authenticated admin user.
    """
    user_id = user.get("user_id", "default")
    expected_prefix = f"admin-{user_id}"

    if not session_id.startswith(expected_prefix):
        raise HTTPException(status_code=403, detail="Not authorized to clear this session")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(config.mongodb_uri)
        db = client[config.mongodb_db]

        # Delete all checkpoints for this thread
        result = await db["langgraph_checkpoints"].delete_many({"thread_id": session_id})

        return {"cleared": True, "checkpoints_removed": result.deleted_count}
    except Exception as e:
        logger.error(f"Failed to clear session: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear session")


# ── Invoice AI Refine Endpoint ────────────────────────


class InvoiceRefineRequest(BaseModel):
    section: str = "all"  # bill_to, ship_to, items, all
    current_data: dict = {}


class InvoiceRefineResponse(BaseModel):
    suggestions: list[dict]
    error: Optional[str] = None


@admin_router.post("/invoice/refine", response_model=InvoiceRefineResponse)
async def refine_invoice_field(body: InvoiceRefineRequest, user: dict = Depends(authenticate_admin)):
    """AI-powered invoice field refinement.

    Accepts current form data + section to refine, returns suggestions
    for improving business names, addresses, HSN codes, descriptions, etc.
    """
    section = body.section
    current_data = body.current_data

    refine_prompt = f"""You are an invoice refinement assistant for Bark Technologies (B2B machinery company).
Current invoice data:
{json.dumps(current_data, indent=2, default=str)}
Section to refine: {section}
Analyze the current data and provide suggestions for improvement. Return a JSON array of suggestions:
[
  {{
    "field": "customerName",
    "current_value": "raj",
    "suggested_value": "Raj Industries Pvt. Ltd.",
    "reason": "Proper business name formatting with legal entity type"
  }},
  {{
    "field": "items[0].hsnCode",
    "current_value": "",
    "suggested_value": "84224000",
    "reason": "HSN code for packaging/filling machines"
  }}
]
Focus on:
- Business name formatting (add Pvt. Ltd., LLP, etc. if appropriate)
- Address completeness (add PIN code, state if missing)
- HSN code suggestions based on item descriptions
- GST rate validation (18% standard for machinery)
- Description improvements (more professional, specific)
Return ONLY the JSON array, no other text."""

    try:
        from langchain_core.messages import SystemMessage as LcSystemMessage, HumanMessage as LcHumanMessage
        llm = _build_refine_llm()
        response = await llm.ainvoke([
            LcSystemMessage(content="You are an invoice data refinement assistant. Return only valid JSON."),
            LcHumanMessage(content=refine_prompt),
        ])

        suggestions = json.loads(response.content)
        return InvoiceRefineResponse(suggestions=suggestions)
    except json.JSONDecodeError:
        return InvoiceRefineResponse(suggestions=[], error="Could not parse AI suggestions")
    except Exception as e:
        logger.error(f"Invoice refine failed: {e}")
        return InvoiceRefineResponse(suggestions=[], error=str(e))


def _build_refine_llm():
    """Build a lightweight LLM for invoice refinement."""
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.3,
        max_tokens=1000,
        request_timeout=30,
    )


# ── Event-Driven Multi-Agent System Endpoint ──────────

@admin_router.post("/agents/chat", response_model=ChatResponse)
async def agent_chat(body: AdminChatMessage, user: dict = Depends(authenticate_admin)):
    """Event-driven multi-agent chat using the new supervisor orchestrator.

    Routes requests to specialized agents (CRM, Sales, Content, Inventory,
    Scheduling, Research) via the supervisor. Each agent has its own MCP
    tools and subscribes to domain events via Redis Streams.
    """
    thread_id = body.thread_id or f"agent-{user['user_id']}"
    start = time.time()

    try:
        from app.agents.supervisor import get_supervisor
        supervisor = get_supervisor()
        result, usage_data = await supervisor.route_request(
            body.message, thread_id, user_context=user,
        )
    except Exception as e:
        logger.error(f"Agent system error: {e}", exc_info=True)
        result = f"Agent system error: {str(e)[:200]}"
        usage_data = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

    latency = (time.time() - start) * 1000
    cost = calculate_cost(
        config.admin_model,
        usage_data.get("input_tokens", 0),
        usage_data.get("output_tokens", 0),
        api_cost=usage_data.get("cost", 0),
    )
    await _save_chat_log(
        session_id=thread_id,
        user_message=body.message,
        assistant_reply=result,
        source="admin_agents",
        user_email=user.get("email", ""),
        user_name=user.get("name", ""),
        model=config.admin_model,
        latency_ms=latency,
        input_tokens=usage_data.get("input_tokens", 0),
        output_tokens=usage_data.get("output_tokens", 0),
        total_tokens=usage_data.get("total_tokens", 0),
        cost=cost,
        tool_calls=usage_data.get("tool_calls", []),
    )
    return ChatResponse(response=result, thread_id=thread_id)


@admin_router.post("/agents/chat/stream")
async def agent_chat_stream(body: AdminChatMessage, user: dict = Depends(authenticate_admin)):
    """SSE streaming for the event-driven multi-agent system."""
    thread_id = body.thread_id or f"agent-{user['user_id']}"

    async def event_generator():
        start = time.time()
        try:
            from app.agents.supervisor import get_supervisor
            supervisor = get_supervisor()
            result, usage_data = await supervisor.route_request(
                body.message, thread_id, user_context=user,
            )
        except Exception as e:
            logger.error(f"Agent stream error: {e}", exc_info=True)
            result = f"Agent system error: {str(e)[:200]}"
            usage_data = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

        latency = (time.time() - start) * 1000
        cost = calculate_cost(
            config.admin_model,
            usage_data.get("input_tokens", 0),
            usage_data.get("output_tokens", 0),
            api_cost=usage_data.get("cost", 0),
        )
        await _save_chat_log(
            session_id=thread_id,
            user_message=body.message,
            assistant_reply=result,
            source="admin_agents",
            user_email=user.get("email", ""),
            user_name=user.get("name", ""),
            model=config.admin_model,
            latency_ms=latency,
            input_tokens=usage_data.get("input_tokens", 0),
            output_tokens=usage_data.get("output_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
            cost=cost,
            tool_calls=usage_data.get("tool_calls", []),
        )
        yield f"data: {json.dumps({'type': 'content_delta', 'content': result})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'thread_id': thread_id, 'usage': usage_data})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Event Bus Status Endpoint ─────────────────────────

@admin_router.get("/events/status")
async def event_bus_status(user: dict = Depends(authenticate_admin)):
    """Get the status of the event bus and agent event loops."""
    try:
        from app.events.bus import get_event_bus
        bus = get_event_bus()
        from app.agents.supervisor import get_supervisor
        supervisor = get_supervisor()
        return {
            "event_bus_connected": bus._connected,
            "event_loop_active": supervisor._event_loop_task is not None,
            "agents": list(supervisor._get_agents().keys()) if hasattr(supervisor, "_get_agents") else [],
        }
    except Exception as e:
        return {"error": str(e)}
