"""Product management agent for admins — full CRUD on product catalog."""

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
from bson import ObjectId
from datetime import datetime
import re

_client: AsyncIOMotorClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


# ---------------------------------------------------------------------------
# Admin product tools
# ---------------------------------------------------------------------------

@tool
async def search_products_admin(
    query: str = "",
    category: str = "",
    limit: int = 20,
    include_inactive: bool = False,
) -> str:
    """Search all products including inactive ones. Admin-only tool.

    Args:
        query: Search text (product name, feature, or keyword)
        category: Optional category slug filter
        limit: Max results (default 20)
        include_inactive: Include soft-deleted / inactive products
    """
    db = _get_db()
    filter_query: dict = {}

    if not include_inactive:
        filter_query["isActive"] = True

    if query:
        words = [re.escape(w) for w in query.split() if len(w) > 2]
        if words:
            filter_query["$or"] = [
                {"name": {"$regex": "|".join(words), "$options": "i"}},
                {"shortDescription": {"$regex": "|".join(words), "$options": "i"}},
                {"description": {"$regex": "|".join(words), "$options": "i"}},
            ]

    if category:
        cat = await db.categories.find_one({"slug": category})
        if cat:
            filter_query["categoryId"] = cat["_id"]

    cursor = db.products.find(filter_query).sort("createdAt", -1).limit(limit)
    products = await cursor.to_list(length=limit)

    if not products:
        return "No products found matching your criteria."

    results = []
    for p in products:
        status = "active" if p.get("isActive", True) else "inactive"
        featured = " [FEATURED]" if p.get("isFeatured") else ""
        results.append(
            f"- **{p['name']}** ({status}{featured}): {p.get('shortDescription', p.get('description', '')[:80])}"
        )

    return f"Found {len(results)} products:\n" + "\n".join(results)


@tool
async def get_product_details(product_id: str) -> str:
    """Get full product details by ID or slug. Admin tool.

    Args:
        product_id: MongoDB ObjectId or product slug
    """
    db = _get_db()
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        product = await db.products.find_one({"slug": product_id})

    if not product:
        return "Product not found."

    specs = "\n".join(
        [f"  - {s['key']}: {s['value']}" for s in product.get("specs", [])]
    )
    status = "active" if product.get("isActive", True) else "inactive"
    featured = "Yes" if product.get("isFeatured") else "No"

    category = ""
    if product.get("categoryId"):
        cat = await db.categories.find_one({"_id": product["categoryId"]})
        if cat:
            category = cat.get("name", str(cat["_id"]))

    return f"""**{product['name']}**

ID: {product['_id']}
Slug: {product.get('slug', 'N/A')}
Status: {status}
Featured: {featured}
Category: {category or 'Uncategorized'}

Description: {product.get('description', 'N/A')}
Short Description: {product.get('shortDescription', 'N/A')}

Specifications:
{specs if specs else '  None'}

MOQ: {product.get('moq', 'N/A')}
Lead Time: {product.get('leadTimeDays', 'N/A')} days

Created: {product.get('createdAt', 'N/A')}
Updated: {product.get('updatedAt', 'N/A')}
"""


@tool
async def create_product(
    name: str,
    slug: str,
    description: str,
    short_description: str = "",
    category_id: str = "",
    specs: list[dict] | None = None,
    moq: str = "",
    lead_time_days: int = 0,
) -> str:
    """Create a new product in the catalog.

    Args:
        name: Product name
        slug: URL-friendly slug (must be unique)
        description: Full product description
        short_description: Brief one-liner
        category_id: MongoDB ObjectId of the category
        specs: List of spec dicts with 'key' and 'value' fields
        moq: Minimum order quantity text
        lead_time_days: Lead time in days
    """
    db = _get_db()

    existing = await db.products.find_one({"slug": slug})
    if existing:
        return f"Error: A product with slug '{slug}' already exists."

    doc = {
        "name": name,
        "slug": slug,
        "description": description,
        "shortDescription": short_description,
        "categoryId": ObjectId(category_id) if category_id else None,
        "specs": specs or [],
        "moq": moq,
        "leadTimeDays": lead_time_days,
        "isActive": True,
        "isFeatured": False,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db.products.insert_one(doc)
    return f"Product '{name}' created successfully. ID: {result.inserted_id}"


@tool
async def update_product(product_id: str, updates: dict) -> str:
    """Update one or more product fields.

    Args:
        product_id: MongoDB ObjectId of the product
        updates: Dict of field names and new values (e.g. {"name": "New Name", "moq": "5 units"})
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return "Invalid product ID format."

    allowed_fields = {
        "name", "slug", "description", "shortDescription",
        "categoryId", "specs", "moq", "leadTimeDays",
        "isActive", "isFeatured",
    }
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not safe_updates:
        return "No valid fields provided for update."

    if "categoryId" in safe_updates and safe_updates["categoryId"]:
        safe_updates["categoryId"] = ObjectId(safe_updates["categoryId"])

    safe_updates["updatedAt"] = datetime.utcnow()

    result = await db.products.update_one({"_id": oid}, {"$set": safe_updates})
    if result.matched_count == 0:
        return "Product not found."

    fields = ", ".join(safe_updates.keys() - {"updatedAt"})
    return f"Product updated. Changed fields: {fields}"


@tool
async def delete_product(product_id: str) -> str:
    """Soft-delete a product by setting isActive to False.

    Args:
        product_id: MongoDB ObjectId of the product
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return "Invalid product ID format."

    result = await db.products.update_one(
        {"_id": oid},
        {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Product not found."

    return "Product soft-deleted (set to inactive)."


@tool
async def toggle_product_featured(product_id: str, is_featured: bool) -> str:
    """Toggle or set the featured status of a product.

    Args:
        product_id: MongoDB ObjectId of the product
        is_featured: True to mark as featured, False to unmark
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return "Invalid product ID format."

    result = await db.products.update_one(
        {"_id": oid},
        {"$set": {"isFeatured": is_featured, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return "Product not found."

    status = "featured" if is_featured else "unfeatured"
    return f"Product marked as {status}."


# ---------------------------------------------------------------------------
# Admin product agent graph
# ---------------------------------------------------------------------------

ADMIN_PRODUCT_TOOLS = [
    search_products_admin,
    get_product_details,
    create_product,
    update_product,
    delete_product,
    toggle_product_featured,
]

PRODUCT_SYSTEM_PROMPT = """You are Bark Technologies Product Admin Agent. You manage the product catalog for a B2B machinery company.

Your responsibilities:
1. Search and filter the product catalog (including inactive products)
2. View full product details including specs and category
3. Create new products with proper specifications
4. Update existing product information
5. Soft-delete products (set inactive)
6. Toggle featured status for products

Always confirm destructive actions (delete) before performing them. Provide clear summaries of changes made.
"""


def _build_product_agent():
    llm = ChatOpenAI(
        model=config.admin_model,
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,
        max_tokens=1024,
    )
    llm_with_tools = llm.bind_tools(ADMIN_PRODUCT_TOOLS)

    def agent_node(state: MessagesState):
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: MessagesState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(ADMIN_PRODUCT_TOOLS)
    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_product_agent_graph = None


def get_product_agent():
    global _product_agent_graph
    if _product_agent_graph is None:
        _product_agent_graph = _build_product_agent()
    return _product_agent_graph


async def run_product_agent(message: str, thread_id: str) -> str:
    graph = get_product_agent()
    messages = [SystemMessage(content=PRODUCT_SYSTEM_PROMPT), HumanMessage(content=message)]
    result = await graph.ainvoke(
        {"messages": messages},
        config={"configurable": {"thread_id": thread_id}},
    )
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage) and msg.content:
            return msg.content
    return "Sorry, I could not process your request. Please try again."
