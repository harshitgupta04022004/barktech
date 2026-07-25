#!/usr/bin/env python3
"""Test script: Send invoice email + product details email via Brevo."""

import asyncio
import os
import sys

# Ensure we can import the agent modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.mcp.email_mcp import send_email

TO_EMAIL = "hg280175@gmail.com"


def load_template(name: str) -> str:
    tpl_path = os.path.join(os.path.dirname(__file__), "templates", name)
    with open(tpl_path, "r") as f:
        return f.read()


def fill_invoice_template(html: str, data: dict) -> str:
    """Simple Handlebars-style placeholder substitution."""
    for key, val in data.items():
        html = html.replace("{{" + key + "}}", str(val))
    return html


async def send_invoice_email():
    template = load_template("invoice_email.html")

    sample = {
        # Company
        "company_name": "Bark Technology",
        "company_address": "Industrial Area, Noida, UP 201301, India",
        "company_gstin": "09AABCB1234C1Z5",
        "company_logo_url": "https://barktechnologies.in/images/logo/logo.png",
        # Invoice meta
        "invoice_no": "BARK-INV-2026-0042",
        "invoice_date": "25 July 2026",
        "due_date": "24 August 2026",
        "place_of_supply": "Uttar Pradesh (09)",
        "state_code": "09",
        # Buyer
        "buyer_name": "Gupta Enterprises",
        "buyer_address": "45, Industrial Estate, Kanpur, UP 208001",
        "buyer_gstin": "09DEFGH5678I1Z8",
        # Ship-to
        "ship_to_name": "Gupta Enterprises — Warehouse",
        "ship_to_address": "78, Sector 62, Noida, UP 201301",
        # Totals
        "subtotal": "₹1,85,000.00",
        "cgst": "₹16,650.00",
        "sgst": "₹16,650.00",
        "igst": "",
        "round_off": "",
        "grand_total": "₹2,18,300.00",
        "amount_in_words": "Rupees Two Lakh Eighteen Thousand Three Hundred Only",
        # Bank
        "bank_account_name": "Bark Technology",
        "bank_account_no": "12345678901234",
        "bank_ifsc": "HDFC0001234",
        "bank_name": "HDFC Bank Ltd — Noida Branch",
        # Signature
        "authorized_signatory": "Rajesh Kumar",
        "company_seal_note": "This is a computer-generated invoice.",
        # Email
        "pdf_download_url": "https://barktechnologies.in/invoices/BARK-INV-2026-0042.pdf",
        "buyer_email": TO_EMAIL,
        # Support
        "support_email": "support@barktechnologies.in",
        "support_phone": "+91 98765 43210",
    }

    # Inject item rows and terms via Handlebars {{#each}} loops
    # (manual replacement since we're not using a Handlebars engine here)
    # Find and replace the item loop
    import re

    item_pattern = re.compile(
        r"<!-- \{\{#each item_rows\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    item_template_match = item_pattern.search(template)
    if item_template_match:
        item_block = item_template_match.group(0)
        items = [
            {"sno": "1", "desc": "Automatic Die Cutting & Creasing Machine 1100mm", "hsn": "8462", "qty": "1", "unit": "NOS", "rate": "₹85,000.00", "gst": "18", "amt": "₹1,00,300.00"},
            {"sno": "2", "desc": "Servo Based Automatic Capping Machine", "hsn": "8462", "qty": "2", "unit": "NOS", "rate": "₹35,000.00", "gst": "18", "amt": "₹82,600.00"},
            {"sno": "3", "desc": "Installation & Commissioning Charges", "hsn": "9983", "qty": "1", "unit": "NOS", "rate": "₹10,000.00", "gst": "18", "amt": "₹11,800.00"},
            {"sno": "4", "desc": "Spare Parts Kit (Seals, Bearings, O-Rings)", "hsn": "8462", "qty": "1", "unit": "SET", "rate": "₹8,500.00", "gst": "18", "amt": "₹10,030.00"},
        ]
        rows_html = ""
        for i, item in enumerate(items):
            bg = "#ffffff" if i % 2 == 0 else "#fafafa"
            rows_html += f"""
          <tr>
            <td style="padding:10px 8px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;background-color:{bg};">{item["sno"]}</td>
            <td style="padding:10px 8px;font-size:12px;color:#333;font-weight:600;border-bottom:1px solid #f0f0f0;background-color:{bg};">{item["desc"]}</td>
            <td style="padding:10px 8px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;background-color:{bg};" class="hide-mobile">{item["hsn"]}</td>
            <td style="padding:10px 8px;font-size:12px;color:#333;text-align:center;border-bottom:1px solid #f0f0f0;background-color:{bg};">{item["qty"]} {item["unit"]}</td>
            <td style="padding:10px 8px;font-size:12px;color:#333;text-align:right;border-bottom:1px solid #f0f0f0;background-color:{bg};">{item["rate"]}</td>
            <td style="padding:10px 8px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;background-color:{bg};" class="hide-mobile">{item["gst"]}%</td>
            <td style="padding:10px 8px;font-size:12px;color:#333;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;background-color:{bg};">{item["amt"]}</td>
          </tr>"""
        template = template[:item_pattern.search(template).start()] + rows_html + template[item_pattern.search(template).end():]

    # Terms
    term_pattern = re.compile(
        r"<!-- \{\{#each terms\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    term_match = term_pattern.search(template)
    if term_match:
        terms = [
            "Payment is due within 30 days of invoice date.",
            "Interest at 1.5% per month will be charged on overdue amounts.",
            "Goods once sold will not be taken back or exchanged.",
            "E. & O.E. (Errors and Omissions Excepted).",
            "Subject to Noida jurisdiction.",
        ]
        term_html = ""
        for i, t in enumerate(terms, 1):
            term_html += f"""
          <tr>
            <td style="padding:2px 0;font-size:11px;color:#888;width:20px;vertical-align:top;">{i}.</td>
            <td style="padding:2px 0;font-size:11px;color:#666;line-height:1.5;">{t}</td>
          </tr>"""
        template = template[:term_pattern.search(template).start()] + term_html + template[term_pattern.search(template).end():]

    # Clean remaining Handlebars comments
    for pattern in [r"\{\{#if\s+\w+\}\}", r"\{\{/if\}\}", r"\{\{#each\s+\w+\}\}", r"\{\{/each\}\}"]:
        template = re.sub(pattern, "", template)

    result = await send_email(TO_EMAIL, f"Invoice {sample['invoice_no']} — {sample['company_name']}", template)
    return result


async def main():
    print("=== Sending Invoice Email ===")
    r1 = await send_invoice_email()
    print(f"Invoice result: {r1}")


if __name__ == "__main__":
    asyncio.run(main())
