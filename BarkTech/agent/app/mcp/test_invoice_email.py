#!/usr/bin/env python3
"""Test script: Send invoice email with PDF attachment via Brevo."""

import asyncio
import base64
import os
import re
import sys
import io

# Ensure we can import the agent modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.mcp.email_mcp import send_email

TO_EMAIL = "hg280175@gmail.com"

INVOICE_NO = "BARK-INV-2026-0042"

# -- Mock invoice data --

INVOICE_DATA = {
    # Company
    "company_name": "Bark Technology",
    "company_address": "Industrial Area, Noida, UP 201301, India",
    "company_gstin": "09AABCB1234C1Z5",
    "company_logo_url": "https://barktechnologies.in/images/logo/logo.png",
    # Invoice meta
    "invoice_no": INVOICE_NO,
    "invoice_date": "25 July 2026",
    "due_date": "24 August 2026",
    "place_of_supply": "Uttar Pradesh (09)",
    "state_code": "09",
    # Buyer
    "buyer_name": "Gupta Enterprises",
    "buyer_address": "45, Industrial Estate, Kanpur, UP 208001",
    "buyer_gstin": "09DEFGH5678I1Z8",
    # Ship-to
    "ship_to_name": "Gupta Enterprises - Warehouse",
    "ship_to_address": "78, Sector 62, Noida, UP 201301",
    # Totals
    "subtotal": "Rs. 1,85,000.00",
    "cgst": "Rs. 16,650.00",
    "sgst": "Rs. 16,650.00",
    "igst": "",
    "round_off": "",
    "grand_total": "Rs. 2,18,300.00",
    "amount_in_words": "Rupees Two Lakh Eighteen Thousand Three Hundred Only",
    # Bank
    "bank_account_name": "Bark Technology",
    "bank_account_no": "12345678901234",
    "bank_ifsc": "HDFC0001234",
    "bank_name": "HDFC Bank Ltd - Noida Branch",
    # Signature
    "authorized_signatory": "Rajesh Kumar",
    "company_seal_note": "This is a computer-generated invoice.",
    # Email
    "pdf_download_url": f"https://barktechnologies.in/invoices/{INVOICE_NO}.pdf",
    # Support
    "support_email": "support@barktechnologies.in",
    "support_phone": "+91 98765 43210",
}

ITEM_ROWS = [
    {"sno": "1", "description": "Automatic Die Cutting & Creasing Machine 1100mm", "hsn_code": "8462", "qty": "1", "unit": "NOS", "rate": "Rs. 85,000.00", "gst_percent": "18", "amount": "Rs. 1,00,300.00"},
    {"sno": "2", "description": "Servo Based Automatic Capping Machine", "hsn_code": "8462", "qty": "2", "unit": "NOS", "rate": "Rs. 35,000.00", "gst_percent": "18", "amount": "Rs. 82,600.00"},
    {"sno": "3", "description": "Installation & Commissioning Charges", "hsn_code": "9983", "qty": "1", "unit": "NOS", "rate": "Rs. 10,000.00", "gst_percent": "18", "amount": "Rs. 11,800.00"},
    {"sno": "4", "description": "Spare Parts Kit (Seals, Bearings, O-Rings)", "hsn_code": "8462", "qty": "1", "unit": "SET", "rate": "Rs. 8,500.00", "gst_percent": "18", "amount": "Rs. 10,030.00"},
]

TERMS = [
    "Payment is due within 30 days of invoice date.",
    "Interest at 1.5% per month will be charged on overdue amounts.",
    "Goods once sold will not be taken back or exchanged.",
    "E. & O.E. (Errors and Omissions Excepted).",
    "Subject to Noida jurisdiction.",
]


def load_template(name: str) -> str:
    tpl_path = os.path.join(os.path.dirname(__file__), "templates", name)
    with open(tpl_path, "r") as f:
        return f.read()


def render_invoice_template(html: str) -> str:
    """Render the invoice template by replacing loops and placeholders."""

    # -- 1. Replace {{#each item_rows}} ... {{/each}} --
    item_pattern = re.compile(
        r"<!-- \{\{#each item_rows\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    item_match = item_pattern.search(html)
    if item_match:
        loop_content = item_match.group(0)
        single_row = re.search(r"(<tr>.*?</tr>)", loop_content, re.DOTALL)
        if single_row:
            row_template = single_row.group(1)
            rows_html = ""
            for i, item in enumerate(ITEM_ROWS):
                bg = "#ffffff" if i % 2 == 0 else "#fafafa"
                row = row_template
                for key, val in item.items():
                    row = row.replace("{{this." + key + "}}", str(val))
                row = row.replace("{{#if @odd}}", bg if i % 2 != 0 else "")
                row = row.replace("{{else}}", "")
                row = row.replace("{{/if}}", "")
                rows_html += "\n                  " + row
            html = html[:item_match.start()] + rows_html + "\n                  " + html[item_match.end():]

    # -- 2. Replace {{#each terms}} ... {{/each}} --
    term_pattern = re.compile(
        r"<!-- \{\{#each terms\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    term_match = term_pattern.search(html)
    if term_match:
        loop_content = term_match.group(0)
        single_row = re.search(r"(<tr>.*?</tr>)", loop_content, re.DOTALL)
        if single_row:
            row_template = single_row.group(1)
            terms_html = ""
            for i, term_text in enumerate(TERMS, 1):
                row = row_template
                row = row.replace("{{this.number}}", str(i))
                row = row.replace("{{this.text}}", term_text)
                terms_html += "\n                  " + row
            html = html[:term_match.start()] + terms_html + "\n                  " + html[term_match.end():]

    # -- 3. Replace all remaining {{variable}} placeholders --
    for key, val in INVOICE_DATA.items():
        html = html.replace("{{" + key + "}}", str(val))

    # -- 4. Clean any remaining Handlebars comments/syntax --
    html = re.sub(r"<!-- \{\{#if \w+\}\} -->", "", html)
    html = re.sub(r"<!-- \{\{/if\}\} -->", "", html)
    html = re.sub(r"<!-- \{\{else\}\} -->", "", html)
    html = re.sub(r"\{\{#if\s+\w+\}\}", "", html)
    html = re.sub(r"\{\{/if\}\}", "", html)
    html = re.sub(r"\{\{else\}\}", "", html)
    html = re.sub(r"\{\{#each\s+\w+\}\}", "", html)
    html = re.sub(r"\{\{/each\}\}", "", html)

    return html


def create_dummy_pdf() -> bytes:
    """Create a simple valid PDF file in memory."""
    pdf_content = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 412 >>
stream
BT
/F1 12 Tf
72 720 Td
(Bark Technology) Tj
/F1 10 Tf
0 -25 Td
(Tax Invoice {INVOICE_NO}) Tj
0 -20 Td
(Invoice Date: {INVOICE_DATA['invoice_date']}) Tj
0 -15 Td
(Due Date: {INVOICE_DATA['due_date']}) Tj
0 -25 Td
(Bill To: {INVOICE_DATA['buyer_name']}) Tj
0 -15 Td
({INVOICE_DATA['buyer_address']}) Tj
0 -25 Td
(Amount: {INVOICE_DATA['grand_total']}) Tj
0 -15 Td
(Status: Generated for testing) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000730 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
809
%%EOF"""
    return pdf_content.encode("utf-8")


async def send_invoice_email():
    """Send invoice email with proper template rendering and PDF attachment."""
    template = load_template("invoice_email.html")

    # Step 1: Render the template (loops + placeholders)
    rendered_html = render_invoice_template(template)

    print(f"\n--- Template Rendering Check ---")
    print(f"  'buyer_name' present: {'Gupta Enterprises' in rendered_html}")
    print(f"  'invoice_no' present: {'BARK-INV-2026-0042' in rendered_html}")
    print(f"  Item rows rendered: {'Automatic Die Cutting' in rendered_html}")
    print(f"  Terms rendered: {'Payment is due within 30 days' in rendered_html}")

    # Step 2: Create a dummy PDF for attachment
    pdf_bytes = create_dummy_pdf()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

    # Step 3: Send email with PDF attachment
    attachments = [
        {
            "filename": f"Invoice_{INVOICE_NO}.pdf",
            "content": pdf_b64,
            "contentType": "application/pdf",
        }
    ]

    subject = f"Invoice {INVOICE_NO} -- {INVOICE_DATA['company_name']}"
    print(f"\n--- Sending Invoice Email ---")
    print(f"  To: {TO_EMAIL}")
    print(f"  Subject: {subject}")
    print(f"  Attachments: 1 PDF ({len(pdf_bytes)} bytes)")

    result = await send_email(
        TO_EMAIL, subject, rendered_html, attachments=attachments
    )
    return result


async def main():
    print("=" * 60)
    print("  BARK TECHNOLOGY -- Invoice Email Test (with PDF Attachment)")
    print("=" * 60)

    r = await send_invoice_email()
    print(f"\nResult: {r}")


if __name__ == "__main__":
    asyncio.run(main())
