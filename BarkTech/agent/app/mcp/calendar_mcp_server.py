"""Calendar MCP Server — FastMCP server for Google Calendar operations.

This is a proper MCP server that wraps the Google Calendar API.
It can be launched as a subprocess by the MultiServerMCPClient.

Usage (standalone):
    python -m app.mcp.calendar_mcp_server

Usage (via MCP client):
    MultiServerMCPClient starts this as a stdio subprocess.
"""

import os
import logging
from datetime import datetime
from typing import Any

from fastmcp import FastMCP

logger = logging.getLogger("calendar-mcp-server")

# ── Configuration ──────────────────────────────────────
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


# ── FastMCP Server ─────────────────────────────────────
mcp = FastMCP(
    name="Calendar MCP Server",
    instructions=(
        "Google Calendar operations for Bark Technologies. "
        "Create, list, cancel, and get calendar events for scheduling "
        "installations, demos, site visits, and meetings."
    ),
)


@mcp.tool()
async def create_calendar_event(
    title: str,
    start: str,
    end: str,
    description: str = "",
    attendees: list[str] | None = None,
) -> dict:
    """Create a Google Calendar event.

    Args:
        title: Event title (e.g. "Machine Installation at XYZ Factory").
        start: ISO 8601 datetime string (e.g. "2026-07-20T10:00:00").
        end: ISO 8601 datetime string.
        description: Optional event description/notes.
        attendees: Optional list of attendee email addresses.

    Returns:
        dict with success status, event_id, and event details.
    """
    import httpx

    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except ValueError:
        return {"success": False, "error": "Invalid datetime format. Use ISO 8601."}

    if end_dt <= start_dt:
        return {"success": False, "error": "End time must be after start time."}

    event_body = {
        "summary": title,
        "description": description,
        "start": _parse_iso(start),
        "end": _parse_iso(end),
    }
    if attendees:
        event_body["attendees"] = [{"email": email} for email in attendees]

    headers = {**_get_headers(), "Content-Type": "application/json"}
    params = _get_params()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events",
                headers=headers, params=params, json=event_body,
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "event_id": data.get("id"),
                    "html_link": data.get("htmlLink"),
                    "summary": data.get("summary"),
                    "start": data.get("start", {}).get("dateTime"),
                    "end": data.get("end", {}).get("dateTime"),
                    "status": data.get("status"),
                }
            return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def list_calendar_events(from_date: str, to_date: str, max_results: int = 25) -> dict:
    """List Google Calendar events within a date range.

    Args:
        from_date: ISO 8601 datetime for range start.
        to_date: ISO 8601 datetime for range end.
        max_results: Maximum events to return (default 25, max 250).

    Returns:
        dict with success status and list of events.
    """
    import httpx

    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    params = {
        **_get_params(),
        "timeMin": from_date,
        "timeMax": to_date,
        "maxResults": str(min(max_results, 250)),
        "singleEvents": "true",
        "orderBy": "startTime",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events",
                headers=_get_headers(), params=params,
            )
            if response.status_code == 200:
                items = response.json().get("items", [])
                events = [
                    {
                        "id": item.get("id"),
                        "summary": item.get("summary", "(No title)"),
                        "start": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                        "end": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                        "status": item.get("status"),
                    }
                    for item in items
                ]
                return {"success": True, "events": events, "count": len(events)}
            return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def cancel_calendar_event(event_id: str) -> dict:
    """Cancel/delete a Google Calendar event by ID.

    Args:
        event_id: The Google Calendar event ID to cancel.

    Returns:
        dict with success status.
    """
    import httpx

    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.delete(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events/{event_id}",
                headers=_get_headers(), params=_get_params(),
            )
            if response.status_code == 204:
                return {"success": True, "event_id": event_id, "message": "Event cancelled."}
            return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def get_calendar_event(event_id: str) -> dict:
    """Get details of a specific Google Calendar event by ID.

    Args:
        event_id: The Google Calendar event ID.

    Returns:
        dict with success status and event details.
    """
    import httpx

    if not GOOGLE_CALENDAR_API_KEY and not GOOGLE_OAUTH_ACCESS_TOKEN:
        return {"success": False, "error": "Google Calendar API not configured."}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{CALENDAR_API_BASE}/calendars/{GOOGLE_CALENDAR_ID}/events/{event_id}",
                headers=_get_headers(), params=_get_params(),
            )
            if response.status_code == 200:
                item = response.json()
                return {
                    "success": True,
                    "event": {
                        "id": item.get("id"),
                        "summary": item.get("summary", "(No title)"),
                        "start": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                        "end": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                        "status": item.get("status"),
                    },
                }
            return {"success": False, "error": f"Calendar API error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    mcp.run(transport="stdio")
