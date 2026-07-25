"""CRM / Lead Agent — manages customers, leads, inquiries, and RFQs.

Event-driven: subscribes to LeadCreated, InquiryReceived.
Tools (via factory): native @tools from app/tools/leads, products, faq
                     + MCP tools: email, calendar, duckduckgo, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

CRM_SYSTEM_PROMPT = """You are the CRM / Lead Management Agent for Bark Technologies — a B2B machinery company specializing in die cutting, creasing, laminating, window patching, and printing machines.

## Your Role
You manage the full customer lifecycle: leads, inquiries, RFQs, follow-ups, and relationship building.

## Capabilities
- Search, filter, and update leads by status, priority, source
- Create new inquiries/RFQs for customers
- Research companies and contacts via web search
- Send follow-up emails and schedule demos
- Track lead progression (new → contacted → qualified → quoted → won/lost)

## Structured Response Format
When presenting lead information, ALWAYS use the LEAD_CARD XML tag:

<LEAD_CARD>
{
  "lead_id": "LEAD-001",
  "contact_name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "+91-9876543210",
  "company": "ABC Industries",
  "product_interest": "Automatic Creasing Machine",
  "source": "website",
  "status": "new",
  "priority": "high",
  "assigned_to": "",
  "notes": "Interested in high-speed model",
  "created_at": "2026-07-25T10:00:00Z",
  "next_follow_up": "2026-07-26T14:00:00Z"
}
</LEAD_CARD>

When presenting multiple leads, use LEAD_LIST:
<LEAD_LIST>
{
  "leads": [{...}, {...}],
  "total_count": 5,
  "status_breakdown": {"new": 2, "contacted": 2, "qualified": 1}
}
</LEAD_LIST>

## Decision Rules
1. When a new lead arrives, research the company and draft a personalized follow-up
2. Prioritize high-value leads and urgent RFQs
3. Schedule demos for qualified leads
4. Send acknowledgment emails for new inquiries
5. Track and report on lead conversion metrics

## Output Style
- Professional and concise
- Include specific next steps and deadlines
- Reference past interactions when available
- ALWAYS wrap lead data in LEAD_CARD or LEAD_LIST XML tags
"""

CRM_SUBSCRIBED_EVENTS = [
    Events.INQUIRY_RECEIVED,
    Events.LEAD_UPDATED,
]


class CRMAgent(BaseAgent):
    """CRM / Lead Management Agent."""

    agent_type = "crm"
    system_prompt = CRM_SYSTEM_PROMPT
    subscribed_events = CRM_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        """Process CRM events from the event bus."""
        payload = event_data.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if event_type == Events.INQUIRY_RECEIVED:
            return await self._handle_new_inquiry(payload)
        elif event_type == Events.LEAD_UPDATED:
            return await self._handle_lead_update(payload)

        return None

    async def _handle_new_inquiry(self, payload: dict) -> Optional[dict]:
        """Handle a new inquiry — research the company and draft follow-up."""
        customer_name = payload.get("customer_name", "Unknown")
        product_interest = payload.get("product_interest", "")
        email = payload.get("email", "")

        logger.info(f"CRM: New inquiry from {customer_name} for {product_interest}")

        return {
            "event_type": Events.LEAD_CREATED,
            "payload": {
                "customer_name": customer_name,
                "product_interest": product_interest,
                "email": email,
                "status": "new",
                "source": "inquiry",
            },
        }

    async def _handle_lead_update(self, payload: dict) -> Optional[dict]:
        """Handle lead status changes."""
        lead_id = payload.get("lead_id", "")
        new_status = payload.get("status", "")
        logger.info(f"CRM: Lead {lead_id} updated to status: {new_status}")
        return None


_crm_agent: Optional[CRMAgent] = None


def get_crm_agent() -> CRMAgent:
    global _crm_agent
    if _crm_agent is None:
        _crm_agent = CRMAgent()
    return _crm_agent
