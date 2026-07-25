"""Email MCP integration via Brevo (Sendinblue) API v3.

Sends transactional and templated emails using Brevo's email API.
Falls back to SMTP if Brevo is not configured.
"""

import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Ensure .env is loaded before reading env vars
# Use absolute path to be safe
_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(_env_path, override=True)

logger = logging.getLogger(__name__)

# Brevo API v3 Configuration
# BREVO_MCP_TOKEN is a base64-encoded JSON: {"api_key":"xkeysib-..."}
# We decode it to get the raw API key for direct API calls.
def _decode_brevo_key() -> str:
    """Decode the base64-encoded Brevo MCP token to get the raw API key."""
    import base64, json
    token = os.getenv("BREVO_MCP_TOKEN", "")
    if not token:
        token = os.getenv("BREVO_API_KEY", "")
        if token:
            return token
        return ""
    # Strip surrounding quotes that .env may have added
    token = token.strip().strip('"').strip("'")
    try:
        decoded = base64.b64decode(token).decode("utf-8")
        data = json.loads(decoded)
        return data.get("api_key", data.get("apikey", ""))
    except Exception as e:
        logger.warning(f"Failed to decode Brevo token: {e}")
        return ""

BREVO_API_KEY = _decode_brevo_key()
BREVO_API_URL = "https://api.brevo.com/v3"

if BREVO_API_KEY:
    logger.info(f"Brevo API key loaded ({len(BREVO_API_KEY)} chars)")
else:
    logger.warning("No Brevo API key configured")

# SMTP Fallback
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@barktechnologies.in")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Bark Technologies")


# ── Professional Email Wrapper ─────────────────────────────
def _wrap_email(body_html: str) -> str:
    """Wrap email body in a professional HTML document with Bark Technologies branding."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bark Technologies</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr>
    <td style="background:linear-gradient(135deg,#e65100,#ff8f00);padding:28px 36px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Bark Technologies</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:1px;text-transform:uppercase;">Machinery &amp; Packaging Solutions</p>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 36px 24px;color:#333333;font-size:14px;line-height:1.7;">
      {body_html}
    </td>
  </tr>
  <tr>
    <td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td>
  </tr>
  <tr>
    <td style="padding:24px 36px 28px;text-align:center;">
      <p style="margin:0 0 6px;color:#888;font-size:12px;">Bark Technologies &mdash; UDYAM-UP-28-0004163</p>
      <p style="margin:0 0 6px;color:#888;font-size:12px;">
        <a href="https://barktechnologies.in" style="color:#e65100;text-decoration:none;">barktechnologies.in</a>
        &nbsp;|&nbsp;
        <a href="mailto:info@barktechnologies.in" style="color:#e65100;text-decoration:none;">info@barktechnologies.in</a>
      </p>
      <p style="margin:8px 0 0;color:#aaa;font-size:11px;">This email was sent by Bark Technologies. If you did not expect this, please ignore it.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>"""


# ── Email Templates ─────────────────────────────────────────
TEMPLATES = {}


def _product_detail_rows(specs: list, description: str = "") -> str:
    rows = ""
    if specs:
        for spec in specs:
            key = spec.get("key", "") if isinstance(spec, dict) else str(spec)
            val = spec.get("value", "") if isinstance(spec, dict) else ""
            rows += f'<tr><td style="padding:10px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">{key}</td><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:500;">{val}</td></tr>'
    return rows


def _inquiry_ack(cvars: dict) -> str:
    body = f"""
      <p style="margin:0 0 16px;color:#555;">Dear <strong>{cvars.get('customer_name', 'Customer')}</strong>,</p>
      <p style="margin:0 0 16px;color:#555;">Thank you for reaching out to <strong>Bark Technologies</strong>. We have received your inquiry about <strong style="color:#e65100;">{cvars.get('product_name', 'our product')}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:8px;border:1px solid #fde0c8;margin:20px 0;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Reference ID</p>
          <p style="margin:0;color:#e65100;font-size:15px;font-weight:700;">{cvars.get('inquiry_id', 'N/A')}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;color:#555;">Our team will review your requirements and get back to you within <strong>24 hours</strong>.</p>
      <p style="margin:16px 0 0;color:#555;">Warm regards,<br><strong style="color:#e65100;">Bark Technologies</strong> Team</p>
    """
    return _wrap_email(body)

TEMPLATES["inquiry_acknowledgement"] = _inquiry_ack


def _product_inquiry(cvars: dict) -> str:
    product_name = cvars.get("product_name", "Product")
    company = cvars.get("company_name", "Bark Technologies")
    description = cvars.get("description", "")
    specs_raw = cvars.get("specs", "")
    image_url = cvars.get("image_url", "")
    cta_url = cvars.get("cta_url", "https://barktechnologies.in/products")
    customer_name = cvars.get("customer_name", "Customer")

    import json as _json
    specs = []
    if isinstance(specs_raw, str) and specs_raw.startswith("["):
        try:
            specs = _json.loads(specs_raw)
        except Exception:
            specs = []
    elif isinstance(specs_raw, list):
        specs = specs_raw

    image_html = ""
    if image_url:
        image_html = f'<img src="{image_url}" alt="{product_name}" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:24px;">'

    specs_table = ""
    if specs:
        rows = _product_detail_rows(specs, description)
        specs_table = f"""
        <p style="margin:20px 0 8px;color:#333;font-size:14px;font-weight:700;">Specifications</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
          {rows}
        </table>"""

    desc_html = ""
    if description:
        desc_html = f'<p style="margin:0 0 16px;color:#555;line-height:1.7;">{description}</p>'

    body = f"""
      <p style="margin:0 0 16px;color:#555;">Dear <strong>{customer_name}</strong>,</p>
      <p style="margin:0 0 16px;color:#555;">Thank you for your interest in our <strong style="color:#e65100;">{product_name}</strong>.</p>
      {image_html}
      <h2 style="margin:0 0 6px;color:#222;font-size:18px;">{product_name}</h2>
      <p style="margin:0 0 12px;color:#888;font-size:12px;">by <strong>{company}</strong></p>
      {desc_html}
      {specs_table}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr><td align="center">
          <a href="{cta_url}" style="display:inline-block;background:linear-gradient(135deg,#e65100,#ff8f00);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:600;">View Full Catalogue</a>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#555;">Best regards,<br><strong style="color:#e65100;">Bark Technologies</strong> Team</p>
    """
    return _wrap_email(body)

TEMPLATES["product_inquiry"] = _product_inquiry


def _invoice(cvars: dict) -> str:
    body = f"""
      <p style="margin:0 0 16px;color:#555;">Dear <strong>{cvars.get('customer_name', 'Customer')}</strong>,</p>
      <p style="margin:0 0 16px;color:#555;">Please find the details of your invoice below:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
        <tr><td style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">Invoice Number</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">#{cvars.get('invoice_id', 'N/A')}</td></tr>
        <tr><td style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">Amount</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#e65100;font-size:15px;font-weight:700;">{cvars.get('amount', 'N/A')}</td></tr>
        <tr><td style="padding:12px 16px;background:#fafafa;color:#555;font-size:13px;">Due Date</td><td style="padding:12px 16px;color:#222;font-size:13px;font-weight:500;">{cvars.get('due_date', 'N/A')}</td></tr>
      </table>
      <p style="margin:20px 0 12px;color:#555;">You can pay via bank transfer or UPI.</p>
      <p style="margin:16px 0 0;color:#555;">Best regards,<br><strong style="color:#e65100;">Bark Technologies</strong> Team</p>
    """
    return _wrap_email(body)

TEMPLATES["invoice"] = _invoice


def _quote(cvars: dict) -> str:
    body = f"""
      <p style="margin:0 0 16px;color:#555;">Dear <strong>{cvars.get('customer_name', 'Customer')}</strong>,</p>
      <p style="margin:0 0 16px;color:#555;">Please find below our quotation:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
        <tr><td style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">Product</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">{cvars.get('product_name', 'N/A')}</td></tr>
        <tr><td style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">Price</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#e65100;font-size:15px;font-weight:700;">{cvars.get('price', 'N/A')}</td></tr>
        <tr><td style="padding:12px 16px;background:#fafafa;color:#555;font-size:13px;">Delivery</td><td style="padding:12px 16px;color:#222;font-size:13px;font-weight:500;">{cvars.get('delivery_time', 'N/A')}</td></tr>
      </table>
      <p style="margin:20px 0 12px;color:#555;">This quotation is valid for <strong>30 days</strong>.</p>
      <p style="margin:16px 0 0;color:#555;">Best regards,<br><strong style="color:#e65100;">Bark Technologies</strong> Team</p>
    """
    return _wrap_email(body)

TEMPLATES["quote"] = _quote


def _payment_reminder(cvars: dict) -> str:
    body = f"""
      <p style="margin:0 0 16px;color:#555;">Dear <strong>{cvars.get('customer_name', 'Customer')}</strong>,</p>
      <p style="margin:0 0 16px;color:#555;">This is a friendly reminder that Invoice <strong>#{cvars.get('invoice_id', 'N/A')}</strong> for <strong style="color:#e65100;">{cvars.get('amount', 'N/A')}</strong> is still outstanding.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:8px;border:1px solid #fde0c8;margin:20px 0;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
          <p style="margin:0;color:#e65100;font-size:15px;font-weight:700;">{cvars.get('due_date', 'N/A')}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;color:#555;">Please make the payment at your earliest convenience.</p>
      <p style="margin:16px 0 0;color:#555;">Best regards,<br><strong style="color:#e65100;">Bark Technologies</strong> Team</p>
    """
    return _wrap_email(body)

TEMPLATES["payment_reminder"] = _payment_reminder


# ── Brevo API v3 Send Email ──────────────────────────────────

async def _send_via_brevo(to: str, subject: str, html: str, attachments: list = None) -> dict:
    """Send email using Brevo Transactional Email API v3 with optional attachments.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.
        attachments: Optional list of dicts: {"filename": str, "content": str (base64), "contentType": str}
    """
    import httpx

    url = f"{BREVO_API_URL}/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }
    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": html,
    }
    if attachments:
        # Brevo API requires "name" not "filename" for attachments
        brevo_attachments = []
        for att in attachments:
            brevo_att = {
                "name": att.get("filename", att.get("name", "file")),
                "content": att.get("content", ""),
            }
            if "contentType" in att:
                brevo_att["contentType"] = att["contentType"]
            brevo_attachments.append(brevo_att)
        payload["attachment"] = brevo_attachments

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            logger.info(f"Brevo sending email to={to}, from={EMAIL_FROM}, subject={subject[:50]}")
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()
            logger.info(f"Brevo response: status={resp.status_code}, data={data}")
            if resp.status_code in (200, 201):
                email_id = data.get("messageId", "")
                logger.info(f"Email sent via Brevo to {to}, messageId={email_id}")
                return {"success": True, "email_id": email_id, "message": f"Email queued for delivery. Brevo messageId: {email_id}"}
            else:
                error_msg = data.get("message", str(data))
                logger.error(f"Brevo API error: {resp.status_code} - {error_msg}")
                return {"success": False, "error": f"Brevo error {resp.status_code}: {error_msg}"}
    except httpx.HTTPError as e:
        logger.error(f"Brevo HTTP error: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Brevo unexpected error: {e}")
        return {"success": False, "error": str(e)}


# ── SMTP Fallback ──────────────────────────────────────────

async def _send_via_smtp(to: str, subject: str, html: str, attachments: list = None) -> dict:
    """Send email using Python smtplib with MIME attachment support.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.
        attachments: Optional list of dicts: {"filename": str, "content": bytes|str, "contentType": str}
    """
    import asyncio
    import smtplib
    from email.mime.base import MIMEBase

    def _smtp_send():
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM or SMTP_USER}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html", "utf-8"))

        if attachments:
            for att in attachments:
                import base64
                from email import encoders
                part = MIMEBase("application", "octet-stream")
                content = att.get("content")
                if isinstance(content, str):
                    content = base64.b64decode(content)
                part.set_payload(content)
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{att.get("filename", "file")}"',
                )
                msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            if SMTP_PORT != 465:
                server.starttls()
                server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM or SMTP_USER, [to], msg.as_string())

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _smtp_send)
        logger.info(f"Email sent via SMTP to {to}, subject='{subject}'")
        return {"success": True, "email_id": f"smtp-{to}"}
    except Exception as e:
        logger.error(f"SMTP error sending to {to}: {e}")
        return {"success": False, "error": str(e)}


# ── Public API ──────────────────────────────────────────────

async def send_email(to: str, subject: str, html: str, attachments: list = None) -> dict:
    """Send a raw HTML email via Brevo API (primary) or SMTP (fallback).

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML body content.
        attachments: Optional list of file attachments. Each dict:
            - filename (str): e.g. "Invoice_BARK-INV-2026-0042.pdf"
            - content (str|bytes): Base64 string (Brevo) or raw bytes (SMTP)
            - contentType (str): e.g. "application/pdf"

    Priority: Brevo API > SMTP.
    """
    # ── Primary: Brevo API v3 ──────────────────────────────
    if BREVO_API_KEY:
        logger.info(f"Attempting Brevo API send to={to}")
        result = await _send_via_brevo(to, subject, html, attachments=attachments)
        if result["success"]:
            return result
        logger.warning(f"Brevo API failed: {result.get('error')}, trying SMTP fallback")

    # ── Fallback: SMTP ─────────────────────────────────────
    if SMTP_USER and SMTP_PASS:
        # Warn if sending from a free email provider via SMTP (DMARC risk)
        free_domains = ("@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@aol.com")
        if any(EMAIL_FROM.lower().endswith(d) for d in free_domains):
            logger.warning(
                f"SMTP sender '{EMAIL_FROM}' is a free email provider. "
                "Gmail/Yahoo DMARC policy may reject delivery. Use Brevo API or a custom domain."
            )
        logger.info(f"Attempting SMTP send to={to} via {SMTP_HOST}:{SMTP_PORT}")
        result = await _send_via_smtp(to, subject, html, attachments=attachments)
        if result["success"]:
            return result
        logger.error(f"SMTP also failed: {result.get('error')}")

    logger.error("No email transport configured (no Brevo API key or SMTP credentials)")
    return {"success": False, "error": "No email transport configured"}


async def send_template_email(to: str, template: str, variables: dict) -> dict:
    """Send a templated email using a predefined template."""
    template_fn = TEMPLATES.get(template)
    if not template_fn:
        return {"success": False, "error": f"Unknown template: {template}. Available: {list(TEMPLATES.keys())}"}

    try:
        html = template_fn(variables) if callable(template_fn) else template_fn.format(**variables)
    except (KeyError, TypeError) as e:
        return {"success": False, "error": f"Template error: {e}"}

    subject = variables.get("subject", f"Bark Technologies — {template.replace('_', ' ').title()}")
    return await send_email(to, subject, html)


async def send_campaign(
    subject: str,
    html_content: str,
    list_ids: list[int],
    sender_name: str = "",
    sender_email: str = "",
    scheduled_at: str = "",
) -> dict:
    """Send a Brevo email campaign to a list of contacts."""
    import httpx

    url = f"{BREVO_API_URL}/emailCampaigns"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }
    payload = {
        "name": f"Campaign: {subject[:50]}",
        "subject": subject,
        "sender": {"name": sender_name or EMAIL_FROM_NAME, "email": sender_email or EMAIL_FROM},
        "type": "classic",
        "htmlContent": html_content,
        "recipients": {"listIds": list_ids},
    }
    if scheduled_at:
        payload["scheduledAt"] = scheduled_at

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()
            if resp.status_code in (200, 201):
                campaign_id = data.get("id")
                logger.info(f"Brevo campaign created: id={campaign_id}")
                return {"success": True, "campaign_id": campaign_id}
            else:
                error_msg = data.get("message", str(data))
                logger.error(f"Brevo campaign error: {resp.status_code} - {error_msg}")
                return {"success": False, "error": error_msg}
    except httpx.HTTPError as e:
        logger.error(f"Brevo campaign HTTP error: {e}")
        return {"success": False, "error": str(e)}
