"""Claude Ads MCP integration for ad campaign management.

Manages social media ad campaigns via Claude Ads API.
Requires CLAUDE_ADS_API_KEY env var.
"""

import httpx
import os
import logging

logger = logging.getLogger(__name__)

CLAUDE_ADS_API_URL = os.getenv("MCP_CLAUDE_ADS_URL", "http://localhost:8030/mcp")
CLAUDE_ADS_API_KEY = os.getenv("CLAUDE_ADS_API_KEY", "")


async def _call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Call a tool on the Claude Ads MCP server."""
    if not CLAUDE_ADS_API_KEY:
        return {"success": False, "error": "CLAUDE_ADS_API_KEY not configured"}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                CLAUDE_ADS_API_URL,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": arguments,
                    },
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {CLAUDE_ADS_API_KEY}",
                },
            )
            data = resp.json()
            if "result" in data:
                return data["result"]
            if "error" in data:
                return {"success": False, "error": data["error"].get("message", str(data["error"]))}
            return {"success": False, "error": "Invalid MCP response"}
    except httpx.HTTPError as e:
        logger.error(f"Claude Ads MCP HTTP error: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Claude Ads MCP error: {e}")
        return {"success": False, "error": str(e)}


async def create_campaign(
    name: str,
    platform: str,
    budget: float,
    target_audience: str = "",
    content: str = "",
) -> dict:
    """Create a new ad campaign.

    Args:
        name: Campaign name.
        platform: Target platform (facebook, instagram, linkedin, twitter, reddit).
        budget: Campaign budget in INR.
        target_audience: Target audience description.
        content: Ad content/copy.

    Returns:
        dict with success, campaign_id, error.
    """
    return await _call_mcp_tool("create_campaign", {
        "name": name,
        "platform": platform,
        "budget": budget,
        "target_audience": target_audience,
        "content": content,
    })


async def publish_post(
    platform: str,
    content: str,
    media_urls: list[str] = None,
    scheduled_time: str = None,
) -> dict:
    """Publish a post to social media.

    Args:
        platform: Target platform (facebook, instagram, linkedin, twitter, reddit).
        content: Post text content.
        media_urls: Optional list of media URLs to include.
        scheduled_time: Optional ISO timestamp for scheduled publishing.

    Returns:
        dict with success, post_id, error.
    """
    return await _call_mcp_tool("publish_post", {
        "platform": platform,
        "content": content,
        "media_urls": media_urls or [],
        "scheduled_time": scheduled_time,
    })


async def get_campaign_stats(campaign_id: str = None) -> dict:
    """Get campaign performance statistics.

    Args:
        campaign_id: Optional specific campaign ID. If None, returns all campaigns.

    Returns:
        dict with campaign stats (impressions, clicks, conversions, spend).
    """
    return await _call_mcp_tool("get_campaign_stats", {
        "campaign_id": campaign_id,
    })
