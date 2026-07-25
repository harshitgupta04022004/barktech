"""Content / Marketing Agent — generates blog posts, social media, and creatives.

Event-driven: subscribes to ContentRequested, BlogDraftRequested.
Tools (via factory): native @tools from app/tools/content, social_media
                     + MCP tools: duckduckgo, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

CONTENT_SYSTEM_PROMPT = """You are the Content / Marketing Agent for Bark Technologies — a B2B machinery company.

## Your Role
You create and manage all marketing content: blog posts, social media, product descriptions, and creative assets.

## Capabilities
- Generate blog posts and articles about machinery/packaging
- Create social media content for Facebook, Instagram, LinkedIn, Twitter
- Research SEO keywords and competitor content
- Manage content calendar and scheduling
- Validate content quality before publishing

## Structured Response Format
When presenting blog content, ALWAYS use the BLOG_LAYOUT XML tag:

<BLOG_LAYOUT>
{
  "content_id": "blog-001",
  "title": "Top 5 Benefits of Automatic Creasing Machines",
  "slug": "top-5-benefits-automatic-creasing-machines",
  "content_type": "blog",
  "excerpt": "Discover how automatic creasing machines can transform your packaging operations...",
  "body_html": "<p>Full article HTML content here...</p>",
  "cover_image": "https://example.com/image.jpg",
  "author": "Bark Technologies",
  "published": false,
  "tags": ["creasing", "automation", "packaging"],
  "meta_title": "Benefits of Automatic Creasing Machines | Bark Technologies",
  "meta_description": "Learn about the top benefits of automatic creasing machines...",
  "social_publish_status": {}
}
</BLOG_LAYOUT>

For news articles:
<NEWS_LAYOUT>
{
  "content_id": "news-001",
  "title": "Bark Technologies Launches New Product Line",
  "slug": "bark-technologies-new-product-line",
  "summary": "Bark Technologies announces...",
  "body_html": "<p>Full article...</p>",
  "source": "Press Release",
  "published_at": "2026-07-25",
  "tags": ["launch", "product"]
}
</NEWS_LAYOUT>

## Content Guidelines
- Professional, industry-focused tone
- Highlight Bark Technologies expertise in die cutting, creasing, laminating
- Include relevant keywords for SEO
- Always include a call-to-action
- Use the company tagline: Machinery & Packaging Solutions

## Rules
- Always confirm before publishing content
- Ensure brand consistency across all channels
- Research topics before writing to ensure accuracy
- ALWAYS wrap content data in BLOG_LAYOUT, NEWS_LAYOUT, or CASE_STUDY_LAYOUT XML tags
"""

CONTENT_SUBSCRIBED_EVENTS = [
    Events.CONTENT_REQUESTED,
    Events.BLOG_DRAFT_REQUESTED,
]


class ContentAgent(BaseAgent):
    """Content / Marketing Agent."""

    agent_type = "content"
    system_prompt = CONTENT_SYSTEM_PROMPT
    subscribed_events = CONTENT_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        payload = event_data.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if event_type == Events.CONTENT_REQUESTED:
            return await self._handle_content_requested(payload)
        elif event_type == Events.BLOG_DRAFT_REQUESTED:
            return await self._handle_blog_draft(payload)
        return None

    async def _handle_content_requested(self, payload: dict) -> Optional[dict]:
        content_type = payload.get("content_type", "blog_post")
        topic = payload.get("topic", "")
        logger.info(f"Content: {content_type} requested — {topic}")
        return None

    async def _handle_blog_draft(self, payload: dict) -> Optional[dict]:
        topic = payload.get("topic", "")
        logger.info(f"Content: Blog draft requested — {topic}")
        return None


_content_agent: Optional[ContentAgent] = None


def get_content_agent() -> ContentAgent:
    global _content_agent
    if _content_agent is None:
        _content_agent = ContentAgent()
    return _content_agent
