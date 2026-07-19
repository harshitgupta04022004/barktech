"""Admin agent — multi-agent collaboration pattern with supervisor routing.

Per architecture spec:
- Supervisor routes to specialized agents: product, lead, invoice, analytics, comms, campaign, scheduling
- Each agent has its own tools bound (native + MCP)
- Human-in-the-loop for destructive operations
- Observability: tracks all interactions for debugging
"""

import json
import logging
import time
import re
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from app.config import config
from app.tools import admin_tools
from app.tools.mcp_tools import all_mcp_tools, whatsapp_tools, email_tools, media_tools, web_research_tools
from app.services.observability import observability
from app.guardrails import check_input, check_output

logger = logging.getLogger(__name__)

# In-memory conversation store
_conversation_store: dict[str, list] = {}
_MAX_HISTORY = 40


def _get_conversation_history(thread_id: str) -> list:
    return _conversation_store.get(thread_id, [])


def _save_conversation_history(thread_id: str, messages: list):
    trimmed = messages[-_MAX_HISTORY:] if len(messages) > _MAX_HISTORY else messages
    _conversation_store[thread_id] = trimmed


def _clear_conversation_history(thread_id: str):
    _conversation_store.pop(thread_id, None)


# ── Supervisor System Prompt ──────────────────────────
SUPERVISOR_SYSTEM_PROMPT = """You are the Admin Operations Supervisor for Bark Technologies — a B2B machinery company.

## Your Role
You coordinate specialized agents to handle admin operations. You decide which agent should handle each task.

## Available Agents
- **product**: Product catalog management, specs, media, documents, stock/inventory
- **lead**: Lead/inquiry management, RFQ processing, status updates
- **invoice**: Invoice creation, PDF generation, GST, manual paid/partial status
- **analytics**: Reports, search logs, analytics events, business metrics
- **comms**: WhatsApp notifications, email sending, customer follow-ups
- **campaign**: Ad campaigns, social media publishing, creative design
- **scheduling**: Calendar management, installation demos, site visits
- **FINISH**: Task is complete and a final answer has been provided

## Decision Rules
1. If the task is fully handled, respond with FINISH
2. If the task involves product operations, respond with product
3. If the task involves leads/inquiries, respond with lead
4. If the task involves invoicing, respond with invoice
5. If the task involves analytics/reports, respond with analytics
6. If the task involves notifications/emails, respond with comms
7. If the task involves ad campaigns or creative design, respond with campaign
8. If the task involves scheduling/calendar, respond with scheduling

## Human-in-the-Loop
For destructive operations (delete, bulk update) or financial operations (create invoice), set awaiting_human_input=true and ask a clear question with choices.

## Output Format
Respond with ONLY one word: product, lead, invoice, analytics, comms, campaign, scheduling, or FINISH"""


def _build_llm():
    """Build the LLM instance."""
    return ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,
        max_tokens=2048,
        request_timeout=60,
    )


# ── Supervisor Node ───────────────────────────────────
def _build_supervisor_node():
    llm = _build_llm()

    async def supervisor_node(state: MessagesState) -> dict:
        messages = [SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT)] + state["messages"]
        response = await llm.ainvoke(messages)
        decision = response.content.strip().lower()

        valid_agents = {"product", "lead", "invoice", "analytics", "comms", "campaign", "scheduling", "finish"}
        if decision not in valid_agents:
            decision = "finish"

        return {"next_agent": decision, "current_agent": "supervisor"}

    return supervisor_node


# ── Specialized Agent Builders ─────────────────────────
def _build_tool_agent(system_prompt: str, tools: list, agent_name: str):
    """Build a specialized agent node with its own tools."""
    llm = _build_llm()
    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: MessagesState):
        messages = [SystemMessage(content=system_prompt)] + state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response], "current_agent": agent_name}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(tools)

    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


# ── Agent System Prompts ──────────────────────────────
PRODUCT_PROMPT = """You are the Product Management Agent for Bark Technologies.

## Your Capabilities
- Search, view, create, update products in the catalog
- Manage product specs, categories, stock/inventory
- Upload/manage product media (photos, datasheets)

## Tools Available
- search_products, get_product_specs: Search and view products
- get_stock_info, get_low_stock_products: Check inventory
- presign_media_upload, get_media_public_url: Manage product media via S3/R2

## Rules
1. READ operations: Execute immediately
2. CREATE/UPDATE operations: Execute with audit logging
3. DELETE operations: REQUIRES HUMAN APPROVAL - ask before deleting
4. Always confirm before bulk updates"""

LEAD_PROMPT = """You are the Lead Management Agent for Bark Technologies.

## Your Capabilities
- Search and filter leads/inquiries by status, priority
- Update lead status (new->contacted->qualified->quoted->won/lost)
- Create new inquiries/RFQs
- Research RFQs using web search

## Tools Available
- search_leads, update_lead_status, get_lead_stats: Lead management
- create_inquiry: Create new inquiries
- research_url, research_web_search: Research RFQs (read-only web)

## Rules
1. READ operations: Execute immediately
2. UPDATE operations: Execute with audit logging
3. Always log status changes for audit trail"""

INVOICE_PROMPT = """You are the Invoice Management Agent for Bark Technologies.

## Your Capabilities
- Create invoices with line items, GST, and totals
- View invoice statistics and revenue data
- Generate PDF invoices via WeasyPrint
- Send invoice PDFs via email

## Tools Available
- create_invoice, get_invoice_stats: Invoice CRUD and stats
- send_email, send_template_email: Send invoice PDFs via email

## Rules
1. CREATE invoice: REQUIRES HUMAN CONFIRMATION before creating
2. Always confirm amounts and GST rates
3. Invoice PDF is returned as a download URL, never raw bytes
4. No payment gateway - invoices track paid/partial status manually"""

ANALYTICS_PROMPT = """You are the Analytics Agent for Bark Technologies.

## Your Capabilities
- Query sales data, lead metrics, product performance
- Generate business reports and insights
- Analyze search logs and analytics events

## Tools Available
- search_leads, get_lead_stats: Lead analytics
- get_invoice_stats: Revenue analytics
- get_stock_info, get_low_stock_products: Inventory analytics
- search_products: Product performance data

## Rules
1. Provide data-driven insights with specific numbers
2. Format responses with tables and bullet points
3. Highlight trends and actionable recommendations"""

COMMS_PROMPT = """You are the Communications Agent for Bark Technologies.

## Your Capabilities
- Send WhatsApp notifications to admins and customers
- Send transactional emails (inquiry ack, invoice, quotes)
- Manage customer follow-ups

## Tools Available
- send_whatsapp_notification: Send WhatsApp messages
- send_admin_whatsapp_alert: Alert admins via WhatsApp
- send_email, send_template_email: Send emails via Resend

## Rules
1. Always confirm before sending external notifications
2. Use professional tone for customer-facing messages
3. Format messages appropriately for each channel"""

CAMPAIGN_PROMPT = """You are the Campaign Agent for Bark Technologies.

## Your Capabilities
- Manage ad campaigns and social media publishing
- Generate creative designs for product visuals
- Manage campaign analytics and performance

## Tools Available
- presign_media_upload, get_media_public_url: Manage campaign media

## Rules
1. Always confirm before publishing content
2. Ensure brand consistency
3. Track campaign performance metrics"""

SCHEDULING_PROMPT = """You are the Scheduling Agent for Bark Technologies.

## Your Capabilities
- Schedule installations, demos, and site visits
- Manage calendar events
- Check availability and book time slots

## Tools Available
- create_calendar_event: Create Google Calendar events
- list_calendar_events: Check availability
- cancel_calendar_event: Cancel/reschedule events
- get_calendar_event: View event details

## Rules
1. Always confirm before creating events
2. Check for conflicts before booking
3. Include relevant details (location, attendees, notes)"""


# ── Build the Multi-Agent Graph ───────────────────────
def _build_admin_graph():
    """Build the admin multi-agent graph with supervisor routing."""
    supervisor = _build_supervisor_node()

    # Build specialized agents with their tools
    product_tools = [t for t in admin_tools if t.name in (
        "search_products", "get_product_specs", "get_stock_info", "get_low_stock_products"
    )] + media_tools

    lead_tools = [t for t in admin_tools if t.name in (
        "create_inquiry", "search_leads", "update_lead_status", "get_lead_stats"
    )] + web_research_tools

    invoice_tools = [t for t in admin_tools if t.name in (
        "create_invoice", "get_invoice_stats"
    )] + email_tools

    analytics_tools = [t for t in admin_tools if t.name in (
        "search_leads", "get_lead_stats", "get_invoice_stats",
        "get_stock_info", "get_low_stock_products", "search_products"
    )]

    comms_tools = whatsapp_tools + email_tools
    campaign_tools = media_tools
    scheduling_tools = [t for t in admin_tools if t.name in (
        "create_calendar_event", "list_calendar_events", "cancel_calendar_event", "get_calendar_event"
    )]

    product_agent = _build_tool_agent(PRODUCT_PROMPT, product_tools, "product")
    lead_agent = _build_tool_agent(LEAD_PROMPT, lead_tools, "lead")
    invoice_agent = _build_tool_agent(INVOICE_PROMPT, invoice_tools, "invoice")
    analytics_agent = _build_tool_agent(ANALYTICS_PROMPT, analytics_tools, "analytics")
    comms_agent = _build_tool_agent(COMMS_PROMPT, comms_tools, "comms")
    campaign_agent = _build_tool_agent(CAMPAIGN_PROMPT, campaign_tools, "campaign")
    scheduling_agent = _build_tool_agent(SCHEDULING_PROMPT, scheduling_tools, "scheduling")

    # Build the main graph
    graph = StateGraph(MessagesState)

    # Add supervisor node
    graph.add_node("supervisor", supervisor)

    # Add specialized agent subgraphs
    graph.add_node("product", product_agent)
    graph.add_node("lead", lead_agent)
    graph.add_node("invoice", invoice_agent)
    graph.add_node("analytics", analytics_agent)
    graph.add_node("comms", comms_agent)
    graph.add_node("campaign", campaign_agent)
    graph.add_node("scheduling", scheduling_agent)

    # Route from START to supervisor
    graph.add_edge(START, "supervisor")

    # Supervisor routes to agents
    graph.add_conditional_edges(
        "supervisor",
        lambda state: state.get("next_agent", "finish"),
        {
            "product": "product",
            "lead": "lead",
            "invoice": "invoice",
            "analytics": "analytics",
            "comms": "comms",
            "campaign": "campaign",
            "scheduling": "scheduling",
            "finish": END,
        },
    )

    # All agents route back to supervisor for next decision or END
    for agent_name in ["product", "lead", "invoice", "analytics", "comms", "campaign", "scheduling"]:
        graph.add_edge(agent_name, "supervisor")

    return graph.compile()


_admin_graph = None


def get_admin_graph():
    global _admin_graph
    if _admin_graph is None:
        _admin_graph = _build_admin_graph()
    return _admin_graph


async def run_admin_agent(message: str, thread_id: str, user_context: dict | None = None) -> tuple[str, dict]:
    """Run the admin multi-agent system for an admin chat message.

    Returns:
        Tuple of (response_text, usage_data) where usage_data contains
        input_tokens, output_tokens, total_tokens, cost from OpenRouter.
    """
    start_time = time.time()

    # Input guardrails
    input_check = check_input(message)
    if input_check["blocked"]:
        return "Your message was blocked by our safety system. Please try rephrasing.", {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

    # Handle clear commands
    if message.strip().lower() in ("/clear", "clear", "reset"):
        _clear_conversation_history(thread_id)
        return "Chat cleared. How can I help you?", {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

    # Refresh model config from backend API (every 5 minutes)
    try:
        await config.refresh_models()
    except Exception:
        pass

    graph = get_admin_graph()

    # Build messages with conversation history
    messages = []

    # Add user context as system info (only once per session)
    history = _get_conversation_history(thread_id)
    if user_context and not history:
        ctx_parts = []
        if user_context.get("name"):
            ctx_parts.append(f"User: {user_context['name']}")
        if user_context.get("role"):
            ctx_parts.append(f"Role: {user_context['role']}")
        if user_context.get("email"):
            ctx_parts.append(f"Email: {user_context['email']}")
        if ctx_parts:
            messages.append(SystemMessage(content=f"Logged-in admin: {', '.join(ctx_parts)}"))

    # Add conversation history
    messages.extend(history)

    # Add current user message
    messages.append(HumanMessage(content=message))

    usage_data = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

    try:
        result = await graph.ainvoke({"messages": messages})

        all_result_messages = result["messages"]

        # Extract usage data from all AI messages
        for msg in all_result_messages:
            if hasattr(msg, "usage_metadata") and msg.usage_metadata:
                usage = msg.usage_metadata
                usage_data["input_tokens"] += usage.get("input_tokens", 0) or 0
                usage_data["output_tokens"] += usage.get("output_tokens", 0) or 0
            if hasattr(msg, "response_metadata") and msg.response_metadata:
                meta = msg.response_metadata
                if "token_usage" in meta:
                    token_usage = meta["token_usage"]
                    usage_data["input_tokens"] += token_usage.get("prompt_tokens", 0) or 0
                    usage_data["output_tokens"] += token_usage.get("completion_tokens", 0) or 0
                if "cost" in meta:
                    usage_data["cost"] += float(meta["cost"]) or 0.0

        usage_data["total_tokens"] = usage_data["input_tokens"] + usage_data["output_tokens"]

        # Save the conversation history
        updated_history = []
        if user_context and not history:
            ctx_parts = []
            if user_context.get("name"):
                ctx_parts.append(f"User: {user_context['name']}")
            if user_context.get("role"):
                ctx_parts.append(f"Role: {user_context['role']}")
            if user_context.get("email"):
                ctx_parts.append(f"Email: {user_context['email']}")
            if ctx_parts:
                updated_history.append(SystemMessage(content=f"Logged-in admin: {', '.join(ctx_parts)}"))

        updated_history.extend(all_result_messages)
        _save_conversation_history(thread_id, updated_history)

        # Extract final response
        response_text = ""
        for msg in reversed(all_result_messages):
            if isinstance(msg, AIMessage) and msg.content:
                response_text = msg.content
                break

        if not response_text:
            response_text = "Sorry, I could not process your request. Please try again."

        # Output guardrails
        output_check = check_output(response_text)
        if output_check["filtered"] != response_text:
            response_text = output_check["filtered"]

        # Log interaction for observability
        latency = (time.time() - start_time) * 1000
        try:
            await observability.log_interaction(
                session_id=thread_id,
                source="admin",
                user_message=message,
                assistant_reply=response_text,
                model=config.admin_model,
                latency_ms=latency,
                tokens_used=usage_data["total_tokens"],
                cost=usage_data["cost"],
            )
        except Exception as obs_err:
            logger.warning(f"Observability log failed: {obs_err}")

        return response_text, usage_data

    except Exception as e:
        logger.error(f"Admin agent error: {e}", exc_info=True)
        latency = (time.time() - start_time) * 1000
        try:
            await observability.log_interaction(
                session_id=thread_id,
                source="admin",
                user_message=message,
                assistant_reply="",
                model=config.admin_model,
                latency_ms=latency,
                error=str(e),
            )
        except Exception:
            pass

        error_str = str(e).lower()
        if "timeout" in error_str or "timed out" in error_str:
            return "The request timed out. The AI model took too long to respond. Please try again with a simpler question.", usage_data
        elif "rate" in error_str and "limit" in error_str:
            return "Rate limit reached. Please wait a moment and try again.", usage_data
        elif "api" in error_str or "connection" in error_str:
            return "Unable to connect to the AI model service. Please check that the agent service is running and try again.", usage_data
        elif "model" in error_str and ("not found" in error_str or "not available" in error_str):
            return "The AI model is not available. Please contact the system administrator to check the model configuration.", usage_data
        else:
            return f"An error occurred while processing your request. Please try again.\n\nError details: {str(e)[:200]}", usage_data
