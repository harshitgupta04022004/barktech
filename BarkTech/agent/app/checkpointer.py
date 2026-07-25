"""LangGraph persistence setup — MongoDB-backed conversation + long-term memory.

Per architecture spec:
- MongoDBSaver (AsyncMongoDBSaver) for short-term, thread-scoped memory (checkpointer)
- MongoDBStore for long-term, cross-thread memory (user preferences, facts, knowledge)
- LangMem tools for semantic/episodic/procedural memory management
- LangGraph handles ALL memory operations — no custom memory classes needed
"""

import json
import logging
import os
import time
from contextlib import AbstractContextManager

logger = logging.getLogger(__name__)

# Debug log helper
_LOG_PATH = "/home/harshit/Desktop/bark_technology/.cursor/debug-eabb58.log"


def _debug_log(location, message, data=None, hypothesis_id=None):
    """Write NDJSON debug log for tracing."""
    entry = {
        "sessionId": "eabb58",
        "id": f"log_{int(time.time()*1000)}_{location.replace('/', '_').replace('.', '_')}",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data or {},
    }
    if hypothesis_id:
        entry["hypothesisId"] = hypothesis_id
    try:
        with open(_LOG_PATH, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass


# Global instances
_checkpointer = None
_store = None
_checkpointer_ctx: AbstractContextManager | None = None
_store_ctx: AbstractContextManager | None = None


def _patch_mongodb_store(store):
    """Patch MongoDBStore to work without index_config (no vector search).

    Bug fix: langgraph-store-mongodb 0.3.0 only sets embeddings, _is_autoembedding,
    _index_name, _relevance_score_fn, _embedding_key, index_field, index_filters
    inside __init__ when index_config is provided. But langmem's search/manage
    memory tools access these attributes unconditionally.

    When using the store for basic key-value storage (no vector search):
    1. Set safe defaults for all vector-search attributes
    2. Monkey-patch asearch() to fall back to prefix match when query is provided
       but embeddings are not available
    """
    patched = False
    if not hasattr(store, '_is_autoembedding'):
        store._is_autoembedding = False
        patched = True
    if not hasattr(store, 'embeddings'):
        store.embeddings = None
        patched = True
    if not hasattr(store, '_index_name'):
        store._index_name = None
        patched = True
    if not hasattr(store, '_relevance_score_fn'):
        store._relevance_score_fn = "cosine"
        patched = True
    if not hasattr(store, '_embedding_key'):
        store._embedding_key = "embedding"
        patched = True
    if not hasattr(store, 'index_field'):
        store.index_field = None
        patched = True
    if not hasattr(store, 'index_filters'):
        store.index_filters = None
        patched = True

    # Monkey-patch asearch to handle query without embeddings gracefully
    if store.embeddings is None and not getattr(store, '_asearch_patched', False):
        _original_asearch = store.asearch

        async def _safe_asearch(namespace_prefix, query=None, filter=None, limit=None, offset=None, **kwargs):
            """Fallback asearch: when query is provided but no embeddings,
            do a simple prefix match instead of vector search."""
            if query and store.embeddings is None:
                # Log the vector search skip
                _debug_log(
                    "checkpointer.py:_safe_asearch",
                    "No embeddings available, falling back to prefix match",
                    {"query": query[:100] if query else None},
                    hypothesis_id="A",
                )
                # Call without query to do simple match
                return await _original_asearch(namespace_prefix, query=None, filter=filter, limit=limit, offset=offset, **kwargs)
            return await _original_asearch(namespace_prefix, query=query, filter=filter, limit=limit, offset=offset, **kwargs)

        store.asearch = _safe_asearch
        store._asearch_patched = True
        patched = True

    if patched:
        _debug_log(
            "checkpointer.py:_patch_mongodb_store",
            "Patched MongoDBStore with safe defaults for vector-search attributes",
            {"patched_attrs": True},
            hypothesis_id="A",
        )
        logger.info("Patched MongoDBStore with safe defaults (no vector search)")
    return store


async def setup_checkpointer(backend: str | None = None):
    """Initialize LangGraph checkpointer.

    Args:
        backend: "mongodb" for production, "memory" for dev/test.
                 Defaults to checking MONGODB_URI env var.

    Returns:
        Checkpointer instance for use with compiled LangGraph graphs.
    """
    global _checkpointer, _checkpointer_ctx

    if _checkpointer is not None:
        _debug_log(
            "checkpointer.py:setup_checkpointer",
            "Checkpointer already initialized",
            {"type": type(_checkpointer).__name__},
        )
        return _checkpointer

    if backend is None:
        backend = "mongodb" if os.getenv("MONGODB_URI") else "memory"

    _debug_log(
        "checkpointer.py:setup_checkpointer",
        "Setting up checkpointer",
        {"backend": backend, "mongodb_uri_set": bool(os.getenv("MONGODB_URI"))},
    )

    if backend == "mongodb":
        try:
            from langgraph.checkpoint.mongodb import MongoDBSaver

            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB_NAME", "BarkTech")

            # Use "langgraph_checkpoints" to match the collection name used by
            # the session listing/clear/delete endpoints in routes.py
            _checkpointer_ctx = MongoDBSaver.from_conn_string(
                mongodb_uri,
                db_name=db_name,
                checkpoint_collection_name="langgraph_checkpoints",
                writes_collection_name="langgraph_checkpoint_writes",
            )
            checkpointer = _checkpointer_ctx.__enter__()
            _checkpointer = checkpointer
            _debug_log(
                "checkpointer.py:setup_checkpointer",
                "LangGraph checkpointer initialized with MongoDB",
                {"type": "MongoDBSaver", "collection": "langgraph_checkpoints"},
            )
            logger.info("LangGraph checkpointer initialized with MongoDB backend")
            return _checkpointer
        except ImportError:
            logger.warning(
                "langgraph-checkpoint-mongodb not installed — falling back to MemorySaver. "
                "Install with: pip install langgraph-checkpoint-mongodb"
            )
        except Exception as e:
            _debug_log(
                "checkpointer.py:setup_checkpointer",
                "MongoDB checkpointer failed, falling back to MemorySaver",
                {"error": str(e)},
            )
            logger.warning(f"Failed to init MongoDB checkpointer: {e} — falling back to MemorySaver")

    # Fallback: in-memory checkpointer (dev/test)
    from langgraph.checkpoint.memory import MemorySaver

    _checkpointer = MemorySaver()
    _debug_log(
        "checkpointer.py:setup_checkpointer",
        "Checkpointer initialized with in-memory backend",
        {"type": "MemorySaver"},
    )
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
    global _store, _store_ctx

    if _store is not None:
        _debug_log(
            "checkpointer.py:setup_store",
            "Store already initialized",
            {"type": type(_store).__name__},
        )
        return _store

    if backend is None:
        backend = "mongodb" if os.getenv("MONGODB_URI") else "memory"

    _debug_log(
        "checkpointer.py:setup_store",
        "Setting up store",
        {"backend": backend},
    )

    if backend == "mongodb":
        try:
            from langgraph.store.mongodb import MongoDBStore

            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB_NAME", "BarkTech")

            # from_conn_string returns a context manager — enter it to get the store
            _store_ctx = MongoDBStore.from_conn_string(
                mongodb_uri,
                db_name=db_name,
                collection_name="langgraph_store",
            )
            _store = _store_ctx.__enter__()
            # Patch for langgraph-store-mongodb 0.3.0 bug
            _patch_mongodb_store(_store)
            _debug_log(
                "checkpointer.py:setup_store",
                "LangGraph store initialized with MongoDB",
                {"type": "MongoDBStore"},
            )
            logger.info("LangGraph store initialized with MongoDB backend")
            return _store
        except ImportError:
            logger.warning(
                "langgraph-store-mongodb not installed — falling back to InMemoryStore. "
                "Install with: pip install langgraph-store-mongodb"
            )
        except Exception as e:
            _debug_log(
                "checkpointer.py:setup_store",
                "MongoDB store failed, falling back to InMemoryStore",
                {"error": str(e)},
            )
            logger.warning(f"Failed to init MongoDB store: {e} — falling back to InMemoryStore")

    # Fallback: in-memory store (dev/test)
    from langgraph.store.memory import InMemoryStore

    _store = InMemoryStore()
    _debug_log(
        "checkpointer.py:setup_store",
        "Store initialized with in-memory backend",
        {"type": "InMemoryStore"},
    )
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


async def cleanup_checkpointer():
    """Clean up the checkpointer context manager to properly close MongoDB connections."""
    global _checkpointer, _checkpointer_ctx
    if _checkpointer_ctx is not None:
        try:
            _checkpointer_ctx.__exit__(None, None, None)
            logger.info("LangGraph checkpointer context closed")
        except Exception as e:
            logger.warning(f"Error closing checkpointer context: {e}")
        _checkpointer = None
        _checkpointer_ctx = None


async def cleanup_store():
    """Clean up the store context manager to properly close MongoDB connections."""
    global _store, _store_ctx
    if _store_ctx is not None:
        try:
            _store_ctx.__exit__(None, None, None)
            logger.info("LangGraph store context closed")
        except Exception as e:
            logger.warning(f"Error closing store context: {e}")
        _store = None
        _store_ctx = None


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
