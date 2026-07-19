# Strategy: AI Must Not Invent Specifications

## Objective

Tool-grounded responses only; zero hallucinated specs.

## Architecture

```
User question
  → intent classifier
  → if product/spec question: MUST call search_products / get_product_details
  → LLM composes answer ONLY from tool JSON returned
  → if tool returns empty: "I don't have that spec — talk to specialist"
```

## Prompt rules

- System: "Never state a number not present in tool output."
- Cite: "According to our datasheet for MY-1500A…"
- Price: always "on request" unless `price_type` in DB

## Tests

- 50-question eval set with expected product IDs
- Fail deploy if accuracy &lt; 95% on spec questions

## Stack note (audit)

- Claude Haiku for intent; Sonnet for final response
- Optional Go/Gin backend — same orchestration pattern as multi-step routing pipelines

## Effort

**Included** in AI MVP — non-negotiable requirement
