"""Event type definitions for the BarkTech event-driven multi-agent system.

All domain events are defined here as string constants and typed dataclasses.
Agents publish and subscribe to these events via Redis Streams.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class EventCategory(str, Enum):
    """High-level event categories."""
    CRM = "crm"
    SALES = "sales"
    CONTENT = "content"
    INVENTORY = "inventory"
    SCHEDULING = "scheduling"
    SYSTEM = "system"


# ── Event Names (Redis Stream Keys) ───────────────────

class Events:
    """All event type constants. Use as Redis Stream names."""

    # CRM / Lead Events
    LEAD_CREATED = "LeadCreated"
    LEAD_UPDATED = "LeadUpdated"
    LEAD_ASSIGNED = "LeadAssigned"
    INQUIRY_RECEIVED = "InquiryReceived"

    # Sales / Invoice Events
    INVOICE_CREATED = "InvoiceCreated"
    INVOICE_PAID = "InvoicePaid"
    INVOICE_SENT = "InvoiceSent"
    QUOTATION_SENT = "QuotationSent"

    # Content / Marketing Events
    CONTENT_REQUESTED = "ContentRequested"
    CONTENT_PUBLISHED = "ContentPublished"
    BLOG_DRAFT_REQUESTED = "BlogDraftRequested"
    SOCIAL_POST_SCHEDULED = "SocialPostScheduled"

    # Inventory / Stock Events
    PRODUCT_UPDATED = "ProductUpdated"
    STOCK_LOW = "StockLow"
    STOCK_REORDERED = "StockReordered"

    # Scheduling Events
    INSTALLATION_SCHEDULED = "InstallationScheduled"
    DEMO_BOOKED = "DemoBooked"
    SITE_VISIT_SCHEDULED = "SiteVisitScheduled"

    # System Events
    AGENT_ERROR = "AgentError"
    AGENT_HEALTH_CHECK = "AgentHealthCheck"


# ── Event Data Classes ────────────────────────────────

@dataclass
class BaseEvent:
    """Base class for all events."""
    event_type: str
    source: str  # Which agent or backend service emitted this
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    payload: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "source": self.source,
            "timestamp": self.timestamp,
            "payload": str(self.payload),  # Redis Streams requires string values
            "metadata": str(self.metadata),
        }


@dataclass
class LeadCreatedEvent(BaseEvent):
    """Emitted when a new lead/inquiry is created."""
    def __init__(self, lead_id: str, customer_name: str, product_interest: str, source: str = "backend"):
        super().__init__(
            event_type=Events.LEAD_CREATED,
            source=source,
            payload={
                "lead_id": lead_id,
                "customer_name": customer_name,
                "product_interest": product_interest,
            },
        )


@dataclass
class InvoicePaidEvent(BaseEvent):
    """Emitted when an invoice is marked as paid."""
    def __init__(self, invoice_id: str, amount: float, customer_email: str, source: str = "backend"):
        super().__init__(
            event_type=Events.INVOICE_PAID,
            source=source,
            payload={
                "invoice_id": invoice_id,
                "amount": amount,
                "customer_email": customer_email,
            },
        )


@dataclass
class StockLowEvent(BaseEvent):
    """Emitted when stock falls below threshold."""
    def __init__(self, product_id: str, product_name: str, current_stock: int, min_stock: int, source: str = "inventory_agent"):
        super().__init__(
            event_type=Events.STOCK_LOW,
            source=source,
            payload={
                "product_id": product_id,
                "product_name": product_name,
                "current_stock": current_stock,
                "min_stock": min_stock,
            },
        )


@dataclass
class ContentPublishedEvent(BaseEvent):
    """Emitted when content is published."""
    def __init__(self, content_id: str, content_type: str, title: str, source: str = "content_agent"):
        super().__init__(
            event_type=Events.CONTENT_PUBLISHED,
            source=source,
            payload={
                "content_id": content_id,
                "content_type": content_type,
                "title": title,
            },
        )


@dataclass
class InstallationScheduledEvent(BaseEvent):
    """Emitted when an installation is scheduled."""
    def __init__(self, installation_id: str, customer_name: str, date: str, source: str = "scheduling_agent"):
        super().__init__(
            event_type=Events.INSTALLATION_SCHEDULED,
            source=source,
            payload={
                "installation_id": installation_id,
                "customer_name": customer_name,
                "date": date,
            },
        )
