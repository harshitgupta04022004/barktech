"""Centralized MCP server configuration registry.

All MCP server connection details are defined here. Agents pick only what
they need via get_agent_mcp_config(). No secrets are hard-coded — everything
comes from environment variables.

Architecture (v3):
- Native @tools in app/tools/ handle MongoDB core operations
- Email: Brevo API v3 via email_mcp.py (native tool, NOT an MCP server)
- MCP servers handle external services: WhatsApp, Media, Calendar, Research
- Other MCP servers are local FastMCP processes
- Agents get tools from BOTH native @tools AND MCP servers
"""

import os
import logging

logger = logging.getLogger(__name__)

# ── Agent Tool Bundles ─────────────────────────────────
# Each agent type maps to its required native tool modules and MCP server keys.
# Native tools are imported from app/tools/ and always available.
# MCP tools are optional enhancements loaded from local FastMCP servers.

AGENT_TOOL_BUNDLES: dict[str, dict] = {
    "crm": {
        "description": "CRM / Lead Management Agent",
        "native_modules": [
            "app.tools.leads",
            "app.tools.products",
            "app.tools.faq",
        ],
        "native_tool_names": [
            "create_inquiry", "search_leads", "update_lead_status", "get_lead_stats",
            "search_products", "get_product_specs", "get_faq", "get_contact_info",
        ],
        "mcp_servers": ["calendar", "duckduckgo", "thinking", "memory", "fetch"],
    },
    "sales": {
        "description": "Sales / Invoice Agent",
        "native_modules": [
            "app.tools.invoices",
            "app.tools.products",
        ],
        "native_tool_names": [
            "create_invoice", "get_invoice", "update_invoice", "delete_invoice",
            "list_invoices", "mark_invoice_status", "get_invoice_stats",
            "generate_invoice_pdf", "search_products", "get_product_specs",
        ],
        "mcp_servers": ["storage", "thinking", "memory"],
    },
    "content": {
        "description": "Content / Marketing Agent",
        "native_modules": [
            "app.tools.content",
            "app.tools.social_media",
        ],
        "native_tool_names": [
            "create_content", "list_content", "get_content", "update_content", "delete_content",
            "check_content_duplicates", "submit_for_review", "schedule_content",
            "publish_facebook_post", "publish_instagram_post",
            "publish_linkedin_post", "publish_twitter_post",
            "validate_platform_credentials", "validate_content_for_publish",
            "get_publish_status", "schedule_publish",
        ],
        "mcp_servers": ["duckduckgo", "thinking", "fetch"],
    },
    "inventory": {
        "description": "Inventory / Stock Agent",
        "native_modules": [
            "app.tools.stock",
            "app.tools.products",
            "app.tools.product_admin",
        ],
        "native_tool_names": [
            "get_stock_info", "get_low_stock_products",
            "search_products", "get_product_specs",
            "list_products", "get_product",
        ],
        "mcp_servers": ["duckduckgo", "thinking", "memory"],
    },
    "scheduling": {
        "description": "Installation / Scheduling Agent",
        "native_modules": [
            "app.mcp.calendar_mcp",
            "app.tools.mcp_tools",
        ],
        "native_tool_names": [
            "create_calendar_event", "list_calendar_events",
            "cancel_calendar_event", "get_calendar_event",
            "send_template_email",
        ],
        "mcp_servers": ["thinking", "time"],
    },
    "research": {
        "description": "Web Research Agent",
        "native_modules": [
            "app.tools.mcp_tools",
        ],
        "native_tool_names": [
            "research_url", "research_web_search",
        ],
        "mcp_servers": ["duckduckgo", "thinking", "fetch"],
    },
    "admin": {
        "description": "Admin Supervisor (all tools)",
        "native_modules": [
            "app.tools.leads",
            "app.tools.invoices",
            "app.tools.products",
            "app.tools.stock",
            "app.tools.faq",
            "app.tools.content",
            "app.tools.social_media",
            "app.tools.email_management",
            "app.tools.product_admin",
            "app.tools.product_enhance",
            "app.tools.mcp_tools",
            "app.mcp.calendar_mcp",
        ],
        "native_tool_names": [
            "create_inquiry", "search_leads", "update_lead_status", "get_lead_stats",
            "create_invoice", "get_invoice", "update_invoice", "delete_invoice",
            "list_invoices", "mark_invoice_status", "get_invoice_stats",
            "generate_invoice_pdf",
            "search_products", "get_product_specs",
            "get_stock_info", "get_low_stock_products",
            "get_faq", "get_contact_info",
            "create_content", "list_content", "get_content", "update_content", "delete_content",
            "check_content_duplicates", "submit_for_review", "schedule_content",
            "publish_facebook_post", "publish_instagram_post",
            "publish_linkedin_post", "publish_twitter_post",
            "manage_subscriber", "send_adhoc_email",
            "create_product", "get_product", "update_product", "delete_product",
            "list_products", "upload_product_media", "extract_product_info",
            "enhance_product_details", "create_category", "list_categories",
            "send_whatsapp_notification", "send_admin_whatsapp_alert",
            "send_email", "send_template_email",
            "presign_media_upload", "get_media_public_url",
            "research_url", "research_web_search",
            "create_calendar_event", "list_calendar_events",
            "cancel_calendar_event", "get_calendar_event",
        ],
        "mcp_servers": ["calendar", "duckduckgo", "thinking", "storage", "memory", "fetch", "time", "github"],
    },
}

# ── MCP Server Definitions (Local FastMCP Servers) ──────
# Each entry is a local FastMCP server process. If a server isn't available,
# the system falls back to native tools gracefully.
# Email is handled by native @tools (app.tools.mcp_tools → app.mcp.email_mcp),
# NOT by an MCP server, to avoid Brevo HTTP MCP connection issues.

COMMON_MCP_CONFIG: dict[str, dict] = {
    # ── WhatsApp (Cloud API via FastMCP) ──
    "whatsapp": {
        "transport": "stdio",
        "command": "python",
        "args": ["-m", "app.mcp.whatsapp_mcp_server"],
        "env": {
            "WHATSAPP_BUSINESS_TOKEN": os.getenv("WHATSAPP_BUSINESS_TOKEN", ""),
            "WHATSAPP_PHONE_NUMBER_ID": os.getenv("WHATSAPP_PHONE_NUMBER_ID", ""),
            "ADMIN_PHONE_NUMBER": os.getenv("ADMIN_PHONE_NUMBER", "917498415371"),
        },
    },

    # ── Storage (OpenDAL / Backblaze B2) ──
    "storage": {
        "transport": "stdio",
        "command": "uvx",
        "args": ["mcp-server-opendal"],
        "env": {
            "OPENDAL_TYPE": "s3",
            "OPENDAL_BUCKET": os.getenv("S3_BUCKET", "barkTech"),
            "OPENDAL_REGION": os.getenv("AWS_REGION", "us-east-005"),
            "OPENDAL_ENDPOINT": os.getenv("S3_ENDPOINT_URL", ""),
            "OPENDAL_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", ""),
            "OPENDAL_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", ""),
        },
    },

    # ── DuckDuckGo (Web Research) ──
    "duckduckgo": {
        "transport": "stdio",
        "command": "uvx",
        "args": ["duckduckgo-mcp-server"],
    },

    # ── Playwright (Browser Automation) ──
    "playwright": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@playwright/mcp"],
    },

    # ── Calendar (Google Calendar via FastMCP) ──
    "calendar": {
        "transport": "stdio",
        "command": "python",
        "args": ["-m", "app.mcp.calendar_mcp_server"],
        "env": {
            "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
            "GOOGLE_CALENDAR_API_KEY": os.getenv("GOOGLE_CALENDAR_API_KEY", ""),
            "GOOGLE_CALENDAR_ID": os.getenv("GOOGLE_CALENDAR_ID", "primary"),
        },
    },

    # ── Sequential Thinking ──
    "thinking": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },

    # ── Invoice (Custom FastMCP) ──
    "invoice": {
        "transport": "stdio",
        "command": "python",
        "args": [os.path.join(os.path.dirname(__file__), "..", "invoice_mcp.py")],
        "env": {
            "BACKEND_API_URL": os.getenv("BACKEND_API_URL", "http://localhost:3000"),
        },
    },

    # ── MongoDB (Official MCP) ──
    "mongodb": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "mongodb-mcp-server"],
        "env": {
            "MDB_MCP_CONNECTION_STRING": os.getenv("MONGODB_URI", ""),
        },
    },

    # ── Memory (Official MCP — persistent key-value store) ──
    "memory": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"],
    },

    # ── Fetch (Official MCP — HTTP fetch for web research) ──
    "fetch": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-fetch"],
    },

    # ── Time (Official MCP — time zone conversions) ──
    "time": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-time"],
    },

    # ── GitHub (Official MCP — repos, issues, PRs) ──
    "github": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": os.getenv("GITHUB_TOKEN", ""),
        },
    },
}


def get_agent_mcp_config(agent_type: str) -> dict[str, dict]:
    """Get the MCP configuration subset for a specific agent type.

    Args:
        agent_type: One of "crm", "sales", "content", "inventory",
                    "scheduling", "research", "admin".

    Returns:
        Dict mapping MCP server name -> connection config.
    """
    if agent_type not in AGENT_TOOL_BUNDLES:
        raise ValueError(
            f"Unknown agent type: {agent_type}. "
            f"Valid types: {list(AGENT_TOOL_BUNDLES.keys())}"
        )

    server_keys = AGENT_TOOL_BUNDLES[agent_type].get("mcp_servers", [])
    config = {}
    for key in server_keys:
        if key in COMMON_MCP_CONFIG:
            config[key] = COMMON_MCP_CONFIG[key]
        else:
            logger.warning(f"MCP server '{key}' not in COMMON_MCP_CONFIG")

    logger.info(f"MCP config for agent '{agent_type}': {list(config.keys())}")
    return config


def get_agent_native_tool_names(agent_type: str) -> list[str]:
    """Get the list of native tool names for an agent type."""
    if agent_type not in AGENT_TOOL_BUNDLES:
        return []
    return AGENT_TOOL_BUNDLES[agent_type].get("native_tool_names", [])


def get_agent_native_modules(agent_type: str) -> list[str]:
    """Get the list of native tool module paths for an agent type."""
    if agent_type not in AGENT_TOOL_BUNDLES:
        return []
    return AGENT_TOOL_BUNDLES[agent_type].get("native_modules", [])
