"""Invoice tools — create, stats, and PDF generation."""

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


@tool
async def generate_invoice_pdf(invoice_id: str) -> str:
    """Generate a print-ready PDF for an existing invoice via WeasyPrint.

    Returns a download URL, never raw PDF bytes. Use this after creating an invoice
    to generate the PDF document for email or download.

    Args:
        invoice_id: The MongoDB ObjectId of the invoice to generate PDF for.
    """
    from bson import ObjectId
    from app.services.invoice_pdf import invoice_pdf_service

    db = _get_db()
    try:
        invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        return f"Invalid invoice ID: {invoice_id}"

    if not invoice:
        return f"Invoice not found: {invoice_id}"

    # Build invoice data for the PDF service
    invoice_data = {
        "invoice_number": invoice.get("invoiceNumber", ""),
        "contact_name": invoice.get("contactName", ""),
        "email": invoice.get("email", ""),
        "phone": invoice.get("phone", ""),
        "company": invoice.get("company", ""),
        "address": invoice.get("address", ""),
        "items": invoice.get("items", []),
        "subtotal": invoice.get("subtotal", 0),
        "gst_amount": invoice.get("totalTax", 0),
        "grand_total": invoice.get("grandTotal", 0),
        "notes": invoice.get("notes", ""),
        "invoice_date": invoice.get("createdAt", ""),
    }

    try:
        pdf_path = invoice_pdf_service.generate_pdf(invoice_data)
        # Return download URL, not raw bytes
        download_url = f"/admin/invoices/{invoice_id}/pdf"
        return f"PDF generated successfully!\nInvoice: {invoice.get('invoiceNumber', 'N/A')}\nDownload: {download_url}\nFile: {pdf_path}"
    except Exception as e:
        return f"Failed to generate PDF: {str(e)}"


@tool
async def list_invoices(
    status: str = "",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """List invoices with optional status filter. Admin-only tool.

    Args:
        status: Filter by status (draft, sent, paid, partial, overdue)
        limit: Maximum results to return (default 20)
        offset: Number of results to skip (for pagination)
    """
    db = _get_db()
    query = {}
    if status:
        query["status"] = status

    cursor = db.invoices.find(query).sort("createdAt", -1).skip(offset).limit(limit)
    invoices = await cursor.to_list(length=limit)
    total = await db.invoices.count_documents(query)

    if not invoices:
        return "No invoices found."

    results = []
    for inv in invoices:
        results.append(
            f"- **{inv.get('invoiceNumber', 'N/A')}**: {inv.get('contactName', 'Unknown')} | "
            f"INR {inv.get('grandTotal', 0):,.2f} | Status: {inv.get('status', 'draft')}"
        )

    return f"Invoices ({total} total):\n\n" + "\n".join(results)


@tool
async def mark_invoice_status(invoice_id: str, status: str) -> str:
    """Update invoice status (sent, paid, partial, overdue). Admin-only tool.

    Requires human confirmation before marking as paid.

    Args:
        invoice_id: The MongoDB ObjectId of the invoice
        status: New status (draft, sent, paid, partial, overdue)
    """
    from bson import ObjectId

    valid_statuses = ["draft", "sent", "paid", "partial", "overdue"]
    if status not in valid_statuses:
        return f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}"

    db = _get_db()
    result = await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Invoice not found."
    return f"Invoice {invoice_id} status updated to '{status}' successfully."
