"""Invoice tools — create and stats."""

from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
from datetime import datetime

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


@tool
async def create_invoice(
    contact_name: str,
    email: str,
    items: list,
    phone: str = "",
    company: str = "",
    address: str = "",
    notes: str = "",
) -> str:
    """Create a new invoice for an admin.

    Args:
        contact_name: Customer full name
        email: Customer email
        items: List of items with description, quantity, unit, unitPrice, taxRate
        phone: Phone number
        company: Company name
        address: Billing address
        notes: Additional notes
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
            "taxAmount": tax,
            "totalAmount": sub + tax,
        })

    grand = subtotal + total_tax
    doc = {
        "invoiceNumber": invoice_number,
        "contactName": contact_name,
        "email": email,
        "phone": phone,
        "company": company,
        "address": address,
        "items": processed,
        "subtotal": subtotal,
        "totalTax": total_tax,
        "grandTotal": grand,
        "currency": "INR",
        "status": "draft",
        "notes": notes,
        "createdAt": datetime.utcnow(),
    }
    result = await db.invoices.insert_one(doc)
    return f"Invoice {invoice_number} created. Total: INR {grand:,.2f}. ID: {result.inserted_id}"


@tool
async def get_invoice_stats() -> str:
    """Get invoice statistics — count, revenue, status breakdown."""
    db = _get_db()
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}, "total": {"$sum": "$grandTotal"}}}]
    results = await db.invoices.aggregate(pipeline).to_list(10)
    if not results:
        return "No invoices found."
    lines = ["Invoice Stats:"]
    for r in results:
        lines.append(f"- {r['_id']}: {r['count']} (INR {r['total']:,.2f})")
    return "\n".join(lines)
