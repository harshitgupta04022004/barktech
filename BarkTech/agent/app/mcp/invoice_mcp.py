"""Invoice MCP — wraps the Node.js backend invoice API for agent use.

Provides invoice CRUD, status management, and PDF generation via the
Fastify backend at BACKEND_API_URL. All tools return dicts with a
'success' key for consistent error handling by the agent.

Requires:
- BACKEND_API_URL env var (default http://localhost:3000)
- A valid JWT token set via INVOICE_API_TOKEN env var
"""

import os
import logging
from typing import Any

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000")
INVOICE_API_TOKEN = os.getenv("INVOICE_API_TOKEN", "")

INVOICES_BASE = f"{BACKEND_API_URL}/api/invoices"


def _get_headers() -> dict[str, str]:
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if INVOICE_API_TOKEN:
        headers["Authorization"] = f"Bearer {INVOICE_API_TOKEN}"
    return headers


async def _request(method: str, path: str, **kwargs) -> dict[str, Any]:
    """Make an authenticated request to the backend invoice API."""
    url = f"{INVOICES_BASE}{path}"
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(method, url, headers=headers, **kwargs)

            if response.status_code in (200, 201):
                data = response.json()
                return {"success": True, **data}

            if response.status_code == 404:
                return {"success": False, "error": "Invoice not found."}

            try:
                data = response.json()
                error_msg = data.get("error", data.get("message", f"HTTP {response.status_code}"))
            except Exception:
                error_msg = f"HTTP {response.status_code}: {response.text[:300]}"
            return {"success": False, "error": error_msg}

    except httpx.TimeoutException:
        return {"success": False, "error": "Backend request timed out."}
    except httpx.HTTPError as e:
        logger.error(f"Invoice API HTTP error: {e}")
        return {"success": False, "error": f"Connection error: {str(e)[:200]}"}
    except Exception as e:
        logger.error(f"Invoice API error: {e}")
        return {"success": False, "error": f"Unexpected error: {str(e)[:200]}"}


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
    items: list[dict] | None = None,
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
) -> dict[str, Any]:
    """Create a new invoice via the backend API.

    Args:
        customer_name: Customer full name (REQUIRED).
        customer_email: Customer email address.
        customer_phone: Customer phone number.
        customer_company: Customer company name.
        customer_address: Billing address.
        customer_gst: Customer GST number.
        ship_to_address: Shipping address.
        mode_of_delivery: Delivery mode (default: BY TRANSPORT).
        dispatch_from: Dispatch location.
        transport_details: Transport details.
        delivery_basis: Delivery basis.
        ref_attended_by: Referral / attended by person.
        currency: Currency code (default: INR).
        items: List of line items, each with: description, hsnCode, quantity, unitPrice, gstRate.
        gst_rate: Overall GST rate (default: 18).
        due_date: Due date string (e.g. '2026-08-15').
        notes: Additional notes.
        terms: Terms and conditions.
        bank_name: Bank beneficiary name.
        bank_bank: Bank name.
        bank_address: Bank branch address.
        bank_account_no: Bank account number.
        bank_ifsc_code: IFSC code.
        bank_swift_code: SWIFT code.

    Returns:
        dict with success status and invoice details or error.
    """
    if not customer_name or not customer_name.strip():
        return {"success": False, "error": "customer_name is required."}

    if not items or len(items) == 0:
        return {"success": False, "error": "At least one line item is required."}

    payload: dict[str, Any] = {
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
        "refAttendedBy": ref_attended_by,
        "currency": currency,
        "items": items,
        "gstRate": gst_rate,
        "notes": notes,
        "terms": terms,
        "bankName": bank_name,
        "bankBank": bank_bank,
        "bankAddress": bank_address,
        "bankAccountNo": bank_account_no,
        "bankIfscCode": bank_ifsc_code,
        "bankSwiftCode": bank_swift_code,
    }
    if due_date:
        payload["dueDate"] = due_date

    return await _request("POST", "/", json=payload)


# ──────────────────────────────────────────────────────────────────
# get_invoice
# ──────────────────────────────────────────────────────────────────

@tool
async def get_invoice(invoice_id: str) -> dict[str, Any]:
    """Get full invoice details by ID.

    Args:
        invoice_id: MongoDB ObjectId of the invoice.
    """
    return await _request("GET", f"/{invoice_id}")


# ──────────────────────────────────────────────────────────────────
# update_invoice
# ──────────────────────────────────────────────────────────────────

@tool
async def update_invoice(
    invoice_id: str,
    customer_name: str | None = None,
    customer_email: str | None = None,
    customer_phone: str | None = None,
    customer_company: str | None = None,
    customer_address: str | None = None,
    customer_gst: str | None = None,
    ship_to_address: str | None = None,
    mode_of_delivery: str | None = None,
    dispatch_from: str | None = None,
    transport_details: str | None = None,
    delivery_basis: str | None = None,
    ref_attended_by: str | None = None,
    currency: str | None = None,
    items: list[dict] | None = None,
    gst_rate: float | None = None,
    due_date: str | None = None,
    notes: str | None = None,
    terms: str | None = None,
    bank_name: str | None = None,
    bank_bank: str | None = None,
    bank_address: str | None = None,
    bank_account_no: str | None = None,
    bank_ifsc_code: str | None = None,
    bank_swift_code: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    """Update an existing invoice. Only provided fields are changed.

    Args:
        invoice_id: MongoDB ObjectId of the invoice (REQUIRED).
        customer_name: New customer name.
        customer_email: New email.
        customer_phone: New phone.
        customer_company: New company.
        customer_address: New billing address.
        customer_gst: New GST number.
        ship_to_address: New shipping address.
        mode_of_delivery: New delivery mode.
        dispatch_from: New dispatch location.
        transport_details: New transport details.
        delivery_basis: New delivery basis.
        ref_attended_by: New ref/attended by.
        currency: New currency code.
        items: New line items list (totals are recalculated).
        gst_rate: New GST rate.
        due_date: New due date string.
        notes: New notes.
        terms: New terms.
        bank_name: New bank beneficiary name.
        bank_bank: New bank name.
        bank_address: New bank address.
        bank_account_no: New bank account number.
        bank_ifsc_code: New IFSC code.
        bank_swift_code: New SWIFT code.
        status: New status (draft, sent, paid, partially_paid, overdue, cancelled).
    """
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

    locals_map = {
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "customer_company": customer_company,
        "customer_address": customer_address,
        "customer_gst": customer_gst,
        "ship_to_address": ship_to_address,
        "mode_of_delivery": mode_of_delivery,
        "dispatch_from": dispatch_from,
        "transport_details": transport_details,
        "delivery_basis": delivery_basis,
        "ref_attended_by": ref_attended_by,
        "currency": currency,
        "notes": notes,
        "terms": terms,
        "bank_name": bank_name,
        "bank_bank": bank_bank,
        "bank_address": bank_address,
        "bank_account_no": bank_account_no,
        "bank_ifsc_code": bank_ifsc_code,
        "bank_swift_code": bank_swift_code,
        "status": status,
    }

    payload: dict[str, Any] = {}
    for param, db_field in field_map.items():
        val = locals_map[param]
        if val is not None:
            payload[db_field] = val

    if items is not None:
        payload["items"] = items
    if gst_rate is not None:
        payload["gstRate"] = gst_rate
    if due_date is not None:
        payload["dueDate"] = due_date

    if not payload:
        return {"success": False, "error": "No fields to update. Provide at least one field."}

    return await _request("PUT", f"/{invoice_id}", json=payload)


# ──────────────────────────────────────────────────────────────────
# delete_invoice
# ──────────────────────────────────────────────────────────────────

@tool
async def delete_invoice(invoice_id: str) -> dict[str, Any]:
    """Delete an invoice permanently.

    Args:
        invoice_id: MongoDB ObjectId of the invoice to delete.
    """
    return await _request("DELETE", f"/{invoice_id}")


# ──────────────────────────────────────────────────────────────────
# list_invoices
# ──────────────────────────────────────────────────────────────────

@tool
async def list_invoices(
    status: str = "",
    search: str = "",
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    """List invoices with optional filters. Returns invoice summaries.

    Args:
        status: Filter by status (draft, sent, paid, partially_paid, overdue, cancelled).
        search: Search by invoice number, customer name, or company name.
        page: Page number (default 1).
        limit: Max results per page (default 20).
    """
    params: dict[str, Any] = {"page": page, "limit": limit}
    if status:
        params["status"] = status
    if search:
        params["search"] = search

    return await _request("GET", "/", params=params)


# ──────────────────────────────────────────────────────────────────
# get_invoice_stats
# ──────────────────────────────────────────────────────────────────

@tool
async def get_invoice_stats() -> dict[str, Any]:
    """Get aggregate invoice statistics — counts, revenue, and breakdowns by status."""
    return await _request("GET", "/stats")


# ──────────────────────────────────────────────────────────────────
# mark_invoice_status
# ──────────────────────────────────────────────────────────────────

@tool
async def mark_invoice_status(invoice_id: str, status: str) -> dict[str, Any]:
    """Update the status of an invoice.

    Args:
        invoice_id: MongoDB ObjectId of the invoice.
        status: New status (draft, sent, paid, partially_paid, overdue, cancelled).
    """
    valid = {"draft", "sent", "paid", "partially_paid", "overdue", "cancelled"}
    if status not in valid:
        return {"success": False, "error": f"Invalid status '{status}'. Valid: {', '.join(sorted(valid))}"}

    # Use the dedicated status endpoint
    status_endpoints = {
        "sent": "/submit",
        "paid": "/mark-paid",
        "cancelled": "/cancel",
    }
    endpoint = status_endpoints.get(status)
    if endpoint:
        return await _request("POST", f"/{invoice_id}{endpoint}")

    # For draft / overdue / partially_paid — generic update
    return await _request("PUT", f"/{invoice_id}", json={"status": status})


# ──────────────────────────────────────────────────────────────────
# generate_invoice_pdf
# ──────────────────────────────────────────────────────────────────

@tool
async def generate_invoice_pdf(invoice_id: str) -> dict[str, Any]:
    """Generate a print-ready PDF for an existing invoice.

    Returns a download URL. Use after creating an invoice to generate
    the PDF document for email or download.

    Args:
        invoice_id: MongoDB ObjectId of the invoice.
    """
    return await _request("GET", f"/{invoice_id}/pdf")
