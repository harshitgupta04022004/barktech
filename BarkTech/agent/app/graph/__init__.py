"""Graph modules for client and admin agents.

DEPRECATED: This module is deprecated. Use `app.agents` instead.

The new agents module provides:
- Orchestrator for user chat delegation with verification
- Event Router for direct event-to-agent routing
- Structured response schemas for all agent outputs
- Specialized agents: CRM, Sales, Content, Inventory, Scheduling, Research

Migration:
    from app.graph.client_agent import run_client_agent  # OLD
    from app.agents import get_orchestrator  # NEW
"""

import warnings

warnings.warn(
    "app.graph is deprecated. Use app.agents instead. "
    "See app/agents/__init__.py for the new API.",
    DeprecationWarning,
    stacklevel=2,
)

# Import from new agents module for backward compatibility
from app.agents.supervisor import get_orchestrator as get_admin_graph
from app.agents.supervisor import get_orchestrator as get_graph
from app.agents.supervisor import get_orchestrator

# For backward compatibility, provide run_client_agent and run_admin_agent wrappers
async def run_client_agent(message: str, thread_id: str, user_context: dict = None):
    """Deprecated. Use orchestrator.route_request() instead."""
    warnings.warn(
        "run_client_agent is deprecated. Use get_orchestrator().route_request() instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    orchestrator = get_orchestrator()
    return await orchestrator.route_request(message, thread_id, user_context)

async def run_admin_agent(message: str, thread_id: str, user_context: dict = None):
    """Deprecated. Use orchestrator.route_request() instead."""
    warnings.warn(
        "run_admin_agent is deprecated. Use get_orchestrator().route_request() instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    orchestrator = get_orchestrator()
    return await orchestrator.route_request(message, thread_id, user_context)

__all__ = [
    "get_graph", "run_client_agent",
    "get_admin_graph", "run_admin_agent",
    "get_orchestrator",
]
