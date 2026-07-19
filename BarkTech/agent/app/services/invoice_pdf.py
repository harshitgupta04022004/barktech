"""
Invoice PDF Generation Service
Renders Bark Technologies tax invoices to PDF using WeasyPrint + Jinja2.
Matches the exact format from the company's standard invoice template.
"""

import os
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Any

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML


TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
LOGO_PATH = str(Path(__file__).parent.parent / "templates" / "bark_technologies_logo.png")
SIGNATURE_PATH = str(Path(__file__).parent.parent / "templates" / "bark_technologies_signature.png")

# Bark Technologies defaults
COMPANY_DEFAULTS = {
    "company_name": "BARK TECHNOLOGIES",
    "company_address": "SF-03, LOCAL SHOPPING COMPLEX, SHUSHANT AQUAPOLIS, GHAZIABAD UTTAR PRADESH 201009",
    "company_gst": "09AAWFB1759R1ZC",
    "company_contact": "07042245270/8810597980",
    "company_email": "sales1barktechnologies@gmail.com",
    "bank_name": "BARK TECHNOLOGIES",
    "bank_bank": "ICICI BANK LTD",
    "bank_address": "NOIDA 132",
    "bank_account_no": "157905003103",
    "bank_ifsc": "ICIC0001579",
    "bank_swift": "",
}


def number_to_words(amount: float) -> str:
    """Convert a number to Indian English words for invoice amount.
    Matches the exact format: THREE LAKH SEVENTY ONE THOUSAND SEVEN HUNDRED RUPEES ONLY
    """
    if amount <= 0:
        return "ZERO RUPEES ONLY"

    ones = [
        "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
        "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
        "SEVENTEEN", "EIGHTEEN", "NINETEEN",
    ]
    tens = [
        "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY",
        "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
    ]

    def _convert_hundreds(n: int) -> str:
        result = ""
        if n >= 100:
            result += ones[n // 100] + " HUNDRED "
            n %= 100
        if n >= 20:
            result += tens[n // 10] + " "
            n %= 10
        if n > 0:
            result += ones[n] + " "
        return result.strip()

    whole_part = int(amount)
    decimal_part = round((amount - whole_part) * 100)

    result = ""
    if whole_part >= 10000000:
        result += _convert_hundreds(whole_part // 10000000) + " CRORE "
    if whole_part >= 100000:
        result += _convert_hundreds((whole_part % 10000000) // 100000) + " LAKH "
    if whole_part >= 1000:
        result += _convert_hundreds((whole_part % 100000) // 1000) + " THOUSAND "
    if whole_part % 1000 > 0:
        result += _convert_hundreds(whole_part % 1000) + " "

    result = result.strip() + " RUPEES"

    if decimal_part > 0:
        result += " AND " + _convert_hundreds(decimal_part) + " PAISE"

    return result + " ONLY"


def generate_invoice_number(invoice_number: str) -> str:
    """
    Ensure invoice number matches BARK{FY}-{FY+1}S{###} format.
    e.g. BARK26-27S120
    """
    if not invoice_number:
        now = datetime.now()
        fy_start = now.year if now.month >= 4 else now.year - 1
        fy_end = fy_start + 1
        short_start = str(fy_start)[-2:]
        short_end = str(fy_end)[-2:]
        return f"BARK{short_start}-{short_end}S001"
    return invoice_number


def format_invoice_date(date_str: str = None) -> str:
    """Format date as '23rd June 2026' style."""
    if date_str:
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            dt = datetime.now()
    else:
        dt = datetime.now()

    day = dt.day
    suffix = {1: "st", 2: "nd", 3: "rd"}.get(day % 10 if day % 100 not in (11, 12, 13) else 0, "th")
    month = dt.strftime("%B")
    year = dt.year
    return f"{day}{suffix} {month} {year}"


def format_currency_indian(amount: float) -> str:
    """Format number in Indian comma style: 3,15,000.00"""
    s = f"{amount:.2f}"
    integer_part, decimal_part = s.split(".")

    # Indian grouping: last 3 digits, then groups of 2
    if len(integer_part) > 3:
        last_three = integer_part[-3:]
        remaining = integer_part[:-3]
        groups = []
        while remaining:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        integer_part = ",".join(groups) + "," + last_three

    return f"{integer_part}.{decimal_part}"


class InvoicePDFService:
    """Generates Bark Technologies tax invoices as PDF."""

    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(str(TEMPLATE_DIR)),
            autoescape=False,
        )
        self.env.globals["range"] = range

    def generate_pdf(
        self,
        invoice_data: dict[str, Any],
        output_path: str = None,
    ) -> str:
        """
        Generate a PDF invoice from invoice data.

        Args:
            invoice_data: Dictionary with invoice fields
            output_path: Optional path to save PDF. If None, creates temp file.

        Returns:
            Path to the generated PDF file.
        """
        # Merge with company defaults
        data = {**COMPANY_DEFAULTS, **invoice_data}

        # Process items
        items = data.get("items", [])
        processed_items = []
        subtotal = 0

        for item in items:
            qty = float(item.get("quantity", 1))
            rate = float(item.get("unit_price", item.get("unitPrice", 0)))
            amount = qty * rate
            subtotal += amount
            processed_items.append({
                "description": item.get("description", ""),
                "hsn_code": item.get("hsn_code", item.get("hsnCode", "")),
                "unit_price": rate,
                "quantity": int(qty),
                "amount": amount,
            })

        # Tax calculation
        gst_rate = float(data.get("gst_rate", 18))
        gst_amount = subtotal * (gst_rate / 100)
        grand_total = subtotal + gst_amount

        # Override with provided values if available
        if "subtotal" in invoice_data:
            subtotal = float(invoice_data["subtotal"])
        if "gst_amount" in invoice_data:
            gst_amount = float(invoice_data["gst_amount"])
        if "total" in invoice_data:
            grand_total = float(invoice_data["total"])
        if "grand_total" in invoice_data:
            grand_total = float(invoice_data["grand_total"])

        # Amount in words
        amount_in_words = data.get("amount_in_words", "")
        if not amount_in_words:
            amount_in_words = number_to_words(grand_total)

        # Invoice number
        invoice_number = generate_invoice_number(data.get("invoice_number", ""))

        # Date
        invoice_date = data.get("invoice_date", "")
        if not invoice_date:
            invoice_date = format_invoice_date()
        elif isinstance(invoice_date, str) and "T" in invoice_date:
            invoice_date = format_invoice_date(invoice_date)

        # Template context
        context = {
            **data,
            "items": processed_items,
            "subtotal": subtotal,
            "gst_rate": gst_rate,
            "gst_amount": gst_amount,
            "grand_total": grand_total,
            "amount_in_words": amount_in_words,
            "invoice_number": invoice_number,
            "invoice_date": invoice_date,
            "logo_path": LOGO_PATH,
            "signature_path": SIGNATURE_PATH,
            "format_currency_indian": format_currency_indian,
            "mode_of_delivery": data.get("mode_of_delivery", "BY TRANSPORT"),
            "dispatch_from": data.get("dispatch_from", ""),
            "ship_to_address": data.get("ship_to_address", ""),
            "ref_attended_by": data.get("ref_attended_by", ""),
            "delivery_label": data.get("delivery_label", "FACTORY DELIVERY"),
        }

        # Render HTML
        template = self.env.get_template("invoice.html")
        html_content = template.render(**context)

        # Generate PDF
        if output_path is None:
            fd, output_path = tempfile.mkstemp(suffix=".pdf", prefix="invoice_")
            os.close(fd)

        HTML(string=html_content).write_pdf(output_path)
        return output_path

    def generate_pdf_bytes(self, invoice_data: dict[str, Any]) -> bytes:
        """Generate PDF and return as bytes."""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            output_path = tmp.name

        try:
            self.generate_pdf(invoice_data, output_path)
            with open(output_path, "rb") as f:
                return f.read()
        finally:
            if os.path.exists(output_path):
                os.unlink(output_path)

    def generate_html_preview(self, invoice_data: dict[str, Any]) -> str:
        """Generate HTML preview of the invoice (for frontend rendering)."""
        data = {**COMPANY_DEFAULTS, **invoice_data}

        items = data.get("items", [])
        processed_items = []
        subtotal = 0

        for item in items:
            qty = float(item.get("quantity", 1))
            rate = float(item.get("unit_price", item.get("unitPrice", 0)))
            amount = qty * rate
            subtotal += amount
            processed_items.append({
                "description": item.get("description", ""),
                "hsn_code": item.get("hsn_code", item.get("hsnCode", "")),
                "unit_price": rate,
                "quantity": int(qty),
                "amount": amount,
            })

        gst_rate = float(data.get("gst_rate", 18))
        gst_amount = subtotal * (gst_rate / 100)
        grand_total = subtotal + gst_amount

        if "subtotal" in invoice_data:
            subtotal = float(invoice_data["subtotal"])
        if "gst_amount" in invoice_data:
            gst_amount = float(invoice_data["gst_amount"])
        if "total" in invoice_data:
            grand_total = float(invoice_data["total"])
        if "grand_total" in invoice_data:
            grand_total = float(invoice_data["grand_total"])

        amount_in_words = data.get("amount_in_words", "")
        if not amount_in_words:
            amount_in_words = number_to_words(grand_total)

        invoice_number = generate_invoice_number(data.get("invoice_number", ""))

        invoice_date = data.get("invoice_date", "")
        if not invoice_date:
            invoice_date = format_invoice_date()
        elif isinstance(invoice_date, str) and "T" in invoice_date:
            invoice_date = format_invoice_date(invoice_date)

        context = {
            **data,
            "items": processed_items,
            "subtotal": subtotal,
            "gst_rate": gst_rate,
            "gst_amount": gst_amount,
            "grand_total": grand_total,
            "amount_in_words": amount_in_words,
            "invoice_number": invoice_number,
            "invoice_date": invoice_date,
            "logo_path": LOGO_PATH,
            "signature_path": SIGNATURE_PATH,
            "format_currency_indian": format_currency_indian,
            "mode_of_delivery": data.get("mode_of_delivery", "BY TRANSPORT"),
            "dispatch_from": data.get("dispatch_from", ""),
            "ship_to_address": data.get("ship_to_address", ""),
            "ref_attended_by": data.get("ref_attended_by", ""),
            "delivery_label": data.get("delivery_label", "FACTORY DELIVERY"),
        }

        template = self.env.get_template("invoice.html")
        return template.render(**context)


# Singleton
invoice_pdf_service = InvoicePDFService()
