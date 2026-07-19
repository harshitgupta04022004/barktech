"""FAQ and contact info tools."""

from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import config
import re

_client = None


def _get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.mongodb_uri)
    return _client[config.mongodb_db]


@tool
async def get_faq(question: str = "") -> str:
    """Search the FAQ database for answers to common questions about Bark Technologies.

    Args:
        question: The customer's question to search for
    """
    db = _get_db()
    query = {"isActive": True}
    if question:
        # Use regex search to avoid requiring a text index
        words = [re.escape(w) for w in question.split() if len(w) > 2]
        if words:
            query["$or"] = [
                {"question": {"$regex": "|".join(words), "$options": "i"}},
                {"answer": {"$regex": "|".join(words), "$options": "i"}},
            ]

    cursor = db.faqs.find(query).limit(5)
    faqs = await cursor.to_list(length=5)

    if not faqs:
        return "No FAQ entries found. Please contact our team directly for assistance."

    results = []
    for faq in faqs:
        results.append(f"**Q: {faq['question']}**\nA: {faq['answer']}")

    return "\n\n".join(results)


@tool
async def get_contact_info() -> str:
    """Get Bark Technologies contact information — offices, phone, email."""
    db = _get_db()
    offices = await db.offices.find({"isActive": True}).to_list(length=10)

    if not offices:
        return (
            "Bark Technologies Contact Information:\n"
            "- Email: info@barktechnologies.in\n"
            "- Phone: +91 8810597980\n"
            "- Website: www.barktechnologies.in\n\n"
            "Visit our website for more details."
        )

    results = []
    for office in offices:
        results.append(
            f"**{office.get('name', 'Office')}**\n"
            f"Address: {office.get('address', 'N/A')}\n"
            f"Phone: {office.get('phone', 'N/A')}\n"
            f"Email: {office.get('email', 'N/A')}"
        )

    return "Bark Technologies Offices:\n\n" + "\n\n".join(results)
