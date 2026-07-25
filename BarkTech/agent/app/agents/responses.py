"""Typed response schemas for the BarkTech multi-agent system.

All agents return StructuredResponse objects that get serialized to XML tags.
This ensures consistent, renderable output across the entire system.
"""

from pydantic import BaseModel, Field
from typing import Literal, Optional, Any
from enum import Enum


class ResponseType(str, Enum):
    """All possible response types that agents can produce."""
    TEXT = "text"
    PRODUCT_CARD = "product_card"
    PRODUCT_LIST = "product_list"
    INVOICE_CARD = "invoice_card"
    INVOICE_LIST = "invoice_list"
    EMAIL_LAYOUT = "email_layout"
    BLOG_LAYOUT = "blog_layout"
    NEWS_LAYOUT = "news_layout"
    CASE_STUDY_LAYOUT = "case_study_layout"
    LEAD_CARD = "lead_card"
    LEAD_LIST = "lead_list"
    STOCK_ALERT = "stock_alert"
    TABLE_VIEW = "table_view"
    STATS_CHART = "stats_chart"
    DELETE_CONFIRM = "delete_confirm"
    HITL_CONFIRM = "hitl_confirm"
    MULTI_RESULT = "multi_result"
    CALENDAR_EVENT = "calendar_event"
    WHATSAPP_CONFIRM = "whatsapp_confirm"


# ── Base Response ─────────────────────────────────────

class StructuredResponse(BaseModel):
    """Universal response envelope. Every agent output wraps in this."""
    response_type: ResponseType
    payload: dict[str, Any] = Field(default_factory=dict)
    text_summary: str = ""  # Human-readable summary above the card
    action_buttons: list[dict] = []  # [{label, action, payload}]


# ── Product Responses ─────────────────────────────────

class ProductCardPayload(BaseModel):
    product_id: str
    name: str
    slug: str = ""
    category: str = ""
    published: bool = False
    is_featured: bool = False
    short_description: str = ""
    description: str = ""
    models: str = ""
    lead_time_days: int = 0
    warranty_months: int = 0
    specs: list[dict] = []
    media: list[dict] = []
    llm_extracted_data: Optional[dict] = None


class ProductListPayload(BaseModel):
    products: list[ProductCardPayload] = []
    total_count: int = 0
    page: int = 1
    page_size: int = 20


# ── Invoice Responses ─────────────────────────────────

class InvoiceLineItem(BaseModel):
    description: str
    hsn_code: str = ""
    quantity: int = 1
    unit_price: float = 0.0
    gst_rate: float = 18.0
    line_total: float = 0.0


class InvoiceCardPayload(BaseModel):
    invoice_id: str
    invoice_number: str
    customer_name: str
    customer_email: str = ""
    customer_phone: str = ""
    status: str = "draft"  # draft, sent, paid, overdue, cancelled
    line_items: list[InvoiceLineItem] = []
    subtotal: float = 0.0
    gst_amount: float = 0.0
    total: float = 0.0
    due_date: str = ""
    paid_date: Optional[str] = None
    notes: str = ""
    pdf_url: Optional[str] = None


class InvoiceListPayload(BaseModel):
    invoices: list[InvoiceCardPayload] = []
    total_count: int = 0
    total_amount: float = 0.0
    total_paid: float = 0.0
    total_pending: float = 0.0


# ── Lead/CRM Responses ───────────────────────────────

class LeadCardPayload(BaseModel):
    lead_id: str
    contact_name: str
    email: str = ""
    phone: str = ""
    company: str = ""
    product_interest: str = ""
    source: str = ""  # website, phone, email, referral
    status: str = "new"  # new, contacted, qualified, proposal_sent, won, lost
    priority: str = "medium"  # low, medium, high, urgent
    assigned_to: str = ""
    notes: str = ""
    created_at: str = ""
    last_contact: str = ""
    next_follow_up: Optional[str] = None


class LeadListPayload(BaseModel):
    leads: list[LeadCardPayload] = []
    total_count: int = 0
    status_breakdown: dict[str, int] = {}  # {"new": 5, "contacted": 3, ...}


# ── Email Responses ───────────────────────────────────

class EmailLayoutPayload(BaseModel):
    to: str
    subject: str
    preview_text: str = ""
    body_html: str = ""
    from_name: str = "Bark Technologies"
    from_email: str = ""
    template_type: str = ""  # inquiry_ack, invoice, quote, payment_reminder, newsletter
    attachments: list[dict] = []
    sent: bool = False
    message_id: Optional[str] = None


# ── Content/Blog Responses ────────────────────────────

class BlogLayoutPayload(BaseModel):
    content_id: str
    title: str
    slug: str = ""
    content_type: str = "blog"  # blog, news, case_study
    excerpt: str = ""
    body_html: str = ""
    cover_image: str = ""
    author: str = "Bark Technologies"
    published: bool = False
    published_at: Optional[str] = None
    tags: list[str] = []
    meta_title: str = ""
    meta_description: str = ""
    social_publish_status: dict[str, str] = {}  # {"linkedin": "published", "twitter": "pending"}


class NewsLayoutPayload(BaseModel):
    content_id: str
    title: str
    slug: str = ""
    summary: str = ""
    body_html: str = ""
    source: str = ""
    published_at: str = ""
    cover_image: str = ""
    tags: list[str] = []


class CaseStudyLayoutPayload(BaseModel):
    content_id: str
    title: str
    client_name: str = ""
    industry: str = ""
    challenge: str = ""
    solution: str = ""
    results: str = ""
    body_html: str = ""
    cover_image: str = ""
    published: bool = False


# ── Inventory/Stock Responses ─────────────────────────

class StockAlertPayload(BaseModel):
    product_id: str
    product_name: str
    current_stock: int = 0
    min_stock: int = 5
    location: str = "Main Warehouse"
    is_low_stock: bool = False
    reorder_suggested: bool = False


class TableViewPayload(BaseModel):
    title: str = ""
    headers: list[str] = []
    rows: list[list[str]] = []
    footer: Optional[dict] = None  # {"label": "Total", "values": [...]}


class StatsChartPayload(BaseModel):
    title: str = ""
    chart_type: str = "bar"  # bar, line, pie, donut
    metrics: list[dict] = []  # [{"label": "New Leads", "value": 12, "change": "+3", "trend": "up"}]
    data_points: list[dict] = []  # [{"label": "Jan", "value": 100}, ...]


# ── Calendar/Scheduling Responses ─────────────────────

class CalendarEventPayload(BaseModel):
    event_id: str = ""
    title: str
    description: str = ""
    start_time: str
    end_time: str = ""
    location: str = ""
    attendees: list[str] = []
    event_type: str = ""  # demo, installation, site_visit, meeting
    customer_name: str = ""
    customer_email: str = ""
    status: str = "confirmed"  # confirmed, pending, cancelled
    google_calendar_link: str = ""


# ── WhatsApp Responses ────────────────────────────────

class WhatsAppConfirmPayload(BaseModel):
    to: str
    message: str
    template_name: str = ""
    status: str = "sent"  # sent, failed, pending
    message_id: Optional[str] = None
    timestamp: str = ""


# ── HITL / Confirmation Responses ────────────────────

class DeleteConfirmPayload(BaseModel):
    entity_type: str  # product, lead, invoice, blog
    entity_id: str
    entity_name: str
    warning: str = "This action cannot be undone."


class HITLConfirmPayload(BaseModel):
    action: str  # delete, publish, send_bulk_email, run_ad_campaign
    description: str
    entity_type: str = ""
    entity_id: str = ""
    risk_level: str = "medium"  # low, medium, high
    requires_approval: bool = True


# ── Multi-Result Response ────────────────────────────

class MultiResultItem(BaseModel):
    response_type: str
    payload: dict[str, Any] = {}
    text_summary: str = ""


class MultiResultPayload(BaseModel):
    items: list[MultiResultItem] = []
    total_results: int = 0
