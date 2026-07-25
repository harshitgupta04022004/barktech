"""MCP Tool Permissions — defines which agents can use which tools.

Enforces least-privilege access control at the tool level.
"""

# Tool permission mapping: tool_name -> list of allowed agent types
TOOL_PERMISSIONS: dict[str, list[str]] = {
    # MongoDB tools — available to all agents
    "find": ["crm", "sales", "content", "inventory", "scheduling", "admin"],
    "findOne": ["crm", "sales", "content", "inventory", "scheduling", "admin"],
    "insertOne": ["crm", "sales", "content", "inventory", "scheduling", "admin"],
    "updateOne": ["crm", "sales", "content", "inventory", "scheduling", "admin"],
    "deleteOne": ["admin"],  # Only admin can delete

    # Storage tools
    "listBuckets": ["admin"],
    "listFiles": ["sales", "content", "inventory", "admin"],
    "uploadFile": ["content", "admin"],
    "deleteFile": ["admin"],

    # Email (Resend)
    "sendEmail": ["crm", "sales", "inventory", "scheduling", "admin"],
    "createContact": ["crm", "admin"],

    # Calendar
    "createEvent": ["crm", "scheduling", "admin"],
    "listEvents": ["crm", "scheduling", "admin"],
    "deleteEvent": ["scheduling", "admin"],

    # DuckDuckGo (read-only)
    "search": ["crm", "content", "inventory", "research", "admin"],
    "fetchUrl": ["crm", "content", "inventory", "research", "admin"],

    # Playwright
    "screenshot": ["research", "admin"],
    "navigate": ["research", "admin"],

    # Canva
    "generateDesign": ["content", "admin"],
    "exportAsset": ["content", "admin"],

    # Sequential Thinking
    "thinking": ["crm", "sales", "content", "inventory", "scheduling", "research", "admin"],

    # Invoice
    "createInvoice": ["sales", "admin"],
    "getInvoice": ["sales", "admin"],
}


def check_tool_permission(agent_type: str, tool_name: str) -> bool:
    """Check if an agent type is allowed to use a specific tool.

    Args:
        agent_type: The agent requesting access (e.g., "crm", "sales").
        tool_name: The MCP tool name.

    Returns:
        True if allowed, False otherwise.
    """
    allowed_agents = TOOL_PERMISSIONS.get(tool_name)
    if allowed_agents is None:
        # Unknown tool — deny by default
        return False
    return agent_type in allowed_agents


def get_agent_allowed_tools(agent_type: str) -> list[str]:
    """Get all tool names allowed for a specific agent type.

    Args:
        agent_type: The agent type.

    Returns:
        List of allowed tool names.
    """
    return [
        tool_name
        for tool_name, allowed_agents in TOOL_PERMISSIONS.items()
        if agent_type in allowed_agents
    ]
