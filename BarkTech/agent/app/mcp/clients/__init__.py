"""MCP Client factories and MultiServerMCPClient configurations.

Provides centralized MCP server configs and per-agent client factories.
Each agent gets only the MCP servers it needs (least privilege).
Native tools are loaded from app/tools/ modules.
MCP tools are optional enhancements from local FastMCP servers.
"""

from app.mcp.clients.mcp_config import (
    COMMON_MCP_CONFIG, AGENT_TOOL_BUNDLES,
    get_agent_mcp_config, get_agent_native_tool_names, get_agent_native_modules,
)
from app.mcp.clients.mcp_client_factory import get_agent_tools, cleanup_mcp_clients

__all__ = [
    "COMMON_MCP_CONFIG",
    "AGENT_TOOL_BUNDLES",
    "get_agent_mcp_config",
    "get_agent_native_tool_names",
    "get_agent_native_modules",
    "get_agent_tools",
    "cleanup_mcp_clients",
]
