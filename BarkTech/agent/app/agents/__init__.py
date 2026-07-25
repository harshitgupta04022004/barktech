"""BarkTech Multi-Agent System — Event-Driven Architecture.

Exports all specialized agents, the orchestrator, event router, and structured responses.

Usage:
    from app.agents import get_orchestrator, get_event_router

    orchestrator = get_orchestrator()
    result, usage = await orchestrator.route_request("Create invoice for...", thread_id, user_context)

    # Or for event-driven tasks (backend-initiated):
    router = get_event_router()
    await router.route_event("InvoicePaid", event_data)
"""

from app.agents.supervisor import Orchestrator, get_orchestrator, get_supervisor, SupervisorOrchestrator
from app.agents.base import BaseAgent
from app.agents.event_router import EventRouter, get_event_router
from app.agents.responses import (
    StructuredResponse,
    ResponseType,
    ProductCardPayload,
    InvoiceCardPayload,
    LeadCardPayload,
    TableViewPayload,
    StatsChartPayload,
    EmailLayoutPayload,
    BlogLayoutPayload,
    CalendarEventPayload,
)
from app.agents.serializer import serialize_response, serialize_multi_response, parse_xml_response
from app.agents.crm_agent import CRMAgent, get_crm_agent
from app.agents.sales_agent import SalesAgent, get_sales_agent
from app.agents.content_agent import ContentAgent, get_content_agent
from app.agents.inventory_agent import InventoryAgent, get_inventory_agent
from app.agents.scheduling_agent import SchedulingAgent, get_scheduling_agent
from app.agents.research_agent import ResearchAgent, get_research_agent

__all__ = [
    # Orchestrator
    "Orchestrator", "SupervisorOrchestrator",
    "get_orchestrator", "get_supervisor",
    # Event Router
    "EventRouter", "get_event_router",
    # Base
    "BaseAgent",
    # Structured Responses
    "StructuredResponse", "ResponseType",
    "ProductCardPayload", "InvoiceCardPayload", "LeadCardPayload",
    "TableViewPayload", "StatsChartPayload", "EmailLayoutPayload",
    "BlogLayoutPayload", "CalendarEventPayload",
    # Serializer
    "serialize_response", "serialize_multi_response", "parse_xml_response",
    # Agents
    "CRMAgent", "get_crm_agent",
    "SalesAgent", "get_sales_agent",
    "ContentAgent", "get_content_agent",
    "InventoryAgent", "get_inventory_agent",
    "SchedulingAgent", "get_scheduling_agent",
    "ResearchAgent", "get_research_agent",
]
