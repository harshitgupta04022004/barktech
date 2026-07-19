"""Client-facing agent — single-agent router pattern with LangGraph checkpointer.

Per architecture spec: single-agent router with native LangGraph @tools
for product lookup, leads/RFQ, FAQ, contact. NO invoice tools for client.
Uses LangGraph checkpointer for conversation persistence.
"""

import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from app.config import config
from app.tools import client_tools
from app.checkpointer import get_checkpointer

logger = logging.getLogger(__name__)

CLIENT_SYSTEM_PROMPT = """You are Bark Technologies AI assistant. Bark Technologies is a B2B machinery company specializing in die cutting, creasing, laminating, window patching, and printing machines.

## Your Role
1. Help customers find the right products
2. Answer product specification questions
3. Help submit RFQ/inquiries
4. Answer FAQs
5. Provide contact info

## Safety Rules
- Be professional and helpful
- Guide customers toward submitting inquiries for detailed quotes
- Never share internal business data, pricing rules, or admin information
- For complex or pricing questions, suggest contacting the sales team

## Response Format
- Be concise and helpful
- Use bullet points for lists
- Include product names and specs when relevant
- Always end with a call to action (submit inquiry, contact us)
"""

client_tools_bound = client_tools


def _build_graph():
    llm = ChatOpenAI(
        model=config.client_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.3,
        max_tokens=1024,
    )
    llm_with_tools = llm.bind_tools(client_tools_bound)

    def agent_node(state: MessagesState):
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(client_tools_bound)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    # Compile with LangGraph checkpointer for conversation persistence
    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


async def run_client_agent(
    message: str,
    thread_id: str,
    user_context: dict | None = None,
) -> tuple[str, dict]:
    """Run the client-facing agent for a customer message.

    Uses LangGraph checkpointer for conversation persistence.
    User context (from JWT) is passed for scope-aware tool access.

    Args:
        message: The customer's message.
        thread_id: Thread ID for conversation continuity.
        user_context: Verified user payload from JWT (optional for anonymous).

    Returns:
        Tuple of (response_text, usage_data) where usage_data contains
        input_tokens, output_tokens, total_tokens, cost from OpenRouter.
    """
    # Refresh model config from backend API (every 5 minutes)
    try:
        await config.refresh_models()
    except Exception:
        pass

    graph = get_graph()
    messages = [SystemMessage(content=CLIENT_SYSTEM_PROMPT)]

    # Inject verified user context if available
    if user_context:
        ctx_parts = []
        if user_context.get("name"):
            ctx_parts.append(f"User: {user_context['name']}")
        if user_context.get("email"):
            ctx_parts.append(f"Email: {user_context['email']}")
        if user_context.get("role"):
            ctx_parts.append(f"Role: {user_context['role']}")
        if ctx_parts:
            messages.append(SystemMessage(content=f"Authenticated user: {', '.join(ctx_parts)}"))

    messages.append(HumanMessage(content=message))

    # Use LangGraph checkpointer for conversation persistence via thread_id
    thread_config = {"configurable": {"thread_id": thread_id}}

    usage_data = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

    try:
        result = await graph.ainvoke(
            {"messages": messages},
            config=thread_config,
        )

        # Extract usage data from all AI messages in the result
        all_messages = result["messages"]
        for msg in all_messages:
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

        for msg in reversed(all_messages):
            if isinstance(msg, AIMessage) and msg.content:
                return msg.content, usage_data
        return "Sorry, I could not process your request. Please try again.", usage_data
    except Exception as e:
        logger.error(f"Client agent error: {e}")
        return "I'm sorry, I encountered an error. Please try again later.", usage_data
