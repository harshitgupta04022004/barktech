"""Calendar MCP - Google Calendar integration for scheduling.

Provides calendar event management using Google Calendar API.
Supports create, list, cancel, and get events.

Requires:
- GOOGLE_CALENDAR_API_KEY for API access
- A Google Calendar ID (defaults to "primary")
"""

import os
import logging
from datetime import datetime
from typing import Any

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# Configuration
GOOGLE_CALENDAR_API_KEY = os.getenv("GOOGLE_CALENDAR_API_KEY", "")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")
GOOGLE_OAUTH_ACCESS_TOKEN = os.getenv("GOOGLE_OAUTH_ACCESS_TOKEN", "")

CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"


def _get_headers() -> dict[str, str]:
    if GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"Authorization": f"Bearer {GOOGLE_OAUTH_ACCESS_TOKEN}"}
    return {}


def _get_params() -> dict[str, str]:
    params: dict[str, str] = {}
    if GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        params["key"] = GOOGLE_CALENDAR_API_KEY
    return params


def _parse_iso(dt_str: str) -> dict[str, str]:
    try:
        dt = datetime.fromisoformat(dt_str)
        return {"dateTime": dt.isoformat(), "timeZone": "Asia/Kolkata"}
    except ValueError:
        return {"date": dt_str}


@tool
async def create_calendar_event(
    title: str,
    start: str,
    end: str,
    description: str = "",
    attendees: list[str] | None = None,
) -> dict[str, Any]:
    """Create a Google Calendar event for scheduling installations, demos, or site visits.

    Args:
        title: Event title (e.g. "Machine Installation at XYZ Factory").
        start: ISO 8601 datetime string (e.g. "2026-07-20T10:00:00").
        end: ISO 8601 datetime string.
        description: Optional event description/notes.
        attendees: Optional list of attendee email addresses.

    Returns:
        dict with success status, event_id, and event details.
    """
    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {
            "success": False,
            "error": "Google Calendar API not configured. Set GOOGLE_CALENDAR_API_KEY or GOOGLE_OAUTH_ACCESS_TOKEN.",
        }

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except ValueError:
        return {"success": False, "error": "Invalid datetime format. Use ISO 8601 (e.g. 2026-07-20T10:00:00)."}

    if end_dt <= start_dt:
        return {"success": False, "error": "End time must be after start time."}

    event_body: dict[str, Any] = {
        "summary": title,
        "description": description,
        "start": _parse_iso(start),
        "end": _parse_iso(end),
    }

    if attendees:
        event_body["attendees"] = [{"email": email} for email in attendees]

    headers = _get_headers()
    headers["Content-Type"] = "application/json"
    params = _get_params()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events",
                headers=headers,
                params=params,
                json=event_body,
            )

            if response.status_code == 200:
                data = response.json()
                logger.info(f"Created Google Calendar event: {data.get('id')} - {title}")
                return {
                    "success": True,
                    "event_id": data.get("id"),
                    "html_link": data.get("htmlLink"),
                    "summary": data.get("summary"),
                    "start": data.get("start", {}).get("dateTime"),
                    "end": data.get("end", {}).get("dateTime"),
                    "status": data.get("status"),
                }
            else:
                logger.error(f"Google Calendar API error ({response.status_code}): {response.text}")
                return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Google Calendar API request timed out."}
    except Exception as e:
        logger.error(f"Failed to create calendar event: {e}")
        return {"success": False, "error": f"Failed to create event: {str(e)[:200]}"}


@tool
async def list_calendar_events(
    from_date: str,
    to_date: str,
    max_results: int = 25,
) -> dict[str, Any]:
    """List Google Calendar events within a date range.

    Args:
        from_date: ISO 8601 datetime string for range start (e.g. "2026-07-01T00:00:00").
        to_date: ISO 8601 datetime string for range end (e.g. "2026-07-31T23:59:59").
        max_results: Maximum number of events to return (default 25, max 250).

    Returns:
        dict with success status and list of events.
    """
    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    headers = _get_headers()
    params = _get_params()
    params.update({
        "timeMin": from_date,
        "timeMax": to_date,
        "maxResults": str(min(max_results, 250)),
        "singleEvents": "true",
        "orderBy": "startTime",
    })

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events",
                headers=headers,
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                events = []
                for item in items:
                    events.append({
                        "id": item.get("id"),
                        "summary": item.get("summary", "(No title)"),
                        "description": item.get("description", ""),
                        "start": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                        "end": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                        "status": item.get("status"),
                        "html_link": item.get("htmlLink"),
                        "attendees": [a.get("email") for a in item.get("attendees", [])],
                    })
                return {"success": True, "events": events, "count": len(events)}
            else:
                return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Google Calendar API request timed out."}
    except Exception as e:
        logger.error(f"Failed to list calendar events: {e}")
        return {"success": False, "error": f"Failed to list events: {str(e)[:200]}"}


@tool
async def cancel_calendar_event(event_id: str) -> dict[str, Any]:
    """Cancel/delete a Google Calendar event by ID.

    Args:
        event_id: The Google Calendar event ID to cancel.

    Returns:
        dict with success status and cancelled event_id.
    """
    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    headers = _get_headers()
    params = _get_params()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.delete(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events/{event_id}",
                headers=headers,
                params=params,
            )

            if response.status_code == 204:
                logger.info(f"Cancelled Google Calendar event: {event_id}")
                return {"success": True, "event_id": event_id, "message": "Event cancelled successfully."}
            elif response.status_code == 404:
                return {"success": False, "error": f"Event not found: {event_id}"}
            else:
                return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Google Calendar API request timed out."}
    except Exception as e:
        logger.error(f"Failed to cancel calendar event: {e}")
        return {"success": False, "error": f"Failed to cancel event: {str(e)[:200]}"}


@tool
async def get_calendar_event(event_id: str) -> dict[str, Any]:
    """Get details of a specific Google Calendar event by ID.

    Args:
        event_id: The Google Calendar event ID.

    Returns:
        dict with success status and event details.
    """
    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    headers = _get_headers()
    params = _get_params()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events/{event_id}",
                headers=headers,
                params=params,
            )

            if response.status_code == 200:
                item = response.json()
                return {
                    "success": True,
                    "event": {
                        "id": item.get("id"),
                        "summary": item.get("summary", "(No title)"),
                        "description": item.get("description", ""),
                        "start": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                        "end": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                        "status": item.get("status"),
                        "html_link": item.get("htmlLink"),
                        "attendees": [a.get("email") for a in item.get("attendees", [])],
                    },
                }
            elif response.status_code == 404:
                return {"success": False, "error": f"Event not found: {event_id}"}
            else:
                return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Google Calendar API request timed out."}
    except Exception as e:
        logger.error(f"Failed to get calendar event: {e}")
        return {"success": False, "error": f"Failed to get event: {str(e)[:200]}"}
