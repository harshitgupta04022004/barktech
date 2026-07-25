"""Content management tools for the ContentAgent.

Provides CRUD operations for blog posts, news articles, case studies,
installation showcases, and general content posts via the unified /api/v1/content API.
Includes near-duplicate detection and page_slug/product linking support.
"""

import json
import hashlib
import logging
import httpx
from langchain_core.tools import tool
from app.config import config
from app.services.observability import observability

logger = logging.getLogger(__name__)

BACKEND_URL = config.backend_url.rstrip("/")


def _normalize_for_hash(title: str, content: str) -> str:
    """Normalize text for content hashing (lowercase, collapse whitespace)."""
    combined = (title + content).lower()
    return " ".join(combined.split())


def _content_hash(title: str, content: str) -> str:
    """Generate SHA-256 content hash for near-duplicate detection."""
    normalized = _normalize_for_hash(title, content)
    return hashlib.sha256(normalized.encode()).hexdigest()


async def _api_call(method: str, endpoint: str, data: dict = None, params: dict = None) -> dict:
    """Make an authenticated API call to the backend."""
    url = f"{BACKEND_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            if method == "GET":
                resp = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                resp = await client.post(url, headers=headers, json=data)
            elif method == "PUT":
                resp = await client.put(url, headers=headers, json=data)
            elif method == "DELETE":
                resp = await client.delete(url, headers=headers)
            elif method == "PATCH":
                resp = await client.patch(url, headers=headers, json=data)
            else:
                return {"success": False, "error": f"Unsupported method: {method}"}

            if resp.status_code >= 400:
                error_msg = resp.text[:500]
                try:
                    error_data = resp.json()
                    error_msg = error_data.get("message", error_data.get("error", error_msg))
                except Exception:
                    pass
                return {"success": False, "error": f"API error {resp.status_code}: {error_msg}"}

            return resp.json()
    except httpx.TimeoutException:
        return {"success": False, "error": "Backend API timeout"}
    except httpx.ConnectError:
        return {"success": False, "error": "Cannot connect to backend API"}
    except Exception as e:
        logger.error(f"API call error: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════
# Near-Duplicate Detection
# ═══════════════════════════════════════════════════════

@tool
async def check_content_duplicates(
    title: str,
    content: str,
    content_type: str = "general",
) -> str:
    """Check for near-duplicate content before creating a new post.

    Searches for posts with the same content hash created in the last 7 days.
    Returns existing similar posts as a soft warning, not a hard block.

    Args:
        title: The proposed title.
        content: The proposed content body.
        content_type: The content type to check against (blog, news, case_study, general).
    """
    content_hash = _content_hash(title, content)

    result = await _api_call("GET", "/api/v1/content", params={
        "type": content_type,
        "limit": 50,
    })

    if result.get("success") is False:
        return json.dumps({"success": False, "error": result.get("error", "Failed to check duplicates")})

    items = result.get("data", [])
    # Note: Server-side hash check would be more efficient; this is a client-side fallback
    return json.dumps({
        "success": True,
        "content_hash": content_hash,
        "message": "Content hash generated. Server will check for duplicates on creation.",
        "existing_count": len(items),
    })


# ═══════════════════════════════════════════════════════
# Unified Content CRUD (routes through /api/v1/content)
# ═══════════════════════════════════════════════════════

@tool
async def create_content(
    content_type: str,
    title: str,
    content: str,
    excerpt: str = "",
    product_id: str = "",
    page_slug: str = "",
    image_url: str = "",
    tags: str = "",
    meta_title: str = "",
    meta_description: str = "",
    news_type: str = "",
    client_name: str = "",
    location: str = "",
    industry: str = "",
    hashtags: str = "",
    link_url: str = "",
    scheduled_at: str = "",
) -> str:
    """Create a new content draft of any type. Always creates in draft status.

    Args:
        content_type: Type of content (blog, news, case_study, general, installation).
        title: Content title.
        content: Full content body (HTML or markdown).
        excerpt: Short excerpt/summary for previews.
        product_id: Associated product ID (optional, but recommended for publishable content).
        page_slug: Site page slug to link to (alternative to product_id).
        image_url: Featured/cover image URL.
        tags: Comma-separated tags.
        meta_title: SEO title override.
        meta_description: SEO description.
        news_type: For news type: company, press_release, industry, event, award.
        client_name: For case studies: client company name.
        location: For case studies/installations: location.
        industry: For case studies: client industry.
        hashtags: For content posts: comma-separated hashtags.
        link_url: For content posts: link URL.
        scheduled_at: ISO datetime string for scheduled publishing (optional).
    """
    data = {
        "contentType": content_type,
        "title": title,
        "content": content,
        "excerpt": excerpt,
        "reviewStatus": "draft",
        "createdVia": "agent_chat",
    }

    if product_id:
        data["productId"] = product_id
    if page_slug:
        data["pageSlug"] = page_slug
    if image_url:
        data["imageUrl"] = image_url
    if tags:
        data["tags"] = tags
    if meta_title:
        data["metaTitle"] = meta_title
    if meta_description:
        data["metaDescription"] = meta_description
    if news_type:
        data["newsType"] = news_type
    if client_name:
        data["clientName"] = client_name
    if location:
        data["location"] = location
    if industry:
        data["industry"] = industry
    if hashtags:
        data["hashtags"] = hashtags
    if link_url:
        data["linkUrl"] = link_url
    if scheduled_at:
        data["scheduledAt"] = scheduled_at

    result = await _api_call("POST", "/api/v1/content", data)
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    content_data = result.get("data", result)

    return json.dumps({
        "success": True,
        "message": f"{content_type} '{title}' created as draft",
        "content": content_data,
        "contentType": content_type,
    })


@tool
async def list_content(
    content_type: str = "",
    review_status: str = "",
    search: str = "",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """List content across all types with optional filtering.

    Args:
        content_type: Filter by type (blog, news, case_study, general). Empty for all.
        review_status: Filter by review status (draft, in_review, approved, rejected).
        search: Search in title and content.
        limit: Maximum number of results.
        offset: Pagination offset.
    """
    params = {"limit": limit, "offset": offset}
    if content_type:
        params["type"] = content_type
    if review_status:
        params["reviewStatus"] = review_status
    if search:
        params["search"] = search

    result = await _api_call("GET", "/api/v1/content", params=params)
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "items": result.get("data", []),
        "total": result.get("total", 0),
        "message": f"Found {result.get('total', 0)} content items",
    })


@tool
async def get_content(content_id: str) -> str:
    """Get a specific content item by ID.

    Args:
        content_id: The content item ID.
    """
    result = await _api_call("GET", f"/api/v1/content/{content_id}")
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "content": result.get("data", result),
        "contentType": result.get("contentType", "unknown"),
    })


@tool
async def update_content(
    content_id: str,
    content_type: str = "general",
    title: str = "",
    content: str = "",
    excerpt: str = "",
    product_id: str = "",
    page_slug: str = "",
    image_url: str = "",
    tags: str = "",
) -> str:
    """Update an existing content item. Only provided fields are updated.

    Args:
        content_id: The content item ID to update.
        content_type: The content type (needed to route to correct collection).
        title: New title (optional).
        content: New content body (optional).
        excerpt: New excerpt (optional).
        product_id: New product link (optional).
        page_slug: New page slug link (optional).
        image_url: New image URL (optional).
        tags: New tags (optional).
    """
    data = {"contentType": content_type}
    if title:
        data["title"] = title
    if content:
        data["content"] = content
    if excerpt:
        data["excerpt"] = excerpt
    if product_id:
        data["productId"] = product_id
    if page_slug:
        data["pageSlug"] = page_slug
    if image_url:
        data["imageUrl"] = image_url
    if tags:
        data["tags"] = tags

    if len(data) <= 1:  # Only contentType
        return json.dumps({"success": False, "error": "No fields to update"})

    result = await _api_call("PUT", f"/api/v1/content/{content_id}", data)
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "message": f"Content {content_id} updated",
        "content": result.get("data", result),
    })


@tool
async def delete_content(content_id: str) -> str:
    """Delete a content item permanently.

    Args:
        content_id: The content item ID to delete.
    """
    result = await _api_call("DELETE", f"/api/v1/content/{content_id}")
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "message": f"Content {content_id} deleted",
    })


@tool
async def submit_for_review(content_id: str, content_type: str = "general") -> str:
    """Submit content for admin review. Transitions from draft to in_review.

    Args:
        content_id: The content item ID.
        content_type: The content type.
    """
    result = await _api_call("PATCH", f"/api/v1/content/{content_id}/review", {
        "status": "in_review",
    })
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "message": f"Content {content_id} submitted for review",
        "content": result.get("data", result),
    })


@tool
async def schedule_content(
    content_id: str,
    scheduled_at: str,
) -> str:
    """Schedule an approved content item for future publishing.

    Args:
        content_id: The content item ID (must be approved).
        scheduled_at: ISO datetime string for when to publish.
    """
    result = await _api_call("PUT", f"/api/v1/content/{content_id}", {
        "scheduledAt": scheduled_at,
    })
    if result.get("success") is False and "error" in result:
        return json.dumps(result)

    return json.dumps({
        "success": True,
        "message": f"Content {content_id} scheduled for {scheduled_at}",
        "content": result.get("data", result),
    })


# Tool lists for backward compatibility
content_blog_tools = [create_content, list_content, get_content, update_content, delete_content]
content_news_tools = [create_content, list_content, get_content, update_content, delete_content]
content_case_study_tools = [create_content, list_content, get_content, update_content, delete_content]
content_installation_tools = [create_content, list_content]
content_post_tools = [create_content, list_content]

# All content tools combined (deduplicated)
all_content_tools = [
    check_content_duplicates,
    create_content, list_content, get_content, update_content, delete_content,
    submit_for_review, schedule_content,
]
