"""Email management tools for the EmailAgent.

Provides subscriber management, email sequence triggers, and email statistics
via the Node.js backend API and Email MCP (Resend).
"""

import json
import logging
import httpx
from langchain_core.tools import tool
from app.config import config
from app.services.observability import observability

logger = logging.getLogger(__name__)

BACKEND_URL = config.backend_url.rstrip("/")


async def _api_call(method: str, endpoint: str, data: dict = None, params: dict = None) -> dict:
    """Make an authenticated API call to the backend."""
    url = f"{BACKEND_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            if method == "GET":
                resp = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                resp = await client.post(url, headers=headers, json=data)
            elif method == "PUT":
                resp = await client.put(url, headers=headers, json=data)
            elif method == "DELETE":
                resp = await client.delete(url, headers=headers, json=data)
            else:
                return {"success": False, "error": f"Unsupported method: {method}"}

            if resp.status_code >= 400:
                error_msg = resp.text[:500]
                try:
                    error_data = resp.json()
                    error_msg = error_data.get("message", error_data.get("error", error_msg))
                except Exception:
                    pass
                return {"success": False, "error": f"API error {resp.status_code}: {error_msg}"}

            return resp.json()
    except httpx.TimeoutException:
        return {"success": False, "error": "Backend API timeout"}
    except httpx.ConnectError:
        return {"success": False, "error": "Cannot connect to backend API"}
    except Exception as e:
        logger.error(f"API call error: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════
# Subscriber Management Tools
# ═══════════════════════════════════════════════════════

@tool
async def manage_subscriber(
    action: str,
    email: str = "",
    name: str = "",
    source: str = "newsletter",
) -> dict:
    """Manage email subscribers. Supports add, remove, list, and status operations.

    Args:
        action: Operation to perform (add, remove, list, get_status).
        email: Subscriber email address (required for add/remove/get_status).
        name: Subscriber name (optional for add).
        source: Subscription source (default: newsletter).
    """
    if action == "add":
        if not email:
            return {"success": False, "error": "Email is required for add operation"}

        data = {"email": email, "source": source}
        if name:
            data["name"] = name

        result = await _api_call("POST", "/api/email/subscribe", data)
        return {
            "success": result.get("success", True),
            "message": f"Subscriber {email} added successfully" if result.get("success", True) else result.get("error", "Failed"),
            "subscriber": result.get("data", result),
        }

    elif action == "remove":
        if not email:
            return {"success": False, "error": "Email is required for remove operation"}

        result = await _api_call("DELETE", "/api/email/unsubscribe", {"email": email})
        return {
            "success": result.get("success", True),
            "message": f"Subscriber {email} removed" if result.get("success", True) else result.get("error", "Failed"),
        }

    elif action == "list":
        result = await _api_call("GET", "/api/email/subscribers")
        subscribers = result.get("data", result)
        return {
            "success": True,
            "subscribers": subscribers,
            "count": len(subscribers) if isinstance(subscribers, list) else 0,
            "message": f"Found {len(subscribers) if isinstance(subscribers, list) else 0} subscribers",
        }

    elif action == "get_status":
        if not email:
            return {"success": False, "error": "Email is required for get_status operation"}
        # Check if subscriber exists by trying to get list and filter
        result = await _api_call("GET", "/api/email/subscribers")
        subscribers = result.get("data", [])
        for sub in subscribers:
            if sub.get("email") == email:
                return {
                    "success": True,
                    "status": sub.get("status", "unknown"),
                    "subscriber": sub,
                }
        return {
            "success": True,
            "status": "not_found",
            "message": f"Subscriber {email} not found",
        }

    else:
        return {"success": False, "error": f"Unknown action: {action}. Use add, remove, list, or get_status"}


# ═══════════════════════════════════════════════════════
# Email Sequence Tools
# ═══════════════════════════════════════════════════════

@tool
async def trigger_sequence(
    sequence_name: str,
    subscriber_email: str,
    variables: dict = None,
) -> dict:
    """Trigger an email sequence for a subscriber.

    Args:
        sequence_name: Name of the sequence to trigger (e.g., 'rfq_submit', 'datasheet_download', 'newsletter_signup').
        subscriber_email: Email of the subscriber to send to.
        variables: Template variables to interpolate in the sequence emails.
    """
    data = {
        "sequenceName": sequence_name,
        "subscriberEmail": subscriber_email,
    }
    if variables:
        data["variables"] = variables

    result = await _api_call("POST", "/api/email/sequences/trigger", data)
    return {
        "success": result.get("success", True),
        "message": f"Sequence '{sequence_name}' triggered for {subscriber_email}" if result.get("success", True) else result.get("error", "Failed"),
        "result": result.get("data", result),
    }


@tool
async def list_email_sequences() -> dict:
    """List all available email sequences.

    Returns a list of sequences with their names, trigger types, and active status.
    """
    result = await _api_call("GET", "/api/email/sequences")
    sequences = result.get("data", result)
    return {
        "success": True,
        "sequences": sequences,
        "message": f"Found {len(sequences) if isinstance(sequences, list) else 0} sequences",
    }


# ═══════════════════════════════════════════════════════
# Email Stats Tools
# ═══════════════════════════════════════════════════════

@tool
async def get_email_stats(
    date_range: str = "30d",
) -> dict:
    """Get email sending statistics and performance metrics.

    Args:
        date_range: Time range for stats (7d, 30d, 90d, all).
    """
    # This would typically aggregate from Resend webhooks or email logs
    # For now, we'll query the backend for available stats
    result = await _api_call("GET", "/api/email/stats", params={"dateRange": date_range})

    if result.get("success") is False and "error" in result:
        # Fallback: provide basic subscriber count
        sub_result = await _api_call("GET", "/api/email/subscribers")
        subscribers = sub_result.get("data", [])
        active_count = len([s for s in subscribers if s.get("status") == "active"]) if isinstance(subscribers, list) else 0

        return {
            "success": True,
            "stats": {
                "total_subscribers": len(subscribers) if isinstance(subscribers, list) else 0,
                "active_subscribers": active_count,
                "date_range": date_range,
                "note": "Detailed send stats not yet available from backend",
            },
            "message": f"Basic stats: {active_count} active subscribers",
        }

    return {
        "success": True,
        "stats": result.get("data", result),
        "message": "Email stats retrieved",
    }


# ═══════════════════════════════════════════════════════
# Subscriber Stats Tools
# ═══════════════════════════════════════════════════════

@tool
async def get_subscriber_stats(
    days: int = 30,
) -> dict:
    """Get subscriber growth and engagement statistics.

    Args:
        days: Number of days to look back.
    """
    result = await _api_call("GET", "/api/email/subscribers/stats", params={
        "days": days,
    })
    if result.get("success") is False and "error" in result:
        return {
            "success": True,
            "stats": {"date_range": f"{days}d", "note": "Detailed stats not available"},
            "message": "Subscriber stats endpoint not available",
        }

    return {
        "success": True,
        "stats": result.get("data", result),
    }


@tool
async def preview_adhoc_recipients(
    segment_filter: str = "",
) -> dict:
    """Preview how many recipients an ad-hoc email would reach, excluding unsubscribed and bounced.

    Args:
        segment_filter: JSON string for segment filter. Empty sends to all active subscribers.
    """
    params = {}
    if segment_filter:
        params["segmentFilter"] = segment_filter

    result = await _api_call("GET", "/api/email/adhoc/preview", params=params)
    if result.get("success") is False and "error" in result:
        return {
            "success": True,
            "recipients": {"count": 0, "note": "Preview not available from backend"},
            "message": "Ad-hoc preview endpoint not available",
        }

    return {
        "success": True,
        "recipients": result.get("data", result),
    }


@tool
async def send_adhoc_email(
    subject: str,
    html_content: str,
    segment_filter: str = "",
    preview_text: str = "",
    dry_run: str = "false",
) -> dict:
    """Send an ad-hoc email to a segment of subscribers. Always requires confirmation.

    Unsubscribed and bounced subscribers are automatically excluded.
    Use preview_adhoc_recipients first to see recipient count.

    Args:
        subject: Email subject line.
        html_content: Full HTML email body.
        segment_filter: JSON string for segment filter. Empty sends to all active subscribers.
        preview_text: Preview text for email clients.
        dry_run: If "true", validates and returns without sending.
    """
    data = {
        "subject": subject,
        "htmlContent": html_content,
        "previewText": preview_text,
        "dryRun": dry_run.lower() == "true",
    }
    if segment_filter:
        try:
            data["segmentFilter"] = json.loads(segment_filter)
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid segment filter JSON"}

    result = await _api_call("POST", "/api/email/adhoc/send", data)
    if result.get("success") is False and "error" in result:
        return {"success": False, "error": result.get("error", "Failed to send")}

    return {
        "success": True,
        "message": f"Ad-hoc email '{subject}' {'validated' if dry_run.lower() == 'true' else 'sent'}",
        "result": result.get("data", result),
    }


# Tool list for EmailAgent
email_management_tools = [
    manage_subscriber,
    trigger_sequence,
    list_email_sequences,
    get_email_stats,
    get_subscriber_stats,
    preview_adhoc_recipients,
    send_adhoc_email,
]
