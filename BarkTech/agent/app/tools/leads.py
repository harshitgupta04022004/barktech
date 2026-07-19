"""Lead / RFQ tools — native LangGraph @tools against MongoDB."""

import re
from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


@tool
async def create_inquiry(
    contact_name: str,
    email: str,
    product_name: str,
    quantity: int,
    phone: str = "",
    company: str = "",
    country: str = "",
    notes: str = "",
) -> str:
    """Create a new RFQ/inquiry for a customer. Use this when a customer wants to request a quote or inquiry.

    Args:
        contact_name: Customer's full name
        email: Customer's email address
        product_name: Name of the product they're interested in
        quantity: Quantity requested
        phone: Optional phone number
        company: Optional company name
        country: Optional country
        notes: Optional additional notes
    """
    db = _get_db()
    lead = {
        "contactName": contact_name,
        "email": email,
        "phone": phone,
        "company": company,
        "country": country,
        "source": "ai_chat",
        "status": "new",
        "priority": "medium",
        "rfqItems": [{"productName": product_name, "quantity": quantity, "notes": notes}],
        "notes": notes,
    }
    result = await db.leads.insert_one(lead)
    return f"Inquiry created successfully!\nReference ID: {result.inserted_id}\nProduct: {product_name}\nQuantity: {quantity}\nContact: {contact_name} ({email})\n\nOur team will get back to you within 24 hours."


@tool
async def search_leads(
    status: str = "",
    priority: str = "",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """Search and list leads/inquiries. Admin-only tool.

    Args:
        status: Filter by status (new, contacted, qualified, quoted, won, lost)
        priority: Filter by priority (low, normal, high, urgent)
        limit: Maximum results to return (default 20)
        offset: Number of results to skip (for pagination)
    """
    db = _get_db()
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    cursor = db.leads.find(query).sort("createdAt", -1).skip(offset).limit(limit)
    leads = await cursor.to_list(length=limit)
    total = await db.leads.count_documents(query)

    if not leads:
        return "No leads found matching your criteria."

    results = []
    for lead in leads:
        results.append(
            f"- **{lead.get('contactName', 'Unknown')}** ({lead.get('email', 'N/A')})\n"
            f"  Status: {lead.get('status', 'new')} | Priority: {lead.get('priority', 'normal')}\n"
            f"  Company: {lead.get('company', 'N/A')} | Source: {lead.get('source', 'N/A')}\n"
            f"  Created: {lead.get('createdAt', 'N/A')}"
        )

    return f"Found {total} leads:\n\n" + "\n\n".join(results)


@tool
async def update_lead_status(lead_id: str, status: str) -> str:
    """Update the status of a lead/inquiry. Admin-only tool.

    Args:
        lead_id: The MongoDB ObjectId of the lead
        status: New status (new, contacted, qualified, quoted, won, lost, spam)
    """
    from bson import ObjectId
    valid_statuses = ["new", "contacted", "qualified", "quoted", "won", "lost", "spam"]
    if status not in valid_statuses:
        return f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}"

    db = _get_db()
    result = await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {"status": status, "updatedAt": __import__("datetime").datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Lead not found."
    return f"Lead {lead_id} status updated to '{status}' successfully."


@tool
async def get_lead_stats() -> str:
    """Get aggregate statistics for leads/inquiries. Admin-only tool."""
    db = _get_db()
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await db.leads.aggregate(pipeline).to_list(10)
    total = await db.leads.count_documents({})

    if not results:
        return "No leads found."

    lines = [f"Lead Statistics (Total: {total}):\n"]
    for r in results:
        lines.append(f"- {r['_id']}: {r['count']} leads")

    return "\n".join(lines)
