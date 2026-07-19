"""Product tools — search and spec lookup."""

from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
import re
from bson import ObjectId

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


@tool
async def search_products(query: str = "", category: str = "") -> str:
    """Search Bark Technologies product catalog. Use this when a customer asks about products, machinery, or equipment.

    Args:
        query: Search text (product name, feature, or keyword)
        category: Optional category filter (e.g., 'die-cutting', 'laminating')
    """
    db = _get_db()
    filter_query = {"isActive": True}

    if query:
        words = [re.escape(w) for w in query.split() if len(w) > 2]
        if words:
            filter_query["$or"] = [
                {"name": {"$regex": "|".join(words), "$options": "i"}},
                {"shortDescription": {"$regex": "|".join(words), "$options": "i"}},
                {"description": {"$regex": "|".join(words), "$options": "i"}},
            ]
    if category:
        # Look up category by slug to get its ObjectId
        cat = await db.categories.find_one({"slug": category})
        if cat:
            filter_query["categoryId"] = cat["_id"]

    cursor = db.products.find(filter_query).limit(10)
    products = await cursor.to_list(length=10)

    if not products:
        return "No products found matching your criteria."

    results = []
    for p in products:
        results.append(
            f"- **{p['name']}**: {p.get('shortDescription', p.get('description', '')[:100])}"
        )

    return f"Found {len(results)} products:\n" + "\n".join(results)


@tool
async def get_product_specs(product_id: str) -> str:
    """Get detailed specifications for a specific product.

    Args:
        product_id: The MongoDB ObjectId of the product
    """
    db = _get_db()
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        # Try by slug if not a valid ObjectId
        product = await db.products.find_one({"slug": product_id})

    if not product:
        return "Product not found."

    specs = "\n".join(
        [f"- {s['key']}: {s['value']}" for s in product.get("specs", [])]
    )

    return f"""**{product['name']}**

Description: {product.get('description', 'N/A')}

Specifications:
{specs if specs else 'No specifications available.'}

MOQ: {product.get('moq', 'Contact for quote')}
Lead Time: {product.get('leadTimeDays', 'Contact for quote')} days
"""
