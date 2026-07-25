"""Installation / Scheduling Agent — manages calendar, installations, demos.

Event-driven: subscribes to InstallationScheduled, DemoBooked.
Tools (via factory): native @tools from app/mcp/calendar_mcp (Google Calendar)
                     + MCP tools: email, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

SCHEDULING_SYSTEM_PROMPT = """You are the Scheduling Agent for Bark Technologies — a B2B machinery company.

## Your Role
You coordinate service installations, product demos, and site visits.

## Capabilities
- Schedule installations, demos, and site visits via Google Calendar
- Check availability and avoid conflicts
- Send confirmation emails and reminders
- Reschedule or cancel events
- Track installation status and completion

## Structured Response Format
When presenting calendar events, ALWAYS use the CALENDAR_EVENT XML tag:

<CALENDAR_EVENT>
{
  "event_id": "CAL-001",
  "title": "Product Demo - Automatic Creasing Machine",
  "description": "Demo for Acme Industries on high-speed creasing capabilities",
  "start_time": "2026-07-26T10:00:00Z",
  "end_time": "2026-07-26T12:00:00Z",
  "location": "Bark Technologies Showroom, Noida",
  "attendees": ["rajesh@acme.com", "sales@barktechnologies.in"],
  "event_type": "demo",
  "customer_name": "Acme Industries",
  "customer_email": "rajesh@acme.com",
  "status": "confirmed",
  "google_calendar_link": "https://calendar.google.com/event?id=..."
}
</CALENDAR_EVENT>

For scheduling confirmations via email:
<EMAIL_LAYOUT>
{
  "to": "rajesh@acme.com",
  "subject": "Demo Confirmed - Bark Technologies",
  "preview_text": "Your product demo has been scheduled",
  "body_html": "<p>Your demo is confirmed for July 26 at 10 AM...</p>",
  "template_type": "demo_confirmation"
}
</EMAIL_LAYOUT>

## Rules
- Always check for conflicts before booking
- Include location, attendees, and notes in events
- Send confirmation emails after booking
- Remind customers 24 hours before appointments
- ALWAYS wrap calendar data in CALENDAR_EVENT XML tags
"""

SCHEDULING_SUBSCRIBED_EVENTS = [
    Events.INSTALLATION_SCHEDULED,
    Events.DEMO_BOOKED,
]


class SchedulingAgent(BaseAgent):
    """Installation / Scheduling Agent."""

    agent_type = "scheduling"
    system_prompt = SCHEDULING_SYSTEM_PROMPT
    subscribed_events = SCHEDULING_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        payload = event_data.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if event_type == Events.INSTALLATION_SCHEDULED:
            return await self._handle_installation_scheduled(payload)
        elif event_type == Events.DEMO_BOOKED:
            return await self._handle_demo_booked(payload)
        return None

    async def _handle_installation_scheduled(self, payload: dict) -> Optional[dict]:
        customer = payload.get("customer_name", "")
        date = payload.get("date", "")
        logger.info(f"Scheduling: Installation for {customer} on {date}")
        return {
            "event_type": "InstallationConfirmed",
            "payload": {
                "customer_name": customer,
                "date": date,
                "message": "Installation confirmed. Send confirmation email.",
            },
        }

    async def _handle_demo_booked(self, payload: dict) -> Optional[dict]:
        customer = payload.get("customer_name", "")
        logger.info(f"Scheduling: Demo booked for {customer}")
        return None


_scheduling_agent: Optional[SchedulingAgent] = None


def get_scheduling_agent() -> SchedulingAgent:
    global _scheduling_agent
    if _scheduling_agent is None:
        _scheduling_agent = SchedulingAgent()
    return _scheduling_agent
