"""Native LangGraph tools - core business operations against MongoDB.

Per architecture spec:
- Client tools: products, leads/inquiries, FAQ, contact
- Admin tools: all client tools + invoices, stock, lead management, calendar
- All tools query MongoDB directly via Motor (async)
- Calendar tools use Google Calendar API
"""

from app.tools.products import search_products, get_product_specs
from app.tools.leads import create_inquiry, search_leads, update_lead_status, get_lead_stats
from app.tools.faq import get_faq, get_contact_info
from app.tools.invoices import create_invoice, get_invoice_stats
from app.tools.stock import get_stock_info, get_low_stock_products
from app.mcp.calendar_mcp import create_calendar_event, list_calendar_events, cancel_calendar_event, get_calendar_event

# Client tools - used by the client-facing agent
client_tools = [
    search_products,
    get_product_specs,
    create_inquiry,
    get_faq,
    get_contact_info,
]

# Admin tools - used by the admin multi-agent system
admin_tools = [
    search_products,
    get_product_specs,
    create_inquiry,
    search_leads,
    update_lead_status,
    get_lead_stats,
    get_faq,
    get_contact_info,
    create_invoice,
    get_invoice_stats,
    get_stock_info,
    get_low_stock_products,
    create_calendar_event,
    list_calendar_events,
    cancel_calendar_event,
    get_calendar_event,
]

# Calendar-only tools (for calendar-specific agent or API)
calendar_tools = [
    create_calendar_event,
    list_calendar_events,
    cancel_calendar_event,
    get_calendar_event,
]

__all__ = [
    "search_products", "get_product_specs", "create_inquiry",
    "search_leads", "update_lead_status", "get_lead_stats",
    "get_faq", "get_contact_info",
    "create_invoice", "get_invoice_stats",
    "get_stock_info", "get_low_stock_products",
    "create_calendar_event", "list_calendar_events", "cancel_calendar_event", "get_calendar_event",
    "client_tools", "admin_tools", "calendar_tools",
]
