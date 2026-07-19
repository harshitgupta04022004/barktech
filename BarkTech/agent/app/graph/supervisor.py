"""Supervisor agent — routes admin tasks to specialized agents via LangGraph."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from app.config import config
from app.graph.admin_state import AdminAgentState

SUPERVISOR_SYSTEM_PROMPT = """You are the Admin Supervisor for Bark Technologies — a B2B machinery company specializing in die cutting, creasing, laminating, window patching, and printing machines.

Your job is to analyze admin requests and route them to the correct specialized agent. You output ONLY a JSON decision — no prose.

## Available agents

- **product**: Product catalog management — search, update, add, remove products, manage categories, specs, images
- **lead**: Lead/inquiry management — view, update, assign, follow up on customer leads and RFQs
- **invoice**: Invoicing — create, update, send, generate PDFs for invoices
- **analytics**: Business analytics — revenue reports, lead conversion, product performance, inventory stats
- **FINISH**: Task is complete and a final answer has been provided

## Routing rules

1. If the task is about products, product catalog, specs, categories → route to "product"
2. If the task is about leads, inquiries, RFQs, customer follow-ups → route to "lead"
3. If the task is about invoices, billing, PDF generation, payments → route to "invoice"
4. If the task is about analytics, reports, dashboards, statistics → route to "analytics"
5. If the task has been completed and a final answer is ready → route to "FINISH"
6. If you need admin approval or clarification before proceeding → set awaiting_human_input=true and output your question

## Human-in-the-loop

If the admin needs to confirm an action (e.g., deleting a product, sending an invoice, bulk operations), set `awaiting_human_input: true` and add the question to `pending_questions`.

## Response format

Respond with ONLY valid JSON matching this structure:
```json
{
  "next_agent": "product|lead|invoice|analytics|FINISH",
  "reasoning": "brief reason for this routing decision",
  "task_context_update": {},
  "awaiting_human_input": false,
  "human_question": null
}
```
"""


def _build_supervisor():
    """Build the supervisor node function."""
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.1,
        max_tokens=512,
    )

    async def supervisor_node(state: AdminAgentState) -> dict:
        """Analyze state and decide which agent handles the next step."""
        import json
        import re

        messages = [
            SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
            *state["messages"],
        ]

        response = await llm.ainvoke(messages)
        raw = response.content.strip()

        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r"\{[\s\S]*\}", raw)
        if not json_match:
            return {
                "next_agent": "FINISH",
                "tool_results": [{"supervisor": "Could not parse routing decision"}],
                "error_log": [f"Supervisor parse error: {raw[:200]}"],
            }

        try:
            decision = json.loads(json_match.group())
        except json.JSONDecodeError:
            return {
                "next_agent": "FINISH",
                "tool_results": [{"supervisor": "Invalid JSON in routing decision"}],
                "error_log": [f"Supervisor JSON error: {json_match.group()[:200]}"],
            }

        valid_agents = {"product", "lead", "invoice", "analytics", "FINISH"}
        next_agent = decision.get("next_agent", "FINISH")
        if next_agent not in valid_agents:
            next_agent = "FINISH"

        update = {
            "next_agent": next_agent,
            "current_agent": next_agent,
            "tool_results": [{"supervisor": decision.get("reasoning", "")}],
        }

        # Update task context if provided
        ctx_update = decision.get("task_context_update", {})
        if ctx_update:
            merged = {**state.get("task_context", {}), **ctx_update}
            update["task_context"] = merged

        # Handle human-in-the-loop
        if decision.get("awaiting_human_input", False):
            update["awaiting_human_input"] = True
            question = decision.get("human_question", "Clarification needed.")
            pending = list(state.get("pending_questions", []))
            pending.append({"question": question, "from_agent": "supervisor"})
            update["pending_questions"] = pending

        return update

    return supervisor_node


supervisor_node = _build_supervisor()
