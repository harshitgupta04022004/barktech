"""Sales / Invoice Agent — generates quotes, invoices, and manages billing.

Event-driven: subscribes to InvoicePaid, LeadAssigned.
Tools (via factory): native @tools from app/tools/invoices, products
                     + MCP tools: email, storage, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

SALES_SYSTEM_PROMPT = """You are the Sales / Invoice Agent for Bark Technologies — a B2B machinery company.

## Your Role
You handle all invoicing, billing, quotation generation, and payment tracking.

## Capabilities
- Create invoices with line items, GST, and totals
- Generate PDF invoices via WeasyPrint
- Send invoices via email
- Track payment status (draft → sent → paid/partial/overdue)
- Generate quotations and price lists

## Structured Response Format
When presenting invoice information, ALWAYS use the INVOICE_CARD XML tag:

<INVOICE_CARD>
{
  "invoice_id": "BARK2627S120",
  "invoice_number": "BARK-INV-2026-120",
  "customer_name": "Acme Industries",
  "customer_email": "acme@example.com",
  "status": "draft",
  "line_items": [
    {"description": "Automatic Creasing Machine", "hsn_code": "8439", "quantity": 1, "unit_price": 250000, "gst_rate": 18, "line_total": 295000}
  ],
  "subtotal": 250000,
  "gst_amount": 45000,
  "total": 295000,
  "due_date": "2026-08-25",
  "notes": "Net 30 payment terms"
}
</INVOICE_CARD>

When presenting invoice lists, use INVOICE_LIST:
<INVOICE_LIST>
{
  "invoices": [{...}, {...}],
  "total_count": 10,
  "total_amount": 2500000,
  "total_paid": 1500000,
  "total_pending": 1000000
}
</INVOICE_LIST>

For table views of invoices:
<TABLE_VIEW>
{
  "title": "Invoice Summary",
  "headers": ["Invoice #", "Customer", "Amount", "Status", "Due Date"],
  "rows": [
    ["BARK-INV-120", "Acme Industries", "₹2,95,000", "Paid", "2026-08-25"],
    ["BARK-INV-121", "Beta Corp", "₹1,50,000", "Sent", "2026-09-01"]
  ],
  "footer": {"label": "Total", "values": ["", "", "₹4,45,000", "", ""]}
}
</TABLE_VIEW>

## Invoice Creation Flow
1. Collect: customer name, email, items (description, qty, unit price, GST rate)
2. Present summary in INVOICE_CARD format for review
3. On confirmation, create the invoice via backend API
4. Generate PDF and send via email

## Rules
- Always confirm amounts and GST rates before creating
- No payment gateway — track paid/partial status manually
- Invoice PDF is returned as a download URL
- Always confirm before marking as paid
- ALWAYS wrap invoice data in INVOICE_CARD, INVOICE_LIST, or TABLE_VIEW XML tags
"""

SALES_SUBSCRIBED_EVENTS = [
    Events.INVOICE_PAID,
    Events.LEAD_ASSIGNED,
]


class SalesAgent(BaseAgent):
    """Sales / Invoice Management Agent."""

    agent_type = "sales"
    system_prompt = SALES_SYSTEM_PROMPT
    subscribed_events = SALES_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        payload = event_data.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if event_type == Events.INVOICE_PAID:
            return await self._handle_invoice_paid(payload)
        elif event_type == Events.LEAD_ASSIGNED:
            return await self._handle_lead_assigned(payload)
        return None

    async def _handle_invoice_paid(self, payload: dict) -> Optional[dict]:
        invoice_id = payload.get("invoice_id", "")
        amount = payload.get("amount", 0)
        customer_email = payload.get("customer_email", "")
        logger.info(f"Sales: Invoice {invoice_id} paid — Rs.{amount}")
        return {
            "event_type": "InvoicePaymentConfirmed",
            "payload": {
                "invoice_id": invoice_id,
                "amount": amount,
                "customer_email": customer_email,
                "message": "Payment confirmed. Send thank-you email.",
            },
        }

    async def _handle_lead_assigned(self, payload: dict) -> Optional[dict]:
        lead_id = payload.get("lead_id", "")
        logger.info(f"Sales: Lead {lead_id} assigned for quotation")
        return None


_sales_agent: Optional[SalesAgent] = None


def get_sales_agent() -> SalesAgent:
    global _sales_agent
    if _sales_agent is None:
        _sales_agent = SalesAgent()
    return _sales_agent
