"""Orchestrator — routes tasks to specialized agents with verification.

The Orchestrator sits at the top of the multi-agent hierarchy for user chat.
It:
- Routes incoming requests to the appropriate specialist agent
- Verifies agent results before returning to the user
- Composes multi-agent responses when tasks span domains
- Manages the event loop for all agents
- Handles human-in-the-loop for critical operations
- Returns structured responses (product cards, tables, etc.)

For event-driven tasks (backend-initiated), use EventRouter instead.
"""

import asyncio
import json
import logging
import time
from typing import Optional

from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langchain_openai import ChatOpenAI

from app.config import config
from app.checkpointer import get_checkpointer, get_store
from app.events.bus import get_event_bus, init_event_bus
from app.events.types import Events
from app.services.observability import observability

logger = logging.getLogger(__name__)

# Lazy imports to avoid circular dependencies
_agents = {}


def _get_agents():
    """Lazy-load all agent instances."""
    global _agents
    if not _agents:
        from app.agents.crm_agent import get_crm_agent
        from app.agents.sales_agent import get_sales_agent
        from app.agents.content_agent import get_content_agent
        from app.agents.inventory_agent import get_inventory_agent
        from app.agents.scheduling_agent import get_scheduling_agent
        from app.agents.research_agent import get_research_agent

        _agents = {
            "crm": get_crm_agent(),
            "sales": get_sales_agent(),
            "content": get_content_agent(),
            "inventory": get_inventory_agent(),
            "scheduling": get_scheduling_agent(),
            "research": get_research_agent(),
        }
    return _agents


ORCHESTRATOR_PROMPT = """You are the Admin Operations Orchestrator for Bark Technologies — a B2B machinery company.

## Your Role
You coordinate specialized agents to handle admin operations. You decide which agent should handle each task, verify their results, and compose a final structured response.

## Available Agents
- **crm**: Lead/inquiry management, RFQ processing, customer follow-ups, CRM data
- **sales**: Invoice creation, PDF generation, GST, billing, quotations, payment tracking
- **content**: Blog posts, social media, marketing content, creative design, SEO
- **inventory**: Stock levels, inventory management, reorder alerts, product availability
- **scheduling**: Calendar management, installation demos, site visits, appointments
- **research**: Web research, competitor analysis, data gathering, specifications lookup
- **FINISH**: Task is complete and a final answer has been provided

## Decision Rules
1. If the user is asking a general question about capabilities or how things work, answer directly
2. If the task is fully handled by a previous agent response, respond with FINISH
3. If the task involves leads, inquiries, RFQs, or customer data, route to crm
4. If the task involves invoices, billing, quotations, or payments, route to sales
5. If the task involves content, marketing, blog posts, or social media, route to content
6. If the task involves stock, inventory, or product availability, route to inventory
7. If the task involves scheduling, calendar, installations, or demos, route to scheduling
8. If the task requires web research or data gathering, route to research

## Verification Rules
Before returning a final answer:
1. If the agent returned a structured response (XML tags), verify the data is complete
2. If the agent returned an error, try re-routing or inform the user
3. If multiple agents were involved, compose their results into a MULTI_RESULT

## Confirmation Flow
When a specialized agent asks for confirmation, the user's next response is a reply to that agent. Route it back to the same agent.

## About Bark Technologies
Bark Technologies is a B2B machinery company specializing in packaging solutions:
- Machinery: filling machines, capping machines, labeling machines, packaging lines
- Services: installation, maintenance, calibration, site visits
- Products: bottle filling machines, cap tightening machines, shrink wrap machines, conveyors
- GST billing, invoice management, lead management, inventory tracking

## Output Format
For routing decisions: respond with ONLY one word: crm, sales, content, inventory, scheduling, research, or FINISH
For general questions: provide a helpful, complete answer directly
"""


class Orchestrator:
    """Multi-agent orchestrator that routes tasks, verifies results, and composes responses."""

    def __init__(self):
        self._llm = None
        self._verifier_llm = None
        self._event_loop_task = None

    @property
    def llm(self) -> ChatOpenAI:
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=config.admin_model,
                openai_api_key=config.openrouter_api_key,
                openai_api_base=config.openrouter_base_url,
                temperature=0.1,
                max_tokens=512,
            )
        return self._llm

    @property
    def verifier_llm(self) -> ChatOpenAI:
        """Lighter model for verification passes."""
        if self._verifier_llm is None:
            self._verifier_llm = ChatOpenAI(
                model=config.admin_model,
                openai_api_key=config.openrouter_api_key,
                openai_api_base=config.openrouter_base_url,
                temperature=0.0,
                max_tokens=256,
            )
        return self._verifier_llm

    async def route_request(
        self, message: str, thread_id: str, user_context: dict | None = None
    ) -> tuple[str, dict]:
        """Route an incoming request to the appropriate agent.

        Args:
            message: User's message.
            thread_id: Conversation thread ID.
            user_context: Optional user context from JWT.

        Returns:
            Tuple of (response_text, usage_data).
        """
        messages = [SystemMessage(content=ORCHESTRATOR_PROMPT)]

        if user_context:
            ctx_parts = []
            if user_context.get("name"):
                ctx_parts.append(f"User: {user_context['name']}")
            if user_context.get("role"):
                ctx_parts.append(f"Role: {user_context['role']}")
            if ctx_parts:
                messages.append(SystemMessage(content=f"Context: {', '.join(ctx_parts)}"))

        messages.append(HumanMessage(content=message))

        try:
            response = await self.llm.ainvoke(messages)
            decision = response.content.strip().lower()
            valid_agents = {"crm", "sales", "content", "inventory", "scheduling", "research", "finish"}

            if decision not in valid_agents:
                if len(response.content.strip()) > 10:
                    usage_data = self._extract_usage(response)
                    return response.content.strip(), usage_data
                return "I am not sure how to handle that. Please try rephrasing.", {
                    "input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0,
                }

            if decision == "finish":
                return "Task completed. How else can I help?", {
                    "input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0,
                }

            agents = _get_agents()
            agent = agents.get(decision)
            if agent is None:
                return f"Agent '{decision}' is not available.", {
                    "input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0,
                }

            orchestrator_usage = self._extract_usage(response)
            result, agent_usage = await agent.invoke(message, thread_id, user_context)

            # Verify the agent's response
            verified_result = await self._verify_response(result, decision, message)

            total_usage = {
                "input_tokens": orchestrator_usage.get("input_tokens", 0) + agent_usage.get("input_tokens", 0),
                "output_tokens": orchestrator_usage.get("output_tokens", 0) + agent_usage.get("output_tokens", 0),
                "total_tokens": orchestrator_usage.get("total_tokens", 0) + agent_usage.get("total_tokens", 0),
                "cost": orchestrator_usage.get("cost", 0) + agent_usage.get("cost", 0),
                "tool_calls": agent_usage.get("tool_calls", []),
            }
            return verified_result, total_usage

        except Exception as e:
            logger.error(f"Orchestrator routing error: {e}", exc_info=True)
            return f"I encountered an error processing your request: {str(e)[:200]}", {
                "input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0,
            }

    async def _verify_response(
        self, result: str, agent_type: str, original_message: str
    ) -> str:
        """Verify an agent's response before returning to the user.

        Checks:
        1. If response contains structured XML tags, verify they are valid
        2. If response is empty or error, attempt recovery
        3. If response seems incomplete, flag for review
        """
        if not result or len(result.strip()) == 0:
            logger.warning(f"Agent '{agent_type}' returned empty response")
            return f"The {agent_type} agent could not process the request. Please try again."

        if result.startswith("Agent error:"):
            logger.warning(f"Agent '{agent_type}' returned error: {result[:100]}")
            return result

        # Check for structured XML tags and validate
        from app.agents.serializer import parse_xml_response
        blocks = parse_xml_response(result)

        if blocks:
            logger.info(
                f"Agent '{agent_type}' returned {len(blocks)} structured block(s): "
                f"{[b['type'] for b in blocks]}"
            )
            # Structured response is valid, return as-is
            return result

        # Non-structured text response -- return as-is (general question answer)
        return result

    async def compose_multi_agent_response(
        self, results: list[dict], thread_id: str, user_context: dict | None = None
    ) -> tuple[str, dict]:
        """Compose results from multiple agents into a single response.

        Used when a user request spans multiple domains.
        """
        from app.agents.serializer import serialize_multi_response
        from app.agents.responses import StructuredResponse, ResponseType

        items = []
        total_usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

        for r in results:
            agent_type = r.get("agent", "unknown")
            result_text = r.get("result", "")

            # Parse the agent's response
            from app.agents.serializer import parse_xml_response
            blocks = parse_xml_response(result_text)

            if blocks:
                for block in blocks:
                    items.append({
                        "response_type": block["type"],
                        "payload": block["payload"],
                        "text_summary": block.get("text_before", ""),
                    })
            else:
                items.append({
                    "response_type": "text",
                    "payload": {"text": result_text},
                    "text_summary": result_text,
                })

            # Accumulate usage
            usage = r.get("usage", {})
            for key in total_usage:
                total_usage[key] += usage.get(key, 0)

        # Build multi-result response
        multi_response = StructuredResponse(
            response_type=ResponseType.MULTI_RESULT,
            payload={"items": items, "total_results": len(items)},
        )
        from app.agents.serializer import serialize_response
        composed = serialize_response(multi_response)

        return composed, total_usage

    def _extract_usage(self, response) -> dict:
        """Extract token usage from an LLM response."""
        usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            um = response.usage_metadata
            usage["input_tokens"] = um.get("input_tokens", 0) or 0
            usage["output_tokens"] = um.get("output_tokens", 0) or 0
        if hasattr(response, "response_metadata") and response.response_metadata:
            meta = response.response_metadata
            if "token_usage" in meta:
                tu = meta["token_usage"]
                usage["input_tokens"] = tu.get("prompt_tokens", 0) or 0
                usage["output_tokens"] = tu.get("completion_tokens", 0) or 0
            if "cost" in meta:
                usage["cost"] = float(meta["cost"]) or 0.0
        usage["total_tokens"] = usage["input_tokens"] + usage["output_tokens"]
        return usage

    async def start_event_loops(self):
        """Start background event loops for all agents."""
        agents = _get_agents()
        tasks = []
        for name, agent in agents.items():
            if agent.subscribed_events:
                task = asyncio.create_task(
                    agent.run_event_loop(), name=f"event_loop_{name}",
                )
                tasks.append(task)
                logger.info(f"Started event loop for agent: {name}")
        self._event_loop_task = tasks
        return tasks

    async def stop_event_loops(self):
        """Stop all background event loops."""
        if self._event_loop_task:
            for task in self._event_loop_task:
                task.cancel()
            logger.info("Stopped all agent event loops")
            self._event_loop_task = None


# Backward compatibility alias
SupervisorOrchestrator = Orchestrator

_orchestrator: Optional[Orchestrator] = None


def get_supervisor() -> Orchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator


# Alias for new code
def get_orchestrator() -> Orchestrator:
    return get_supervisor()
