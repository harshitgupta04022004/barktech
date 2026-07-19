"""Invoice routes for the agent service.
Handles PDF generation, text formatting, and invoice preview.
"""

import logging
import os
import tempfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional

from app.services.invoice_pdf import (
    invoice_pdf_service,
    number_to_words,
    format_invoice_date,
)

logger = logging.getLogger(__name__)

invoice_router = APIRouter(prefix="/invoice", tags=["invoice"])


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
    """AI text formatting agent - rewrites admin-written text into
    professional invoice-ready formatting."""
    text = body.text.strip()

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

    if body.context == "address":
        lines = [line.strip() for line in text.replace(";", ",").split(",") if line.strip()]
        formatted_lines = []
        for line in lines:
            words = line.split()
            result = []
            for i, word in enumerate(words):
                if word.upper() in ("UP", "GUJ", "PIN", "INDIA", "GST", "GSTIN", "SF"):
                    result.append(word.upper())
                elif i == 0 or not word[0].isupper():
                    result.append(word.title())
                else:
                    result.append(word)
            formatted_lines.append(" ".join(result))
        formatted = "\n".join(formatted_lines)
        return FormatTextResponse(
            original=text,
            formatted=formatted,
            suggestions=["Address formatted with proper casing and line breaks"],
        )

    if body.context == "description":
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        formatted_lines = []
        for line in lines:
            words = line.split()
            result = []
            for i, word in enumerate(words):
                if word.upper() in ("W", "HP", "KW", "RPM", "MM", "CM", "KG", "Ltr", "HPR"):
                    result.append(word.upper())
                elif word.isdigit():
                    result.append(word)
                elif i == 0:
                    result.append(word.title())
                elif word.isupper():
                    result.append(word)
                else:
                    result.append(word.title())
            formatted_lines.append(" ".join(result))
        formatted = "\n".join(formatted_lines)
        return FormatTextResponse(
            original=text,
            formatted=formatted,
            suggestions=["Description formatted with proper capitalization"],
        )

    if body.context == "general":
        formatted = " ".join(text.split())
        formatted = formatted.strip(".")
        words = formatted.split()
        result = []
        for i, word in enumerate(words):
            if word.upper() in ("UP", "GUJ", "PIN", "INDIA", "GST", "GSTIN", "SF", "PC", "HSN"):
                result.append(word.upper())
            elif word.isdigit() or "." in word:
                result.append(word)
            elif i == 0:
                result.append(word.title())
            elif word.isupper() and len(word) > 1:
                result.append(word)
            else:
                result.append(word.title() if not word[0].isupper() else word)
        formatted = " ".join(result)
        return FormatTextResponse(
            original=text,
            formatted=formatted,
            suggestions=["Text formatted with proper capitalization"],
        )

    formatted = " ".join(text.split())
    return FormatTextResponse(
        original=text,
        formatted=formatted.title(),
        suggestions=["Text title-cased"],
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
