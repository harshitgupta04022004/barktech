"""Base Agent class for the BarkTech multi-agent system.

All specialized agents inherit from BaseAgent. It provides:
- LLM initialization via OpenRouter
- Tool loading (native @tools + optional MCP tools via factory)
- LangGraph checkpointer for conversation persistence
- Event bus integration for publishing/subscribing
- Session memory via LangGraph Store
- Observability (logging, metrics)
"""

import asyncio
import json
import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Optional

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode

from app.config import config
from app.checkpointer import get_checkpointer, get_store
from app.services.observability import observability

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Base class for all BarkTech domain agents.

    Subclasses must implement:
    - agent_type: str (e.g., "crm", "sales", "content")
    - system_prompt: str (agent-specific instructions)
    - subscribed_events: list[str] (events this agent listens to)
    - handle_event(event_data: dict) -> Optional[dict] (event processing logic)
    """

    agent_type: str = ""
    system_prompt: str = ""
    subscribed_events: list[str] = []

    def __init__(self):
        self._llm = None
        self._tools = None
        self._graph = None

    @property
    def llm(self) -> ChatOpenAI:
        """Lazy-init LLM instance."""
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=config.admin_model,
                openai_api_key=config.openrouter_api_key,
                openai_api_base=config.openrouter_base_url,
                temperature=0.2,
                max_tokens=2048,
                request_timeout=60,
            )
        return self._llm

    async def get_tools(self) -> list:
        """Load all tools for this agent (native + MCP) via the factory.

        This is the single entry point for tool loading. The factory handles:
        1. Loading native LangGraph @tools from app/tools/
        2. Optionally loading MCP tools via MultiServerMCPClient
        3. Graceful degradation if MCP servers are unavailable
        """
        if self._tools is None:
            from app.mcp.clients.mcp_client_factory import get_agent_tools
            self._tools = await get_agent_tools(self.agent_type)
            logger.info(
                f"Agent '{self.agent_type}' loaded {len(self._tools)} tools: "
                f"{[t.name for t in self._tools[:10]]}{'...' if len(self._tools) > 10 else ''}"
            )
        return self._tools

    def _build_graph(self, tools: list):
        """Build a LangGraph agent graph with the given tools."""
        llm = self.llm
        llm_with_tools = llm.bind_tools(tools)

        def agent_node(state: MessagesState):
            response = llm_with_tools.invoke(state["messages"])
            return {"messages": [response]}

        def should_continue(state: MessagesState):
            last = state["messages"][-1]
            if hasattr(last, "tool_calls") and last.tool_calls:
                return "tools"
            return END

        graph = StateGraph(MessagesState)
        graph.add_node("agent", agent_node)
        if tools:
            graph.add_node("tools", ToolNode(tools))
            graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
            graph.add_edge("tools", "agent")
        else:
            graph.add_edge("agent", END)
        graph.add_edge(START, "agent")

        checkpointer = get_checkpointer()
        compile_kwargs = {}
        if checkpointer:
            compile_kwargs["checkpointer"] = checkpointer
        return graph.compile(**compile_kwargs)

    async def get_graph(self):
        """Get or build the agent's LangGraph graph."""
        if self._graph is None:
            tools = await self.get_tools()
            self._graph = self._build_graph(tools)
            logger.info(
                f"Built graph for agent '{self.agent_type}' "
                f"with {len(tools)} tools"
            )
        return self._graph

    async def invoke(self, message: str, thread_id: str, user_context: dict | None = None) -> tuple[str, dict]:
        """Invoke the agent with a user message.

        Args:
            message: User's text message.
            thread_id: Thread ID for conversation persistence.
            user_context: Optional user context dict.

        Returns:
            Tuple of (response_text, usage_data).
        """
        start_time = time.time()

        graph = await self.get_graph()

        messages = [
            SystemMessage(content=self.system_prompt),
        ]

        if user_context:
            ctx_parts = []
            if user_context.get("name"):
                ctx_parts.append(f"User: {user_context['name']}")
            if user_context.get("role"):
                ctx_parts.append(f"Role: {user_context['role']}")
            if ctx_parts:
                messages.append(SystemMessage(content=f"Context: {', '.join(ctx_parts)}"))

        messages.append(HumanMessage(content=message))

        graph_config = {"configurable": {"thread_id": thread_id}}
        usage_data = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost": 0}

        try:
            result = await graph.ainvoke({"messages": messages}, config=graph_config)
            all_messages = result["messages"]

            # Extract usage data
            for msg in all_messages:
                if hasattr(msg, "usage_metadata") and msg.usage_metadata:
                    usage = msg.usage_metadata
                    usage_data["input_tokens"] += usage.get("input_tokens", 0) or 0
                    usage_data["output_tokens"] += usage.get("output_tokens", 0) or 0
                if hasattr(msg, "response_metadata") and msg.response_metadata:
                    meta = msg.response_metadata
                    if "token_usage" in meta:
                        tu = meta["token_usage"]
                        usage_data["input_tokens"] += tu.get("prompt_tokens", 0) or 0
                        usage_data["output_tokens"] += tu.get("completion_tokens", 0) or 0

            usage_data["total_tokens"] = usage_data["input_tokens"] + usage_data["output_tokens"]

            # Extract tool calls
            from app.utils.cost import extract_tool_calls_from_messages
            tc_list = extract_tool_calls_from_messages(all_messages)
            if tc_list:
                usage_data["tool_calls"] = tc_list

            # Get final response
            response_text = ""
            for msg in reversed(all_messages):
                if isinstance(msg, AIMessage) and msg.content:
                    response_text = msg.content
                    break

            if not response_text:
                response_text = f"Agent '{self.agent_type}' could not process the request."

            return response_text, usage_data

        except Exception as e:
            logger.error(f"Agent '{self.agent_type}' error: {e}", exc_info=True)
            latency = (time.time() - start_time) * 1000
            try:
                await observability.log_interaction(
                    session_id=thread_id,
                    source=self.agent_type,
                    user_message=message,
                    assistant_reply="",
                    model=config.admin_model,
                    latency_ms=latency,
                    error=str(e),
                )
            except Exception:
                pass
            return f"Agent error: {str(e)[:200]}", usage_data

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        """Process an incoming event from the event bus.

        Override in subclasses for event-specific handling.
        The response dict is published to the backend via the EventRouter.
        """
        logger.info(f"Agent '{self.agent_type}' received event: {event_type}")
        return None

    def build_structured_response(
        self, response_type: str, payload: dict, text_summary: str = ""
    ) -> dict:
        """Build a structured response dict for the EventRouter.

        This helper ensures all event responses follow the structured format
        that the backend expects.
        """
        from app.agents.serializer import serialize_response
        from app.agents.responses import StructuredResponse, ResponseType

        try:
            rt = ResponseType(response_type)
        except ValueError:
            rt = ResponseType.TEXT

        response = StructuredResponse(
            response_type=rt,
            payload=payload,
            text_summary=text_summary,
        )
        return {
            "structured_response": serialize_response(response),
            "response_type": response_type,
            "payload": payload,
            "text_summary": text_summary,
        }

    async def emit_event(self, event_type: str, payload: dict):
        """Publish an event to the event bus."""
        from app.events.bus import get_event_bus
        bus = get_event_bus()
        try:
            await bus.publish(event_type, {
                "event_type": event_type,
                "source": self.agent_type,
                "payload": json.dumps(payload, default=str),
            })
            logger.info(f"Agent '{self.agent_type}' emitted event: {event_type}")
        except Exception as e:
            logger.error(f"Failed to emit event: {e}")

    async def run_event_loop(self):
        """Subscribe to events and process them indefinitely.

        Now uses the EventRouter which handles response publication
        back to the Node.js backend via Redis response channels.
        """
        from app.agents.event_router import get_event_router

        if not self.subscribed_events:
            logger.info(f"Agent '{self.agent_type}' has no subscribed events")
            return

        router = get_event_router()
        from app.events.bus import get_event_bus
        bus = get_event_bus()
        logger.info(
            f"Agent '{self.agent_type}' starting event loop "
            f"for: {self.subscribed_events}"
        )

        for event_type in self.subscribed_events:
            try:
                async for msg_id, data in bus.subscribe(
                    event_type, f"{self.agent_type}_consumer"
                ):
                    try:
                        result = await self.process_event(event_type, data)
                        await bus.ack(event_type, msg_id)

                        if result:
                            # Use EventRouter to publish response back to backend
                            await router._publish_response(
                                event_type, self.agent_type, result
                            )
                    except Exception as e:
                        logger.error(
                            f"Agent '{self.agent_type}' failed to process "
                            f"event {event_type}: {e}"
                        )
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Event loop error for '{self.agent_type}': {e}")
                await asyncio.sleep(1)
