"""Event system for inter-agent communication via Redis Streams.

Usage:
    from app.events import EventBus, Events, get_event_bus

    # Publish
    bus = get_event_bus()
    await bus.publish(Events.LEAD_CREATED, {"lead_id": "123", ...})

    # Subscribe
    async for msg_id, data in bus.subscribe(Events.LEAD_CREATED, "crm_agent"):
        # Process event
        await bus.ack(Events.LEAD_CREATED, msg_id)
"""

from app.events.bus import EventBus, get_event_bus, init_event_bus, shutdown_event_bus
from app.events.types import (
    Events,
    EventCategory,
    BaseEvent,
    LeadCreatedEvent,
    InvoicePaidEvent,
    StockLowEvent,
    ContentPublishedEvent,
    InstallationScheduledEvent,
)

__all__ = [
    "EventBus",
    "get_event_bus",
    "init_event_bus",
    "shutdown_event_bus",
    "Events",
    "EventCategory",
    "BaseEvent",
    "LeadCreatedEvent",
    "InvoicePaidEvent",
    "StockLowEvent",
    "ContentPublishedEvent",
    "InstallationScheduledEvent",
]
