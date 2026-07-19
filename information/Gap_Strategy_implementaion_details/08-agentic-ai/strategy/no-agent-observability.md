# Strategy: No Agent Tooling or Observability

## Objective

Production-grade agent ops from day one.

## Agent tools (register all)

- `search_products`, `get_product_details`, `compare_products`
- `create_rfq`, `get_faq`, `handoff_to_human`

## Observability

- **Observability**: trace every tool call
- Log: latency, token cost, user feedback thumbs up/down
- Alert if error rate &gt; 5%

## Human review

- Dashboard: flagged conversations
- Sales can correct answer → feeds FAQ improvement

## Effort

**Low–Medium** (setup with agent build)
