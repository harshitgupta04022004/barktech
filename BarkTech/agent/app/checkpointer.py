"""LangGraph persistence setup — MongoDB-backed conversation + long-term memory.

Per architecture spec:
- MongoDBSaver (AsyncMongoDBSaver) for short-term, thread-scoped memory (checkpointer)
- MongoDBStore for long-term, cross-thread memory (user preferences, facts, knowledge)
- LangMem tools for semantic/episodic/procedural memory management
- LangGraph handles ALL memory operations — no custom memory classes needed
"""

import logging
import os

logger = logging.getLogger(__name__)

# Global instances
_checkpointer = None
_store = None


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


async def setup_store(backend: str | None = None):
    """Initialize LangGraph Store for long-term cross-thread memory.

    The store persists user preferences, facts, and accumulated knowledge
    across ALL threads. Organized by namespace (e.g., ("admin_memories", user_id)).

    Args:
        backend: "mongodb" for production, "memory" for dev/test.

    Returns:
        Store instance for use with compiled LangGraph graphs.
    """
    global _store

    if _store is not None:
        return _store

    if backend is None:
        backend = "mongodb" if os.getenv("MONGODB_URI") else "memory"

    if backend == "mongodb":
        try:
            from langgraph.store.mongodb import MongoDBStore

            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB_NAME", "BarkTech")

            store = MongoDBStore.from_conn_string(
                mongodb_uri,
                db_name=db_name,
                collection_name="langgraph_store",
            )
            _store = store
            logger.info("LangGraph store initialized with MongoDB backend")
            return _store
        except ImportError:
            logger.warning(
                "langgraph-store-mongodb not installed — falling back to InMemoryStore. "
                "Install with: pip install langgraph-store-mongodb"
            )
        except Exception as e:
            logger.warning(f"Failed to init MongoDB store: {e} — falling back to InMemoryStore")

    # Fallback: in-memory store (dev/test)
    from langgraph.store.memory import InMemoryStore

    _store = InMemoryStore()
    logger.info("LangGraph store initialized with in-memory backend")
    return _store


def get_checkpointer():
    """Get the current checkpointer instance.

    Returns None if setup_checkpointer() hasn't been called yet.
    """
    return _checkpointer


def get_store():
    """Get the current store instance.

    Returns None if setup_store() hasn't been called yet.
    """
    return _store


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
