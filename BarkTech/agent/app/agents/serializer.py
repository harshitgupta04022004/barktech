"""XML tag serializer for structured agent responses.

Converts StructuredResponse objects to XML-tagged strings that the frontend
React components can parse and render as rich UI elements.
"""

import json
import logging
from typing import Any

from app.agents.responses import (
    StructuredResponse,
    ResponseType,
)

logger = logging.getLogger(__name__)

# ── XML Tag Mapping ───────────────────────────────────

# ResponseType -> XML tag name
TAG_MAP = {
    ResponseType.TEXT: None,  # Text has no wrapper tag
    ResponseType.PRODUCT_CARD: "PRODUCT_CARD",
    ResponseType.PRODUCT_LIST: "PRODUCT_LIST",
    ResponseType.INVOICE_CARD: "INVOICE_CARD",
    ResponseType.INVOICE_LIST: "INVOICE_LIST",
    ResponseType.EMAIL_LAYOUT: "EMAIL_LAYOUT",
    ResponseType.BLOG_LAYOUT: "BLOG_LAYOUT",
    ResponseType.NEWS_LAYOUT: "NEWS_LAYOUT",
    ResponseType.CASE_STUDY_LAYOUT: "CASE_STUDY_LAYOUT",
    ResponseType.LEAD_CARD: "LEAD_CARD",
    ResponseType.LEAD_LIST: "LEAD_LIST",
    ResponseType.STOCK_ALERT: "STOCK_ALERT",
    ResponseType.TABLE_VIEW: "TABLE_VIEW",
    ResponseType.STATS_CHART: "STATS_CHART",
    ResponseType.DELETE_CONFIRM: "DELETE_CONFIRM",
    ResponseType.HITL_CONFIRM: "HITL_CONFIRM",
    ResponseType.MULTI_RESULT: "MULTI_RESULT",
    ResponseType.CALENDAR_EVENT: "CALENDAR_EVENT",
    ResponseType.WHATSAPP_CONFIRM: "WHATSAPP_CONFIRM",
}


def serialize_response(response: StructuredResponse) -> str:
    """Convert a StructuredResponse to an XML-tagged string.

    For TEXT responses, returns the text_summary only.
    For all other types, wraps the payload in the appropriate XML tag.

    Example output for INVOICE_CARD:
        Here is the invoice summary.

        <INVOICE_CARD>
        {"invoice_id": "BARK2627S120", "customer_name": "Acme Corp", ...}
        </INVOICE_CARD>
    """
    tag = TAG_MAP.get(response.response_type)

    parts = []

    # Always include the text summary if present
    if response.text_summary:
        parts.append(response.text_summary)

    # For text-only responses, return just the summary
    if tag is None:
        return response.text_summary or ""

    # Wrap payload in XML tag
    payload_json = json.dumps(response.payload, default=str, ensure_ascii=False)
    parts.append(f"<{tag}>\n{payload_json}\n</{tag}>")

    # Append action buttons as XML if present
    if response.action_buttons:
        buttons_json = json.dumps(response.action_buttons, default=str, ensure_ascii=False)
        parts.append(f"<ACTION_BUTTONS>\n{buttons_json}\n</ACTION_BUTTONS>")

    return "\n\n".join(parts)


def serialize_multi_response(responses: list[StructuredResponse]) -> str:
    """Serialize multiple responses into a MULTI_RESULT wrapper.

    Used by the Orchestrator when it delegates to multiple agents
    and composes their results.
    """
    items = []
    for resp in responses:
        items.append({
            "response_type": resp.response_type.value,
            "payload": resp.payload,
            "text_summary": resp.text_summary,
        })

    multi = StructuredResponse(
        response_type=ResponseType.MULTI_RESULT,
        payload={
            "items": items,
            "total_results": len(items),
        },
        text_summary="",
    )
    return serialize_response(multi)


def parse_xml_response(content: str) -> list[dict]:
    """Parse XML-tagged content from agent output into structured blocks.

    Returns a list of dicts, each with:
    - type: the tag name (e.g., "PRODUCT_CARD")
    - payload: parsed JSON dict
    - text_before: text preceding the tag
    - text_after: text following the tag

    Returns empty list if no structured tags found.
    """
    import re

    blocks = []
    # Build regex for all known tags
    tag_names = [t for t in TAG_MAP.values() if t is not None]
    tag_pattern = "|".join(tag_names)
    regex = rf"<({tag_pattern})>\s*(\{{[\s\S]*?\}})\s*</\1>"

    for match in re.finditer(regex, content):
        tag_name = match.group(1)
        try:
            payload = json.loads(match.group(2))
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON in <{tag_name}> tag")
            continue

        start = match.start()
        end = match.end()

        blocks.append({
            "type": tag_name,
            "payload": payload,
            "text_before": content[:start].strip(),
            "text_after": content[end:].strip(),
            "start": start,
            "end": end,
        })

    return blocks
