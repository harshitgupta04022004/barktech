"""Email MCP integration via Resend API.

Sends transactional and templated emails using Resend.
Requires RESEND_API_KEY env var.
"""

import httpx
import os
import logging

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com"
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@barktechnologies.in")

# Email templates (HTML snippets)
TEMPLATES = {
    "inquiry_acknowledgement": """
    <h2>Thank you for your inquiry!</h2>
    <p>Dear {customer_name},</p>
    <p>We have received your inquiry about <strong>{product_name}</strong>.</p>
    <p>Our team will get back to you within 24 hours with a detailed quotation.</p>
    <p>Reference: <strong>{inquiry_id}</strong></p>
    <br>
    <p>Best regards,<br>Bark Technologies Team</p>
    """,
    "invoice": """
    <h2>Invoice #{invoice_id}</h2>
    <p>Dear {customer_name},</p>
    <p>Please find the details of your invoice below:</p>
    <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">{amount}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">{due_date}</td></tr>
    </table>
    <p>You can pay via bank transfer or UPI. Please reply to this email for payment details.</p>
    <br>
    <p>Best regards,<br>Bark Technologies Team</p>
    """,
    "quote": """
    <h2>Quotation for {product_name}</h2>
    <p>Dear {customer_name},</p>
    <p>Thank you for your interest in our products. Please find below our quotation:</p>
    <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Product:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">{product_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Price:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">{price}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Delivery:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">{delivery_time}</td></tr>
    </table>
    <p>This quotation is valid for 30 days.</p>
    <br>
    <p>Best regards,<br>Bark Technologies Team</p>
    """,
}


async def send_email(to: str, subject: str, html: str) -> dict:
    """Send a raw HTML email via Resend.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.

    Returns:
        dict with keys: success (bool), email_id (str), error (str).
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured")
        return {"success": False, "error": "RESEND_API_KEY not configured"}

    url = f"{RESEND_API_URL}/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "from": EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "html": html,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()
            if resp.status_code == 200:
                email_id = data.get("id", "")
                logger.info(f"Email sent to {to}, id={email_id}")
                return {"success": True, "email_id": email_id}
            else:
                logger.error(f"Resend API error: {data}")
                return {"success": False, "error": data.get("message", "Unknown error")}
    except httpx.HTTPError as e:
        logger.error(f"Email HTTP error: {e}")
        return {"success": False, "error": str(e)}


async def send_template_email(to: str, template: str, variables: dict) -> dict:
    """Send a templated email using a predefined template.

    Args:
        to: Recipient email address.
        template: Template name (inquiry_acknowledgement, invoice, quote).
        variables: Dict of variables to interpolate into the template.

    Returns:
        dict with keys: success (bool), email_id (str), error (str).
    """
    template_html = TEMPLATES.get(template)
    if not template_html:
        return {"success": False, "error": f"Unknown template: {template}"}

    try:
        html = template_html.format(**variables)
    except KeyError as e:
        return {"success": False, "error": f"Missing template variable: {e}"}

    subject = variables.get("subject", f"Bark Technologies — {template.replace('_', ' ').title()}")

    return await send_email(to, subject, html)
