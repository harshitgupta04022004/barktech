"""Web Research MCP for read-only web research.

Provides URL fetching and web search capabilities for the agent.
Uses httpx for fetching and DuckDuckGo for search.
"""

import httpx
import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Common headers for web requests
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BarkBot/1.0; +https://barktechnologies.in)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _extract_text(html: str, max_chars: int = 8000) -> str:
    """Extract readable text from HTML content.

    Simple HTML tag stripper — not a full parser, but sufficient for research.
    """
    # Remove script and style tags and their content
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL)
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Truncate to max_chars
    if len(text) > max_chars:
        text = text[:max_chars] + "... [truncated]"
    return text


async def fetch_url(url: str, max_chars: int = 8000) -> dict:
    """Fetch and return text content from a URL.

    Args:
        url: The URL to fetch.
        max_chars: Maximum characters to return.

    Returns:
        dict with keys: success (bool), url (str), title (str), text (str), error (str).
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return {"success": False, "error": "Only http/https URLs are supported"}

        async with httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type and "text/" not in content_type:
                return {"success": False, "error": f"Unsupported content type: {content_type}"}

            html = resp.text
            # Extract title
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.DOTALL | re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else ""

            text = _extract_text(html, max_chars)

            return {
                "success": True,
                "url": url,
                "title": title,
                "text": text,
                "content_length": len(text),
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching {url}: {e}")
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except httpx.RequestError as e:
        logger.error(f"Request error fetching {url}: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error fetching {url}: {e}")
        return {"success": False, "error": str(e)}


async def search_web(query: str, limit: int = 5) -> list:
    """Search the web for information using DuckDuckGo HTML search.

    Args:
        query: Search query string.
        limit: Maximum number of results to return.

    Returns:
        list of dicts with keys: title, url, snippet.
    """
    try:
        search_url = "https://html.duckduckgo.com/html/"
        async with httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        ) as client:
            resp = await client.post(search_url, data={"q": query})
            resp.raise_for_status()

            html = resp.text

            # Extract search results using regex (DDG HTML layout)
            results = []
            # Match result blocks
            result_blocks = re.findall(
                r'<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>(.*?)</a>.*?'
                r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
                html,
                re.DOTALL,
            )

            for url, title, snippet in result_blocks[:limit]:
                # Clean up title and snippet (remove HTML tags)
                clean_title = re.sub(r"<[^>]+>", "", title).strip()
                clean_snippet = re.sub(r"<[^>]+>", "", snippet).strip()
                # Decode URL if it's a DDG redirect
                if "uddg=" in url:
                    import urllib.parse
                    url = urllib.parse.unquote(url.split("uddg=")[1].split("&")[0])
                results.append({
                    "title": clean_title,
                    "url": url,
                    "snippet": clean_snippet,
                })

            return results
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return []
