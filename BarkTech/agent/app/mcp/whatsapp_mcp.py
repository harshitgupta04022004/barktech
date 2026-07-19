"""WhatsApp Business API MCP integration for notifications.

Uses the WhatsApp Cloud API (v18.0) to send messages and alerts.
Requires WHATSAPP_BUSINESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars.
"""

import httpx
import os
import logging

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
WHATSAPP_TOKEN = os.getenv("WHATSAPP_BUSINESS_TOKEN", "")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
ADMIN_PHONE = os.getenv("ADMIN_PHONE_NUMBER", "")


async def _send_message(phone: str, message: str) -> dict:
    """Internal helper to send a text message via WhatsApp Cloud API."""
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID:
        logger.warning("WhatsApp credentials not configured")
        return {"success": False, "error": "WhatsApp credentials not configured"}

    url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()
            if resp.status_code == 200:
                msg_id = data.get("messages", [{}])[0].get("id", "")
                logger.info(f"WhatsApp message sent to {phone}, id={msg_id}")
                return {"success": True, "message_id": msg_id}
            else:
                logger.error(f"WhatsApp API error: {data}")
                return {"success": False, "error": data.get("error", {}).get("message", "Unknown error")}
    except httpx.HTTPError as e:
        logger.error(f"WhatsApp HTTP error: {e}")
        return {"success": False, "error": str(e)}


async def send_notification(phone: str, message: str) -> dict:
    """Send a WhatsApp notification to a phone number.

    Args:
        phone: Recipient phone number with country code (e.g. "919876543210").
        message: Text message to send.

    Returns:
        dict with keys: success (bool), message_id (str), error (str).
    """
    return await _send_message(phone, message)


async def send_admin_alert(message_type: str, details: dict) -> dict:
    """Send an alert to the admin phone via WhatsApp.

    Formats the message based on the type and details dict.

    Args:
        message_type: Type of alert (e.g. "new_inquiry", "invoice_paid", "low_stock").
        details: Dictionary of details to include in the message.

    Returns:
        dict with keys: success (bool), message_id (str), error (str).
    """
    if not ADMIN_PHONE:
        return {"success": False, "error": "ADMIN_PHONE_NUMBER not configured"}

    templates = {
        "new_inquiry": "🔔 New Inquiry\nFrom: {contact_name}\nProduct: {product}\nMessage: {message}",
        "invoice_paid": "💰 Invoice Paid\nInvoice: {invoice_id}\nAmount: {amount}\nCustomer: {customer}",
        "low_stock": "⚠️ Low Stock Alert\nProduct: {product}\nCurrent Stock: {stock}\nMinimum: {minimum}",
        "new_lead": "📋 New Lead\nName: {name}\nEmail: {email}\nSource: {source}",
        "rfq_received": "📝 RFQ Received\nCustomer: {customer}\nProduct: {product}\nQuantity: {quantity}",
    }

    template = templates.get(message_type)
    if not template:
        return {"success": False, "error": f"Unknown message_type: {message_type}"}

    try:
        formatted = template.format(**details)
    except KeyError as e:
        return {"success": False, "error": f"Missing detail field: {e}"}

    return await _send_message(ADMIN_PHONE, formatted)
