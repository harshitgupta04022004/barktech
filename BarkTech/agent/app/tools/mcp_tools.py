"""MCP tools wrapped as LangGraph @tools for the admin multi-agent system."""

from langchain_core.tools import tool
from app.mcp.whatsapp_mcp import send_notification as _send_notification, send_admin_alert as _send_admin_alert
from app.mcp.email_mcp import send_email as _send_email, send_template_email as _send_template_email
from app.mcp.media_mcp import presign_upload as _presign_upload, get_public_url as _get_public_url
from app.mcp.web_research_mcp import fetch_url as _fetch_url, search_web as _search_web


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
    """Send a transactional email via Resend.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.
    """
    return await _send_email(to, subject, html)


@tool
async def send_template_email(to: str, template: str, variables: dict) -> dict:
    """Send a templated email using a predefined Bark template.

    Available templates: inquiry_acknowledgement, invoice, quote.

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


whatsapp_tools = [send_whatsapp_notification, send_admin_whatsapp_alert]
email_tools = [send_email, send_template_email]
media_tools = [presign_media_upload, get_media_public_url]
web_research_tools = [research_url, research_web_search]
all_mcp_tools = whatsapp_tools + email_tools + media_tools + web_research_tools
