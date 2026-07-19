"""Observability service — tracks agent interactions for debugging and cost monitoring.

Per architecture spec:
- MongoDB for fast queries and analytics
- Tracks token usage, latency, tool calls, errors
- Provides stats for admin dashboard
"""

import logging
import time
from datetime import datetime

logger = logging.getLogger(__name__)


class ObservabilityService:
    """Tracks all agent interactions for observability."""

    def __init__(self):
        self._client = None

    def _get_db(self):
        if self._client is None:
            from motor.motor_asyncio import AsyncIOMotorClient
            from app.config import config as cfg
            self._client = AsyncIOMotorClient(cfg.mongodb_uri)
            self._db_name = cfg.mongodb_db
        return self._client[self._db_name]

    async def log_interaction(
        self,
        session_id: str,
        source: str,
        user_message: str,
        assistant_reply: str,
        model: str = "",
        latency_ms: float = 0,
        tool_calls: list = None,
        tokens_used: int = 0,
        cost: float = 0,
        error: str = None,
    ):
        """Log an agent interaction to MongoDB (chatlogs collection for Node.js backend)."""
        try:
            db = self._get_db()
            await db.chatlogs.insert_one({
                "sessionId": session_id,
                "source": source,
                "userMessage": user_message,
                "assistantReply": assistant_reply[:500],
                "model": model,
                "inputTokens": tokens_used,
                "outputTokens": 0,
                "totalTokens": tokens_used,
                "cost": cost,
                "latencyMs": latency_ms,
                "toolCalls": tool_calls or [],
                "errorMessage": error,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            })
        except Exception as e:
            logger.error(f"Failed to log interaction: {e}")

    async def get_stats(self, hours: int = 24):
        """Get interaction stats for the last N hours."""
        try:
            db = self._get_db()
            since = datetime.utcnow().replace(hour=datetime.utcnow().hour - hours)

            total = await db.agent_traces.count_documents({"createdAt": {"$gte": since}})
            errors = await db.agent_traces.count_documents({"createdAt": {"$gte": since}, "error": {"$ne": None}})

            pipeline = [
                {"$match": {"createdAt": {"$gte": since}}},
                {"$group": {
                    "_id": "$source",
                    "count": {"$sum": 1},
                    "avgLatency": {"$avg": "$latencyMs"},
                    "totalTokens": {"$sum": "$tokensUsed"},
                }},
            ]
            by_source = await db.agent_traces.aggregate(pipeline).to_list(10)

            return {
                "totalInteractions": total,
                "errors": errors,
                "errorRate": (errors / total * 100) if total > 0 else 0,
                "bySource": {s["_id"]: {"count": s["count"], "avgLatency": round(s["avgLatency"], 0)} for s in by_source},
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"totalInteractions": 0, "errors": 0, "errorRate": 0, "bySource": {}}

    async def get_recent_traces(self, limit: int = 20):
        """Get recent agent traces for debugging."""
        try:
            db = self._get_db()
            traces = await db.agent_traces.find().sort("createdAt", -1).limit(limit).to_list(limit)
            return traces
        except Exception as e:
            logger.error(f"Failed to get traces: {e}")
            return []


observability = ObservabilityService()
