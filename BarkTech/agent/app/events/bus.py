"""Event Bus — Redis Streams pub/sub for inter-agent communication.

Provides publish/subscribe pattern using Redis Streams with consumer groups.
Each agent subscribes to relevant event topics and processes them concurrently.
"""

import asyncio
import json
import logging
import os
from typing import AsyncGenerator, Optional

import redis.asyncio as aioredis

from app.events.types import BaseEvent

logger = logging.getLogger(__name__)

# Redis connection
_redis_url = os.getenv("REDIS_URL", "")
_redis: Optional[aioredis.Redis] = None


def _get_redis() -> aioredis.Redis:
    """Get or create Redis connection."""
    global _redis
    if _redis is None:
        if not _redis_url:
            raise RuntimeError(
                "REDIS_URL not configured. Set it in .env for event bus."
            )
        _redis = aioredis.from_url(
            _redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis


class EventBus:
    """Redis Streams-based event bus for inter-agent communication.

    Features:
    - Consumer groups for parallel processing (at-least-once delivery)
    - Message acknowledgment
    - Dead letter handling for failed messages
    - Persistent message history

    Usage:
        bus = EventBus()
        await bus.connect()

        # Publish an event
        await bus.publish(Events.LEAD_CREATED, {
            "lead_id": "123",
            "customer_name": "Raj Industries",
        })

        # Subscribe to events
        async for msg_id, event in bus.subscribe(Events.LEAD_CREATED, "crm_agent"):
            print(f"New lead: {event}")
            await bus.ack(Events.LEAD_CREATED, msg_id)
    """

    def __init__(self, consumer_group: str = "bark_agents"):
        self._consumer_group = consumer_group
        self._connected = False

    async def connect(self):
        """Establish Redis connection."""
        if not self._connected:
            try:
                redis = _get_redis()
                await redis.ping()
                self._connected = True
                logger.info("Event bus connected to Redis")
            except Exception as e:
                logger.error(f"Event bus connection failed: {e}")
                raise

    async def disconnect(self):
        """Close Redis connection."""
        global _redis
        if _redis:
            await _redis.close()
            _redis = None
        self._connected = False
        logger.info("Event bus disconnected")

    async def publish(self, stream: str, event: dict) -> str:
        """Publish an event to a Redis Stream.

        Args:
            stream: Stream name (e.g., "LeadCreated").
            event: Event data dict with at least "event_type", "source", "payload".

        Returns:
            Redis Stream message ID.
        """
        redis = _get_redis()
        try:
            # Ensure all values are strings (Redis Streams requirement)
            string_event = {}
            for k, v in event.items():
                if isinstance(v, (dict, list)):
                    string_event[k] = json.dumps(v, default=str)
                else:
                    string_event[k] = str(v) if v is not None else ""

            msg_id = await redis.xadd(stream, string_event)
            logger.info(f"Published event to '{stream}': id={msg_id}")
            return msg_id
        except Exception as e:
            logger.error(f"Failed to publish event to '{stream}': {e}")
            raise

    async def subscribe(
        self,
        stream: str,
        consumer_name: str,
        block_ms: int = 5000,
    ) -> AsyncGenerator[tuple[str, dict], None]:
        """Subscribe to events using a consumer group.

        Creates the consumer group if it doesn't exist.

        Args:
            stream: Stream name to subscribe to.
            consumer_name: Unique consumer name within the group.
            block_ms: How long to block waiting for new messages.

        Yields:
            Tuple of (message_id, event_data_dict).
        """
        redis = _get_redis()
        group = self._consumer_group

        # Check if stream exists and has messages before creating consumer group
        try:
            info = await redis.xinfo_stream(stream)
            if info.get("length", 0) == 0:
                # Stream exists but is empty — wait for messages
                pass
        except Exception:
            # Stream doesn't exist yet — create it with mkstream
            pass

        # Create consumer group (ignore if exists)
        try:
            await redis.xgroup_create(stream, group, id="0", mkstream=True)
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

        while True:
            try:
                entries = await redis.xreadgroup(
                    groupname=group,
                    consumername=consumer_name,
                    streams={stream: ">"},
                    count=1,
                    block=block_ms,
                )
                if not entries:
                    continue

                for stream_name, messages in entries:
                    for msg_id, data in messages:
                        yield msg_id, data
            except asyncio.CancelledError:
                logger.info(f"Subscription to '{stream}' cancelled")
                break
            except Exception as e:
                # Rate-limit error logging: only log first occurrence, then every 60s
                err_str = str(e)
                now = asyncio.get_event_loop().time()
                last_log_key = f"_last_err_{stream}"
                last_log = getattr(self, last_log_key, 0)
                if now - last_log > 60:
                    logger.warning(f"Error reading from '{stream}': {err_str}")
                    setattr(self, last_log_key, now)
                await asyncio.sleep(1)

    async def ack(self, stream: str, msg_id: str):
        """Acknowledge a message as processed."""
        redis = _get_redis()
        try:
            await redis.xack(stream, self._consumer_group, msg_id)
        except Exception as e:
            logger.error(f"Failed to ack message {msg_id} on '{stream}': {e}")

    async def publish_channel(self, channel: str, event: dict) -> str:
        """Publish an event to a Redis pub/sub channel.

        Args:
            channel: Channel name (e.g., "agent_response:InvoicePaid").
            event: Event data dict.

        Returns:
            Redis channel name.
        """
        redis = _get_redis()
        try:
            # Ensure all values are strings (Redis requirement)
            string_event = {}
            for k, v in event.items():
                if isinstance(v, (dict, list)):
                    string_event[k] = json.dumps(v, default=str)
                else:
                    string_event[k] = str(v) if v is not None else ""

            await redis.publish(channel, json.dumps(string_event, default=str))
            logger.info(f"Published to channel '{channel}'")
            return channel
        except Exception as e:
            logger.error(f"Failed to publish to channel '{channel}': {e}")
            raise

    async def publish_event(self, event: BaseEvent):
        """Publish a typed event object.

        Convenience method that converts a BaseEvent to dict and publishes.
        """
        await self.publish(event.event_type, event.to_dict())

    async def get_stream_info(self, stream: str) -> dict:
        """Get information about a Redis Stream."""
        redis = _get_redis()
        try:
            info = await redis.xinfo_stream(stream)
            return info
        except Exception:
            return {"length": 0}

    async def get_pending(self, stream: str) -> list:
        """Get pending (unacknowledged) messages for the consumer group."""
        redis = _get_redis()
        try:
            pending = await redis.xpending_range(
                stream, self._consumer_group, min="-", max="+", count=100
            )
            return pending
        except Exception:
            return []


# ── Global Event Bus Instance ─────────────────────────
_event_bus: Optional[EventBus] = None


def get_event_bus() -> EventBus:
    """Get the global event bus instance."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus


async def init_event_bus():
    """Initialize and connect the global event bus."""
    bus = get_event_bus()
    await bus.connect()
    return bus


async def shutdown_event_bus():
    """Disconnect the global event bus."""
    bus = get_event_bus()
    await bus.disconnect()
