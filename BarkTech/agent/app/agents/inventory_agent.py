"""Inventory / Stock Agent — manages stock levels, orders, and reordering.

Event-driven: subscribes to ProductUpdated, StockLow.
Tools (via factory): native @tools from app/tools/stock, products, product_admin
                     + MCP tools: email, duckduckgo, thinking
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent
from app.events.types import Events

logger = logging.getLogger(__name__)

INVENTORY_SYSTEM_PROMPT = """You are the Inventory / Stock Agent for Bark Technologies — a B2B machinery company.

## Your Role
You manage stock levels, track inventory, and handle reorder notifications.

## Capabilities
- Monitor stock levels and identify low-stock items
- Send reorder notifications when stock falls below threshold
- Track incoming/outgoing inventory
- Generate stock reports and analytics
- Research market prices for parts and materials

## Structured Response Format
When presenting stock alerts, ALWAYS use the STOCK_ALERT XML tag:

<STOCK_ALERT>
{
  "product_id": "PROD-001",
  "product_name": "Automatic Creasing Machine",
  "current_stock": 3,
  "min_stock": 5,
  "location": "Main Warehouse",
  "is_low_stock": true,
  "reorder_suggested": true
}
</STOCK_ALERT>

When presenting stock tables, use TABLE_VIEW:
<TABLE_VIEW>
{
  "title": "Stock Levels",
  "headers": ["Product", "Current Stock", "Min Stock", "Status", "Location"],
  "rows": [
    ["Creasing Machine A", "3", "5", "Low Stock", "Warehouse 1"],
    ["Laminator B", "12", "5", "In Stock", "Warehouse 1"],
    ["Punch Cutter", "0", "3", "Out of Stock", "Warehouse 2"]
  ]
}
</TABLE_VIEW>

For analytics:
<STATS_CHART>
{
  "title": "Inventory Overview",
  "metrics": [
    {"label": "Total Products", "value": 45, "trend": "neutral"},
    {"label": "Low Stock Items", "value": 3, "change": "+1", "trend": "up"},
    {"label": "Out of Stock", "value": 1, "trend": "neutral"}
  ],
  "data_points": [
    {"label": "Jan", "value": 120},
    {"label": "Feb", "value": 135},
    {"label": "Mar", "value": 110}
  ]
}
</STATS_CHART>

## Rules
- Alert immediately when stock is critically low
- Track stock movements with timestamps
- Maintain minimum stock levels for high-demand products
- Research alternatives when stock is unavailable
- ALWAYS wrap stock data in STOCK_ALERT, TABLE_VIEW, or STATS_CHART XML tags
"""

INVENTORY_SUBSCRIBED_EVENTS = [
    Events.PRODUCT_UPDATED,
    Events.STOCK_LOW,
]


class InventoryAgent(BaseAgent):
    """Inventory / Stock Management Agent."""

    agent_type = "inventory"
    system_prompt = INVENTORY_SYSTEM_PROMPT
    subscribed_events = INVENTORY_SUBSCRIBED_EVENTS

    async def process_event(self, event_type: str, event_data: dict) -> Optional[dict]:
        payload = event_data.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if event_type == Events.PRODUCT_UPDATED:
            return await self._handle_product_updated(payload)
        elif event_type == Events.STOCK_LOW:
            return await self._handle_stock_low(payload)
        return None

    async def _handle_product_updated(self, payload: dict) -> Optional[dict]:
        product_id = payload.get("product_id", "")
        logger.info(f"Inventory: Product {product_id} updated")
        return None

    async def _handle_stock_low(self, payload: dict) -> Optional[dict]:
        product_name = payload.get("product_name", "")
        current = payload.get("current_stock", 0)
        minimum = payload.get("min_stock", 0)
        logger.info(f"Inventory: LOW STOCK — {product_name} ({current}/{minimum})")

        return {
            "event_type": "StockReorderNeeded",
            "payload": {
                "product_name": product_name,
                "current_stock": current,
                "min_stock": minimum,
                "action": "reorder",
            },
        }


_inventory_agent: Optional[InventoryAgent] = None


def get_inventory_agent() -> InventoryAgent:
    global _inventory_agent
    if _inventory_agent is None:
        _inventory_agent = InventoryAgent()
    return _inventory_agent
