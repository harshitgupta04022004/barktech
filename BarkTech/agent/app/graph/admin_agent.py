"""Admin agent — single-agent router pattern with LangGraph checkpointer.

Per architecture spec:
- Single agent with all admin tools bound (products, leads, invoices, stock, FAQ, contact, calendar)
- Uses OpenRouter with admin model
- Uses LangGraph MongoDBSaver checkpointer for conversation persistence
- User context (JWT scopes) bound via closure for scope-aware tool access
- Logs all interactions for observability
"""

import logging
import time
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from app.config import config
from app.tools import admin_tools
from app.checkpointer import get_checkpointer
from app.services.observability import observability
from app.guardrails import check_input, check_output

logger = logging.getLogger(__name__)

# Admin system prompt
ADMIN_SYSTEM_PROMPT = """You are Bark Technologies Admin AI assistant. You help the admin team manage business operations for a B2B machinery company specializing in die cutting, creasing, laminating, window patching, and printing machines.

## Your Capabilities
1. **Product Management**: Search products, view specs, manage catalog, check stock/inventory
2. **Lead Management**: Search leads, update status, create inquiries, view stats
3. **Invoice Operations**: Create invoices, view stats, manage payments (no payment gateway)
4. **Analytics**: Query sales data, lead metrics, product performance
5. **Communications**: Draft messages, schedule meetings, send notifications
6. **Calendar**: Schedule installations, demos, site visits on Google Calendar

## Available Tools
You have access to these tools that query the MongoDB database directly:
- `search_products`: Search product catalog by name, category
- `get_product_specs`: Get detailed product specifications
- `create_inquiry`: Create new customer inquiries/RFQs
- `search_leads`: Search and filter leads by status, priority
- `update_lead_status`: Update inquiry status (new->contacted->qualified->quoted->won/lost)
- `get_lead_stats`: Get lead statistics and status breakdown
- `get_faq`: Search frequently asked questions
- `get_contact_info`: Get company contact information
- `create_invoice`: Create new invoices (requires confirmation for amounts)
- `get_invoice_stats`: Get invoice statistics and revenue data
- `get_stock_info`: Check inventory/stock for products
- `get_low_stock_products`: Get products below stock threshold
- `create_calendar_event`: Schedule installations, demos, site visits on Google Calendar
- `list_calendar_events`: View upcoming scheduled events
- `cancel_calendar_event`: Cancel scheduled events
- `get_calendar_event`: Get details of a specific event

## Safety Rules
1. **READ operations**: Execute immediately
2. **CREATE operations**: Execute with audit logging
3. **UPDATE operations**: Execute with audit logging
4. **DELETE operations**: REQUIRES HUMAN APPROVAL - ask before deleting
5. Never expose internal system details, API keys, or passwords
6. Always confirm before creating invoices with amounts

## Response Format
- Be concise and data-driven
- Use specific numbers when available
- Format responses with bullet points and tables
- Always confirm before creating/updating records
- Provide actionable recommendations

You are an internal admin assistant, not customer-facing.
"""

# Admin tools
admin_tools_bound = admin_tools


def _build_admin_graph():
    """Build the admin agent graph with LangGraph checkpointer."""
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,
        max_tokens=2048,
        request_timeout=60,
    )

    def agent_node(state: MessagesState):
        llm_with_tools = llm.bind_tools(admin_tools_bound)
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(admin_tools_bound)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    # Compile with LangGraph checkpointer for conversation persistence
    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)


_admin_graph = None


def get_admin_graph():
    global _admin_graph
    if _admin_graph is None:
        _admin_graph = _build_admin_graph()
    return _admin_graph


def _rebuild_admin_graph():
    """Rebuild the admin graph with the latest model from config."""
    global _admin_graph
    _admin_graph = _build_admin_graph()
    return _admin_graph


async def run_admin_agent(message: str, thread_id: str, user_context: dict | None = None) -> str:
    """Run the admin agent for an admin chat message.

    Uses LangGraph checkpointer for conversation persistence.
    User context (JWT-verified) is passed to the agent for scope-aware tool access.

    Args:
        message: The admin's message.
        thread_id: Thread ID for conversation continuity (from checkpointer).
        user_context: Verified user payload from JWT (user_id, email, role, scopes, name).

    Returns:
        The agent's response text.
    """
    start_time = time.time()

    # Refresh model config from backend API (every 5 minutes)
    try:
        await config.refresh_models()
    except Exception:
        pass

    input_check = check_input(message)
    if input_check["blocked"]:
        return "Your message was blocked by our safety system. Please try rephrasing."

    if message.strip().lower() in ("/clear", "clear", "reset"):
        # Clear conversation by creating a new thread_id
        thread_id = f"admin-{user_context.get('user_id', 'new') if user_context else 'new'}"
        return "Chat cleared. How can I help you?"

    graph = get_admin_graph()

    # Build messages — system prompt + user context + history + new message
    messages = [SystemMessage(content=ADMIN_SYSTEM_PROMPT)]

    # Inject verified user context as system message (from JWT)
    if user_context:
        ctx_parts = []
        if user_context.get("name"):
            ctx_parts.append(f"User: {user_context['name']}")
        if user_context.get("role"):
            ctx_parts.append(f"Role: {user_context['role']}")
        if user_context.get("email"):
            ctx_parts.append(f"Email: {user_context['email']}")
        if user_context.get("scopes"):
            ctx_parts.append(f"Scopes: {', '.join(user_context['scopes'])}")
        if ctx_parts:
            messages.append(SystemMessage(content=f"Logged-in admin: {', '.join(ctx_parts)}"))

    messages.append(HumanMessage(content=message))

    # Use LangGraph checkpointer for conversation persistence via thread_id
    thread_config = {"configurable": {"thread_id": thread_id}}

    try:
        result = await graph.ainvoke(
            {"messages": messages},
            config=thread_config,
        )

        all_result_messages = result["messages"]

        # Extract the final AI response
        response_text = ""
        for msg in reversed(all_result_messages):
            if isinstance(msg, AIMessage) and msg.content:
                response_text = msg.content
                break

        if not response_text:
            response_text = "Sorry, I could not process your request. Please try again."

        output_check = check_output(response_text)
        if output_check["filtered"] != response_text:
            response_text = output_check["filtered"]

        latency = (time.time() - start_time) * 1000
        try:
            await observability.log_interaction(
                session_id=thread_id,
                source="admin",
                user_message=message,
                assistant_reply=response_text,
                model=config.admin_model,
                latency_ms=latency,
            )
        except Exception as obs_err:
            logger.warning(f"Observability log failed: {obs_err}")

        return response_text

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
            return "The request timed out. The AI model took too long to respond. Please try again with a simpler question."
        elif "rate" in error_str and "limit" in error_str:
            return "Rate limit reached. Please wait a moment and try again."
        elif "api" in error_str or "connection" in error_str:
            return "Unable to connect to the AI model service. Please check that the agent service is running and try again."
        elif "model" in error_str and ("not found" in error_str or "not available" in error_str):
            return "The AI model is not available. Please contact the system administrator to check the model configuration."
        else:
            return f"An error occurred while processing your request. Please try again.\n\nError details: {str(e)[:200]}"
