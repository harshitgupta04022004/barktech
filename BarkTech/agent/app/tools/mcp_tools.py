"""MCP tools wrapped as LangGraph @tools for the admin multi-agent system.

Tool categories (per v2 architecture):
- whatsapp_tools: WhatsApp notifications via WhatsApp MCP
- email_tools: Email sending via Email MCP (Resend)
- media_tools: S3/R2 media management via Media MCP
- web_research_tools: DuckDuckGo web research
- canvas_tools: Creative design generation via Canvas MCP
"""

from langchain_core.tools import tool
from app.mcp.whatsapp_mcp import send_notification as _send_notification, send_admin_alert as _send_admin_alert
from app.mcp.email_mcp import send_email as _send_email, send_template_email as _send_template_email
from app.mcp.media_mcp import presign_upload as _presign_upload, get_public_url as _get_public_url, list_objects as _list_objects
from app.mcp.web_research_mcp import fetch_url as _fetch_url, search_web as _search_web
from app.mcp.canvas_mcp import generate_design as _generate_design, export_asset as _export_asset


@tool
async def send_whatsapp_notification(phone: str, message: str) -> dict:
    """Send a WhatsApp notification to a phone number.

    Args:
        phone: Recipient phone number with country code.
        message: Text message to send.
    """
    return await _send_notification(phone, message)


@tool
async def send_admin_whatsapp_alert(message_type: str, details: dict) -> dict:
    """Send an alert to the admin phone via WhatsApp.

    Args:
        message_type: Type of alert (new_inquiry, invoice_paid, low_stock, new_lead, rfq_received).
        details: Dict of details to include.
    """
    return await _send_admin_alert(message_type, details)


@tool
async def send_email(to: str, subject: str, html: str) -> dict:
    """Send a transactional email via Brevo API v3 (with SMTP fallback).

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.
    """
    return await _send_email(to, subject, html)


@tool
async def send_template_email(to: str, template: str, variables: dict) -> dict:
    """Send a templated email using a predefined Bark template (via Brevo API v3).

    Available templates: inquiry_acknowledgement, invoice, quote, payment_reminder, product_inquiry.

    Args:
        to: Recipient email address.
        template: Template name.
        variables: Dict of variables to interpolate.
    """
    return await _send_template_email(to, template, variables)


@tool
async def presign_media_upload(key: str, content_type: str) -> dict:
    """Generate a presigned upload URL for direct browser uploads to S3/R2.

    Args:
        key: S3 object key (e.g. "products/my-image.png").
        content_type: MIME type (e.g. "image/png").
    """
    return await _presign_upload(key, content_type)


@tool
async def get_media_public_url(key: str) -> dict:
    """Get the public URL for a media file in S3/R2.

    Args:
        key: S3 object key.
    """
    return await _get_public_url(key)


@tool
async def research_url(url: str, max_chars: int = 8000) -> dict:
    """Fetch text content from a public URL for RFQ research. Read-only.

    Args:
        url: The URL to fetch.
        max_chars: Maximum characters to return.
    """
    return await _fetch_url(url, max_chars)


@tool
async def research_web_search(query: str, limit: int = 5) -> list:
    """Search the web for public information about industry standards.

    Args:
        query: Search query string.
        limit: Maximum number of results.
    """
    return await _search_web(query, limit)


@tool
async def generate_creative_design(
    prompt: str,
    design_type: str = "product_creative",
    dimensions: str = "1080x1080",
    style: str = "professional",
) -> dict:
    """Generate a creative design asset for products or marketing.

    Args:
        prompt: Description of the design to generate.
        design_type: Type of design (product_creative, brochure, social_post, banner).
        dimensions: Output dimensions (e.g., "1080x1080", "1920x1080").
        style: Design style (professional, modern, minimal, bold).
    """
    return await _generate_design(prompt, design_type, dimensions, style)


@tool
async def export_design_asset(
    design_id: str,
    format: str = "png",
    quality: int = 95,
) -> dict:
    """Export a generated design to a specific format.

    Args:
        design_id: The ID of the design to export.
        format: Output format (png, jpg, pdf, svg).
        quality: Output quality (1-100, for lossy formats).
    """
    return await _export_asset(design_id, format, quality)


whatsapp_tools = [send_whatsapp_notification, send_admin_whatsapp_alert]
email_tools = [send_email, send_template_email]
media_tools = [presign_media_upload, get_media_public_url]
web_research_tools = [research_url, research_web_search]  # DuckDuckGo MCP
canvas_tools = [generate_creative_design, export_design_asset]  # Canvas MCP
all_mcp_tools = whatsapp_tools + email_tools + media_tools + web_research_tools + canvas_tools
