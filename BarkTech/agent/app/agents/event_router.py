"""Event Router — Direct event-to-agent routing without supervisor overhead.

When the Node.js backend publishes an event to Redis Streams, this router
picks it up and dispatches it directly to the specialized agent. The agent
processes the event and returns a structured response BACK TO THE NODE.JS
BACKEND via a Redis response channel.

Flow:
    Backend -> Redis Streams -> EventRouter -> Specialized Agent
    Agent -> Structured Response -> Redis Response Channel -> Backend
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional

from app.events.types import Events
from app.events.bus import get_event_bus

logger = logging.getLogger(__name__)


# ── Event Type -> Agent Type Mapping ──────────────────
# Maps each event type to the agent that handles it.
# No LLM routing, no supervisor -- just a direct dictionary lookup.

EVENT_ROUTER: dict[str, str] = {
    # CRM / Lead Events
    Events.INQUIRY_RECEIVED: "crm",
    Events.LEAD_CREATED: "crm",
    Events.LEAD_UPDATED: "crm",
    Events.LEAD_ASSIGNED: "crm",

    # Sales / Invoice Events
    Events.INVOICE_CREATED: "sales",
    Events.INVOICE_PAID: "sales",
    Events.INVOICE_SENT: "sales",
    Events.QUOTATION_SENT: "sales",

    # Content / Marketing Events
    Events.CONTENT_REQUESTED: "content",
    Events.CONTENT_PUBLISHED: "content",
    Events.BLOG_DRAFT_REQUESTED: "content",
    Events.SOCIAL_POST_SCHEDULED: "content",

    # Inventory / Stock Events
    Events.PRODUCT_UPDATED: "inventory",
    Events.STOCK_LOW: "inventory",
    Events.STOCK_REORDERED: "inventory",

    # Scheduling Events
    Events.INSTALLATION_SCHEDULED: "scheduling",
    Events.DEMO_BOOKED: "scheduling",
    Events.SITE_VISIT_SCHEDULED: "scheduling",
}


class EventRouter:
    """Routes events directly to specialized agents.

    Agent responses are returned to the Node.js backend via:
    1. Agent publishes response to "agent_response:{event_type}" Redis channel
    2. Backend subscribes to these channels
    3. Backend stores result in MongoDB and notifies admin UI via SSE
    """

    def __init__(self):
        self._agents: dict[str, any] = {}
        self._initialized = False

    def _initialize_agents(self):
        """Lazy-initialize agent instances from the supervisor module."""
        if self._initialized:
            return

        try:
            from app.agents.supervisor import _get_agents
            self._agents = _get_agents()
            self._initialized = True
            logger.info(
                f"EventRouter initialized with agents: {list(self._agents.keys())}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize agents for EventRouter: {e}")

    def _get_agent(self, agent_type: str):
        """Get a specific agent instance by type."""
        self._initialize_agents()
        return self._agents.get(agent_type)

    async def route_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        """Route an event directly to its specialized agent.

        Args:
            event_type: The event type string (e.g., "InvoicePaid").
            event_data: The event payload dict.

        Returns:
            The agent's response dict, or None if routing failed.
        """
        agent_type = EVENT_ROUTER.get(event_type)
        if not agent_type:
            logger.warning(f"No agent mapped for event type: {event_type}")
            return None

        agent = self._get_agent(agent_type)
        if not agent:
            logger.error(
                f"Agent '{agent_type}' not found for event: {event_type}"
            )
            return None

        logger.info(
            f"Routing event '{event_type}' to agent '{agent_type}' "
            f"(direct, no supervisor)"
        )

        try:
            # Direct invocation -- no LLM routing, no supervisor
            result = await agent.process_event(event_type, event_data)

            # Return response to backend via Redis response channel
            if result:
                await self._publish_response(event_type, agent_type, result)

            return result

        except Exception as e:
            logger.error(
                f"Agent '{agent_type}' failed to process event "
                f"'{event_type}': {e}",
                exc_info=True,
            )
            # Publish error response so backend knows
            await self._publish_response(
                event_type,
                agent_type,
                {
                    "status": "error",
                    "error": str(e),
                    "event_type": event_type,
                },
            )
            return None

    async def _publish_response(
        self, event_type: str, agent_type: str, result: dict
    ):
        """Publish agent response to a Redis pub/sub channel.

        The Node.js backend subscribes to these channels and processes
        the results (stores in MongoDB, notifies admin UI via SSE).

        Uses Redis pub/sub (not Streams) for real-time response delivery.
        """
        bus = get_event_bus()

        response_channel = f"agent_response:{event_type}"
        response_payload = {
            "event_type": event_type,
            "source_agent": agent_type,
            "result": json.dumps(result, default=str),
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat(),
        }

        try:
            await bus.publish_channel(response_channel, response_payload)
            logger.info(
                f"Published response for '{event_type}' from "
                f"'{agent_type}' to channel '{response_channel}'"
            )
        except Exception as e:
            logger.error(
                f"Failed to publish response to '{response_channel}': {e}"
            )

    def get_mapped_events(self) -> list[str]:
        """Return all event types that have agent mappings."""
        return list(EVENT_ROUTER.keys())

    def get_agent_for_event(self, event_type: str) -> Optional[str]:
        """Return the agent type that handles a given event type."""
        return EVENT_ROUTER.get(event_type)


# ── Global Event Router Instance ──────────────────────
_event_router: Optional[EventRouter] = None


def get_event_router() -> EventRouter:
    """Get the global event router instance."""
    global _event_router
    if _event_router is None:
        _event_router = EventRouter()
    return _event_router


# ── Event Loop Runner ─────────────────────────────────

async def run_event_router_loop():
    """Main event loop that subscribes to ALL mapped events and routes them.

    This runs as a background task in the FastAPI application.
    It subscribes to each event stream and dispatches to the appropriate agent.
    """
    router = get_event_router()
    bus = get_event_bus()

    mapped_events = router.get_mapped_events()
    if not mapped_events:
        logger.warning("No events mapped in EventRouter, nothing to subscribe to")
        return

    logger.info(
        f"EventRouter starting event loop for {len(mapped_events)} events: "
        f"{mapped_events}"
    )

    # Create a task for each event type subscription
    tasks = []
    for event_type in mapped_events:
        task = asyncio.create_task(
            _subscribe_and_route(event_type, router, bus)
        )
        tasks.append(task)

    # Run all subscriptions concurrently
    try:
        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        logger.info("EventRouter event loop cancelled")
    except Exception as e:
        logger.error(f"EventRouter event loop error: {e}")


async def _subscribe_and_route(
    event_type: str, router: EventRouter, bus
):
    """Subscribe to a single event type and route incoming events.

    Skips streams that don't exist yet (no events published).
    """
    consumer_name = f"event_router_{EVENT_ROUTER.get(event_type, 'unknown')}"

    # Check if stream exists before subscribing (avoid timeout spam)
    try:
        info = await bus.get_stream_info(event_type)
        if info.get("length", 0) == 0 and not info.get("first-entry"):
            # Stream is empty or doesn't exist — wait before subscribing
            await asyncio.sleep(10)
            info = await bus.get_stream_info(event_type)
            if info.get("length", 0) == 0:
                logger.debug(f"Stream '{event_type}' has no messages, deferring subscription")
                # Still subscribe but with longer block time to reduce noise
    except Exception:
        pass

    try:
        async for msg_id, data in bus.subscribe(
            event_type, consumer_name, block_ms=10000
        ):
            try:
                # Parse event data
                payload = data.get("payload", "{}")
                if isinstance(payload, str):
                    try:
                        payload = json.loads(payload)
                    except json.JSONDecodeError:
                        payload = {"raw": payload}

                event_data = {
                    "event_type": event_type,
                    "source": data.get("source", "backend"),
                    "payload": payload,
                    "timestamp": data.get("timestamp", ""),
                }

                # Route directly to specialized agent
                await router.route_event(event_type, event_data)

                # Acknowledge the message
                await bus.ack(event_type, msg_id)

            except Exception as e:
                logger.error(
                    f"Failed to process event '{event_type}': {e}",
                    exc_info=True,
                )
                # Still ack to prevent reprocessing loop
                await bus.ack(event_type, msg_id)

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(
            f"EventRouter subscription error for '{event_type}': {e}"
        )
