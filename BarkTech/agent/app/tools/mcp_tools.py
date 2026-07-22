"""MCP tools wrapped as LangGraph @tools for the admin multi-agent system."""

from langchain_core.tools import tool
from app.mcp.whatsapp_mcp import send_notification as _send_notification, send_admin_alert as _send_admin_alert
from app.mcp.email_mcp import send_email as _send_email, send_template_email as _send_template_email
from app.mcp.media_mcp import presign_upload as _presign_upload, get_public_url as _get_public_url, list_objects as _list_objects
from app.mcp.web_research_mcp import fetch_url as _fetch_url, search_web as _search_web
from app.mcp.claude_ads_mcp import create_campaign as _create_campaign, publish_post as _publish_post, get_campaign_stats as _get_campaign_stats
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


@tool
async def create_ad_campaign(
    name: str,
    platform: str,
    budget: float,
    target_audience: str = "",
    content: str = "",
) -> dict:
    """Create a new ad campaign on social media.

    Args:
        name: Campaign name.
        platform: Target platform (facebook, instagram, linkedin, twitter, reddit).
        budget: Campaign budget in INR.
        target_audience: Target audience description.
        content: Ad content/copy.
    """
    return await _create_campaign(name, platform, budget, target_audience, content)


@tool
async def publish_social_post(
    platform: str,
    content: str,
    media_urls: list = None,
    scheduled_time: str = None,
) -> dict:
    """Publish a post to social media.

    Args:
        platform: Target platform (facebook, instagram, linkedin, twitter, reddit).
        content: Post text content.
        media_urls: Optional list of media URLs to include.
        scheduled_time: Optional ISO timestamp for scheduled publishing.
    """
    return await _publish_post(platform, content, media_urls, scheduled_time)


@tool
async def get_ad_campaign_stats(campaign_id: str = "") -> dict:
    """Get ad campaign performance statistics.

    Args:
        campaign_id: Optional specific campaign ID. If empty, returns all campaigns.
    """
    return await _get_campaign_stats(campaign_id or None)


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
web_research_tools = [research_url, research_web_search]
ads_tools = [create_ad_campaign, publish_social_post, get_ad_campaign_stats]
canvas_tools = [generate_creative_design, export_design_asset]
all_mcp_tools = whatsapp_tools + email_tools + media_tools + web_research_tools + ads_tools + canvas_tools
