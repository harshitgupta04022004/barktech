#!/usr/bin/env python3
"""Test: Send inquiry reply email via Brevo."""

import asyncio
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.mcp.email_mcp import send_email

TO_EMAIL = "hg280175@gmail.com"


def build_reply_html():
    path = os.path.join(os.path.dirname(__file__), "templates", "inquiry_reply.html")
    with open(path) as f:
        html = f.read()

    data = {
        "{{logo_url}}": "https://barktechnologies.in/images/logo/logo.png",
        "{{inquiry_subject}}": "Automatic Capping Machine - Pricing & Lead Time",
        "{{ticket_id}}": "BT-2026-0847",
        "{{customer_name}}": "Gupta Enterprises",
        "{{original_query_snippet}}": "Hi, I need a quote for 3 servo-based automatic capping machines with a throughput of 120 bottles/min. We also need installation support in Kanpur.",
        "{{inquiry_date}}": "23 July 2026, 10:42 AM IST",
        "{{support_url}}": "https://barktechnologies.in/faq",
        "{{support_agent_name}}": "Priya Sharma",
        "{{support_agent_title}}": "Customer Support Executive",
        "{{support_email}}": "support@barktechnologies.in",
        "{{support_phone}}": "+91 98765 43210",
        "{{company_address}}": "Industrial Area, Noida, UP 201301, India",
        "{{security_email}}": "security@barktechnologies.in",
        "{{attachment_name}}": "Product_Brochure_Capping_Machines.pdf",
        "{{attachment_url}}": "https://barktechnologies.in/docs/capping-brochure.pdf",
    }

    for k, v in data.items():
        html = html.replace(k, v)

    paras = [
        "Thank you for your interest in our servo-based automatic capping machines, Gupta Enterprises team!",
        "For 3 units of our SBC-120 model (120 bottles/min throughput), the current pricing is Rs.35,000 per unit (ex-works Noida). Installation and commissioning at your Kanpur facility is included at no extra charge.",
        "The standard lead time for this configuration is 4-6 weeks from order confirmation. We also offer expedited production at a 15% premium for a 2-3 week delivery window.",
        "Please find our full product brochure attached for detailed specifications and pricing tiers.",
    ]
    paras_html = ""
    for p in paras:
        paras_html += '<p style="margin: 0 0 12px; font-size: 14px; color: #444; line-height: 1.7;">' + p + '</p>\n'

    loop_pattern = re.compile(
        r"<!-- \{\{#each reply_paragraphs\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    m = loop_pattern.search(html)
    if m:
        html = html[:m.start()] + paras_html + html[m.end():]

    steps = [
        {"num": "1", "text": "Confirm your order by replying to this email with a purchase order."},
        {"num": "2", "text": "Our accounts team will share a proforma invoice within 24 hours."},
        {"num": "3", "text": "Upon payment confirmation, production begins and you will receive a tracking link."},
    ]
    steps_html = ""
    for s in steps:
        steps_html += '<tr><td width="32" valign="top" style="padding: 4px 10px 4px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#e65100;color:#ffffff;font-size:12px;font-weight:700;border-radius:50%;">' + s["num"] + '</span></td><td valign="top" style="padding:4px 0;font-size:13px;color:#444;line-height:1.6;">' + s["text"] + '</td></tr>'

    steps_pattern = re.compile(
        r"<!-- \{\{#each reply_steps\}\} -->.*?<!-- \{\{/each\}\} -->", re.DOTALL
    )
    m = steps_pattern.search(html)
    if m:
        html = html[:m.start()] + steps_html + html[m.end():]

    status_html = '<span style="display:inline-block;background-color:#e3f2fd;color:#1565c0;font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;">&#9993; Awaiting Your Reply</span>'
    status_pattern = re.compile(
        r"<!-- \{\{#if ticket_status\}\} -->.*?<!-- \{\{/if\}\} -->", re.DOTALL
    )
    m = status_pattern.search(html)
    if m:
        html = html[:m.start()] + status_html + html[m.end():]

    html = re.sub(r"<!--\s*\{\{.*?\}\}\s*-->", "", html)
    html = re.sub(r"\{\{#if\s+\w+\}\}", "", html)
    html = re.sub(r"\{\{/if\}\}", "", html)

    return html


async def main():
    html = build_reply_html()
    result = await send_email(TO_EMAIL, "Re: Automatic Capping Machine - Pricing & Lead Time", html)
    print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
