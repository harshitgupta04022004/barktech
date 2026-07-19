"""LangGraph checkpointer setup — MongoDB-backed conversation persistence.

Per architecture spec:
- Use AsyncMongoDBSaver for production (short-term, thread-scoped memory)
- Use MemorySaver for testing/development
- LangGraph handles ALL memory operations — no custom memory classes needed
"""

import logging
import os

logger = logging.getLogger(__name__)

# Global checkpointer instance
_checkpointer = None


async def setup_checkpointer(backend: str | None = None):
    """Initialize LangGraph checkpointer.

    Args:
        backend: "mongodb" for production, "memory" for dev/test.
                 Defaults to checking MONGODB_URI env var.

    Returns:
        Checkpointer instance for use with compiled LangGraph graphs.
    """
    global _checkpointer

    if _checkpointer is not None:
        return _checkpointer

    if backend is None:
        backend = "mongodb" if os.getenv("MONGODB_URI") else "memory"

    if backend == "mongodb":
        try:
            from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver

            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            checkpointer = AsyncMongoDBSaver.from_conn_string(mongodb_uri)
            await checkpointer.setup()
            _checkpointer = checkpointer
            logger.info("LangGraph checkpointer initialized with MongoDB backend")
            return _checkpointer
        except ImportError:
            logger.warning(
                "langgraph-checkpoint-mongodb not installed — falling back to MemorySaver. "
                "Install with: pip install langgraph-checkpoint-mongodb"
            )
        except Exception as e:
            logger.warning(f"Failed to init MongoDB checkpointer: {e} — falling back to MemorySaver")

    # Fallback: in-memory checkpointer (dev/test)
    from langgraph.checkpoint.memory import MemorySaver

    _checkpointer = MemorySaver()
    logger.info("LangGraph checkpointer initialized with in-memory backend")
    return _checkpointer


def get_checkpointer():
    """Get the current checkpointer instance.

    Returns None if setup_checkpointer() hasn't been called yet.
    """
    return _checkpointer


async def get_conversation_history(checkpointer, thread_id: str) -> list:
    """Retrieve conversation history for a thread from the checkpointer.

    Args:
        checkpointer: The LangGraph checkpointer instance.
        thread_id: The thread ID to retrieve history for.

    Returns:
        List of messages from the most recent checkpoint.
    """
    config = {"configurable": {"thread_id": thread_id}}
    try:
        checkpoint = await checkpointer.aget(config)
        if checkpoint and checkpoint.get("channel_values"):
            return checkpoint["channel_values"].get("messages", [])
    except Exception as e:
        logger.warning(f"Failed to retrieve conversation history: {e}")
    return []
