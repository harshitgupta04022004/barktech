"""Admin agent state definition — multi-agent collaboration state."""

from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from operator import add


class AdminAgentState(TypedDict):
    """State for admin multi-agent collaboration system."""
    messages: Annotated[list[BaseMessage], add]
    admin_id: str
    admin_role: str
    current_agent: str
    next_agent: str
    task_context: dict
    pending_questions: list[dict]
    human_responses: dict
    awaiting_human_input: bool
    human_input_timeout: int | None
    tool_results: Annotated[list[dict], add]
    whatsapp_notifications: Annotated[list[dict], add]
    error_log: Annotated[list[str], add]
