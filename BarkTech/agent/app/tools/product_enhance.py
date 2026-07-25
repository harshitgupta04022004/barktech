"""AI-powered product enhancement tool.

Takes raw product data (name, basic description, uploaded files)
and uses LLM to generate professional, accurate product details
including description, short description, specs, SEO metadata, etc.
"""

import json
import re
import logging
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config

logger = logging.getLogger(__name__)

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


def _build_enhance_llm():
    return ChatOpenAI(
        model="deepseek/deepseek-v4-flash",  # Fast model for quick enhancement
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.2,  # Lower for faster, more deterministic output
        max_tokens=2000,  # Reduced for faster response
        request_timeout=30,  # 30 second timeout max
    )


ENHANCE_SYSTEM_PROMPT = """You are a product listing specialist for Bark Technologies (B2B machinery, India).

Given product data, return ONLY this JSON:

{
  "name": "Polished product name",
  "shortDescription": "1-2 sentences (max 120 chars)",
  "description": "2-3 paragraphs, B2B focused, highlight features & benefits",
  "models": "Model numbers if known, else empty string",
  "specs": [{"key": "Spec", "value": "Value", "unit": "Unit"}],
  "metaTitle": "SEO title (max 60 chars, include Bark Technologies)",
  "metaDescription": "SEO meta (max 150 chars)"
}

Rules:
- Generate 3-8 key specs only (capacity, power, dimensions, material)
- Description: professional, concise, no filler
- Do NOT fabricate specs you don't have data for
- Return ONLY valid JSON, no markdown, no extra text"""


@tool
async def enhance_product_details(
    product_id: str,
    name: str,
    short_description: str = "",
    description: str = "",
    category_name: str = "",
    models: str = "",
    file_descriptions: str = "",
) -> str:
    """Use AI to enhance product details with professional descriptions, specs, and SEO metadata.

    Call this after creating a product with basic info. The AI will analyze the product
    name, description, category, and any uploaded file descriptions to generate
    complete professional product listing data.

    Args:
        product_id: MongoDB ObjectId of the product to enhance
        name: Product name
        short_description: Brief product description if available
        description: Full product description if available
        category_name: Product category name if available
        models: Model number(s) if available
        file_descriptions: Descriptions of uploaded files (images, PDFs, documents) for context
    """
    db = _get_db()

    try:
        from bson import ObjectId
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        return json.dumps({"error": "Invalid product ID"})

    if not product:
        return json.dumps({"error": "Product not found"})

    context_parts = []
    if name:
        context_parts.append(f"Product Name: {name}")
    if short_description:
        context_parts.append(f"Short Description: {short_description}")
    if description:
        context_parts.append(f"Full Description: {description}")
    if category_name:
        context_parts.append(f"Category: {category_name}")
    if models:
        context_parts.append(f"Model(s): {models}")
    if file_descriptions:
        context_parts.append(f"\nUploaded Files Context:\n{file_descriptions}")

    media = product.get("media", [])
    if media:
        media_urls = [m.get("url", "") for m in media[:5]]
        context_parts.append(f"Product Images: {', '.join(media_urls)}")

    existing_specs = product.get("specs", [])
    if existing_specs:
        specs_text = ", ".join([f"{s['key']}: {s['value']}" for s in existing_specs])
        context_parts.append(f"Existing Specs: {specs_text}")

    prompt = "\n".join(context_parts)

    if not prompt.strip():
        return json.dumps({"error": "No product data provided for enhancement"})

    llm = _build_enhance_llm()
    try:
        response = await llm.ainvoke([
            SystemMessage(content=ENHANCE_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])

        response_text = response.content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        enhanced_data = json.loads(response_text)

        update_fields = {}
        if enhanced_data.get("name"):
            update_fields["name"] = enhanced_data["name"]
        if enhanced_data.get("shortDescription"):
            update_fields["shortDescription"] = enhanced_data["shortDescription"]
        if enhanced_data.get("description"):
            update_fields["description"] = enhanced_data["description"]
        if enhanced_data.get("models"):
            update_fields["models"] = enhanced_data["models"]
        if enhanced_data.get("specs"):
            update_fields["specs"] = enhanced_data["specs"]
        if enhanced_data.get("metaTitle"):
            update_fields["metaTitle"] = enhanced_data["metaTitle"]
        if enhanced_data.get("metaDescription"):
            update_fields["metaDescription"] = enhanced_data["metaDescription"]
        if enhanced_data.get("name"):
            update_fields["summary"] = enhanced_data.get("shortDescription", "")

        update_fields["llmExtractedData"] = enhanced_data

        if update_fields:
            await db.products.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": update_fields},
            )

        return json.dumps({
            "success": True,
            "product_id": product_id,
            "enhanced": enhanced_data,
            "message": f"Product '{enhanced_data.get('name', name)}' enhanced with {len(enhanced_data.get('specs', []))} specs, professional description, and SEO metadata.",
        })

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return json.dumps({"error": "AI enhancement produced invalid response. Please try again."})
    except Exception as e:
        logger.error(f"Product enhancement failed: {e}", exc_info=True)
        return json.dumps({"error": f"Enhancement failed: {str(e)[:200]}"})


@tool
async def create_category(name: str, slug: str = "") -> str:
    """Create a new product category.

    Args:
        name: Category name (e.g., 'Die Cutting', 'Laminating')
        slug: URL-friendly slug (auto-generated from name if empty)
    """
    db = _get_db()

    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    existing = await db.categories.find_one({"slug": slug})
    if existing:
        return json.dumps({
            "success": True,
            "category_id": str(existing["_id"]),
            "name": existing["name"],
            "message": f"Category '{existing['name']}' already exists.",
        })

    max_order = await db.categories.count_documents({})

    result = await db.categories.insert_one({
        "name": name,
        "slug": slug,
        "parentId": None,
        "sortOrder": max_order,
        "isActive": True,
    })

    return json.dumps({
        "success": True,
        "category_id": str(result.inserted_id),
        "name": name,
        "slug": slug,
        "message": f"Category '{name}' created successfully.",
    })


@tool
async def list_categories() -> str:
    """List all active product categories.

    Returns a list of all categories with their IDs, names, and slugs.
    """
    db = _get_db()
    cursor = db.categories.find({"isActive": True}).sort("sortOrder", 1)
    categories = await cursor.to_list(length=100)

    if not categories:
        return "No categories found. Create one using the create_category tool."

    results = []
    for cat in categories:
        results.append(f"- **{cat['name']}** (slug: {cat['slug']}, id: {cat['_id']})")

    return f"Found {len(results)} categories:\n" + "\n".join(results)
