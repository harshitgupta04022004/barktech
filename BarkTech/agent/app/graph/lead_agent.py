"""Lead management agent for admins — search, update, and manage leads/RFQs."""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
from bson import ObjectId
from datetime import datetime

_client: AsyncIOMotorClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


# ---------------------------------------------------------------------------
# Admin lead tools
# ---------------------------------------------------------------------------

@tool
async def search_leads(
    status: str = "",
    priority: str = "",
    source: str = "",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """Search and filter leads with optional status, priority, and source filters.

    Args:
        status: Filter by status (new, contacted, qualified, negotiation, closed_won, closed_lost)
        priority: Filter by priority (low, medium, high, urgent)
        source: Filter by source (ai_chat, website, referral, etc.)
        limit: Max results (default 20)
        offset: Pagination offset
    """
    db = _get_db()
    filter_query: dict = {}

    if status:
        filter_query["status"] = status
    if priority:
        filter_query["priority"] = priority
    if source:
        filter_query["source"] = source

    cursor = (
        db.leads.find(filter_query)
        .sort("createdAt", -1)
        .skip(offset)
        .limit(limit)
    )
    leads = await cursor.to_list(length=limit)

    if not leads:
        return "No leads found matching your criteria."

    results = []
    for lead in leads:
        results.append(
            f"- **{lead.get('contactName', 'N/A')}** "
            f"({lead.get('email', 'N/A')}) "
            f"[{lead.get('status', 'new')}] "
            f"Priority: {lead.get('priority', 'medium')} "
            f"— ID: {lead['_id']}"
        )

    return f"Found {len(results)} leads:\n" + "\n".join(results)


@tool
async def get_lead_details(lead_id: str) -> str:
    """Get full lead details by ID.

    Args:
        lead_id: MongoDB ObjectId of the lead
    """
    db = _get_db()

    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    except Exception:
        return "Invalid lead ID format."

    if not lead:
        return "Lead not found."

    rfq_items = "\n".join(
        [f"  - {item.get('productName', 'N/A')} x {item.get('quantity', 'N/A')} ({item.get('notes', '')})"
         for item in lead.get("rfqItems", [])]
    ) or "  None"

    notes = lead.get("notes", "N/A")

    return f"""**Lead: {lead.get('contactName', 'N/A')}**

ID: {lead['_id']}
Email: {lead.get('email', 'N/A')}
Phone: {lead.get('phone', 'N/A')}
Company: {lead.get('company', 'N/A')}
Country: {lead.get('country', 'N/A')}

Status: {lead.get('status', 'new')}
Priority: {lead.get('priority', 'medium')}
Source: {lead.get('source', 'N/A')}

RFQ Items:
{rfq_items}

Notes: {notes}

Created: {lead.get('createdAt', 'N/A')}
Updated: {lead.get('updatedAt', 'N/A')}
"""


@tool
async def update_lead_status(lead_id: str, status: str) -> str:
    """Update the status of a lead.

    Args:
        lead_id: MongoDB ObjectId of the lead
        status: New status (new, contacted, qualified, negotiation, closed_won, closed_lost)
    """
    db = _get_db()
    valid_statuses = {"new", "contacted", "qualified", "negotiation", "closed_won", "closed_lost"}

    if status not in valid_statuses:
        return f"Invalid status '{status}'. Valid options: {', '.join(sorted(valid_statuses))}"

    try:
        oid = ObjectId(lead_id)
    except Exception:
        return "Invalid lead ID format."

    result = await db.leads.update_one(
        {"_id": oid},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Lead not found."

    return f"Lead status updated to '{status}'."


@tool
async def update_lead_priority(lead_id: str, priority: str) -> str:
    """Update the priority of a lead.

    Args:
        lead_id: MongoDB ObjectId of the lead
        priority: New priority (low, medium, high, urgent)
    """
    db = _get_db()
    valid_priorities = {"low", "medium", "high", "urgent"}

    if priority not in valid_priorities:
        return f"Invalid priority '{priority}'. Valid options: {', '.join(sorted(valid_priorities))}"

    try:
        oid = ObjectId(lead_id)
    except Exception:
        return "Invalid lead ID format."

    result = await db.leads.update_one(
        {"_id": oid},
        {"$set": {"priority": priority, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Lead not found."

    return f"Lead priority updated to '{priority}'."


@tool
async def add_lead_note(lead_id: str, note: str) -> str:
    """Add a note to a lead (appends to existing notes with timestamp).

    Args:
        lead_id: MongoDB ObjectId of the lead
        note: Note text to add
    """
    db = _get_db()

    try:
        oid = ObjectId(lead_id)
    except Exception:
        return "Invalid lead ID format."

    lead = await db.leads.find_one({"_id": oid})
    if not lead:
        return "Lead not found."

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    existing = lead.get("notes", "")
    new_notes = f"{existing}\n[{timestamp}] {note}" if existing else f"[{timestamp}] {note}"

    await db.leads.update_one(
        {"_id": oid},
        {"$set": {"notes": new_notes, "updatedAt": datetime.utcnow()}},
    )
    return f"Note added to lead '{lead.get('contactName', lead_id)}'."


@tool
async def get_lead_stats() -> str:
    """Get lead statistics — counts by status and priority, total pipeline value."""
    db = _get_db()

    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_results = await db.leads.aggregate(status_pipeline).to_list(10)

    priority_pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    priority_results = await db.leads.aggregate(priority_pipeline).to_list(10)

    total = sum(r["count"] for r in status_results)

    lines = [f"**Lead Stats** (Total: {total})", ""]

    lines.append("By Status:")
    status_order = ["new", "contacted", "qualified", "negotiation", "closed_won", "closed_lost"]
    status_map = {r["_id"]: r["count"] for r in status_results}
    for s in status_order:
        count = status_map.get(s, 0)
        lines.append(f"  - {s}: {count}")

    lines.append("")
    lines.append("By Priority:")
    priority_map = {r["_id"]: r["count"] for r in priority_results}
    for p in ["urgent", "high", "medium", "low"]:
        count = priority_map.get(p, 0)
        lines.append(f"  - {p}: {count}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Admin lead agent graph
# ---------------------------------------------------------------------------

ADMIN_LEAD_TOOLS = [
    search_leads,
    get_lead_details,
    update_lead_status,
    update_lead_priority,
    add_lead_note,
    get_lead_stats,
]

LEAD_SYSTEM_PROMPT = """You are Bark Technologies Lead Admin Agent. You manage customer leads and RFQ inquiries for a B2B machinery company.

Your responsibilities:
1. Search and filter leads by status, priority, or source
2. View full lead details including RFQ items and notes
3. Update lead status through the sales pipeline
4. Update lead priority based on urgency
5. Add notes to leads for tracking communication
6. View aggregate lead statistics and pipeline health

Status flow: new → contacted → qualified → negotiation → closed_won / closed_lost
Priority levels: low, medium, high, urgent

Always confirm status changes and provide clear summaries.
"""


def _build_lead_agent():
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,
        max_tokens=1024,
    )
    llm_with_tools = llm.bind_tools(ADMIN_LEAD_TOOLS)

    def agent_node(state: MessagesState):
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(ADMIN_LEAD_TOOLS)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_lead_agent_graph = None


def get_lead_agent():
    global _lead_agent_graph
    if _lead_agent_graph is None:
        _lead_agent_graph = _build_lead_agent()
    return _lead_agent_graph


async def run_lead_agent(message: str, thread_id: str) -> str:
    graph = get_lead_agent()
    messages = [SystemMessage(content=LEAD_SYSTEM_PROMPT), HumanMessage(content=message)]
    result = await graph.ainvoke(
        {"messages": messages},
        config={"configurable": {"thread_id": thread_id}},
    )
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage) and msg.content:
            return msg.content
    return "Sorry, I could not process your request. Please try again."
