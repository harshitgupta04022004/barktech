"""LangMem memory tools — semantic, episodic, and procedural memory management.

These tools let the admin agent:
- Create/update/delete memories during conversation (manage_memory)
- Search past memories semantically (search_memory)
- Build long-term knowledge about users, preferences, and business context

Scoped per admin user via namespace: ("admin_memories", user_id)
"""

import logging
from langmem import create_manage_memory_tool, create_search_memory_tool

logger = logging.getLogger(__name__)


def get_memory_tools(user_id: str):
    """Create memory tools scoped to a specific admin user.

    Args:
        user_id: The admin user's ID for namespace scoping.

    Returns:
        Tuple of (manage_memory_tool, search_memory_tool).
    """
    namespace = ("admin_memories", user_id)

    manage_memory = create_manage_memory_tool(namespace=namespace)
    search_memory = create_search_memory_tool(namespace=namespace)

    logger.info(f"Memory tools created for user: {user_id}")
    return manage_memory, search_memory
