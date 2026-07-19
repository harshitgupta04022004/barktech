"""Analytics specialist agent — provides business insights and reports."""

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from motor.motor_asyncio import AsyncIOMotorClient
from langchain_core.tools import tool
from app.config import config
from app.graph.admin_state import AdminAgentState

_client: AsyncIOMotorClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


ANALYTICS_SYSTEM_PROMPT = """You are the Analytics Specialist agent for Bark Technologies admin operations.

Your responsibilities:
1. Generate revenue and sales reports
2. Analyze lead conversion rates and pipeline health
3. Provide product performance metrics
4. Report on inventory and stock levels
5. Create summary statistics for business decisions

Query the database directly using your tools and present findings in a clear, actionable format.
Highlight trends, anomalies, and recommendations.
"""


@tool
async def get_lead_analytics() -> str:
    """Get lead and inquiry analytics — conversion rates, pipeline stats, source breakdown."""
    db = _get_db()

    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_results = await db.leads.aggregate(status_pipeline).to_list(20)

    source_pipeline = [
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    source_results = await db.leads.aggregate(source_pipeline).to_list(20)

    total = sum(r["count"] for r in status_results)

    lines = [f"**Lead Analytics** (Total: {total})", ""]
    lines.append("By Status:")
    for r in status_results:
        pct = (r["count"] / total * 100) if total else 0
        lines.append(f"  - {r['_id']}: {r['count']} ({pct:.1f}%)")
    lines.append("")
    lines.append("By Source:")
    for r in source_results:
        pct = (r["count"] / total * 100) if total else 0
        lines.append(f"  - {r['_id']}: {r['count']} ({pct:.1f}%)")

    return "\n".join(lines)


@tool
async def get_product_analytics() -> str:
    """Get product catalog analytics — category counts, active products, pricing stats."""
    db = _get_db()

    total = await db.products.count_documents({})
    active = await db.products.count_documents({"isActive": True})
    inactive = total - active

    cat_pipeline = [
        {"$lookup": {"from": "categories", "localField": "categoryId", "foreignField": "_id", "as": "category"}},
        {"$unwind": {"path": "$category", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$category.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cat_results = await db.products.aggregate(cat_pipeline).to_list(20)

    lines = [
        f"**Product Analytics**",
        f"Total Products: {total} (Active: {active}, Inactive: {inactive})",
        "",
        "By Category:",
    ]
    for r in cat_results:
        name = r["_id"] or "Uncategorized"
        lines.append(f"  - {name}: {r['count']}")

    return "\n".join(lines)


@tool
async def get_revenue_analytics() -> str:
    """Get revenue analytics — invoice totals, status breakdown, monthly trends."""
    db = _get_db()

    total_pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total": {"$sum": "$grandTotal"},
        }}
    ]
    results = await db.invoices.aggregate(total_pipeline).to_list(20)

    grand_total = sum(r["total"] for r in results)
    total_count = sum(r["count"] for r in results)

    lines = [
        f"**Revenue Analytics**",
        f"Total Invoices: {total_count}",
        f"Grand Total Revenue: INR {grand_total:,.2f}",
        "",
        "By Status:",
    ]
    for r in results:
        pct = (r["total"] / grand_total * 100) if grand_total else 0
        lines.append(f"  - {r['_id']}: {r['count']} invoices, INR {r['total']:,.2f} ({pct:.1f}%)")

    return "\n".join(lines)


analytics_tools = [get_lead_analytics, get_product_analytics, get_revenue_analytics]


def _build_analytics_agent():
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.1,
        max_tokens=1024,
    )
    llm_with_tools = llm.bind_tools(analytics_tools)
    tool_node = ToolNode(analytics_tools)

    async def analytics_node(state: AdminAgentState) -> dict:
        messages = [SystemMessage(content=ANALYTICS_SYSTEM_PROMPT), *state["messages"]]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    def should_use_tools(state: AdminAgentState) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "end"

    async def tool_results_node(state: AdminAgentState) -> dict:
        result = await tool_node.ainvoke(state)
        return {"tool_results": [{"agent": "analytics", "output": result.get("messages", [])}]}

    return analytics_node, tool_results_node, should_use_tools


analytics_node, analytics_tool_results, analytics_should_use_tools = _build_analytics_agent()
