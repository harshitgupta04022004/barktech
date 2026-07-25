"""Admin product management tools — full CRUD aligned to MongoDB Product schema.

Mirrors the Node.js backend REST endpoints (product.controller.ts):
- create_product  -> POST /api/products
- update_product  -> PUT  /api/products/:id
- delete_product  -> DELETE /api/products/:id
- get_product     -> GET  /api/products/:id (or /slug/:slug)
- list_products   -> GET  /api/products
- upload_product_media -> direct upload to S3/R2 via MCP presign
- extract_product_info -> LLM extraction from PDF/DOCX text -> llmExtractedData

Schema alignment:
- published (bool) NOT isActive - controls public visibility
- media: embedded [{url, alt}] - no separate collection
- specs: embedded [{key, value, unit}] - no separate collection
- slug: auto-generated from name if not provided, must be unique
- reviewStatus: draft by default
- llmExtractedData: Mixed - stores raw LLM JSON output
"""

import json
import re
import base64
import logging
import mimetypes
import httpx
from datetime import datetime
from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from app.config import config

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


def _generate_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug


async def _slug_unique(db, slug: str, exclude_id: str = "") -> str:
    base = slug
    counter = 1
    while True:
        query: dict = {"slug": slug}
        if exclude_id:
            try:
                query["_id"] = {"$ne": ObjectId(exclude_id)}
            except Exception:
                pass
        existing = await db.products.find_one(query)
        if not existing:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


async def _serialize_product(product: dict) -> dict:
    if product is None:
        return {}
    db = await _get_db()
    category_name = ""
    if product.get("categoryId"):
        try:
            cat = await db.categories.find_one({"_id": product["categoryId"]})
            if cat:
                category_name = cat.get("name", "")
        except Exception:
            pass
    return {
        "product_id": str(product["_id"]),
        "name": product.get("name", ""),
        "slug": product.get("slug", ""),
        "category": category_name,
        "categoryId": str(product["categoryId"]) if product.get("categoryId") else None,
        "models": product.get("models", ""),
        "summary": product.get("summary", ""),
        "shortDescription": product.get("shortDescription", ""),
        "description": product.get("description", ""),
        "media": [
            {"url": m.get("url", ""), "alt": m.get("alt", "")}
            for m in product.get("media", [])
        ],
        "specs": [
            {"key": s.get("key", ""), "value": s.get("value", ""), "unit": s.get("unit", "")}
            for s in product.get("specs", [])
        ],
        "leadTimeDays": product.get("leadTimeDays", 0),
        "warrantyMonths": product.get("warrantyMonths", 0),
        "is_featured": product.get("isFeatured", False),
        "isFeatured": product.get("isFeatured", False),
        "published": product.get("published", False),
        "publishedAt": str(product.get("publishedAt", "")),
        "metaTitle": product.get("metaTitle", ""),
        "metaDescription": product.get("metaDescription", ""),
        "reviewStatus": product.get("reviewStatus", "draft"),
        "createdAt": str(product.get("createdAt", "")),
        "updatedAt": str(product.get("updatedAt", "")),
        "llmExtractedData": product.get("llmExtractedData"),
    }


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

@tool
async def create_product(
    name: str,
    slug: str = "",
    category_id: str = "",
    summary: str = "",
    short_description: str = "",
    description: str = "",
    models: str = "",
    media: list[dict] | None = None,
    specs: list[dict] | None = None,
    lead_time_days: str = "",
    warranty_months: int = 0,
    is_featured: bool = False,
    published: bool = False,
    meta_title: str = "",
    meta_description: str = "",
) -> str:
    """Create a new product in the Bark Technologies catalog.

    Mirrors POST /api/products. Writes to the same MongoDB collection
    the admin UI uses — chat-created products appear instantly on the site.

    Args:
        name: Product name (required)
        slug: URL-friendly slug (auto-generated from name if empty)
        category_id: MongoDB ObjectId of the category
        summary: Short summary for internal use
        short_description: Brief one-liner for product cards (max ~120 chars)
        description: Full product description (B2B focused)
        models: Model/SKU numbers (e.g. "TYS-1600, TYS-2000")
        media: List of media objects [{url, alt}] — images/videos already uploaded to S3/R2
        specs: List of spec objects [{key, value, unit}]
        lead_time_days: Delivery lead time (e.g. "7-14")
        warranty_months: Warranty period in months (0 = no warranty listed)
        is_featured: Mark as featured product
        published: Controls public visibility on customer site (default False — admin must explicitly publish)
        meta_title: SEO page title
        meta_description: SEO meta description
    """
    if not name or not name.strip():
        return json.dumps({"error": "Product name is required"})

    name = name.strip()
    db = _get_db()

    if not slug:
        slug = _generate_slug(name)
    slug = await _slug_unique(db, slug)

    doc: dict = {
        "name": name,
        "slug": slug,
        "categoryId": ObjectId(category_id) if category_id else None,
        "summary": summary or short_description or (description[:200] if description else ""),
        "shortDescription": short_description,
        "description": description,
        "models": models,
        "media": media or [],
        "specs": specs or [],
        "leadTimeDays": lead_time_days,
        "warrantyMonths": warranty_months,
        "isFeatured": is_featured,
        "published": published,
        "reviewStatus": "draft",
        "metaTitle": meta_title,
        "metaDescription": meta_description,
    }

    result = await db.products.insert_one(doc)
    product_id = str(result.inserted_id)

    return json.dumps({
        "success": True,
        "product_id": product_id,
        "slug": slug,
        "name": name,
        "published": published,
        "message": f"Product '{name}' created. ID: {product_id}, Slug: {slug}.",
    })


# ---------------------------------------------------------------------------
# GET
# ---------------------------------------------------------------------------

@tool
async def get_product(product_id: str) -> str:
    """Get full product details by ID or slug.

    Mirrors GET /api/products/:id or GET /api/products/slug/:slug.

    Args:
        product_id: MongoDB ObjectId or product slug
    """
    db = await _get_db()
    product = None

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        pass

    if not product:
        product = await db.products.find_one({"slug": product_id})

    if not product:
        return json.dumps({"error": f"Product not found: {product_id}"})

    data = await _serialize_product(product)
    return json.dumps(data)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

@tool
async def update_product(
    product_id: str,
    name: str = "",
    slug: str = "",
    category_id: str = "",
    summary: str = "",
    short_description: str = "",
    description: str = "",
    models: str = "",
    media: list[dict] | None = None,
    specs: list[dict] | None = None,
    lead_time_days: str = "",
    warranty_months: int = -1,
    is_featured: bool | None = None,
    published: bool | None = None,
    meta_title: str = "",
    meta_description: str = "",
    review_status: str = "",
    review_notes: str = "",
) -> str:
    """Update one or more product fields. Only non-empty/non-None fields are modified.

    Mirrors PUT /api/products/:id. Partial updates — only changed fields are written.
    Must show admin the diff before calling this tool.

    Args:
        product_id: MongoDB ObjectId of the product
        name: New product name
        slug: New slug (must be unique)
        category_id: New category ObjectId
        summary: New summary
        short_description: New short description
        description: New full description
        models: New model/SKU
        media: Replace entire media array [{url, alt}]
        specs: Replace entire specs array [{key, value, unit}]
        lead_time_days: New lead time
        warranty_months: New warranty (-1 = don't change, 0 = clear)
        is_featured: New featured status (None = skip)
        published: New published status (None = skip)
        meta_title: New SEO title
        meta_description: New SEO description
        review_status: New review status (draft/in_review/approved/rejected)
        review_notes: Review notes
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return json.dumps({"error": "Invalid product ID format"})

    product = await db.products.find_one({"_id": oid})
    if not product:
        return json.dumps({"error": f"Product not found: {product_id}"})

    updates: dict = {}

    if name:
        updates["name"] = name.strip()

    if slug:
        slug_clean = await _slug_unique(db, slug.strip(), exclude_id=product_id)
        updates["slug"] = slug_clean
    elif name and "name" in updates:
        new_slug = await _slug_unique(db, _generate_slug(name), exclude_id=product_id)
        updates["slug"] = new_slug

    if category_id:
        try:
            updates["categoryId"] = ObjectId(category_id)
        except Exception:
            return json.dumps({"error": "Invalid category ID format"})

    if summary:
        updates["summary"] = summary
    if short_description:
        updates["shortDescription"] = short_description
    if description:
        updates["description"] = description
    if models:
        updates["models"] = models
    if media is not None:
        updates["media"] = media
    if specs is not None:
        updates["specs"] = specs
    if lead_time_days:
        updates["leadTimeDays"] = lead_time_days
    if warranty_months >= 0:
        updates["warrantyMonths"] = warranty_months
    if is_featured is not None:
        updates["isFeatured"] = is_featured
    if published is not None:
        updates["published"] = published
        if published:
            updates["publishedAt"] = datetime.utcnow()
    if meta_title:
        updates["metaTitle"] = meta_title
    if meta_description:
        updates["metaDescription"] = meta_description
    if review_status in ("draft", "in_review", "approved", "rejected"):
        updates["reviewStatus"] = review_status
        if review_status in ("approved", "rejected"):
            updates["reviewedAt"] = datetime.utcnow()
    if review_notes:
        updates["reviewNotes"] = review_notes

    if not updates:
        return json.dumps({"error": "No valid fields provided for update"})

    await db.products.update_one({"_id": oid}, {"$set": updates})

    changed = ", ".join(updates.keys())
    return json.dumps({
        "success": True,
        "product_id": product_id,
        "updated_fields": list(updates.keys()),
        "message": f"Product updated. Changed: {changed}",
    })


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@tool
async def delete_product(product_id: str) -> str:
    """Permanently delete a product from the catalog.

    Mirrors DELETE /api/products/:id (hard delete). WARNING: irreversible.
    Always confirm with admin before calling.

    Args:
        product_id: MongoDB ObjectId of the product to delete
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return json.dumps({"error": "Invalid product ID format"})

    product = await db.products.find_one({"_id": oid})
    if not product:
        return json.dumps({"error": f"Product not found: {product_id}"})

    name = product.get("name", "Unknown")
    await db.products.delete_one({"_id": oid})

    return json.dumps({
        "success": True,
        "product_id": product_id,
        "name": name,
        "message": f"Product '{name}' permanently deleted.",
    })


# ---------------------------------------------------------------------------
# LIST / SEARCH
# ---------------------------------------------------------------------------

@tool
async def list_products(
    query: str = "",
    category: str = "",
    published_only: bool = False,
    featured_only: bool = False,
    limit: int = 20,
) -> str:
    """Search and list products in the catalog.

    Mirrors GET /api/products with filters.

    Args:
        query: Search text (matches name, shortDescription, description, models)
        category: Category slug or name to filter by
        published_only: Only return published (public) products
        featured_only: Only return featured products
        limit: Maximum results (default 20, max 50)
    """
    db = _get_db()
    limit = min(limit, 50)
    filter_query: dict = {}

    if published_only:
        filter_query["published"] = True
    if featured_only:
        filter_query["isFeatured"] = True

    if query:
        words = [re.escape(w) for w in query.split() if len(w) > 1]
        if words:
            regex_pattern = "|".join(words)
            filter_query["$or"] = [
                {"name": {"$regex": regex_pattern, "$options": "i"}},
                {"shortDescription": {"$regex": regex_pattern, "$options": "i"}},
                {"description": {"$regex": regex_pattern, "$options": "i"}},
                {"models": {"$regex": regex_pattern, "$options": "i"}},
            ]

    if category:
        cat = await db.categories.find_one({"slug": category})
        if not cat:
            cat = await db.categories.find_one({
                "name": {"$regex": re.escape(category), "$options": "i"}
            })
        if cat:
            filter_query["categoryId"] = cat["_id"]

    cursor = db.products.find(filter_query).sort("createdAt", -1).limit(limit)
    products = await cursor.to_list(length=limit)

    if not products:
        return json.dumps({"products": [], "total": 0, "message": "No products found"})

    results = []
    for p in products:
        cat_name = ""
        if p.get("categoryId"):
            cat = await db.categories.find_one({"_id": p["categoryId"]})
            if cat:
                cat_name = cat.get("name", "")

        media_thumb = ""
        if p.get("media") and len(p["media"]) > 0:
            media_thumb = p["media"][0].get("url", "")

        results.append({
            "id": str(p["_id"]),
            "name": p.get("name", ""),
            "slug": p.get("slug", ""),
            "shortDescription": p.get("shortDescription", ""),
            "models": p.get("models", ""),
            "category": cat_name,
            "status": "published" if p.get("published") else "draft",
            "isFeatured": p.get("isFeatured", False),
            "mediaCount": len(p.get("media", [])),
            "specCount": len(p.get("specs", [])),
            "thumbnail": media_thumb,
            "createdAt": str(p.get("createdAt", "")),
        })

    return json.dumps({
        "products": results,
        "total": len(results),
        "message": f"Found {len(results)} products",
    })


# ---------------------------------------------------------------------------
# UPLOAD PRODUCT MEDIA
# ---------------------------------------------------------------------------

@tool
async def upload_product_media(
    product_id: str,
    file_name: str,
    file_bytes_b64: str,
    media_type: str = "image",
    alt: str = "",
) -> str:
    """Upload a file (image/video/document) to S3/R2 and attach it to a product.

    Uses Media MCP presign flow:
    1. Get a presigned upload URL via Media MCP
    2. PUT the file bytes directly to S3/R2
    3. Get the public URL
    4. Push {url, alt} into the product's media array

    Args:
        product_id: MongoDB ObjectId of the product to attach media to
        file_name: Original filename (e.g. "product-photo.jpg")
        file_bytes_b64: Base64-encoded file content
        media_type: Type of media — "image", "video", or "document"
        alt: Alt text for the media (defaults to filename)
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return json.dumps({"error": "Invalid product ID format"})

    product = await db.products.find_one({"_id": oid})
    if not product:
        return json.dumps({"error": f"Product not found: {product_id}"})

    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        mime_type = {
            "image": "image/jpeg",
            "video": "video/mp4",
            "document": "application/pdf",
        }.get(media_type, "application/octet-stream")

    # Build S3 key
    slug = product.get("slug", "product")
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    s3_key = f"products/{slug}/{timestamp}-{file_name}"

    # Upload via MCP presign
    try:
        from app.tools.mcp_tools import presign_media_upload, get_media_public_url

        presign_result = await presign_media_upload.ainvoke({
            "key": s3_key,
            "content_type": mime_type,
        })
        presign_data = json.loads(presign_result) if isinstance(presign_result, str) else presign_result

        if presign_data.get("error"):
            return json.dumps({"error": f"Presign failed: {presign_data['error']}"})

        upload_url = presign_data.get("upload_url", "")
        if not upload_url:
            return json.dumps({"error": "No presigned URL returned"})

        # Upload file bytes
        file_bytes = base64.b64decode(file_bytes_b64)
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.put(upload_url, content=file_bytes, headers={"Content-Type": mime_type})
            if resp.status_code not in (200, 201):
                return json.dumps({"error": f"S3 upload failed: HTTP {resp.status_code}"})

        # Get public URL
        url_result = await get_media_public_url.ainvoke({"key": s3_key})
        url_data = json.loads(url_result) if isinstance(url_result, str) else url_result
        public_url = url_data.get("url", "")
        if not public_url:
            return json.dumps({"error": "Failed to get public URL"})

    except Exception as e:
        logger.error(f"Media upload failed: {e}", exc_info=True)
        return json.dumps({"error": f"Media upload failed: {str(e)[:200]}"})

    # Push to product media
    media_entry = {"url": public_url, "alt": alt or file_name}
    await db.products.update_one({"_id": oid}, {"$push": {"media": media_entry}})

    return json.dumps({
        "success": True,
        "product_id": product_id,
        "url": public_url,
        "s3_key": s3_key,
        "media_type": media_type,
        "message": f"File '{file_name}' uploaded and attached to '{product.get('name', '')}'.",
    })


# ---------------------------------------------------------------------------
# EXTRACT PRODUCT INFO FROM FILE
# ---------------------------------------------------------------------------

EXTRACT_SYSTEM_PROMPT = """You are a product data extraction specialist for Bark Technologies — a B2B machinery company in India.

Given text extracted from a product datasheet, catalog page, or technical document, extract product information and return ONLY valid JSON:

{
  "name": "Product name",
  "summary": "1-2 sentence summary for internal reference",
  "shortDescription": "One-liner for product cards (max 120 chars)",
  "description": "2-3 paragraphs professional description for the product detail page (B2B focused)",
  "models": "Model/SKU numbers if found, else empty string",
  "categoryGuess": "Best category guess from: filling, capping, labeling, packaging, conveyors, accessories, other",
  "specs": [{"key": "Spec Name", "value": "Value", "unit": "Unit if applicable"}],
  "leadTimeDays": "Estimated lead time if found, else empty string",
  "warrantyMonths": 0,
  "confidence": 0.85
}

Rules:
- Extract only facts from the document — do NOT fabricate information
- Generate 3-8 key specs only (capacity, power, dimensions, material, speed, weight)
- confidence: 0.0-1.0 based on how much structured data was found
- description: professional, B2B focused, highlight features and applications
- If a field cannot be determined, use empty string or 0 (never null)
- Return ONLY valid JSON, no markdown fences, no extra text"""


@tool
async def extract_product_info(
    product_id: str,
    file_text: str,
    file_name: str = "",
) -> str:
    """Extract product information from PDF/DOCX text using LLM and store in llmExtractedData.

    Sends extracted text to an LLM with a structured output prompt to produce:
    name, summary, descriptions, models, specs, category guess, lead time, warranty.

    The raw LLM output is stored in the product's llmExtractedData JSON field
    for admin review — fields are NOT auto-applied to the product.

    Args:
        product_id: MongoDB ObjectId of the product to update
        file_text: Extracted text content from the PDF/DOCX file
        file_name: Original filename (for context)
    """
    db = _get_db()

    try:
        oid = ObjectId(product_id)
    except Exception:
        return json.dumps({"error": "Invalid product ID format"})

    product = await db.products.find_one({"_id": oid})
    if not product:
        return json.dumps({"error": f"Product not found: {product_id}"})

    if not file_text or not file_text.strip():
        return json.dumps({"error": "No text content provided for extraction"})

    if len(file_text) > 15000:
        file_text = file_text[:15000] + "\n\n[Text truncated at 15000 chars]"

    context_parts = [f"Product name (if known): {product.get('name', 'Unknown')}"]
    if product.get("shortDescription"):
        context_parts.append(f"Current description: {product['shortDescription']}")
    if file_name:
        context_parts.append(f"Source file: {file_name}")
    context_parts.append(f"\n--- Document Content ---\n{file_text}")

    prompt = "\n".join(context_parts)

    from langchain_core.messages import SystemMessage, HumanMessage
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model="deepseek/deepseek-v4-flash",
        openai_api_key=config.openrouter_api_key,
        openai_api_base=config.openrouter_base_url,
        temperature=0.1,
        max_tokens=2000,
        request_timeout=30,
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=EXTRACT_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])

        response_text = response.content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        extracted_data = json.loads(response_text)

        extracted_data["_source_file"] = file_name
        extracted_data["_extracted_at"] = datetime.utcnow().isoformat()
        extracted_data["_extraction_method"] = "llm_structured_output"

        # Store in llmExtractedData — does NOT write to published fields
        await db.products.update_one(
            {"_id": oid},
            {"$set": {"llmExtractedData": extracted_data}},
        )

        return json.dumps({
            "success": True,
            "product_id": product_id,
            "extracted": extracted_data,
            "message": (
                f"Extracted from '{file_name}': name='{extracted_data.get('name', '')}', "
                f"{len(extracted_data.get('specs', []))} specs found, "
                f"confidence={extracted_data.get('confidence', 0):.0%}. "
                f"Data stored in llmExtractedData for review."
            ),
        })

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM extraction response: {e}")
        return json.dumps({"error": "AI extraction produced invalid response. Please try again."})
    except Exception as e:
        logger.error(f"Product info extraction failed: {e}", exc_info=True)
        return json.dumps({"error": f"Extraction failed: {str(e)[:200]}"})
