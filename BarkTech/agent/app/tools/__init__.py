"""Native LangGraph tools + MCP tools for the multi-agent system.

Per architecture spec:
- Native LangGraph @tools for MongoDB core: products, leads, invoices, FAQ, contact, stock
- MCP tools for external services: WhatsApp, Email, Media, Calendar, Web Research
"""

from app.tools.products import search_products, get_product_specs
from app.tools.leads import create_inquiry, search_leads, update_lead_status, get_lead_stats
from app.tools.faq import get_faq, get_contact_info
from app.tools.invoices import create_invoice, get_invoice_stats
from app.tools.stock import get_stock_info, get_low_stock_products
from app.mcp.calendar_mcp import create_calendar_event, list_calendar_events, cancel_calendar_event, get_calendar_event
from app.tools.mcp_tools import (
    send_whatsapp_notification, send_admin_whatsapp_alert,
    send_email, send_template_email,
    presign_media_upload, get_media_public_url,
    research_url, research_web_search,
    whatsapp_tools, email_tools, media_tools, web_research_tools, all_mcp_tools,
)

# Client tools - used by the client-facing agent
client_tools = [
    search_products,
    get_product_specs,
    create_inquiry,
    get_faq,
    get_contact_info,
]

# Admin tools - used by the admin multi-agent system (native MongoDB tools)
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

# Calendar-only tools
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
    "send_whatsapp_notification", "send_admin_whatsapp_alert",
    "send_email", "send_template_email",
    "presign_media_upload", "get_media_public_url",
    "research_url", "research_web_search",
    "client_tools", "admin_tools", "calendar_tools",
    "whatsapp_tools", "email_tools", "media_tools", "web_research_tools", "all_mcp_tools",
]
