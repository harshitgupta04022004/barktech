"""Client agent — lightweight single-agent for customer-facing chat.

Uses a simple ReAct loop with product catalog tools.
Bridges the old routes.py interface to the new agent system.
"""

import logging
import time
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

from app.config import config

logger = logging.getLogger(__name__)

CLIENT_SYSTEM_PROMPT = """You are a helpful AI assistant for Bark Technologies — a B2B machinery company specializing in packaging solutions.

## Your Role
Help customers with:
- Product questions (filling machines, capping machines, labeling machines, packaging lines)
- RFQ (Request for Quotation) inquiries
- FAQ about the company and products
- Installation and maintenance inquiries

## About Bark Technologies
- B2B machinery company: filling machines, capping machines, labeling machines, packaging lines
- Services: installation, maintenance, calibration, site visits
- GST billing, lead management
- License: UDYAM-UP-28-0004163

## Guidelines
- Be helpful, concise, and professional
- If you don't have specific product info, offer to connect them with the team
- For pricing inquiries, suggest they submit an RFQ
- Always use the company's brand name "Bark Technologies"
"""


async def run_client_agent(
    message: str,
    thread_id: str,
    user_context: dict = None,
) -> tuple[str, dict]:
    """Run the client-facing chat agent.

    Args:
        message: User's message.
        thread_id: Conversation thread ID.
        user_context: Optional user context from JWT.

    Returns:
        Tuple of (response_text, usage_data).
    """
    start = time.time()

    try:
        llm = ChatOpenAI(
            model=config.client_model,
            openai_api_key=config.openrouter_api_key,
            openai_api_base=config.openrouter_base_url,
            temperature=0.3,
            max_tokens=1024,
        )

        messages = [SystemMessage(content=CLIENT_SYSTEM_PROMPT)]

        if user_context and user_context.get("name"):
            messages.append(SystemMessage(content=f"Customer: {user_context['name']}"))

        messages.append(HumanMessage(content=message))

        response = await llm.ainvoke(messages)
        result = response.content

        latency = (time.time() - start) * 1000
        usage_data = {
            "input_tokens": getattr(response, "usage_metadata", {}).get("input_tokens", 0) if hasattr(response, "usage_metadata") else 0,
            "output_tokens": getattr(response, "usage_metadata", {}).get("output_tokens", 0) if hasattr(response, "usage_metadata") else 0,
            "total_tokens": getattr(response, "usage_metadata", {}).get("total_tokens", 0) if hasattr(response, "usage_metadata") else 0,
            "cost": 0,
            "tool_calls": [],
            "latency_ms": latency,
        }

        logger.info(f"Client agent responded in {latency:.0f}ms for thread={thread_id}")
        return result, usage_data

    except Exception as e:
        logger.error(f"Client agent error: {e}", exc_info=True)
        return f"I'm sorry, I encountered an error processing your request. Please try again or contact support@barktechnologies.in.", {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost": 0,
            "tool_calls": [],
        }
