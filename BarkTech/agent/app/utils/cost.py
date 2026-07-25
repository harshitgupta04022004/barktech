"""Cost calculation utilities for AI model token usage.

Provides cost estimation based on model pricing from OpenRouter.
"""

import logging

logger = logging.getLogger(__name__)

# Approximate pricing per 1M tokens (USD) — based on OpenRouter rates
# These are fallback estimates; actual costs come from API response metadata
MODEL_PRICING: dict[str, dict[str, float]] = {
    # OpenAI models
    "openai/gpt-4o": {"input": 2.50, "output": 10.00},
    "openai/gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "openai/gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "openai/gpt-4": {"input": 30.00, "output": 60.00},
    "openai/gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    # Anthropic models
    "anthropic/claude-3.5-sonnet": {"input": 3.00, "output": 15.00},
    "anthropic/claude-3-haiku": {"input": 0.25, "output": 1.25},
    # DeepSeek models
    "deepseek/deepseek-v4-flash": {"input": 0.00, "output": 0.00},
    "deepseek/deepseek-chat": {"input": 0.14, "output": 0.28},
    "deepseek/deepseek-coder": {"input": 0.14, "output": 0.28},
    # Xiaomi / Mimo
    "xiaomi/mimo-v2.5": {"input": 0.00, "output": 0.00},
    # Free / default
    "default": {"input": 0.00, "output": 0.00},
}

# Default pricing for unknown models (very conservative estimate)
DEFAULT_INPUT_PRICE = 0.50
DEFAULT_OUTPUT_PRICE = 1.50


def calculate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int,
    api_cost: float | None = None,
) -> float:
    """Calculate the cost of an API call in USD.

    If the API provided a cost directly (e.g. OpenRouter response_metadata.cost),
    use that. Otherwise estimate from token counts and model pricing.

    Args:
        model: Model identifier (e.g. 'openai/gpt-4o' or 'deepseek/deepseek-v4-flash')
        input_tokens: Number of input/prompt tokens
        output_tokens: Number of output/completion tokens
        api_cost: Cost reported by the API (takes precedence if > 0)

    Returns:
        Estimated cost in USD
    """
    # If API already provided a cost, trust it
    if api_cost is not None and api_cost > 0:
        return round(api_cost, 6)

    # Look up pricing
    pricing = MODEL_PRICING.get(model, None)
    if pricing is None:
        # Try partial match (e.g. "openai/gpt-4o-2024-08-06" → "openai/gpt-4o")
        for known_model, known_pricing in MODEL_PRICING.items():
            if model.startswith(known_model.rsplit("/", 1)[-1]):
                pricing = known_pricing
                break

    if pricing is None:
        input_price = DEFAULT_INPUT_PRICE
        output_price = DEFAULT_OUTPUT_PRICE
    else:
        input_price = pricing["input"]
        output_price = pricing["output"]

    # Calculate cost: price is per 1M tokens
    cost = (input_tokens * input_price + output_tokens * output_price) / 1_000_000
    return round(cost, 6)


def extract_tool_calls_from_messages(messages: list) -> list[dict]:
    """Extract tool call information from LangGraph message results.

    Scans through the message list for AI messages that contain tool_calls,
    and for ToolMessage responses that contain the tool results.

    Args:
        messages: List of LangGraph messages (AIMessage, ToolMessage, etc.)

    Returns:
        List of tool call dicts with name, input, output, success fields
    """
    tool_calls = []
    tool_messages: dict[str, dict] = {}  # tool_call_id -> response info

    # First pass: collect tool results from ToolMessages
    for msg in messages:
        msg_type = type(msg).__name__
        if msg_type == "ToolMessage":
            tool_id = getattr(msg, "tool_call_id", "")
            content = getattr(msg, "content", "")
            if tool_id:
                tool_messages[tool_id] = {
                    "output": content if isinstance(content, str) else str(content),
                    "success": not getattr(msg, "status", "").startswith("error"),
                }

    # Second pass: extract tool calls from AIMessages
    for msg in messages:
        msg_type = type(msg).__name__
        if msg_type == "AIMessage":
            raw_tool_calls = getattr(msg, "tool_calls", [])
            for tc in raw_tool_calls:
                # Handle both ToolCall objects and dicts
                if hasattr(tc, 'id'):
                    tc_id = tc.id or ""
                    tc_name = tc.name or "unknown"
                    tc_args = tc.args or {}
                elif isinstance(tc, dict):
                    tc_id = tc.get("id", "")
                    tc_name = tc.get("name", "unknown")
                    tc_args = tc.get("args", {})
                else:
                    tc_id = ""
                    tc_name = "unknown"
                    tc_args = {}
                args_str = str(tc_args) if tc_args else ""

                result_info = tool_messages.get(tc_id, {})
                output = result_info.get("output", "")
                success = result_info.get("success", True)

                tool_calls.append({
                    "name": tc_name,
                    "input": args_str[:500],  # Truncate large inputs
                    "output": output[:500] if output else "",  # Truncate large outputs
                    "success": success,
                })

    return tool_calls
