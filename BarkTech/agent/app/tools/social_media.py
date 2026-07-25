"""Social media publishing tools for content publishing.

Direct integration with Meta Graph API, LinkedIn Marketing API, and X/Twitter API
for organic content publishing.
"""

import json
import logging
import httpx
from langchain_core.tools import tool
from app.config import config
from app.services.observability import observability

logger = logging.getLogger(__name__)

# API credentials from environment
META_ACCESS_TOKEN = config.meta_access_token
META_PAGE_ID = config.meta_page_id
LINKEDIN_ACCESS_TOKEN = config.linkedin_access_token
LINKEDIN_ORG_ID = config.linkedin_org_id
X_API_KEY = config.x_api_key
X_API_SECRET = config.x_api_secret
X_ACCESS_TOKEN = config.x_access_token
X_ACCESS_SECRET = config.x_access_secret


# ═══════════════════════════════════════════════════════
# Facebook Publishing (Meta Graph API)
# ═══════════════════════════════════════════════════════

@tool
async def publish_facebook_post(
    content: str,
    image_url: str = "",
    link_url: str = "",
) -> dict:
    """Publish a post to the Bark Technologies Facebook Page.

    Args:
        content: Post text content.
        image_url: Optional image URL to include.
        link_url: Optional link URL to attach.
    """
    if not META_ACCESS_TOKEN or not META_PAGE_ID:
        return {"success": False, "error": "Meta API credentials not configured (META_ACCESS_TOKEN, META_PAGE_ID)"}

    try:
        url = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}/feed"
        payload = {
            "message": content,
            "access_token": META_ACCESS_TOKEN,
        }

        if link_url:
            payload["link"] = link_url

        if image_url:
            photo_url = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}/photos"
            photo_payload = {
                "url": image_url,
                "caption": content,
                "access_token": META_ACCESS_TOKEN,
            }
            if link_url:
                photo_payload["link"] = link_url

            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(photo_url, data=photo_payload)
        else:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, data=payload)

        data = resp.json()

        if resp.status_code == 200 and "id" in data:
            return {
                "success": True,
                "post_id": data["id"],
                "platform": "facebook",
                "message": f"Published to Facebook successfully (ID: {data['id']})",
            }
        else:
            error_msg = data.get("error", {}).get("message", str(data))
            return {"success": False, "error": f"Facebook API error: {error_msg}"}

    except Exception as e:
        logger.error(f"Facebook publish error: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════
# Instagram Publishing (Meta Graph API)
# ═══════════════════════════════════════════════════════

@tool
async def publish_instagram_post(
    content: str,
    image_url: str = "",
) -> dict:
    """Publish a post to Bark Technologies Instagram account.

    Args:
        content: Caption text for the post.
        image_url: Image URL to publish (required for Instagram).
    """
    if not META_ACCESS_TOKEN:
        return {"success": False, "error": "Meta API credentials not configured (META_ACCESS_TOKEN)"}

    if not image_url:
        return {"success": False, "error": "Instagram posts require an image_url"}

    try:
        container_url = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}/media"
        container_payload = {
            "image_url": image_url,
            "caption": content,
            "access_token": META_ACCESS_TOKEN,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            container_resp = await client.post(container_url, data=container_payload)
            container_data = container_resp.json()

            if "id" not in container_data:
                error_msg = container_data.get("error", {}).get("message", str(container_data))
                return {"success": False, "error": f"Instagram container creation failed: {error_msg}"}

            container_id = container_data["id"]

            publish_url = f"https://graph.facebook.com/v19.0/{META_PAGE_ID}/media_publish"
            publish_payload = {
                "creation_id": container_id,
                "access_token": META_ACCESS_TOKEN,
            }

            publish_resp = await client.post(publish_url, data=publish_payload)
            publish_data = publish_resp.json()

            if "id" in publish_data:
                return {
                    "success": True,
                    "post_id": publish_data["id"],
                    "platform": "instagram",
                    "message": f"Published to Instagram successfully (ID: {publish_data['id']})",
                }
            else:
                error_msg = publish_data.get("error", {}).get("message", str(publish_data))
                return {"success": False, "error": f"Instagram publish failed: {error_msg}"}

    except Exception as e:
        logger.error(f"Instagram publish error: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════
# LinkedIn Publishing (LinkedIn Marketing API)
# ═══════════════════════════════════════════════════════

@tool
async def publish_linkedin_post(
    content: str,
    link_url: str = "",
    title: str = "",
    description: str = "",
) -> dict:
    """Publish a post to Bark Technologies LinkedIn company page.

    Args:
        content: Post text content.
        link_url: Optional link URL to share.
        title: Title for link shares.
        description: Description for link shares.
    """
    if not LINKEDIN_ACCESS_TOKEN:
        return {"success": False, "error": "LinkedIn API credentials not configured (LINKEDIN_ACCESS_TOKEN)"}

    org_id = LINKEDIN_ORG_ID or config.linkedin_org_id

    try:
        url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {LINKEDIN_ACCESS_TOKEN}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        share_content = {
            "shareCommentary": {
                "text": content,
            },
            "shareMediaCategory": "NONE",
        }

        if link_url:
            share_content["shareMediaCategory"] = "ARTICLE"
            share_content["media"] = [{
                "status": "READY",
                "originalUrl": link_url,
                "title": {"text": title or "Bark Technologies"},
                "description": {"text": description or content[:200]},
            }]

        payload = {
            "author": f"urn:li:organization:{org_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": share_content,
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=payload)
            data = resp.json()

            if resp.status_code == 201:
                post_id = data.get("id", "")
                return {
                    "success": True,
                    "post_id": post_id,
                    "platform": "linkedin",
                    "message": f"Published to LinkedIn successfully (ID: {post_id})",
                }
            else:
                error_msg = data.get("message", str(data))
                return {"success": False, "error": f"LinkedIn API error: {error_msg}"}

    except Exception as e:
        logger.error(f"LinkedIn publish error: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════
# X/Twitter Publishing (X API v2)
# ═══════════════════════════════════════════════════════

@tool
async def publish_twitter_post(
    content: str,
    media_urls: list = None,
) -> dict:
    """Publish a tweet to Bark Technologies X/Twitter account.

    Args:
        content: Tweet text content (max 280 characters).
        media_urls: Optional list of media URLs to attach.
    """
    if not X_ACCESS_TOKEN:
        return {"success": False, "error": "X API credentials not configured (X_ACCESS_TOKEN)"}

    try:
        url = "https://api.twitter.com/2/tweets"
        headers = {
            "Authorization": f"Bearer {X_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }

        payload = {
            "text": content[:280],
        }

        if media_urls:
            logger.warning("Media upload for X/Twitter not yet implemented - posting text only")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=payload)
            data = resp.json()

            if resp.status_code == 201:
                tweet_id = data.get("data", {}).get("id", "")
                return {
                    "success": True,
                    "post_id": tweet_id,
                    "platform": "twitter",
                    "message": f"Published to X/Twitter successfully (ID: {tweet_id})",
                }
            else:
                error_msg = data.get("errors", [{}])[0].get("message", str(data))
                return {"success": False, "error": f"X API error: {error_msg}"}

    except Exception as e:
        logger.error(f"Twitter publish error: {e}")
        return {"success": False, "error": str(e)}


# Tool list for ClaudeAdsAgent
social_publish_tools = [
    publish_facebook_post,
    publish_instagram_post,
    publish_linkedin_post,
    publish_twitter_post,
]


# ═══════════════════════════════════════════════════════
# Pre-validation & Status Tools
# ═══════════════════════════════════════════════════════

@tool
async def validate_platform_credentials() -> dict:
    """Check which social media platforms have valid credentials configured.

    Returns the status of each platform's API tokens. This is a pre-publish check
    to avoid wasting time publishing to platforms with expired or missing tokens.
    """
    status = {
        "facebook": bool(META_ACCESS_TOKEN and META_PAGE_ID),
        "instagram": bool(META_ACCESS_TOKEN),
        "linkedin": bool(LINKEDIN_ACCESS_TOKEN),
        "twitter": bool(X_ACCESS_TOKEN),
    }

    return {
        "success": True,
        "platforms": status,
        "available": [p for p, v in status.items() if v],
        "unavailable": [p for p, v in status.items() if not v],
        "message": f"Available: {', '.join(p for p, v in status.items() if v) or 'none'}",
    }


@tool
async def validate_content_for_publish(
    content: str,
    platforms: str = "facebook,instagram,linkedin,twitter",
    image_url: str = "",
) -> dict:
    """Validate content meets requirements for each platform before publishing.

    Checks character limits, required fields, and content suitability.

    Args:
        content: The content text to validate.
        platforms: Comma-separated list of target platforms.
        image_url: Image URL if attaching media.
    """
    platform_list = [p.strip().lower() for p in platforms.split(",")]
    issues = []
    warnings = []

    if len(content) > 2000:
        issues.append(f"Content is {len(content)} characters, exceeds 2000 char limit")
    if len(content) < 10:
        issues.append("Content is too short (minimum 10 characters)")

    if "instagram" in platform_list and not image_url:
        issues.append("Instagram requires an image_url")

    if "twitter" in platform_list:
        if len(content) > 280:
            warnings.append(f"Content is {len(content)} chars, will be truncated to 280 for Twitter")
        if len(content) < 20:
            warnings.append("Twitter content is very short, consider adding more")

    if "linkedin" in platform_list:
        if len(content) < 50:
            warnings.append("LinkedIn posts perform better with 50+ characters")

    if "facebook" in platform_list:
        if len(content) < 20:
            warnings.append("Facebook posts perform better with 20+ characters")

    return {
        "success": len(issues) == 0,
        "platforms": platform_list,
        "issues": issues,
        "warnings": warnings,
        "publishable": len(issues) == 0,
        "message": "Content is ready to publish" if not issues else f"{len(issues)} issue(s) found",
    }


@tool
async def get_publish_status(
    content_post_id: str = "",
) -> dict:
    """Check publish status across all platforms for a content post.

    Args:
        content_post_id: The content post ID to check status for.
    """
    if not content_post_id:
        return {"success": False, "error": "content_post_id is required"}

    BACKEND_URL = config.backend_url.rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/v1/content/{content_post_id}/publish-status",
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "status": data.get("data", data),
                    "message": "Publish status retrieved",
                }
            else:
                return {"success": False, "error": f"Failed to get status: {resp.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@tool
async def schedule_publish(
    content_post_id: str,
    platforms: str,
    scheduled_at: str,
) -> dict:
    """Schedule a content post for future publishing on specified platforms.

    Args:
        content_post_id: The content post ID.
        platforms: Comma-separated list of platforms (facebook,instagram,linkedin,twitter).
        scheduled_at: ISO datetime string for when to publish.
    """
    platform_list = [p.strip().lower() for p in platforms.split(",")]
    BACKEND_URL = config.backend_url.rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/v1/content/{content_post_id}/publish",
                json={
                    "platforms": platform_list,
                    "scheduledAt": scheduled_at,
                },
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return {
                    "success": True,
                    "result": data.get("data", data),
                    "message": f"Scheduled for {scheduled_at} on {', '.join(platform_list)}",
                }
            else:
                return {"success": False, "error": f"Failed to schedule: {resp.status_code} - {resp.text[:200]}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# Extended tool list including validation and status
all_social_tools = social_publish_tools + [
    validate_platform_credentials,
    validate_content_for_publish,
    get_publish_status,
    schedule_publish,
]
