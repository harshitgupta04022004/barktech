"""Native LangGraph tools + MCP tools for the multi-agent system.

Per architecture spec:
- Native LangGraph @tools for MongoDB core: products, leads, invoices, FAQ, contact, stock, content
- MCP tools for external services: WhatsApp, Email, Media, Calendar, DuckDuckGo, Claude Ads, Canvas
"""

from app.tools.products import search_products, get_product_specs
from app.tools.product_enhance import enhance_product_details, create_category, list_categories
from app.tools.product_admin import (
    create_product, get_product, update_product, delete_product,
    list_products, upload_product_media, extract_product_info,
)
from app.tools.leads import create_inquiry, search_leads, update_lead_status, get_lead_stats
from app.tools.faq import get_faq, get_contact_info
from app.tools.invoices import (
    create_invoice, get_invoice, update_invoice, delete_invoice,
    get_invoice_stats, generate_invoice_pdf, list_invoices, mark_invoice_status,
)
from app.tools.stock import get_stock_info, get_low_stock_products
from app.tools.content import (
    create_content, list_content, get_content, update_content, delete_content,
    check_content_duplicates, submit_for_review, schedule_content,
    all_content_tools,
)
from app.tools.social_media import (
    publish_facebook_post, publish_instagram_post,
    publish_linkedin_post, publish_twitter_post,
    validate_platform_credentials, validate_content_for_publish,
    get_publish_status, schedule_publish,
    social_publish_tools, all_social_tools,
)
from app.tools.email_management import (
    manage_subscriber, trigger_sequence, list_email_sequences, get_email_stats,
    get_subscriber_stats, preview_adhoc_recipients, send_adhoc_email,
    email_management_tools,
)
from app.mcp.calendar_mcp import create_calendar_event, list_calendar_events, cancel_calendar_event, get_calendar_event
from app.tools.mcp_tools import (
    send_whatsapp_notification, send_admin_whatsapp_alert,
    send_email, send_template_email,
    presign_media_upload, get_media_public_url,
    research_url, research_web_search,
    generate_creative_design, export_design_asset,
    whatsapp_tools, email_tools, media_tools, web_research_tools,
    canvas_tools, all_mcp_tools,
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
    create_product,
    get_product,
    update_product,
    delete_product,
    list_products,
    upload_product_media,
    extract_product_info,
    enhance_product_details,
    create_category,
    list_categories,
    create_inquiry,
    search_leads,
    update_lead_status,
    get_lead_stats,
    get_faq,
    get_contact_info,
    create_invoice,
    get_invoice,
    update_invoice,
    delete_invoice,
    list_invoices,
    mark_invoice_status,
    get_invoice_stats,
    generate_invoice_pdf,
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

# Product enhancement tools
product_enhance_tools = [
    enhance_product_details,
    create_category,
    list_categories,
]

__all__ = [
    "search_products", "get_product_specs", "create_inquiry",
    "create_product", "get_product", "update_product", "delete_product",
    "list_products", "upload_product_media", "extract_product_info",
    "enhance_product_details", "create_category", "list_categories",
    "search_leads", "update_lead_status", "get_lead_stats",
    "get_faq", "get_contact_info",
    "create_invoice", "get_invoice", "update_invoice", "delete_invoice",
    "list_invoices", "mark_invoice_status",
    "get_invoice_stats", "generate_invoice_pdf",
    "get_stock_info", "get_low_stock_products",
    "create_calendar_event", "list_calendar_events", "cancel_calendar_event", "get_calendar_event",
    "send_whatsapp_notification", "send_admin_whatsapp_alert",
    "send_email", "send_template_email",
    "presign_media_upload", "get_media_public_url",
    "research_url", "research_web_search",
    "generate_creative_design", "export_design_asset",
    "publish_facebook_post", "publish_instagram_post",
    "publish_linkedin_post", "publish_twitter_post",
    "validate_platform_credentials", "validate_content_for_publish",
    "get_publish_status", "schedule_publish",
    "manage_subscriber", "trigger_sequence", "list_email_sequences", "get_email_stats",
    "get_subscriber_stats", "preview_adhoc_recipients", "send_adhoc_email",
    "create_content", "list_content", "get_content", "update_content", "delete_content",
    "check_content_duplicates", "submit_for_review", "schedule_content",
    "client_tools", "admin_tools", "calendar_tools", "product_enhance_tools",
    "whatsapp_tools", "email_tools", "media_tools", "web_research_tools",
    "canvas_tools", "social_publish_tools", "email_management_tools",
    "all_content_tools", "all_social_tools", "all_mcp_tools",
]
