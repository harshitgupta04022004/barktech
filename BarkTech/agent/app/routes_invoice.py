"""Invoice routes for the agent service.
Handles PDF generation, text formatting, and invoice preview.
"""

import logging
import os
import tempfile
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional

from app.services.invoice_pdf import (
    invoice_pdf_service,
    number_to_words,
    format_invoice_date,
)
from app.config import config

logger = logging.getLogger(__name__)

invoice_router = APIRouter(prefix="/invoice", tags=["invoice"])


async def _llm_format(text: str, context: str) -> str:
    """Call the LLM to professionally format text for invoice use."""
    system_prompts = {
        "address": (
            "You are a professional document formatter. Rewrite the following address "
            "into a clean, properly formatted address suitable for a tax invoice. "
            "Use proper line breaks, capitalize correctly (state abbreviations like UP, "
            "GUJ in caps, pin codes on their own line), and ensure the address reads "
            "naturally. Return ONLY the formatted address, nothing else."
        ),
        "description": (
            "You are a professional technical writer for an industrial machinery company. "
            "Rewrite the following product/service description to be clear, concise, and "
            "professional for use on a tax invoice. Use proper capitalization, technical "
            "units in uppercase (HP, KW, MM, KG), and keep it factual. "
            "Return ONLY the formatted description, nothing else."
        ),
        "name": (
            "You are a professional formatter. Clean up the following name to be properly "
            "capitalized and professional for use on a tax invoice. "
            "Return ONLY the formatted name, nothing else."
        ),
        "company": (
            "You are a professional formatter. Clean up the following company name to be "
            "properly formatted for use on a tax invoice. Add proper suffixes like Pvt. Ltd., "
            "LLP, etc. if they seem appropriate based on the context. "
            "Return ONLY the formatted company name, nothing else."
        ),
        "general": (
            "You are a professional document formatter. Clean up the following text to be "
            "properly formatted for use on a tax invoice. Fix capitalization, spacing, and "
            "make it professional. Return ONLY the formatted text, nothing else."
        ),
    }

    system_msg = system_prompts.get(context, system_prompts["general"])

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{config.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": config.admin_model,
                    "messages": [
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip().strip('"')
    except Exception as e:
        logger.warning(f"LLM format failed, falling back to basic formatting: {e}")

    # Fallback: basic title-case formatting
    return " ".join(text.split()).title()


class InvoiceItem(BaseModel):
    description: str
    hsn_code: str = ""
    quantity: int = 1
    unit_price: float = 0.0
    gst_rate: float = 18.0


class GeneratePDFRequest(BaseModel):
    invoice_number: str = ""
    customer_name: str
    customer_company: str = ""
    customer_address: str = ""
    customer_gst: str = ""
    customer_phone: str = ""
    ship_to_address: str = ""
    mode_of_delivery: str = "BY TRANSPORT"
    dispatch_from: str = ""
    ref_attended_by: str = ""
    items: list[InvoiceItem] = []
    gst_rate: float = 18.0
    subtotal: Optional[float] = None
    gst_amount: Optional[float] = None
    total: Optional[float] = None
    amount_in_words: str = ""
    invoice_date: str = ""
    bank_name: str = ""
    bank_bank: str = ""
    bank_address: str = ""
    bank_account_no: str = ""
    bank_ifsc: str = ""
    bank_swift: str = ""


class FormatTextRequest(BaseModel):
    text: str
    context: str = "invoice"


class FormatTextResponse(BaseModel):
    original: str
    formatted: str
    suggestions: list[str] = []


@invoice_router.post("/generate-pdf")
async def generate_invoice_pdf(body: GeneratePDFRequest):
    """Generate a PDF invoice and return as download."""
    try:
        invoice_data = body.model_dump()
        invoice_data["items"] = [item.model_dump() for item in body.items]

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            output_path = tmp.name

        invoice_pdf_service.generate_pdf(invoice_data, output_path)

        return FileResponse(
            path=output_path,
            filename=f"{body.invoice_number or 'invoice'}.pdf",
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{body.invoice_number or "invoice"}.pdf"'},
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@invoice_router.post("/preview")
async def preview_invoice_html(body: GeneratePDFRequest):
    """Generate HTML preview of an invoice."""
    try:
        invoice_data = body.model_dump()
        invoice_data["items"] = [item.model_dump() for item in body.items]
        html = invoice_pdf_service.generate_html_preview(invoice_data)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"HTML preview failed: {e}")
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@invoice_router.post("/format-text")
async def format_invoice_text(body: FormatTextRequest):
    """AI text formatting agent - uses LLM to rewrite admin-written text into
    professional invoice-ready formatting."""
    text = body.text.strip()

    if not text:
        return FormatTextResponse(original="", formatted="", suggestions=["Empty input"])

    # Amount to words is deterministic, no LLM needed
    if body.context == "amount_words":
        try:
            amount = float(text.replace(",", "").replace("\u20b9", "").replace("Rs.", "").strip())
            formatted = number_to_words(amount)
        except ValueError:
            formatted = text.upper()
        return FormatTextResponse(
            original=text,
            formatted=formatted,
            suggestions=["Amount converted to Indian English words"],
        )

    # Map frontend context values to our LLM context keys
    context_map = {
        "address": "address",
        "customerAddress": "address",
        "shipToAddress": "address",
        "description": "description",
        "name": "name",
        "customerName": "name",
        "company": "company",
        "customerCompany": "company",
        "general": "general",
    }
    llm_context = context_map.get(body.context, "general")
    formatted = await _llm_format(text, llm_context)

    return FormatTextResponse(
        original=text,
        formatted=formatted,
        suggestions=[f"Professionally formatted using AI ({llm_context})"],
    )


@invoice_router.post("/calculate-totals")
async def calculate_invoice_totals(body: GeneratePDFRequest):
    """Calculate invoice totals and return preview data."""
    items = body.items
    subtotal = sum(item.quantity * item.unit_price for item in items)
    gst_amount = sum(
        item.quantity * item.unit_price * (item.gst_rate / 100) for item in items
    )
    grand_total = subtotal + gst_amount
    amount_in_words = number_to_words(grand_total)

    return {
        "subtotal": subtotal,
        "gst_amount": gst_amount,
        "grand_total": grand_total,
        "amount_in_words": amount_in_words,
        "item_count": len(items),
    }
