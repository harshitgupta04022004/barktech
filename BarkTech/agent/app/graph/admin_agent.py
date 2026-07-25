"""Admin agent — bridges routes.py to the new Orchestrator system.

Uses the Orchestrator (supervisor.py) for multi-agent admin chat.
"""

import logging
from app.agents.supervisor import Orchestrator

logger = logging.getLogger(__name__)

# Singleton orchestrator instance
_orchestrator: Orchestrator = None


def _get_orchestrator() -> Orchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator


async def run_admin_agent(
    message: str,
    thread_id: str,
    user_context: dict = None,
) -> tuple[str, dict]:
    """Run the admin chat agent via the Orchestrator.

    Args:
        message: User's message.
        thread_id: Conversation thread ID.
        user_context: Optional user context from JWT.

    Returns:
        Tuple of (response_text, usage_data).
    """
    orchestrator = _get_orchestrator()
    return await orchestrator.route_request(message, thread_id, user_context)
