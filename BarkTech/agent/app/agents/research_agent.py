"""Research Agent — assists all other agents with web research and data gathering.

Event-driven: subscribes to no events (called on-demand by other agents).
Tools (via factory): native @tools from app/tools/mcp_tools (research_url, research_web_search)
                     + MCP tools: duckduckgo, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

RESEARCH_SYSTEM_PROMPT = """You are the Research Agent for Bark Technologies — a B2B machinery company.

## Your Role
You assist all other agents with web research, competitor analysis, and data gathering.

## Capabilities
- Search the web for industry information, standards, and specifications
- Research companies, contacts, and market trends
- Scrape web pages for detailed information
- Analyze competitor products and pricing
- Provide summaries and insights from research

## Rules
- Always cite sources when providing research results
- Focus on relevant, actionable information
- Flag any potentially outdated or unreliable information
- Keep research summaries concise but complete
"""

RESEARCH_SUBSCRIBED_EVENTS = []


class ResearchAgent(BaseAgent):
    """Research Agent — on-demand web research for all other agents."""

    agent_type = "research"
    system_prompt = RESEARCH_SYSTEM_PROMPT
    subscribed_events = RESEARCH_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        """Research agent doesn't process events — it's called on-demand."""
        return None


_research_agent: Optional[ResearchAgent] = None


def get_research_agent() -> ResearchAgent:
    global _research_agent
    if _research_agent is None:
        _research_agent = ResearchAgent()
    return _research_agent
