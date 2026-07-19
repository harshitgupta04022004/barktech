"""Stock / inventory tools — native LangGraph @tools against MongoDB."""

from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


@tool
async def get_stock_info(product_id: str = "", product_name: str = "") -> str:
    """Check inventory/stock information for products. Admin-only tool.

    Args:
        product_id: Optional MongoDB ObjectId of the product
        product_name: Optional product name to search stock by
    """
    from bson import ObjectId
    db = _get_db()
    query = {}

    if product_id:
        try:
            query["productId"] = ObjectId(product_id)
        except Exception:
            query["productId"] = product_id

    cursor = db.stocks.find(query).limit(10)
    stocks = await cursor.to_list(length=10)

    if not stocks and product_name:
        # Search by product name
        products = await db.products.find({"name": {"$regex": product_name, "$options": "i"}}).limit(5).to_list(5)
        product_ids = [p["_id"] for p in products]
        if product_ids:
            stocks = await db.stocks.find({"productId": {"$in": product_ids}}).to_list(10)

    if not stocks:
        return "No stock information found."

    results = []
    for s in stocks:
        qty = s.get("quantity", 0)
        reserved = s.get("reserved", 0)
        available = qty - reserved
        status = "Low Stock" if available <= s.get("lowStockThreshold", 5) else "In Stock"
        results.append(
            f"- **{s.get('productName', 'Unknown')}**: {qty} units total, {reserved} reserved, {available} available ({status})"
        )

    return f"Stock Information:\n\n" + "\n".join(results)


@tool
async def get_low_stock_products() -> str:
    """Get list of products with low stock levels. Admin-only tool."""
    db = _get_db()
    cursor = db.stocks.find({
        "$expr": {"$lte": [{"$subtract": ["$quantity", "$reserved"]}, "$lowStockThreshold"]}
    }).limit(20)
    stocks = await cursor.to_list(length=20)

    if not stocks:
        return "No low stock products found. All products are adequately stocked."

    results = []
    for s in stocks:
        qty = s.get("quantity", 0)
        reserved = s.get("reserved", 0)
        available = qty - reserved
        threshold = s.get("lowStockThreshold", 5)
        results.append(
            f"- **{s.get('productName', 'Unknown')}**: {available} available (threshold: {threshold})"
        )

    return f"Low Stock Alert ({len(stocks)} products below threshold):\n\n" + "\n".join(results)
