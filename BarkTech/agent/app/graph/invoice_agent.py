"""Invoice management agent for admins — search, create, and manage invoices."""

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
# Admin invoice tools
# ---------------------------------------------------------------------------

@tool
async def search_invoices(
    status: str = "",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """Search and filter invoices with optional status filter.

    Args:
        status: Filter by status (draft, sent, paid, overdue, cancelled)
        limit: Max results (default 20)
        offset: Pagination offset
    """
    db = _get_db()
    filter_query: dict = {}

    if status:
        filter_query["status"] = status

    cursor = (
        db.invoices.find(filter_query)
        .sort("createdAt", -1)
        .skip(offset)
        .limit(limit)
    )
    invoices = await cursor.to_list(length=limit)

    if not invoices:
        return "No invoices found matching your criteria."

    results = []
    for inv in invoices:
        results.append(
            f"- **{inv.get('invoiceNumber', 'N/A')}** "
            f"({inv.get('contactName', 'N/A')}) "
            f"[{inv.get('status', 'draft')}] "
            f"INR {inv.get('grandTotal', 0):,.2f} "
            f"— ID: {inv['_id']}"
        )

    return f"Found {len(results)} invoices:\n" + "\n".join(results)


@tool
async def get_invoice_details(invoice_id: str) -> str:
    """Get full invoice details by ID.

    Args:
        invoice_id: MongoDB ObjectId of the invoice
    """
    db = _get_db()

    try:
        inv = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        return "Invalid invoice ID format."

    if not inv:
        return "Invoice not found."

    items = "\n".join(
        [f"  - {item.get('description', 'N/A')} x {item.get('quantity', 'N/A')} "
         f"@ INR {item.get('unitPrice', 0):,.2f} "
         f"(tax: {item.get('taxRate', 0)}%) "
         f"= INR {item.get('totalAmount', 0):,.2f}"
         for item in inv.get("items", [])]
    ) or "  None"

    return f"""**Invoice: {inv.get('invoiceNumber', 'N/A')}**

ID: {inv['_id']}
Status: {inv.get('status', 'draft')}
Currency: {inv.get('currency', 'INR')}

Contact: {inv.get('contactName', 'N/A')}
Email: {inv.get('email', 'N/A')}
Phone: {inv.get('phone', 'N/A')}
Company: {inv.get('company', 'N/A')}
Address: {inv.get('address', 'N/A')}

Items:
{items}

Subtotal: INR {inv.get('subtotal', 0):,.2f}
Tax: INR {inv.get('totalTax', 0):,.2f}
Grand Total: INR {inv.get('grandTotal', 0):,.2f}

Notes: {inv.get('notes', 'N/A')}

Created: {inv.get('createdAt', 'N/A')}
Updated: {inv.get('updatedAt', 'N/A')}
"""


@tool
async def create_invoice(
    contact_name: str,
    email: str,
    items: list[dict],
    phone: str = "",
    company: str = "",
    notes: str = "",
) -> str:
    """Create a new invoice with line items.

    Args:
        contact_name: Customer full name
        email: Customer email
        items: List of items — each dict should have:
               description, quantity (int), unit (str), unitPrice (float), taxRate (float)
        phone: Optional phone number
        company: Optional company name
        notes: Optional notes
    """
    db = _get_db()
    now = datetime.utcnow()
    prefix = f"BT{now.year}{now.month:02d}"
    last = await db.invoices.find_one(
        {"invoiceNumber": {"$regex": f"^{prefix}"}},
        sort=[("invoiceNumber", -1)],
    )
    next_num = f"{int(last['invoiceNumber'][-3:]) + 1:03d}" if last else "001"
    invoice_number = f"{prefix}{next_num}"

    subtotal = 0.0
    total_tax = 0.0
    processed = []
    for item in items:
        sub = item["unitPrice"] * item["quantity"]
        tax = sub * (item["taxRate"] / 100)
        subtotal += sub
        total_tax += tax
        processed.append({
            "description": item["description"],
            "quantity": item["quantity"],
            "unit": item["unit"],
            "unitPrice": item["unitPrice"],
            "taxRate": item["taxRate"],
            "taxAmount": round(tax, 2),
            "totalAmount": round(sub + tax, 2),
        })

    grand = round(subtotal + total_tax, 2)
    doc = {
        "invoiceNumber": invoice_number,
        "contactName": contact_name,
        "email": email,
        "phone": phone,
        "company": company,
        "items": processed,
        "subtotal": round(subtotal, 2),
        "totalTax": round(total_tax, 2),
        "grandTotal": grand,
        "currency": "INR",
        "status": "draft",
        "notes": notes,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db.invoices.insert_one(doc)
    return (
        f"Invoice {invoice_number} created successfully.\n"
        f"Total: INR {grand:,.2f}\n"
        f"Items: {len(processed)}\n"
        f"ID: {result.inserted_id}"
    )


@tool
async def update_invoice_status(invoice_id: str, status: str) -> str:
    """Update the status of an invoice.

    Args:
        invoice_id: MongoDB ObjectId of the invoice
        status: New status (draft, sent, paid, overdue, cancelled)
    """
    db = _get_db()
    valid_statuses = {"draft", "sent", "paid", "overdue", "cancelled"}

    if status not in valid_statuses:
        return f"Invalid status '{status}'. Valid options: {', '.join(sorted(valid_statuses))}"

    try:
        oid = ObjectId(invoice_id)
    except Exception:
        return "Invalid invoice ID format."

    result = await db.invoices.update_one(
        {"_id": oid},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Invoice not found."

    return f"Invoice status updated to '{status}'."


@tool
async def get_invoice_stats() -> str:
    """Get aggregate invoice statistics — counts, revenue, and breakdowns by status."""
    db = _get_db()

    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total": {"$sum": "$grandTotal"},
            "avg": {"$avg": "$grandTotal"},
        }}
    ]
    results = await db.invoices.aggregate(pipeline).to_list(10)

    if not results:
        return "No invoices found."

    total_count = sum(r["count"] for r in results)
    total_revenue = sum(r["total"] for r in results)

    lines = [
        f"**Invoice Stats**",
        f"Total Invoices: {total_count}",
        f"Total Revenue: INR {total_revenue:,.2f}",
        "",
        "By Status:",
    ]

    status_order = ["draft", "sent", "paid", "overdue", "cancelled"]
    status_map = {r["_id"]: r for r in results}
    for s in status_order:
        if s in status_map:
            r = status_map[s]
            lines.append(
                f"  - {s}: {r['count']} invoices "
                f"(INR {r['total']:,.2f} total, INR {r['avg']:,.2f} avg)"
            )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Admin invoice agent graph
# ---------------------------------------------------------------------------

ADMIN_INVOICE_TOOLS = [
    search_invoices,
    get_invoice_details,
    create_invoice,
    update_invoice_status,
    get_invoice_stats,
]

INVOICE_SYSTEM_PROMPT = """You are Bark Technologies Invoice Admin Agent. You manage invoices and billing for a B2B machinery company.

Your responsibilities:
1. Search and filter invoices by status
2. View full invoice details with line items
3. Create new invoices with proper line items and tax calculations
4. Update invoice status through the billing workflow
5. View aggregate invoice statistics and revenue data

Status flow: draft → sent → paid / overdue / cancelled

Always confirm invoice creation details and status changes. Provide clear financial summaries.
"""


def _build_invoice_agent():
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,
        max_tokens=1024,
    )
    llm_with_tools = llm.bind_tools(ADMIN_INVOICE_TOOLS)

    def agent_node(state: MessagesState):
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(ADMIN_INVOICE_TOOLS)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_invoice_agent_graph = None


def get_invoice_agent():
    global _invoice_agent_graph
    if _invoice_agent_graph is None:
        _invoice_agent_graph = _build_invoice_agent()
    return _invoice_agent_graph


async def run_invoice_agent(message: str, thread_id: str) -> str:
    graph = get_invoice_agent()
    messages = [SystemMessage(content=INVOICE_SYSTEM_PROMPT), HumanMessage(content=message)]
    result = await graph.ainvoke(
        {"messages": messages},
        config={"configurable": {"thread_id": thread_id}},
    )
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage) and msg.content:
            return msg.content
    return "Sorry, I could not process your request. Please try again."
