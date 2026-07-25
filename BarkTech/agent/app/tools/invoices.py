"""Invoice tools — create, view, update, delete, list, mark status.

All tools write/read the same MongoDB `invoices` collection that the
Node.js backend and admin UI use. Field names match the Mongoose schema
exactly (customerName, customerEmail, gstAmount, total, etc.).
"""

import json
import logging
from datetime import datetime
from bson import ObjectId

from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config

logger = logging.getLogger(__name__)

_client = None

# Company defaults — same as backend invoice.service.ts COMPANY_DEFAULTS
COMPANY_DEFAULTS = {
    "bankName": "BARK TECHNOLOGIES",
    "bankBank": "ICICI BANK LTD",
    "bankAddress": "NOIDA 132",
    "bankAccountNo": "157905003103",
    "bankIfscCode": "ICIC0001579",
    "bankSwiftCode": "",
}


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


def _number_to_words(amount: float) -> str:
    """Convert amount to Indian English words for invoice."""
    if amount <= 0:
        return "ZERO RUPEES ONLY"

    ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
            "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN",
            "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"]
    tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY",
            "SEVENTY", "EIGHTY", "NINETY"]

    def _convert_hundreds(n):
        result = ""
        if n >= 100:
            result += ones[n // 100] + " HUNDRED "
            n %= 100
        if n >= 20:
            result += tens[n // 10] + " "
            n %= 10
        if n > 0:
            result += ones[n] + " "
        return result.strip()

    whole = int(amount)
    decimal_part = round((amount - whole) * 100)

    result = ""
    if whole >= 10000000:
        result += _convert_hundreds(whole // 10000000) + " CRORE "
    if whole >= 100000:
        result += _convert_hundreds((whole % 10000000) // 100000) + " LAKH "
    if whole >= 1000:
        result += _convert_hundreds((whole % 100000) // 1000) + " THOUSAND "
    if whole % 1000 > 0:
        result += _convert_hundreds(whole % 1000) + " "
    result = result.strip() + " RUPEES"

    if decimal_part > 0:
        result += " AND " + _convert_hundreds(decimal_part) + " PAISE"

    return result + " ONLY"


async def _get_next_invoice_number(db) -> str:
    """Generate next invoice number in BARK{FY}S{num} format (matches backend)."""
    now = datetime.utcnow()
    fy_start = now.year if now.month >= 3 else now.year - 1
    fy_end = fy_start + 1
    short_start = str(fy_start)[-2:]
    short_end = str(fy_end)[-2:]
    prefix = f"BARK{short_start}-{short_end}S"

    last = await db.invoices.find_one(
        {"invoiceNumber": {"$regex": f"^{prefix}"}},
        sort=[("invoiceNumber", -1)],
    )
    if last:
        last_num = int(last["invoiceNumber"][-3:])
        next_num = str(last_num + 1).zfill(3)
    else:
        next_num = "001"

    return f"{prefix}{next_num}"


def _invoice_to_card(inv: dict) -> dict:
    """Convert a MongoDB invoice document to a card-friendly dict for frontend rendering."""
    inv_id = str(inv.get("_id", ""))
    items = []
    for item in inv.get("items", []):
        items.append({
            "description": item.get("description", ""),
            "hsnCode": item.get("hsnCode", ""),
            "quantity": item.get("quantity", 1),
            "unitPrice": item.get("unitPrice", 0),
            "gstRate": item.get("gstRate", 18),
            "amount": item.get("amount", 0),
        })

    return {
        "invoice_id": inv_id,
        "invoice_number": inv.get("invoiceNumber", ""),
        "customer_name": inv.get("customerName", ""),
        "customer_email": inv.get("customerEmail", ""),
        "customer_phone": inv.get("customerPhone", ""),
        "customer_company": inv.get("customerCompany", ""),
        "customer_address": inv.get("customerAddress", ""),
        "customer_gst": inv.get("customerGst", ""),
        "ship_to_address": inv.get("shipToAddress", ""),
        "mode_of_delivery": inv.get("modeOfDelivery", "BY TRANSPORT"),
        "dispatch_from": inv.get("dispatchFrom", ""),
        "transport_details": inv.get("transportDetails", ""),
        "delivery_basis": inv.get("deliveryBasis", ""),
        "delivery_label": inv.get("deliveryLabel", "FACTORY DELIVERY"),
        "ref_attended_by": inv.get("refAttendedBy", ""),
        "currency": inv.get("currency", "INR"),
        "items": items,
        "subtotal": inv.get("subtotal", 0),
        "gst_amount": inv.get("gstAmount", 0),
        "gst_rate": inv.get("gstRate", 18),
        "total": inv.get("total", 0),
        "amount_in_words": inv.get("amountInWords", ""),
        "bank_name": inv.get("bankName", ""),
        "bank_bank": inv.get("bankBank", ""),
        "bank_address": inv.get("bankAddress", ""),
        "bank_account_no": inv.get("bankAccountNo", ""),
        "bank_ifsc_code": inv.get("bankIfscCode", ""),
        "bank_swift_code": inv.get("bankSwiftCode", ""),
        "status": inv.get("status", "draft"),
        "notes": inv.get("notes", ""),
        "terms": inv.get("terms", ""),
        "due_date": str(inv.get("dueDate", "")) if inv.get("dueDate") else "",
        "paid_at": str(inv.get("paidAt", "")) if inv.get("paidAt") else "",
        "pdf_url": inv.get("pdfUrl", ""),
        "created_at": str(inv.get("createdAt", "")),
        "updated_at": str(inv.get("updatedAt", "")),
    }


def _process_items(items: list) -> list:
    """Process line items with amount calculation. Returns processed items."""
    processed = []
    for item in items:
        qty = item.get("quantity", 1)
        rate = item.get("unitPrice", 0)
        gst_rate = item.get("gstRate", 18)
        amount = qty * rate
        processed.append({
            "description": item.get("description", ""),
            "hsnCode": item.get("hsnCode", ""),
            "quantity": qty,
            "unitPrice": rate,
            "gstRate": gst_rate,
            "amount": amount,
            "sortOrder": len(processed),
        })
    return processed


def _calculate_totals(items: list, gst_rate: float = 18.0) -> dict:
    """Calculate subtotal, gstAmount, total from processed items."""
    subtotal = sum(item["amount"] for item in items)
    gst_amount = subtotal * (gst_rate / 100)
    total = subtotal + gst_amount
    return {
        "subtotal": round(subtotal, 2),
        "gstAmount": round(gst_amount, 2),
        "gstRate": gst_rate,
        "total": round(total, 2),
    }


# ──────────────────────────────────────────────────────────────────
# create_invoice
# ──────────────────────────────────────────────────────────────────

@tool
async def create_invoice(
    customer_name: str,
    customer_email: str = "",
    customer_phone: str = "",
    customer_company: str = "",
    customer_address: str = "",
    customer_gst: str = "",
    ship_to_address: str = "",
    mode_of_delivery: str = "BY TRANSPORT",
    dispatch_from: str = "",
    transport_details: str = "",
    delivery_basis: str = "",
    ref_attended_by: str = "",
    currency: str = "INR",
    items: list = None,
    gst_rate: float = 18.0,
    due_date: str = "",
    notes: str = "",
    terms: str = "",
    bank_name: str = "",
    bank_bank: str = "",
    bank_address: str = "",
    bank_account_no: str = "",
    bank_ifsc_code: str = "",
    bank_swift_code: str = "",
) -> str:
    """Create a new invoice. Writes to the same MongoDB collection as the admin UI.

    Args:
        customer_name: Customer full name (REQUIRED)
        customer_email: Customer email address
        customer_phone: Customer phone number
        customer_company: Customer company name
        customer_address: Billing address
        customer_gst: Customer GST number
        ship_to_address: Shipping address (defaults to customer_address if empty)
        mode_of_delivery: Delivery mode (default: BY TRANSPORT)
        dispatch_from: Dispatch location
        transport_details: Transport details
        delivery_basis: Delivery basis
        ref_attended_by: Referral/attended by person
        currency: Currency code (default: INR)
        items: List of line items, each a dict with: description, hsnCode, quantity, unitPrice, gstRate
        gst_rate: Overall GST rate (default: 18)
        due_date: Due date string (e.g. '2026-08-15')
        notes: Additional notes
        terms: Terms and conditions
        bank_name: Bank beneficiary name (defaults to company name)
        bank_bank: Bank name
        bank_address: Bank branch address
        bank_account_no: Bank account number
        bank_ifsc_code: IFSC code
        bank_swift_code: SWIFT code
    """
    db = _get_db()

    # Validate required field
    if not customer_name or not customer_name.strip():
        return json.dumps({"error": "customer_name is required. Please provide the customer's full name."})

    # Validate items
    if not items or len(items) == 0:
        return json.dumps({"error": "At least one line item is required. Each item needs description, quantity, and unitPrice."})

    for i, item in enumerate(items):
        if not item.get("description"):
            return json.dumps({"error": f"Line item {i + 1}: description is required."})
        if not isinstance(item.get("quantity", 0), (int, float)) or item.get("quantity", 0) <= 0:
            return json.dumps({"error": f"Line item {i + 1}: quantity must be a positive number."})
        if not isinstance(item.get("unitPrice", 0), (int, float)) or item.get("unitPrice", 0) < 0:
            return json.dumps({"error": f"Line item {i + 1}: unitPrice must be a non-negative number."})

    # Process items
    processed_items = _process_items(items)
    totals = _calculate_totals(processed_items, gst_rate)

    # Generate invoice number
    invoice_number = await _get_next_invoice_number(db)

    # Build invoice document
    now = datetime.utcnow()
    doc = {
        "invoiceNumber": invoice_number,
        "customerName": customer_name.strip(),
        "customerEmail": customer_email.strip(),
        "customerPhone": customer_phone,
        "customerCompany": customer_company,
        "customerAddress": customer_address,
        "customerGst": customer_gst,
        "shipToAddress": ship_to_address or customer_address,
        "modeOfDelivery": mode_of_delivery,
        "dispatchFrom": dispatch_from,
        "transportDetails": transport_details,
        "deliveryBasis": delivery_basis,
        "deliveryLabel": "FACTORY DELIVERY",
        "refAttendedBy": ref_attended_by,
        "currency": currency,
        "items": processed_items,
        "subtotal": totals["subtotal"],
        "gstAmount": totals["gstAmount"],
        "gstRate": totals["gstRate"],
        "total": totals["total"],
        "amountInWords": _number_to_words(totals["total"]),
        "bankName": bank_name or COMPANY_DEFAULTS["bankName"],
        "bankBank": bank_bank or COMPANY_DEFAULTS["bankBank"],
        "bankAddress": bank_address or COMPANY_DEFAULTS["bankAddress"],
        "bankAccountNo": bank_account_no or COMPANY_DEFAULTS["bankAccountNo"],
        "bankIfscCode": bank_ifsc_code or COMPANY_DEFAULTS["bankIfscCode"],
        "bankSwiftCode": bank_swift_code or COMPANY_DEFAULTS["bankSwiftCode"],
        "status": "draft",
        "notes": notes,
        "terms": terms,
        "dueDate": datetime.fromisoformat(due_date) if due_date else None,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await db.invoices.insert_one(doc)
    doc["_id"] = result.inserted_id

    card = _invoice_to_card(doc)
    return json.dumps({
        "success": True,
        "invoice": card,
        "message": f"Invoice {invoice_number} created successfully. Total: INR {totals['total']:,.2f}.",
    })


# ──────────────────────────────────────────────────────────────────
# get_invoice (view)
# ──────────────────────────────────────────────────────────────────

@tool
async def get_invoice(invoice_id: str) -> str:
    """Get full invoice details by ID. Returns the complete invoice object.

    Args:
        invoice_id: MongoDB ObjectId of the invoice
    """
    db = _get_db()
    try:
        inv = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        return json.dumps({"error": "Invalid invoice ID format."})

    if not inv:
        return json.dumps({"error": "Invoice not found."})

    card = _invoice_to_card(inv)
    return json.dumps({"success": True, "invoice": card})


# ──────────────────────────────────────────────────────────────────
# update_invoice (edit)
# ──────────────────────────────────────────────────────────────────

@tool
async def update_invoice(
    invoice_id: str,
    customer_name: str = None,
    customer_email: str = None,
    customer_phone: str = None,
    customer_company: str = None,
    customer_address: str = None,
    customer_gst: str = None,
    ship_to_address: str = None,
    mode_of_delivery: str = None,
    dispatch_from: str = None,
    transport_details: str = None,
    delivery_basis: str = None,
    ref_attended_by: str = None,
    currency: str = None,
    items: list = None,
    gst_rate: float = None,
    due_date: str = None,
    notes: str = None,
    terms: str = None,
    bank_name: str = None,
    bank_bank: str = None,
    bank_address: str = None,
    bank_account_no: str = None,
    bank_ifsc_code: str = None,
    bank_swift_code: str = None,
    status: str = None,
) -> str:
    """Update an existing invoice. Only the fields you provide will be changed.

    Args:
        invoice_id: MongoDB ObjectId of the invoice (REQUIRED)
        customer_name: New customer name
        customer_email: New email
        customer_phone: New phone
        customer_company: New company
        customer_address: New billing address
        customer_gst: New GST number
        ship_to_address: New shipping address
        mode_of_delivery: New delivery mode
        dispatch_from: New dispatch location
        transport_details: New transport details
        delivery_basis: New delivery basis
        ref_attended_by: New ref/attended by
        currency: New currency code
        items: New line items list (if provided, totals are recalculated)
        gst_rate: New GST rate (if provided with items, totals are recalculated)
        due_date: New due date string
        notes: New notes
        terms: New terms
        bank_name: New bank beneficiary name
        bank_bank: New bank name
        bank_address: New bank address
        bank_account_no: New bank account number
        bank_ifsc_code: New IFSC code
        bank_swift_code: New SWIFT code
        status: New status (draft, sent, paid, partially_paid, overdue, cancelled)
    """
    db = _get_db()

    try:
        oid = ObjectId(invoice_id)
    except Exception:
        return json.dumps({"error": "Invalid invoice ID format."})

    existing = await db.invoices.find_one({"_id": oid})
    if not existing:
        return json.dumps({"error": "Invoice not found."})

    # Build update set — only include fields that are not None
    update_fields = {}
    field_map = {
        "customer_name": "customerName",
        "customer_email": "customerEmail",
        "customer_phone": "customerPhone",
        "customer_company": "customerCompany",
        "customer_address": "customerAddress",
        "customer_gst": "customerGst",
        "ship_to_address": "shipToAddress",
        "mode_of_delivery": "modeOfDelivery",
        "dispatch_from": "dispatchFrom",
        "transport_details": "transportDetails",
        "delivery_basis": "deliveryBasis",
        "ref_attended_by": "refAttendedBy",
        "currency": "currency",
        "notes": "notes",
        "terms": "terms",
        "bank_name": "bankName",
        "bank_bank": "bankBank",
        "bank_address": "bankAddress",
        "bank_account_no": "bankAccountNo",
        "bank_ifsc_code": "bankIfscCode",
        "bank_swift_code": "bankSwiftCode",
        "status": "status",
    }

    for param_name, db_field in field_map.items():
        value = locals().get(param_name)
        if value is not None:
            update_fields[db_field] = value

    # Validate status if provided
    if status is not None:
        valid_statuses = ["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"]
        if status not in valid_statuses:
            return json.dumps({"error": f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}"})

    # Handle due_date
    if due_date is not None:
        try:
            update_fields["dueDate"] = datetime.fromisoformat(due_date)
        except ValueError:
            update_fields["dueDate"] = due_date

    # If items are provided, recalculate totals
    if items is not None:
        if len(items) == 0:
            return json.dumps({"error": "Cannot set empty items list. Provide at least one item."})

        for i, item in enumerate(items):
            if not item.get("description"):
                return json.dumps({"error": f"Line item {i + 1}: description is required."})
            if not isinstance(item.get("quantity", 0), (int, float)) or item.get("quantity", 0) <= 0:
                return json.dumps({"error": f"Line item {i + 1}: quantity must be a positive number."})
            if not isinstance(item.get("unitPrice", 0), (int, float)) or item.get("unitPrice", 0) < 0:
                return json.dumps({"error": f"Line item {i + 1}: unitPrice must be a non-negative number."})

        processed_items = _process_items(items)
        effective_gst_rate = gst_rate if gst_rate is not None else existing.get("gstRate", 18)
        totals = _calculate_totals(processed_items, effective_gst_rate)

        update_fields["items"] = processed_items
        update_fields["subtotal"] = totals["subtotal"]
        update_fields["gstAmount"] = totals["gstAmount"]
        update_fields["gstRate"] = totals["gstRate"]
        update_fields["total"] = totals["total"]
        update_fields["amountInWords"] = _number_to_words(totals["total"])

    if not update_fields:
        return json.dumps({"error": "No fields to update. Provide at least one field to change."})

    update_fields["updatedAt"] = datetime.utcnow()

    result = await db.invoices.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return json.dumps({"error": "Invoice not found."})

    # Return the updated invoice
    updated = await db.invoices.find_one({"_id": oid})
    card = _invoice_to_card(updated)
    return json.dumps({
        "success": True,
        "invoice": card,
        "message": f"Invoice {card['invoice_number']} updated successfully.",
    })


# ──────────────────────────────────────────────────────────────────
# delete_invoice
# ──────────────────────────────────────────────────────────────────

@tool
async def delete_invoice(invoice_id: str) -> str:
    """Delete an invoice permanently. This action cannot be undone.

    Args:
        invoice_id: MongoDB ObjectId of the invoice to delete
    """
    db = _get_db()
    try:
        oid = ObjectId(invoice_id)
    except Exception:
        return json.dumps({"error": "Invalid invoice ID format."})

    existing = await db.invoices.find_one({"_id": oid})
    if not existing:
        return json.dumps({"error": "Invoice not found."})

    await db.invoices.delete_one({"_id": oid})
    return json.dumps({
        "success": True,
        "message": f"Invoice {existing.get('invoiceNumber', invoice_id)} deleted successfully.",
    })


# ──────────────────────────────────────────────────────────────────
# list_invoices
# ──────────────────────────────────────────────────────────────────

@tool
async def list_invoices(
    status: str = "",
    search: str = "",
    limit: int = 20,
    page: int = 1,
) -> str:
    """List invoices with optional filters. Returns invoice summaries.

    Args:
        status: Filter by status (draft, sent, paid, partially_paid, overdue, cancelled)
        search: Search by invoice number, customer name, or company name
        limit: Max results per page (default 20)
        page: Page number (default 1)
    """
    db = _get_db()
    query = {}

    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"invoiceNumber": {"$regex": search, "$options": "i"}},
            {"customerName": {"$regex": search, "$options": "i"}},
            {"customerCompany": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    cursor = db.invoices.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    invoices = await cursor.to_list(length=limit)
    total = await db.invoices.count_documents(query)

    if not invoices:
        return json.dumps({"success": True, "invoices": [], "total": 0, "message": "No invoices found."})

    invoice_list = []
    for inv in invoices:
        invoice_list.append({
            "invoice_id": str(inv.get("_id", "")),
            "invoice_number": inv.get("invoiceNumber", ""),
            "customer_name": inv.get("customerName", ""),
            "customer_company": inv.get("customerCompany", ""),
            "total": inv.get("total", 0),
            "status": inv.get("status", "draft"),
            "created_at": str(inv.get("createdAt", "")),
        })

    return json.dumps({
        "success": True,
        "invoices": invoice_list,
        "total": total,
        "page": page,
        "limit": limit,
        "message": f"Found {total} invoice(s).",
    })


# ──────────────────────────────────────────────────────────────────
# get_invoice_stats
# ──────────────────────────────────────────────────────────────────

@tool
async def get_invoice_stats() -> str:
    """Get aggregate invoice statistics — counts, revenue, and breakdowns by status."""
    db = _get_db()

    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total": {"$sum": "$total"},
            "avg": {"$avg": "$total"},
        }}
    ]
    results = await db.invoices.aggregate(pipeline).to_list(10)

    if not results:
        return json.dumps({"success": True, "total_count": 0, "total_revenue": 0, "by_status": [], "message": "No invoices found."})

    total_count = sum(r["count"] for r in results)
    total_revenue = sum(r["total"] for r in results)

    status_order = ["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"]
    status_map = {r["_id"]: r for r in results}
    by_status = []
    for s in status_order:
        if s in status_map:
            r = status_map[s]
            by_status.append({
                "status": s,
                "count": r["count"],
                "total": round(r["total"], 2),
                "avg": round(r["avg"], 2),
            })

    return json.dumps({
        "success": True,
        "total_count": total_count,
        "total_revenue": round(total_revenue, 2),
        "by_status": by_status,
    })


# ──────────────────────────────────────────────────────────────────
# mark_invoice_status
# ──────────────────────────────────────────────────────────────────

@tool
async def mark_invoice_status(invoice_id: str, status: str) -> str:
    """Update the status of an invoice.

    Args:
        invoice_id: MongoDB ObjectId of the invoice
        status: New status (draft, sent, paid, partially_paid, overdue, cancelled)
    """
    valid_statuses = ["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"]
    if status not in valid_statuses:
        return json.dumps({"error": f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}"})

    db = _get_db()
    try:
        oid = ObjectId(invoice_id)
    except Exception:
        return json.dumps({"error": "Invalid invoice ID format."})

    update_fields = {"status": status, "updatedAt": datetime.utcnow()}
    if status in ("paid", "partially_paid"):
        update_fields["paidAt"] = datetime.utcnow()

    result = await db.invoices.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return json.dumps({"error": "Invoice not found."})

    updated = await db.invoices.find_one({"_id": oid})
    card = _invoice_to_card(updated)
    return json.dumps({
        "success": True,
        "invoice": card,
        "message": f"Invoice {card['invoice_number']} status updated to '{status}'.",
    })


# ──────────────────────────────────────────────────────────────────
# generate_invoice_pdf (kept from original, updated field names)
# ──────────────────────────────────────────────────────────────────

@tool
async def generate_invoice_pdf(invoice_id: str) -> str:
    """Generate a print-ready PDF for an existing invoice via WeasyPrint.

    Returns a download URL, never raw PDF bytes. Use this after creating
    an invoice to generate the PDF document for email or download.

    Args:
        invoice_id: The MongoDB ObjectId of the invoice to generate PDF for.
    """
    from app.services.invoice_pdf import invoice_pdf_service

    db = _get_db()
    try:
        invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    except Exception:
        return json.dumps({"error": f"Invalid invoice ID: {invoice_id}"})

    if not invoice:
        return json.dumps({"error": f"Invoice not found: {invoice_id}"})

    # Build invoice data for the PDF service (use backend field names)
    invoice_data = {
        "invoice_number": invoice.get("invoiceNumber", ""),
        "customer_name": invoice.get("customerName", ""),
        "customer_company": invoice.get("customerCompany", ""),
        "customer_address": invoice.get("customerAddress", ""),
        "customer_gst": invoice.get("customerGst", ""),
        "customer_phone": invoice.get("customerPhone", ""),
        "ship_to_address": invoice.get("shipToAddress", ""),
        "mode_of_delivery": invoice.get("modeOfDelivery", "BY TRANSPORT"),
        "dispatch_from": invoice.get("dispatchFrom", ""),
        "ref_attended_by": invoice.get("refAttendedBy", ""),
        "delivery_label": invoice.get("deliveryLabel", "FACTORY DELIVERY"),
        "items": invoice.get("items", []),
        "gst_rate": invoice.get("gstRate", 18),
        "subtotal": invoice.get("subtotal", 0),
        "gst_amount": invoice.get("gstAmount", 0),
        "total": invoice.get("total", 0),
        "amount_in_words": invoice.get("amountInWords", ""),
        "invoice_date": invoice.get("createdAt", ""),
        "bank_name": invoice.get("bankName", COMPANY_DEFAULTS["bankName"]),
        "bank_bank": invoice.get("bankBank", COMPANY_DEFAULTS["bankBank"]),
        "bank_address": invoice.get("bankAddress", COMPANY_DEFAULTS["bankAddress"]),
        "bank_account_no": invoice.get("bankAccountNo", COMPANY_DEFAULTS["bankAccountNo"]),
        "bank_ifsc": invoice.get("bankIfscCode", COMPANY_DEFAULTS["bankIfscCode"]),
        "bank_swift": invoice.get("bankSwiftCode", ""),
    }

    try:
        pdf_path = invoice_pdf_service.generate_pdf(invoice_data)
        download_url = f"/admin/invoices/{invoice_id}/pdf"
        return json.dumps({
            "success": True,
            "invoice_number": invoice.get("invoiceNumber", ""),
            "download_url": download_url,
            "message": f"PDF generated for invoice {invoice.get('invoiceNumber', '')}",
        })
    except Exception as e:
        return json.dumps({"error": f"Failed to generate PDF: {str(e)}"})
