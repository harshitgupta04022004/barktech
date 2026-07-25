"""MCP Client Factory — creates MultiServerMCPClient instances per agent.

Each agent gets:
1. Native LangGraph @tools (from app/tools/) — always available
2. MCP tools (from MultiServerMCPClient) — optional enhancement

If MCP servers are unavailable, agents gracefully fall back to native tools only.
Clients are lazily initialized and cached per agent type.
"""

import importlib
import logging
from typing import Optional

from langchain_core.tools import BaseTool

from app.mcp.clients.mcp_config import (
    get_agent_mcp_config,
    get_agent_native_tool_names,
    get_agent_native_modules,
)

logger = logging.getLogger(__name__)

# ── Client Cache ──────────────────────────────────────
_mcp_clients: dict[str, object] = {}
_native_tools_cache: dict[str, list[BaseTool]] = {}


def _load_native_tools(agent_type: str) -> list[BaseTool]:
    """Load native LangGraph @tools for an agent from app/tools/ modules.

    These are direct Python implementations — no MCP protocol needed.
    Always available regardless of MCP server status.
    """
    if agent_type in _native_tools_cache:
        return _native_tools_cache[agent_type]

    allowed_names = set(get_agent_native_tool_names(agent_type))
    modules = get_agent_native_modules(agent_type)
    tools: list[BaseTool] = []

    for module_path in modules:
        try:
            mod = importlib.import_module(module_path)
            for attr_name in dir(mod):
                obj = getattr(mod, attr_name)
                if isinstance(obj, BaseTool) and attr_name in allowed_names:
                    tools.append(obj)
        except Exception as e:
            logger.warning(f"Failed to load native tools from {module_path}: {e}")

    _native_tools_cache[agent_type] = tools
    logger.info(
        f"Loaded {len(tools)} native tools for agent '{agent_type}': "
        f"{[t.name for t in tools]}"
    )
    return tools


async def _load_mcp_tools(agent_type: str) -> list[BaseTool]:
    """Load MCP tools via MultiServerMCPClient.

    Returns empty list if MCP servers are unavailable (graceful degradation).
    """
    if agent_type in _mcp_clients:
        client = _mcp_clients[agent_type]
        if client is None:
            return []  # Already tried and failed
        try:
            tools = await client.get_tools()
            return tools
        except Exception as e:
            logger.warning(f"MCP tools failed for '{agent_type}': {e}")
            return []

    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient
        config = get_agent_mcp_config(agent_type)
        if not config:
            logger.info(f"No MCP servers configured for agent '{agent_type}'")
            _mcp_clients[agent_type] = None
            return []

        client = MultiServerMCPClient(config)
        _mcp_clients[agent_type] = client

        tools = await client.get_tools()
        logger.info(
            f"Loaded {len(tools)} MCP tools for agent '{agent_type}': "
            f"{[t.name for t in tools]}"
        )
        return tools

    except ImportError as e:
        logger.warning(f"MCP adapter not available: {e}")
        _mcp_clients[agent_type] = None
        return []
    except Exception as e:
        logger.warning(f"MCP client init failed for '{agent_type}': {e}")
        _mcp_clients[agent_type] = None
        return []


async def get_agent_tools(agent_type: str) -> list[BaseTool]:
    """Get all tools (native + MCP) for a specific agent type.

    Native tools are always loaded. MCP tools are loaded if available.
    If MCP fails, agents still have their full native toolset.

    Args:
        agent_type: One of "crm", "sales", "content", "inventory",
                    "scheduling", "research", "admin".

    Returns:
        List of LangChain-compatible tool objects.
    """
    native = _load_native_tools(agent_type)
    mcp = await _load_mcp_tools(agent_type)

    # Merge, avoiding duplicates by name
    seen_names = {t.name for t in native}
    combined = list(native)
    for t in mcp:
        if t.name not in seen_names:
            combined.append(t)
            seen_names.add(t.name)

    logger.info(
        f"Agent '{agent_type}' total tools: {len(combined)} "
        f"({len(native)} native + {len(combined) - len(native)} MCP)"
    )
    return combined


async def cleanup_mcp_clients():
    """Clean up all MCP client connections on shutdown."""
    for agent_type, client in _mcp_clients.items():
        if client is None:
            continue
        try:
            if hasattr(client, "aclose"):
                await client.aclose()
            elif hasattr(client, "close"):
                await client.close()
            logger.info(f"Closed MCP client for agent '{agent_type}'")
        except Exception as e:
            logger.warning(f"Error closing MCP client for '{agent_type}': {e}")
    _mcp_clients.clear()
    _native_tools_cache.clear()
