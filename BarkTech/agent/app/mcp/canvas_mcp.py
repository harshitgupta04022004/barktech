"""Canvas MCP integration for creative design generation.

Generates product creatives, brochures, and visual assets.
Requires CANVAS_API_KEY env var.
"""

import httpx
import os
import logging

logger = logging.getLogger(__name__)

CANVAS_API_URL = os.getenv("MCP_CANVAS_URL", "http://localhost:8040/mcp")
CANVAS_API_KEY = os.getenv("CANVAS_API_KEY", "")


async def _call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Call a tool on the Canvas MCP server."""
    if not CANVAS_API_KEY:
        return {"success": False, "error": "CANVAS_API_KEY not configured"}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                CANVAS_API_URL,
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
                    "Authorization": f"Bearer {CANVAS_API_KEY}",
                },
            )
            data = resp.json()
            if "result" in data:
                return data["result"]
            if "error" in data:
                return {"success": False, "error": data["error"].get("message", str(data["error"]))}
            return {"success": False, "error": "Invalid MCP response"}
    except httpx.HTTPError as e:
        logger.error(f"Canvas MCP HTTP error: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Canvas MCP error: {e}")
        return {"success": False, "error": str(e)}


async def generate_design(
    prompt: str,
    design_type: str = "product_creative",
    dimensions: str = "1080x1080",
    style: str = "professional",
) -> dict:
    """Generate a creative design asset.

    Args:
        prompt: Description of the design to generate.
        design_type: Type of design (product_creative, brochure, social_post, banner).
        dimensions: Output dimensions (e.g., "1080x1080", "1920x1080").
        style: Design style (professional, modern, minimal, bold).

    Returns:
        dict with success, image_url, design_id, error.
    """
    return await _call_mcp_tool("generate_design", {
        "prompt": prompt,
        "design_type": design_type,
        "dimensions": dimensions,
        "style": style,
    })


async def export_asset(
    design_id: str,
    format: str = "png",
    quality: int = 95,
) -> dict:
    """Export a generated design to a specific format.

    Args:
        design_id: The ID of the design to export.
        format: Output format (png, jpg, pdf, svg).
        quality: Output quality (1-100, for lossy formats).

    Returns:
        dict with success, download_url, error.
    """
    return await _call_mcp_tool("export_asset", {
        "design_id": design_id,
        "format": format,
        "quality": quality,
    })
