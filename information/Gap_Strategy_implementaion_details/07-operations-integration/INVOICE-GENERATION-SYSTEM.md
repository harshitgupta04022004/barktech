# Invoice Generation System — HLD/LLD Design Document

> **Version:** 1.0
> **Date:** July 2026
> **Stack:** FastAPI + SQLAlchemy + Jinja2 + WeasyPrint + PostgreSQL
> **Domain:** barktechnologies.in

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Design (HLD)](#2-high-level-design-hld)
3. [Low-Level Design (LLD)](#3-low-level-design-lld)
4. [Mermaid Diagrams](#4-mermaid-diagrams)
5. [SOLID Principles Application](#5-solid-principles-application)
6. [Database Schema](#6-database-schema)
7. [Invoice Data Model](#7-invoice-data-model)
8. [Line Items Management](#8-line-items-management)
9. [Tax Calculation Engine](#9-tax-calculation-engine)
10. [Invoice Number Sequence System](#10-invoice-number-sequence-system)
11. [PDF Generation Service](#11-pdf-generation-service)
12. [WeasyPrint Configuration](#12-weasyprint-configuration)
13. [HTML/CSS Invoice Template](#13-htmlcss-invoice-template)
14. [Print-Ready CSS](#14-print-ready-css)
15. [Jinja2 Template Rendering](#15-jinja2-template-rendering)
16. [PDF Optimization](#16-pdf-optimization)
17. [Print Support](#17-print-support)
18. [API Endpoints](#18-api-endpoints)
19. [Implementation Plan](#19-implementation-plan)
20. [Code Implementation](#20-code-implementation)
21. [Testing Strategy](#21-testing-strategy)
22. [Security Considerations](#22-security-considerations)
23. [Performance Optimization](#23-performance-optimization)
24. [Deployment Considerations](#24-deployment-considerations)

---

## 1. System Overview

### 1.1 Purpose

The Invoice Generation System provides one-click PDF invoice creation from the product catalog. It enables sales teams and administrators to generate professional, print-ready invoices with:

- Product details pulled directly from the catalog
- Auto-calculated line items, taxes, and totals
- Auto-incrementing invoice numbers (e.g., `INV-2026-000001`)
- Professional A4 PDF output with WeasyPrint
- Print-optimized CSS for direct printing
- Template-based design for easy customization

### 1.2 Core Capabilities

| Capability | Description |
|---|---|
| Product Selection | Select products from catalog for invoice line items |
| Quantity and Discount | Enter quantities and apply line-item discounts |
| Tax Calculation | Auto-calculate GST/CGST/SGST based on configurable rates |
| Number Sequence | Auto-increment invoice numbers with date prefix |
| PDF Rendering | Generate print-ready PDF via WeasyPrint |
| Print Support | Direct browser print with CSS print media queries |
| Template Management | Jinja2 templates for HTML rendering |
| History and Lookup | Store and retrieve past invoices |

### 1.3 Technology Stack

| Component | Technology |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15+ |
| ORM | SQLAlchemy 2.1 |
| PDF Engine | WeasyPrint 62+ |
| Templating | Jinja2 |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Print | CSS Paged Media + WeasyPrint |

### 1.4 Dependencies

```
# requirements.txt additions
weasyprint>=62.0
jinja2>=3.1.0
Pillow>=10.0.0
```

### 1.5 System Constraints

- WeasyPrint requires system libraries: `pango`, `harfbuzz`, `cairo`
- PDF generation is CPU-bound and single-threaded — offload to background tasks for high volume
- No JavaScript execution in WeasyPrint — all dynamic content must be server-rendered
- Invoice numbers must be globally unique and gapless (application-level guarantee)

---

## 2. High-Level Design (HLD)

### 2.1 Architecture Overview

The system follows a layered architecture pattern:

```
+-------------------------------------------------------------------------+
|                      CLIENT LAYER                                       |
|                                                                         |
|   +----------------+  +----------------+  +-------------------+         |
|   | Invoice Form   |  | Invoice List   |  | Invoice Preview   |         |
|   | (Jinja2)       |  | (Jinja2)       |  | (Jinja2)          |         |
|   | /invoices/*    |  | /invoices/*    |  | /invoices/*       |         |
|   +-------+--------+  +-------+--------+  +-------------------+         |
|           |                   |                    |                     |
+-----------+-------------------+--------------------+---------------------+
            |                   |                    |
            v                   v                    v
+-------------------------------------------------------------------------+
|                    SERVICE LAYER (FastAPI)                               |
|                                                                         |
|   +---------------------------------------------------------------+    |
|   |                  InvoiceService                                 |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   |  | Create      |  | Validate     |  | Calculate    |          |    |
|   |  | Invoice     |  | Line Items   |  | Totals       |          |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   +---------------------------------------------------------------+    |
|                                                                         |
|   +---------------------------------------------------------------+    |
|   |               PDFGeneratorService                              |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   |  | Render HTML |  | Apply CSS    |  | Generate PDF |          |    |
|   |  | (Jinja2)    |  | (WeasyPrint) |  | (BytesIO)    |          |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   +---------------------------------------------------------------+    |
|                                                                         |
|   +---------------------------------------------------------------+    |
|   |              NumberSequenceService                             |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   |  | Get Next    |  | Validate     |  | Reserve      |          |    |
|   |  | Number      |  | Format       |  | Sequence     |          |    |
|   |  +-------------+  +--------------+  +--------------+          |    |
|   +---------------------------------------------------------------+    |
+-------------------------------------------------------------------------+
            |                   |                    |
            v                   v                    v
+-------------------------------------------------------------------------+
|                      DATA LAYER                                         |
|                                                                         |
|   +--------------+  +--------------+  +------------------+             |
|   |   Invoice    |  | InvoiceItem  |  | NumberSequence   |             |
|   |   Table      |  | Table        |  | Table            |             |
|   +--------------+  +--------------+  +------------------+             |
|                                                                         |
|   +--------------+  +--------------+                                    |
|   |   Product    |  |   Category   |                                    |
|   |   Table      |  |   Table      |                                    |
|   +--------------+  +--------------+                                    |
+-------------------------------------------------------------------------+
```

### 2.2 Invoice Generation Pipeline

The pipeline consists of five stages:

1. **Product Selection** — Admin selects products from catalog, enters quantities
2. **Data Validation** — Validate line items, check stock, verify pricing
3. **Calculation Engine** — Calculate subtotals, taxes, discounts, grand total
4. **Number Assignment** — Generate unique invoice number from sequence
5. **PDF Rendering** — Render HTML template, Apply CSS, Generate PDF via WeasyPrint

### 2.3 PDF Rendering Strategy

```
Invoice Data (Dict)
        |
        v
+-------------------+
|   Jinja2 Engine   |  <- HTML Template + CSS Styles
|   (Template)      |
+---------+---------+
          |
          v
+-------------------+
|   HTML String     |  <- Fully rendered HTML with all data
+---------+---------+
          |
          v
+-------------------+
|   WeasyPrint      |  <- HTML + CSS Paged Media
|   (Renderer)      |
+---------+---------+
          |
          v
+-------------------+
|   PDF Bytes       |  <- In-memory PDF (BytesIO)
|   (Output)        |
+-------------------+
```

**Key Design Decisions:**
- **In-memory generation**: Use `io.BytesIO()` to avoid disk I/O — stream PDF directly to response
- **Template separation**: HTML template, CSS stylesheet, and data are separate concerns
- **Deterministic output**: Same input always produces byte-identical PDF output
- **No JavaScript**: All content is server-rendered — WeasyPrint does not execute JS

### 2.4 Template Management

Templates follow a three-file pattern:

```
bark/
+-- templates/
|   +-- invoices/
|       +-- invoice.html          # Main Jinja2 HTML template
|       +-- invoice_preview.html  # Web preview (browser render)
|       +-- invoice_list.html     # Invoice listing page
+-- static/
    +-- css/
        +-- invoice.css           # Print-optimized CSS for WeasyPrint
```

**Template Strategy:**
- `invoice.html` — Jinja2 template rendered by WeasyPrint for PDF generation
- `invoice_preview.html` — Same template rendered in browser for preview before download
- `invoice.css` — CSS Paged Media rules for WeasyPrint, separate from app CSS
- `invoice_print.css` — Print media queries for direct browser printing

### 2.5 Number Sequence System

Invoice numbers follow the pattern: `INV-{YYYY}-{NNNNNN}`

| Component | Example | Description |
|---|---|---|
| Prefix | `INV` | Fixed prefix identifying document type |
| Separator | `-` | Hyphen separator |
| Year | `2026` | 4-digit year |
| Sequence | `000001` | 6-digit zero-padded sequence |

**Sequence Guarantees:**
- Numbers are unique across all invoices
- Numbers are gapless (no skipped numbers)
- Numbers reset annually (new year starts from 000001)
- Concurrent access is safe via PostgreSQL `SELECT ... FOR UPDATE`

---

## 3. Low-Level Design (LLD)

### 3.1 Invoice Data Model

```python
# app/models/invoice.py

from __future__ import annotations
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    Numeric, ForeignKey, Boolean, Index, CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship, validates
from app.database import Base


class Invoice(Base):
    """Represents a single invoice document."""
    
    __tablename__ = "invoices"

    # --- Identity ---
    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_number = Column(String(30), unique=True, nullable=False, index=True)
    
    # --- Dates ---
    invoice_date = Column(Date, nullable=False, server_default=func.now())
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # --- Parties ---
    company_name = Column(String(300), nullable=False)
    company_address = Column(Text, nullable=True)
    company_gst = Column(String(20), nullable=True)
    company_phone = Column(String(30), nullable=True)
    company_email = Column(String(200), nullable=True)
    
    customer_name = Column(String(300), nullable=False)
    customer_address = Column(Text, nullable=True)
    customer_gst = Column(String(20), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    customer_email = Column(String(200), nullable=True)
    
    # --- Financials ---
    subtotal = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_percent = Column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    tax_rate = Column(Numeric(5, 2), nullable=False, default=Decimal("18.00"))
    tax_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    grand_total = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    
    # --- Status ---
    status = Column(String(20), nullable=False, default="draft")
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    
    # --- Metadata ---
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # --- Relationships ---
    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.sort_order",
    )
    
    __table_args__ = (
        Index("ix_invoices_status", "status"),
        Index("ix_invoices_invoice_date", "invoice_date"),
        CheckConstraint(
            "status IN ('draft', 'sent', 'paid', 'cancelled')",
            name="ck_invoice_status"
        ),
    )

    @validates("invoice_number")
    def validate_invoice_number(self, key, value):
        if not value or len(value) < 5:
            raise ValueError(f"Invalid invoice number: {value}")
        return value

    @property
    def is_editable(self) -> bool:
        return self.status == "draft"

    @property
    def cgst_amount(self) -> Decimal:
        """CGST is half the GST rate (for intra-state)."""
        return self.tax_amount / 2

    @property
    def sgst_amount(self) -> Decimal:
        """SGST is half the GST rate (for intra-state)."""
        return self.tax_amount / 2

    @property
    def igst_amount(self) -> Decimal:
        """IGST is full GST rate (for inter-state)."""
        return self.tax_amount


class InvoiceItem(Base):
    """A single line item on an invoice."""
    
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(
        Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    
    # --- Item Details ---
    description = Column(String(500), nullable=False)
    hsn_code = Column(String(20), nullable=True)
    unit = Column(String(20), nullable=True, default="PCS")
    
    # --- Quantities and Pricing ---
    quantity = Column(Numeric(10, 2), nullable=False, default=Decimal("1.00"))
    unit_price = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_percent = Column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    tax_rate = Column(Numeric(5, 2), nullable=False, default=Decimal("18.00"))
    tax_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    
    # --- Sorting ---
    sort_order = Column(Integer, default=0)
    
    # --- Relationships ---
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", foreign_keys=[product_id])

    __table_args__ = (
        Index("ix_invoice_items_invoice_id", "invoice_id"),
    )

    def calculate_totals(self) -> None:
        """Recalculate line item totals from quantity, price, discount, tax."""
        base = self.quantity * self.unit_price
        self.discount_amount = (base * self.discount_percent) / Decimal("100")
        taxable = base - self.discount_amount
        self.tax_amount = (taxable * self.tax_rate) / Decimal("100")
        self.total = taxable + self.tax_amount


class NumberSequence(Base):
    """Tracks auto-incrementing invoice number sequences per year."""
    
    __tablename__ = "number_sequences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prefix = Column(String(10), nullable=False, default="INV")
    year = Column(Integer, nullable=False)
    last_number = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_number_sequences_prefix_year", "prefix", "year", unique=True),
    )
```

### 3.2 Line Items Management

```python
# app/services/invoice.py

from __future__ import annotations
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session, joinedload

from app.models.invoice import Invoice, InvoiceItem, NumberSequence
from app.models.product import Product


class InvoiceService:
    """Business logic for invoice creation, validation, and calculation."""

    def __init__(self, db: Session):
        self.db = db

    def create_invoice(
        self,
        company_name: str,
        customer_name: str,
        items: List[dict],
        invoice_date: Optional[date] = None,
        due_date: Optional[date] = None,
        discount_percent: Decimal = Decimal("0"),
        tax_rate: Decimal = Decimal("18"),
        notes: Optional[str] = None,
        terms: Optional[str] = None,
    ) -> Invoice:
        """Create a new invoice with line items and auto-generated number."""
        
        # Generate invoice number
        invoice_number = NumberSequenceService.get_next(self.db)
        
        # Create invoice
        invoice = Invoice(
            invoice_number=invoice_number,
            invoice_date=invoice_date or date.today(),
            due_date=due_date,
            company_name=company_name,
            customer_name=customer_name,
            discount_percent=discount_percent,
            tax_rate=tax_rate,
            notes=notes,
            terms=terms,
            status="draft",
        )
        self.db.add(invoice)
        self.db.flush()
        
        # Add line items
        for idx, item_data in enumerate(items):
            item = self._create_line_item(invoice.id, item_data, idx)
            self.db.add(item)
        
        self.db.flush()
        
        # Calculate totals
        self._recalculate_invoice(invoice)
        
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice

    def _create_line_item(
        self, invoice_id: int, item_data: dict, sort_order: int
    ) -> InvoiceItem:
        """Create a single line item from input data."""
        
        product_id = item_data.get("product_id")
        product = None
        description = item_data.get("description", "")
        unit_price = Decimal(str(item_data.get("unit_price", "0")))
        
        # If product_id provided, pull details from catalog
        if product_id:
            product = self.db.get(Product, product_id)
            if product and not description:
                description = product.name
        
        item = InvoiceItem(
            invoice_id=invoice_id,
            product_id=product_id,
            description=description,
            hsn_code=item_data.get("hsn_code", ""),
            unit=item_data.get("unit", "PCS"),
            quantity=Decimal(str(item_data.get("quantity", "1"))),
            unit_price=unit_price,
            discount_percent=Decimal(str(item_data.get("discount_percent", "0"))),
            tax_rate=Decimal(str(item_data.get("tax_rate", "18"))),
            sort_order=sort_order,
        )
        
        # Calculate line item totals
        item.calculate_totals()
        
        return item

    def _recalculate_invoice(self, invoice: Invoice) -> None:
        """Recalculate all invoice totals from line items."""
        
        subtotal = Decimal("0")
        total_tax = Decimal("0")
        total_discount = Decimal("0")
        
        for item in invoice.items:
            item.calculate_totals()
            subtotal += item.quantity * item.unit_price
            total_discount += item.discount_amount
            total_tax += item.tax_amount
        
        # Apply invoice-level discount
        invoice.subtotal = subtotal
        invoice.discount_amount = total_discount
        invoice.tax_amount = total_tax
        
        # Grand total = subtotal - invoice discount + tax
        invoice.grand_total = subtotal - invoice.discount_amount + total_tax

    def update_invoice(
        self, invoice_id: int, updates: dict
    ) -> Invoice:
        """Update an existing draft invoice."""
        
        invoice = self.db.get(Invoice, invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        if not invoice.is_editable:
            raise ValueError("Only draft invoices can be edited")
        
        # Update allowed fields
        allowed_fields = [
            "company_name", "company_address", "company_gst",
            "company_phone", "company_email",
            "customer_name", "customer_address", "customer_gst",
            "customer_phone", "customer_email",
            "invoice_date", "due_date", "notes", "terms",
            "discount_percent", "tax_rate",
        ]
        for field in allowed_fields:
            if field in updates:
                setattr(invoice, field, updates[field])
        
        self._recalculate_invoice(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice

    def add_line_item(
        self, invoice_id: int, item_data: dict
    ) -> InvoiceItem:
        """Add a line item to an existing draft invoice."""
        
        invoice = self.db.get(Invoice, invoice_id)
        if not invoice or not invoice.is_editable:
            raise ValueError("Invoice not found or not editable")
        
        sort_order = len(invoice.items)
        item = self._create_line_item(invoice_id, item_data, sort_order)
        self.db.add(item)
        
        self._recalculate_invoice(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        
        return item

    def remove_line_item(self, item_id: int) -> None:
        """Remove a line item from an invoice."""
        
        item = self.db.get(InvoiceItem, item_id)
        if not item:
            raise ValueError(f"Item {item_id} not found")
        
        invoice = item.invoice
        if not invoice.is_editable:
            raise ValueError("Only draft invoices can be modified")
        
        self.db.delete(item)
        self._recalculate_invoice(invoice)
        self.db.commit()

    def get_invoice(self, invoice_id: int) -> Optional[Invoice]:
        """Retrieve an invoice with all line items."""
        
        return self.db.execute(
            select(Invoice)
            .options(joinedload(Invoice.items))
            .where(Invoice.id == invoice_id)
        ).scalar_one_or_none()

    def get_invoice_by_number(self, invoice_number: str) -> Optional[Invoice]:
        """Retrieve an invoice by its unique number."""
        
        return self.db.execute(
            select(Invoice)
            .options(joinedload(Invoice.items))
            .where(Invoice.invoice_number == invoice_number)
        ).scalar_one_or_none()

    def list_invoices(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Invoice]:
        """List invoices with optional filtering."""
        
        query = select(Invoice).options(joinedload(Invoice.items))
        
        if status:
            query = query.where(Invoice.status == status)
        
        query = (
            query.order_by(Invoice.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        return list(self.db.execute(query).scalars().all())
```

### 3.3 Tax Calculation

```python
# app/services/tax_calculator.py

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass
from typing import List


@dataclass
class TaxBreakdown:
    """Structured tax calculation result."""
    
    subtotal: Decimal
    discount_amount: Decimal
    taxable_amount: Decimal
    cgst_rate: Decimal
    cgst_amount: Decimal
    sgst_rate: Decimal
    sgst_amount: Decimal
    igst_rate: Decimal
    igst_amount: Decimal
    total_tax: Decimal
    grand_total: Decimal


class TaxCalculator:
    """Handles GST/CGST/SGST tax calculations for Indian invoices."""

    # Default GST rate (18%)
    DEFAULT_GST_RATE = Decimal("18.00")
    
    # Tax types
    INTRA_STATE = "intra_state"  # CGST + SGST
    INTER_STATE = "inter_state"  # IGST

    @staticmethod
    def calculate(
        line_items: List[dict],
        tax_rate: Decimal = DEFAULT_GST_RATE,
        discount_percent: Decimal = Decimal("0"),
        tax_type: str = INTRA_STATE,
    ) -> TaxBreakdown:
        """
        Calculate comprehensive tax breakdown for invoice line items.
        
        Args:
            line_items: List of dicts with quantity, unit_price, discount_percent
            tax_rate: GST percentage (e.g., 18 for 18%)
            discount_percent: Invoice-level discount percentage
            tax_type: intra_state for CGST+SGST, inter_state for IGST
        
        Returns:
            TaxBreakdown with all calculated amounts
        """
        
        # Step 1: Calculate line item subtotals
        subtotal = Decimal("0")
        total_item_discount = Decimal("0")
        
        for item in line_items:
            qty = Decimal(str(item.get("quantity", "1")))
            price = Decimal(str(item.get("unit_price", "0")))
            item_discount = Decimal(str(item.get("discount_percent", "0")))
            
            line_subtotal = qty * price
            line_discount = (line_subtotal * item_discount) / Decimal("100")
            subtotal += line_subtotal
            total_item_discount += line_discount
        
        # Step 2: Apply invoice-level discount
        invoice_discount = (subtotal * discount_percent) / Decimal("100")
        total_discount = total_item_discount + invoice_discount
        
        # Step 3: Calculate taxable amount
        taxable_amount = subtotal - total_discount
        
        # Step 4: Calculate tax based on type
        total_tax = (taxable_amount * tax_rate) / Decimal("100")
        
        if tax_type == TaxCalculator.INTRA_STATE:
            # Split into CGST and SGST (each half of GST rate)
            half_rate = tax_rate / Decimal("2")
            cgst_amount = (taxable_amount * half_rate) / Decimal("100")
            sgst_amount = cgst_amount
            igst_rate = Decimal("0")
            igst_amount = Decimal("0")
            cgst_rate = half_rate
            sgst_rate = half_rate
        else:
            # IGST is full rate
            igst_amount = total_tax
            igst_rate = tax_rate
            cgst_rate = Decimal("0")
            cgst_amount = Decimal("0")
            sgst_rate = Decimal("0")
            sgst_amount = Decimal("0")
        
        # Step 5: Calculate grand total
        grand_total = taxable_amount + total_tax
        
        # Step 6: Round to 2 decimal places
        return TaxBreakdown(
            subtotal=TaxCalculator._round(subtotal),
            discount_amount=TaxCalculator._round(total_discount),
            taxable_amount=TaxCalculator._round(taxable_amount),
            cgst_rate=cgst_rate,
            cgst_amount=TaxCalculator._round(cgst_amount),
            sgst_rate=sgst_rate,
            sgst_amount=TaxCalculator._round(sgst_amount),
            igst_rate=igst_rate,
            igst_amount=TaxCalculator._round(igst_amount),
            total_tax=TaxCalculator._round(total_tax),
            grand_total=TaxCalculator._round(grand_total),
        )

    @staticmethod
    def _round(value: Decimal) -> Decimal:
        """Round to 2 decimal places using half-up rounding."""
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def amount_in_words(amount: Decimal) -> str:
        """Convert invoice total amount to words (Indian numbering system)."""
        
        ones = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
            "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
            "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
        ]
        tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty",
            "Sixty", "Seventy", "Eighty", "Ninety",
        ]
        
        def _convert_below_1000(n: int) -> str:
            if n == 0:
                return ""
            elif n < 20:
                return ones[n]
            elif n < 100:
                return tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")
            else:
                remainder = _convert_below_1000(n % 100)
                return ones[n // 100] + " Hundred" + (
                    " and " + remainder if remainder else ""
                )
        
        def _convert(n: int) -> str:
            if n == 0:
                return "Zero"
            
            parts = []
            
            # Lakhs (1,00,000)
            if n >= 100000:
                parts.append(_convert_below_1000(n // 100000) + " Lakh")
                n %= 100000
            
            # Thousands (1,000)
            if n >= 1000:
                parts.append(_convert_below_1000(n // 1000) + " Thousand")
                n %= 1000
            
            # Hundreds
            if n > 0:
                converted = _convert_below_1000(n)
                if parts and converted:
                    parts.append("and " + converted)
                elif converted:
                    parts.append(converted)
            
            return " ".join(parts)
        
        rupees = int(amount)
        paise = int((amount - rupees) * 100)
        
        result = _convert(rupees) + " Rupees"
        if paise > 0:
            result += " and " + _convert(paise) + " Paise"
        result += " Only"
        
        return result
```

### 3.4 Invoice Number Sequence Service

```python
# app/services/number_sequence.py

from __future__ import annotations
from datetime import date
from sqlalchemy import select, func, update
from sqlalchemy.orm import Session

from app.models.invoice import NumberSequence


class NumberSequenceService:
    """Thread-safe invoice number generation with PostgreSQL row locking."""

    PREFIX = "INV"
    YEAR_FORMAT = "%Y"
    SEQUENCE_PADDING = 6  # 000001

    @staticmethod
    def get_next(db: Session) -> str:
        """
        Generate the next unique invoice number.
        
        Uses SELECT ... FOR UPDATE to prevent race conditions.
        Format: INV-YYYY-NNNNNN (e.g., INV-2026-000001)
        """
        
        current_year = date.today().year
        
        # Get or create sequence row with row-level lock
        sequence = db.execute(
            select(NumberSequence)
            .where(NumberSequence.prefix == NumberSequenceService.PREFIX)
            .where(NumberSequence.year == current_year)
            .with_for_update()
        ).scalar_one_or_none()
        
        if sequence is None:
            # First invoice of the year — create sequence
            sequence = NumberSequence(
                prefix=NumberSequenceService.PREFIX,
                year=current_year,
                last_number=1,
            )
            db.add(sequence)
            db.flush()
            next_number = 1
        else:
            # Increment existing sequence
            next_number = sequence.last_number + 1
            db.execute(
                update(NumberSequence)
                .where(NumberSequence.id == sequence.id)
                .values(last_number=next_number)
            )
            db.flush()
        
        # Format: INV-2026-000001
        formatted = (
            f"{NumberSequenceService.PREFIX}-"
            f"{current_year}-"
            f"{str(next_number).zfill(NumberSequenceService.SEQUENCE_PADDING)}"
        )
        
        return formatted

    @staticmethod
    def peek_next(db: Session) -> str:
        """
        Preview the next invoice number without reserving it.
        Useful for UI preview.
        """
        
        current_year = date.today().year
        
        sequence = db.execute(
            select(NumberSequence)
            .where(NumberSequence.prefix == NumberSequenceService.PREFIX)
            .where(NumberSequence.year == current_year)
        ).scalar_one_or_none()
        
        next_number = (sequence.last_number + 1) if sequence else 1
        
        return (
            f"{NumberSequenceService.PREFIX}-"
            f"{current_year}-"
            f"{str(next_number).zfill(NumberSequenceService.SEQUENCE_PADDING)}"
        )

    @staticmethod
    def get_current_number(db: Session) -> str:
        """Get the current (last used) invoice number."""
        
        current_year = date.today().year
        
        sequence = db.execute(
            select(NumberSequence)
            .where(NumberSequence.prefix == NumberSequenceService.PREFIX)
            .where(NumberSequence.year == current_year)
        ).scalar_one_or_none()
        
        if sequence is None:
            return "No invoices generated yet this year"
        
        return (
            f"{NumberSequenceService.PREFIX}-"
            f"{current_year}-"
            f"{str(sequence.last_number).zfill(NumberSequenceService.SEQUENCE_PADDING)}"
        )
```

### 3.5 PDF Generation Service

```python
# app/services/pdf_generator.py

from __future__ import annotations
import io
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS

from app.models.invoice import Invoice


class PDFGeneratorService:
    """
    Generates PDF invoices from Jinja2 templates using WeasyPrint.
    
    Responsibilities:
    - Load and cache Jinja2 templates
    - Render HTML from invoice data
    - Apply CSS styling
    - Generate PDF bytes in memory
    """

    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates" / "invoices"
        css_dir = Path(__file__).parent.parent / "static" / "css"
        
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(["html"]),
        )
        self.template = self.env.get_template("invoice.html")
        self.css_path = css_dir / "invoice.css"
        self.base_url = str(template_dir)

    def generate_pdf(
        self,
        invoice: Invoice,
        output_path: Optional[Path] = None,
    ) -> bytes:
        """
        Generate a PDF for the given invoice.
        
        Args:
            invoice: Invoice model instance with items loaded
            output_path: Optional path to save PDF to disk
        
        Returns:
            PDF file as bytes
        """
        
        # Prepare template context
        context = self._prepare_context(invoice)
        
        # Render HTML
        html_string = self.template.render(**context)
        
        # Load CSS
        stylesheets = []
        if self.css_path.exists():
            stylesheets.append(CSS(filename=str(self.css_path)))
        
        # Generate PDF
        html = HTML(string=html_string, base_url=self.base_url)
        pdf_bytes = html.write_pdf(stylesheets=stylesheets)
        
        # Optionally save to disk
        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(pdf_bytes)
        
        return pdf_bytes

    def generate_html(
        self,
        invoice: Invoice,
    ) -> str:
        """
        Generate HTML preview for the given invoice.
        Used for browser preview before PDF download.
        """
        
        context = self._prepare_context(invoice)
        return self.template.render(**context)

    def _prepare_context(self, invoice: Invoice) -> dict:
        """Prepare template context dict from invoice model."""
        
        # Ensure items are sorted
        items = sorted(invoice.items, key=lambda x: x.sort_order)
        
        return {
            "invoice": invoice,
            "items": items,
            "company": {
                "name": invoice.company_name,
                "address": invoice.company_address,
                "gst": invoice.company_gst,
                "phone": invoice.company_phone,
                "email": invoice.company_email,
            },
            "customer": {
                "name": invoice.customer_name,
                "address": invoice.customer_address,
                "gst": invoice.customer_gst,
                "phone": invoice.customer_phone,
                "email": invoice.customer_email,
            },
            "totals": {
                "subtotal": invoice.subtotal,
                "discount": invoice.discount_amount,
                "tax_rate": invoice.tax_rate,
                "tax_amount": invoice.tax_amount,
                "cgst": invoice.cgst_amount,
                "sgst": invoice.sgst_amount,
                "igst": invoice.igst_amount,
                "grand_total": invoice.grand_total,
            },
            "invoice_date": invoice.invoice_date.strftime("%d %B %Y") if invoice.invoice_date else "",
            "due_date": invoice.due_date.strftime("%d %B %Y") if invoice.due_date else "",
            "amount_in_words": self._amount_in_words(invoice.grand_total),
        }

    def _amount_in_words(self, amount) -> str:
        """Convert amount to words (simplified)."""
        from app.services.tax_calculator import TaxCalculator
        return TaxCalculator.amount_in_words(amount)
```

---

## 4. Mermaid Diagrams

### 4.1 Invoice Generation Flowchart

```mermaid
flowchart TD
    A[Start: Create Invoice] --> B[Select Products from Catalog]
    B --> C[Enter Line Item Details]
    C --> D{Add More Items?}
    D -->|Yes| B
    D -->|No| E[Enter Company and Customer Info]
    E --> F[Apply Tax Rate and Discounts]
    F --> G[Calculate Subtotal]
    G --> H[Calculate Tax Amount]
    H --> I[Calculate Grand Total]
    I --> J[Generate Invoice Number]
    J --> K[Validate All Fields]
    K --> L{Validation Pass?}
    L -->|No| M[Show Error Messages]
    M --> C
    L -->|Yes| N[Save Invoice to Database]
    N --> O[Render HTML Template]
    O --> P[Apply WeasyPrint CSS]
    P --> Q[Generate PDF Bytes]
    Q --> R[Return PDF to Client]
    R --> S{Print?}
    S -->|Yes| T[Send to Printer]
    S -->|No| U[Done]
    T --> U

    style A fill:#e1f5fe
    style R fill:#c8e6c9
    style J fill:#fff3e0
    style L fill:#fce4ec
    style T fill:#e8f5e9
```

### 4.2 Invoice Number Generation Flow

```mermaid
flowchart TD
    A[Request Next Invoice Number] --> B[Get Current Year]
    B --> C[Query NumberSequence Table]
    C --> D{Sequence Exists?}
    D -->|No| E[Create New Sequence Row]
    E --> F[Set last_number = 1]
    D -->|Yes| G[Acquire Row Lock<br/>SELECT FOR UPDATE]
    F --> H[increment = 1]
    G --> I[increment = last_number + 1]
    H --> J[Format: INV-YYYY-NNNNNN]
    I --> K[Update last_number]
    K --> J
    J --> L[Return Formatted Number]
    L --> M[Reserve in Invoice Table]
    M --> N[Done]

    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style G fill:#fff3e0
```

### 4.3 Print Flow

```mermaid
flowchart TD
    A[User Clicks Print] --> B{Browser or PDF?}
    B -->|Browser Print| C[Load invoice_preview.html]
    C --> D[Apply Print CSS Media Query]
    D --> E[window.print]
    E --> F[Browser Print Dialog]
    F --> G[Select Printer]
    G --> H[Print Invoice]
    
    B -->|PDF Download| I[Call /api/invoices/{id}/pdf]
    I --> J[PDFGeneratorService.generate_pdf]
    J --> K[Jinja2 Render HTML]
    K --> L[WeasyPrint Apply CSS]
    L --> M[Generate PDF Bytes]
    M --> N[Return as attachment]
    N --> O[Browser Downloads PDF]
    O --> P[User Opens PDF]
    P --> Q{Print from PDF?}
    Q -->|Yes| R[System Print Dialog]
    R --> S[Print]
    Q -->|No| T[Done]

    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style S fill:#c8e6c9
    style N fill:#fff3e0
```

### 4.4 Class Diagram

```mermaid
classDiagram
    class Invoice {
        +int id
        +str invoice_number
        +date invoice_date
        +date due_date
        +str company_name
        +str company_address
        +str company_gst
        +str customer_name
        +str customer_address
        +str customer_gst
        +Decimal subtotal
        +Decimal discount_amount
        +Decimal tax_amount
        +Decimal grand_total
        +str status
        +str notes
        +str terms
        +bool is_editable
        +Decimal cgst_amount
        +Decimal sgst_amount
        +Decimal igst_amount
    }

    class InvoiceItem {
        +int id
        +int invoice_id
        +int product_id
        +str description
        +str hsn_code
        +str unit
        +Decimal quantity
        +Decimal unit_price
        +Decimal discount_percent
        +Decimal discount_amount
        +Decimal tax_rate
        +Decimal tax_amount
        +Decimal total
        +int sort_order
        +calculate_totals()
    }

    class NumberSequence {
        +int id
        +str prefix
        +int year
        +int last_number
        +datetime created_at
        +datetime updated_at
    }

    class InvoiceService {
        +Session db
        +create_invoice()
        +update_invoice()
        +add_line_item()
        +remove_line_item()
        +get_invoice()
        +get_invoice_by_number()
        +list_invoices()
        -_create_line_item()
        -_recalculate_invoice()
    }

    class PDFGeneratorService {
        +Environment env
        +Template template
        +Path css_path
        +generate_pdf()
        +generate_html()
        -_prepare_context()
        -_amount_in_words()
    }

    class NumberSequenceService {
        +str PREFIX
        +int SEQUENCE_PADDING
        +get_next()$ str
        +peek_next()$ str
        +get_current_number()$ str
    }

    class TaxCalculator {
        +Decimal DEFAULT_GST_RATE
        +calculate()$ TaxBreakdown
        +amount_in_words()$ str
        -_round()$ Decimal
    }

    class TaxBreakdown {
        +Decimal subtotal
        +Decimal discount_amount
        +Decimal taxable_amount
        +Decimal cgst_rate
        +Decimal cgst_amount
        +Decimal sgst_rate
        +Decimal sgst_amount
        +Decimal igst_rate
        +Decimal igst_amount
        +Decimal total_tax
        +Decimal grand_total
    }

    class Product {
        +int id
        +str name
        +str slug
        +str models
        +str summary
        +Decimal price_type
    }

    Invoice "1" --> "*" InvoiceItem : has
    InvoiceItem "*" --> "0..1" Product : references
    InvoiceService --> Invoice : manages
    InvoiceService --> InvoiceItem : creates
    InvoiceService --> NumberSequenceService : uses
    PDFGeneratorService --> Invoice : renders
    TaxCalculator --> TaxBreakdown : returns
    NumberSequenceService --> NumberSequence : locks
```

### 4.5 Component Interaction Diagram

```mermaid
sequenceDiagram
    participant U as User/Admin
    participant API as FastAPI Router
    participant IS as InvoiceService
    participant NS as NumberSequenceService
    participant TC as TaxCalculator
    participant DB as PostgreSQL
    participant PDF as PDFGeneratorService
    participant WS as WeasyPrint

    U->>API: POST /api/invoices
    API->>IS: create_invoice(data)
    IS->>NS: get_next_invoice_number()
    NS->>DB: SELECT FOR UPDATE (lock sequence)
    DB-->>NS: locked row
    NS->>DB: UPDATE last_number
    DB-->>NS: updated
    NS-->>IS: INV-2026-000001
    
    IS->>TC: calculate(items, tax_rate)
    TC-->>IS: TaxBreakdown
    
    IS->>DB: INSERT invoice + items
    DB-->>IS: saved
    
    IS-->>API: Invoice object
    API-->>U: Invoice JSON response
    
    U->>API: GET /api/invoices/{id}/pdf
    API->>PDF: generate_pdf(invoice)
    PDF->>DB: Load invoice with items
    DB-->>PDF: Invoice data
    PDF->>PDF: render HTML (Jinja2)
    PDF->>WS: HTML.write_pdf(CSS)
    WS-->>PDF: PDF bytes
    PDF-->>API: BytesIO(PDF)
    API-->>U: application/pdf download
```

---

## 5. SOLID Principles Application

### 5.1 Single Responsibility Principle (SRP)

Each service has exactly one responsibility:

| Class | Responsibility |
|---|---|
| `InvoiceService` | Invoice CRUD operations and business logic |
| `PDFGeneratorService` | PDF rendering from invoice data |
| `NumberSequenceService` | Invoice number generation and sequencing |
| `TaxCalculator` | Tax computation and amount-in-words conversion |
| `InvoiceItem` | Line item data and individual item calculations |
| `Invoice` | Invoice data container and status management |

**Bad Example (violates SRP):**

```python
# BAD: This class does everything
class InvoiceManager:
    def create_invoice(self): ...
    def calculate_tax(self): ...
    def generate_number(self): ...
    def render_pdf(self): ...
    def send_email(self): ...
```

**Good Example (follows SRP):**

```python
# GOOD: Each class has one reason to change
class InvoiceService:
    def create_invoice(self): ...
    def update_invoice(self): ...

class TaxCalculator:
    def calculate(self): ...

class NumberSequenceService:
    def get_next(self): ...

class PDFGeneratorService:
    def generate_pdf(self): ...
```

### 5.2 Open/Closed Principle (OCP)

The system is open for extension but closed for modification:

```python
# Template system is extensible without modifying core code
class PDFGeneratorService:
    def __init__(self, template_name: str = "invoice.html"):
        # Template can be swapped without changing this class
        self.template = self.env.get_template(template_name)

# Tax calculation is extensible via strategy pattern
class TaxCalculator:
    @staticmethod
    def calculate(line_items, tax_rate, tax_type="intra_state"):
        # New tax types added by extending, not modifying
        if tax_type == "intra_state":
            return TaxCalculator._intra_state_tax(...)
        elif tax_type == "inter_state":
            return TaxCalculator._inter_state_tax(...)
        elif tax_type == "export":
            return TaxCalculator._export_tax(...)  # New: no modification needed

# Number sequence is extensible
class NumberSequenceService:
    @staticmethod
    def get_next(db, prefix="INV", format_style="standard"):
        # New format styles added without modifying existing ones
        if format_style == "standard":
            return NumberSequenceService._standard_format(...)
        elif format_style == "short":
            return NumberSequenceService._short_format(...)
```

### 5.3 Interface Segregation Principle (ISP)

Separate interfaces for different client needs:

```python
# Interface for PDF generation clients
class PDFProvider:
    def generate_pdf(self, invoice: Invoice) -> bytes: ...

# Interface for preview clients (no PDF needed)
class PreviewProvider:
    def generate_html(self, invoice: Invoice) -> str: ...

# Interface for number generation clients
class NumberProvider:
    def get_next(self) -> str: ...
    def peek_next(self) -> str: ...

# InvoiceService does not depend on PDF generation
class InvoiceService:
    def __init__(self, db: Session, number_provider: NumberProvider):
        self.db = db
        self.number_provider = number_provider
        # No PDF dependency — SRP + ISP

# PDF service is separate
class PDFGeneratorService:
    def __init__(self, pdf_provider: PDFProvider):
        self.pdf_provider = pdf_provider
```

### 5.4 Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concretions:

```python
# Abstraction: Invoice can be rendered by any PDF engine
class InvoiceRenderer:
    def render(self, invoice: Invoice) -> bytes:
        raise NotImplementedError

# Concrete implementation using WeasyPrint
class WeasyPrintRenderer(InvoiceRenderer):
    def render(self, invoice: Invoice) -> bytes:
        html = self._render_html(invoice)
        return HTML(string=html).write_pdf()

# Future: Could swap to ReportLab, PDFKit, etc.
class ReportLabRenderer(InvoiceRenderer):
    def render(self, invoice: Invoice) -> bytes:
        # Different PDF engine, same interface
        ...

# PDFGeneratorService depends on abstraction
class PDFGeneratorService:
    def __init__(self, renderer: InvoiceRenderer):
        self.renderer = renderer  # Abstraction, not concrete

    def generate_pdf(self, invoice: Invoice) -> bytes:
        return self.renderer.render(invoice)

# Database abstraction for number sequences
class SequenceProvider:
    def next_value(self) -> str:
        raise NotImplementedError

class PostgreSQLSequenceProvider(SequenceProvider):
    def next_value(self) -> str:
        # PostgreSQL-specific implementation
        ...

class SQLiteSequenceProvider(SequenceProvider):
    def next_value(self) -> str:
        # SQLite-specific implementation
        ...
```

---

## 6. Database Schema

### 6.1 Schema Overview

```sql
-- Invoice table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Company details
    company_name VARCHAR(300) NOT NULL,
    company_address TEXT,
    company_gst VARCHAR(20),
    company_phone VARCHAR(30),
    company_email VARCHAR(200),

    -- Customer details
    customer_name VARCHAR(300) NOT NULL,
    customer_address TEXT,
    customer_gst VARCHAR(20),
    customer_phone VARCHAR(30),
    customer_email VARCHAR(200),

    -- Financials
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Status and metadata
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    notes TEXT,
    terms TEXT,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX ix_invoices_status ON invoices(status);
CREATE INDEX ix_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX ix_invoices_created_at ON invoices(created_at);

-- Invoice line items
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

    description VARCHAR(500) NOT NULL,
    hsn_code VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'PCS',

    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    sort_order INTEGER DEFAULT 0
);

CREATE INDEX ix_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Number sequences (per year)
CREATE TABLE number_sequences (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(10) NOT NULL DEFAULT 'INV',
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_number_sequences_prefix_year UNIQUE (prefix, year)
);
```

### 6.2 Alembic Migration

```python
# alembic/versions/xxxx_create_invoice_tables.py

"""Create invoice generation tables

Revision ID: xxxx
Revises: yyyy
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa

revision = "xxxx"
down_revision = "yyyy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create invoices table
    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("invoice_number", sa.String(30), unique=True, nullable=False),
        sa.Column("invoice_date", sa.Date(), server_default=sa.func.now(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("company_name", sa.String(300), nullable=False),
        sa.Column("company_address", sa.Text(), nullable=True),
        sa.Column("company_gst", sa.String(20), nullable=True),
        sa.Column("company_phone", sa.String(30), nullable=True),
        sa.Column("company_email", sa.String(200), nullable=True),
        sa.Column("customer_name", sa.String(300), nullable=False),
        sa.Column("customer_address", sa.Text(), nullable=True),
        sa.Column("customer_gst", sa.String(20), nullable=True),
        sa.Column("customer_phone", sa.String(30), nullable=True),
        sa.Column("customer_email", sa.String(200), nullable=True),
        sa.Column("subtotal", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("discount_percent", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), server_default="18", nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("grand_total", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("status", sa.String(20), server_default="draft", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("terms", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )

    # Create invoice_items table
    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("invoice_id", sa.Integer(), sa.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("hsn_code", sa.String(20), nullable=True),
        sa.Column("unit", sa.String(20), server_default="PCS"),
        sa.Column("quantity", sa.Numeric(10, 2), server_default="1", nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("discount_percent", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), server_default="18", nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("total", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
    )

    # Create number_sequences table
    op.create_table(
        "number_sequences",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("prefix", sa.String(10), server_default="INV", nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("last_number", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("prefix", "year", name="uq_number_sequences_prefix_year"),
    )

    # Indexes
    op.create_index("ix_invoices_status", "invoices", ["status"])
    op.create_index("ix_invoices_invoice_date", "invoices", ["invoice_date"])
    op.create_index("ix_invoices_created_at", "invoices", ["created_at"])
    op.create_index("ix_invoice_items_invoice_id", "invoice_items", ["invoice_id"])


def downgrade() -> None:
    op.drop_table("invoice_items")
    op.drop_table("invoices")
    op.drop_table("number_sequences")
```

---

## 7. Invoice Data Model

### 7.1 Data Flow Diagram

```
+-------------------------------------------------------------+
|                    INVOICE DATA FLOW                         |
|                                                             |
|  Product Catalog          Invoice Form                      |
|  +--------------+         +---------------+                 |
|  | Product      |-------->| Line Items    |                 |
|  | (name,price) |  select | (qty,price,   |                 |
|  +--------------+         |  discount)    |                 |
|                           +-------+-------+                 |
|                                   |                          |
|                                   v                          |
|  +-----------------------------------------------+          |
|  |           InvoiceService                       |          |
|  |                                                |          |
|  |  +----------+  +----------+  +------------+  |          |
|  |  | Create   |  | Validate |  | Calculate  |  |          |
|  |  | Invoice  |  | Fields   |  | Totals     |  |          |
|  |  +----+-----+  +----+-----+  +-----+------+  |          |
|  |       |              |              |          |          |
|  |       v              v              v          |          |
|  |  +------------------------------------------+ |          |
|  |  |         Invoice Object                   | |          |
|  |  |  - invoice_number (auto)                 | |          |
|  |  |  - company/customer info                 | |          |
|  |  |  - line items[]                          | |          |
|  |  |  - totals (computed)                     | |          |
|  |  +------------------------------------------+ |          |
|  +-----------------------------------------------+          |
|                                   |                          |
|                                   v                          |
|  +-----------------------------------------------+          |
|  |         PDFGeneratorService                    |          |
|  |                                                |          |
|  |  Invoice --> Jinja2 Template --> HTML          |          |
|  |  HTML --> WeasyPrint + CSS --> PDF             |          |
|  +-----------------------------------------------+          |
+-------------------------------------------------------------+
```

### 7.2 JSON Schema for API

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Invoice Create Request",
  "type": "object",
  "required": ["company_name", "customer_name", "items"],
  "properties": {
    "company_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300,
      "description": "Selling company name"
    },
    "company_address": {
      "type": "string",
      "maxLength": 1000
    },
    "company_gst": {
      "type": "string",
      "pattern": "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
      "description": "15-digit GSTIN"
    },
    "company_phone": {
      "type": "string",
      "maxLength": 30
    },
    "company_email": {
      "type": "string",
      "format": "email"
    },
    "customer_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300,
      "description": "Customer/party name"
    },
    "customer_address": {
      "type": "string",
      "maxLength": 1000
    },
    "customer_gst": {
      "type": "string"
    },
    "customer_phone": {
      "type": "string",
      "maxLength": 30
    },
    "customer_email": {
      "type": "string",
      "format": "email"
    },
    "invoice_date": {
      "type": "string",
      "format": "date",
      "description": "Defaults to today if not provided"
    },
    "due_date": {
      "type": "string",
      "format": "date"
    },
    "tax_rate": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "default": 18,
      "description": "GST percentage"
    },
    "discount_percent": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "default": 0
    },
    "notes": {
      "type": "string",
      "maxLength": 2000
    },
    "terms": {
      "type": "string",
      "maxLength": 2000
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["description", "quantity", "unit_price"],
        "properties": {
          "product_id": {
            "type": "integer",
            "description": "Optional: link to product catalog"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500
          },
          "hsn_code": {
            "type": "string",
            "maxLength": 20,
            "description": "HSN/SAC code for GST classification"
          },
          "unit": {
            "type": "string",
            "default": "PCS",
            "enum": ["PCS", "NOS", "KGS", "MTR", "LTR", "SET", "BOX"]
          },
          "quantity": {
            "type": "number",
            "minimum": 0.01
          },
          "unit_price": {
            "type": "number",
            "minimum": 0
          },
          "discount_percent": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "default": 0
          },
          "tax_rate": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "default": 18
          }
        }
      }
    }
  }
}
```

---

## 8. Line Items Management

### 8.1 CRUD Operations

```python
# app/routers/api_invoices.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceItemCreate
from app.services.invoice import InvoiceService

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/", response_model=InvoiceResponse, status_code=201)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice with line items."""
    service = InvoiceService(db)
    
    try:
        invoice = service.create_invoice(
            company_name=payload.company_name,
            customer_name=payload.customer_name,
            items=[item.dict() for item in payload.items],
            invoice_date=payload.invoice_date,
            due_date=payload.due_date,
            discount_percent=payload.discount_percent,
            tax_rate=payload.tax_rate,
            notes=payload.notes,
            terms=payload.terms,
        )
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Retrieve an invoice by ID."""
    service = InvoiceService(db)
    invoice = service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice


@router.get("/", response_model=list[InvoiceResponse])
def list_invoices(
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List all invoices with optional filtering."""
    service = InvoiceService(db)
    return service.list_invoices(status=status, limit=limit, offset=offset)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
):
    """Update a draft invoice."""
    service = InvoiceService(db)
    
    try:
        invoice = service.update_invoice(invoice_id, payload.dict(exclude_unset=True))
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{invoice_id}/items", response_model=InvoiceResponse)
def add_line_item(
    invoice_id: int,
    payload: InvoiceItemCreate,
    db: Session = Depends(get_db),
):
    """Add a line item to an invoice."""
    service = InvoiceService(db)
    
    try:
        service.add_line_item(invoice_id, payload.dict())
        invoice = service.get_invoice(invoice_id)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}", status_code=204)
def remove_line_item(item_id: int, db: Session = Depends(get_db)):
    """Remove a line item from an invoice."""
    service = InvoiceService(db)
    
    try:
        service.remove_line_item(item_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{invoice_id}/number/preview")
def preview_invoice_number(db: Session = Depends(get_db)):
    """Preview the next invoice number without reserving it."""
    from app.services.number_sequence import NumberSequenceService
    return {"next_invoice_number": NumberSequenceService.peek_next(db)}


@router.get("/{invoice_id}/pdf")
def download_pdf(invoice_id: int, db: Session = Depends(get_db)):
    """Download invoice as PDF."""
    from app.services.pdf_generator import PDFGeneratorService
    from fastapi.responses import StreamingResponse
    import io
    
    service = InvoiceService(db)
    invoice = service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    pdf_gen = PDFGeneratorService()
    pdf_bytes = pdf_gen.generate_pdf(invoice)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"
        },
    )


@router.get("/{invoice_id}/preview")
def preview_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get HTML preview of invoice."""
    from app.services.pdf_generator import PDFGeneratorService
    from fastapi.responses import HTMLResponse
    
    service = InvoiceService(db)
    invoice = service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    pdf_gen = PDFGeneratorService()
    html = pdf_gen.generate_html(invoice)
    
    return HTMLResponse(content=html)
```

---

## 9. Tax Calculation Engine

### 9.1 GST Configuration

```python
# app/config/invoice_config.py

from dataclasses import dataclass
from decimal import Decimal
from typing import Dict


@dataclass(frozen=True)
class TaxConfig:
    """Immutable tax configuration."""
    
    name: str
    rate: Decimal
    cgst_rate: Decimal
    sgst_rate: Decimal
    igst_rate: Decimal
    hsn_code: str
    description: str


# Pre-configured tax slabs for India GST
TAX_SLABS: Dict[str, TaxConfig] = {
    "0": TaxConfig(
        name="Exempt",
        rate=Decimal("0"),
        cgst_rate=Decimal("0"),
        sgst_rate=Decimal("0"),
        igst_rate=Decimal("0"),
        hsn_code="9988",
        description="Exempt goods/services",
    ),
    "5": TaxConfig(
        name="5% GST",
        rate=Decimal("5"),
        cgst_rate=Decimal("2.5"),
        sgst_rate=Decimal("2.5"),
        igst_rate=Decimal("5"),
        hsn_code="8471",
        description="Essential items",
    ),
    "12": TaxConfig(
        name="12% GST",
        rate=Decimal("12"),
        cgst_rate=Decimal("6"),
        sgst_rate=Decimal("6"),
        igst_rate=Decimal("12"),
        hsn_code="8443",
        description="Processed food, computers",
    ),
    "18": TaxConfig(
        name="18% GST",
        rate=Decimal("18"),
        cgst_rate=Decimal("9"),
        sgst_rate=Decimal("9"),
        igst_rate=Decimal("18"),
        hsn_code="8443",
        description="Most industrial goods",
    ),
    "28": TaxConfig(
        name="28% GST",
        rate=Decimal("28"),
        cgst_rate=Decimal("14"),
        sgst_rate=Decimal("14"),
        igst_rate=Decimal("28"),
        hsn_code="8703",
        description="Luxury items",
    ),
}


@dataclass
class CompanyConfig:
    """Company details for invoices."""
    
    name: str = "Bark Technologies"
    address: str = ""
    gst: str = ""
    phone: str = ""
    email: str = ""
    state_code: str = ""  # Two-digit state code for GST


@dataclass
class InvoiceDefaults:
    """Default values for new invoices."""
    
    tax_rate: str = "18"
    discount_percent: Decimal = Decimal("0")
    due_days: int = 30
    notes: str = "Thank you for your business!"
    terms: str = (
        "Payment due within 30 days of invoice date. "
        "Late payments attract 1.5% monthly interest."
    )
```

---

## 10. Invoice Number Sequence System

### 10.1 Sequence Patterns

The system supports multiple invoice number formats:

| Pattern | Format | Example | Use Case |
|---|---|---|---|
| Standard | `INV-YYYY-NNNNNN` | `INV-2026-000001` | Default, recommended |
| Compact | `INV-YY-NNNNN` | `INV-26-00001` | Short documents |
| Monthly | `INV-YYYYMM-NNNN` | `INV-202607-0001` | Monthly tracking |
| Custom | `PREFIX-YY-NNNN` | `BKT-26-0001` | Branded prefix |

### 10.2 Sequence Service Implementation

```python
# Complete implementation with all patterns

class NumberSequenceService:
    """
    Thread-safe invoice number generation.
    
    Uses PostgreSQL row-level locking (SELECT ... FOR UPDATE)
    to prevent race conditions in concurrent environments.
    """

    @staticmethod
    def get_next(
        db: Session,
        prefix: str = "INV",
        format_style: str = "standard",
    ) -> str:
        """
        Generate next invoice number with row-level lock.
        
        Format styles:
        - standard: INV-2026-000001
        - compact:  INV-26-00001
        - monthly:  INV-202607-0001
        """
        
        now = date.today()
        current_year = now.year
        current_month = now.month
        
        # Determine sequence key
        if format_style == "monthly":
            sequence_key = f"{prefix}-{current_year}{current_month:02d}"
            padding = 4
        elif format_style == "compact":
            sequence_key = f"{prefix}-{str(current_year)[-2:]}"
            padding = 5
        else:  # standard
            sequence_key = f"{prefix}-{current_year}"
            padding = 6
        
        # Lock row for update
        sequence = db.execute(
            select(NumberSequence)
            .where(NumberSequence.prefix == prefix)
            .where(NumberSequence.year == current_year)
            .with_for_update()
        ).scalar_one_or_none()
        
        if sequence is None:
            sequence = NumberSequence(
                prefix=prefix,
                year=current_year,
                last_number=1,
            )
            db.add(sequence)
            db.flush()
            next_num = 1
        else:
            next_num = sequence.last_number + 1
            sequence.last_number = next_num
            db.flush()
        
        # Format number
        if format_style == "monthly":
            formatted = f"{prefix}-{current_year}{current_month:02d}-{str(next_num).zfill(padding)}"
        elif format_style == "compact":
            formatted = f"{prefix}-{str(current_year)[-2:]}-{str(next_num).zfill(padding)}"
        else:
            formatted = f"{prefix}-{current_year}-{str(next_num).zfill(padding)}"
        
        return formatted
```

---

## 11. PDF Generation Service

### 11.1 Complete PDF Generator

```python
# app/services/pdf_generator.py

from __future__ import annotations
import io
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS

from app.models.invoice import Invoice


class PDFGeneratorService:
    """
    Professional PDF invoice generator using WeasyPrint.
    
    Features:
    - In-memory PDF generation (no disk I/O)
    - CSS Paged Media for print-ready output
    - Template caching for performance
    - Configurable CSS themes
    """

    def __init__(
        self,
        template_name: str = "invoice.html",
        css_name: str = "invoice.css",
    ):
        base_dir = Path(__file__).parent.parent
        template_dir = base_dir / "templates" / "invoices"
        css_dir = base_dir / "static" / "css"
        
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(["html"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self.template = self.env.get_template(template_name)
        self.css_path = css_dir / css_name
        self.base_url = str(template_dir)

    def generate_pdf(
        self,
        invoice: Invoice,
        output_path: Optional[Path] = None,
    ) -> bytes:
        """
        Generate PDF bytes for an invoice.
        
        Args:
            invoice: Invoice model with items loaded
            output_path: Optional path to save PDF file
        
        Returns:
            PDF as bytes
        """
        context = self._prepare_context(invoice)
        html_string = self.template.render(**context)
        
        stylesheets = []
        if self.css_path.exists():
            stylesheets.append(CSS(filename=str(self.css_path)))
        
        html_doc = HTML(string=html_string, base_url=self.base_url)
        pdf_bytes = html_doc.write_pdf(stylesheets=stylesheets)
        
        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(pdf_bytes)
        
        return pdf_bytes

    def generate_html(self, invoice: Invoice) -> str:
        """Generate HTML preview for browser rendering."""
        context = self._prepare_context(invoice)
        return self.template.render(**context)

    def _prepare_context(self, invoice: Invoice) -> dict:
        """Build Jinja2 context from invoice model."""
        items = sorted(invoice.items, key=lambda x: x.sort_order)
        
        return {
            "invoice": invoice,
            "items": items,
            "company": {
                "name": invoice.company_name,
                "address": invoice.company_address,
                "gst": invoice.company_gst,
                "phone": invoice.company_phone,
                "email": invoice.company_email,
            },
            "customer": {
                "name": invoice.customer_name,
                "address": invoice.customer_address,
                "gst": invoice.customer_gst,
                "phone": invoice.customer_phone,
                "email": invoice.customer_email,
            },
            "totals": {
                "subtotal": invoice.subtotal,
                "discount": invoice.discount_amount,
                "tax_rate": invoice.tax_rate,
                "tax_amount": invoice.tax_amount,
                "cgst": invoice.cgst_amount,
                "sgst": invoice.sgst_amount,
                "igst": invoice.igst_amount,
                "grand_total": invoice.grand_total,
            },
            "invoice_date": (
                invoice.invoice_date.strftime("%d %B %Y")
                if invoice.invoice_date else ""
            ),
            "due_date": (
                invoice.due_date.strftime("%d %B %Y")
                if invoice.due_date else ""
            ),
            "amount_in_words": self._amount_in_words(invoice.grand_total),
        }

    def _amount_in_words(self, amount) -> str:
        from app.services.tax_calculator import TaxCalculator
        return TaxCalculator.amount_in_words(amount)
```

---

## 12. WeasyPrint Configuration

### 12.1 System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    libharfbuzz-bin \
    libharfbuzz-dev

# CentOS/RHEL
sudo yum install -y \
    pango \
    pango-devel \
    gdk-pixbuf2 \
    harfbuzz \
    cairo \
    cairo-devel

# Docker (recommended)
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app
COPY . .
```

### 12.2 WeasyPrint Python Configuration

```python
# app/services/weasyprint_config.py

from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration


class WeasyPrintConfig:
    """WeasyPrint rendering configuration."""

    @staticmethod
    def create_html(
        html_string: str,
        base_url: str = "",
    ) -> HTML:
        """
        Create a WeasyPrint HTML document.
        
        Args:
            html_string: Rendered HTML content
            base_url: Base URL for resolving relative paths
        
        Returns:
            WeasyPrint HTML document ready for rendering
        """
        return HTML(string=html_string, base_url=base_url)

    @staticmethod
    def create_css(css_string: str = None, css_path: str = None) -> CSS:
        """
        Create WeasyPrint CSS stylesheet.
        
        Args:
            css_string: CSS as string
            css_path: Path to CSS file
        
        Returns:
            WeasyPrint CSS object
        """
        if css_path:
            return CSS(filename=css_path)
        return CSS(string=css_string)

    @staticmethod
    def get_font_config() -> FontConfiguration:
        """Get default font configuration."""
        return FontConfiguration()

    @staticmethod
    def optimize_pdf(
        html_doc: HTML,
        stylesheets: list = None,
        optimize_size: tuple = ("fonts", "images"),
    ) -> bytes:
        """
        Generate optimized PDF.
        
        Args:
            html_doc: WeasyPrint HTML document
            stylesheets: List of CSS stylesheets
            optimize_size: Tuple of optimization targets
        
        Returns:
            Optimized PDF bytes
        """
        return html_doc.write_pdf(
            stylesheets=stylesheets or [],
            optimize_size=optimize_size,
        )


# Usage example:
def generate_invoice_pdf(html_content: str, css_content: str) -> bytes:
    """Generate PDF from HTML and CSS strings."""
    
    config = WeasyPrintConfig()
    
    html_doc = config.create_html(
        html_string=html_content,
        base_url=".",
    )
    
    css = config.create_css(css_string=css_content)
    
    return config.optimize_pdf(
        html_doc,
        stylesheets=[css],
    )
```

### 12.3 Docker Configuration

```dockerfile
# Dockerfile additions for WeasyPrint

FROM python:3.11-slim

# System dependencies for WeasyPrint
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    libharfbuzz-bin \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verify WeasyPrint works
RUN python -c "from weasyprint import HTML; print('WeasyPrint OK')"

WORKDIR /app
```

```yaml
# docker-compose.yml additions
services:
  web:
    build: .
    volumes:
      - ./bark:/app/bark
      - ./bark/static:/app/bark/static
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/bark
    depends_on:
      - db
```

---

## 13. HTML/CSS Invoice Template

### 13.1 Main Invoice Template

```html
<!-- bark/templates/invoices/invoice.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ invoice.invoice_number }}</title>
    <style>
        /* Base styles for WeasyPrint PDF rendering */
        @page {
            size: A4 portrait;
            margin: 2cm 2cm 3cm 2cm;

            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9px;
                color: #666;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.5;
            background: #fff;
        }

        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }

        /* Header */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1a237e;
        }

        .company-info {
            flex: 1;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1a237e;
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 10px;
            color: #555;
            line-height: 1.6;
        }

        .invoice-badge {
            text-align: right;
            flex-shrink: 0;
            margin-left: 20px;
        }

        .invoice-title {
            font-size: 36px;
            font-weight: bold;
            color: #1a237e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .invoice-number {
            font-size: 14px;
            color: #555;
            margin-top: 5px;
        }

        /* Invoice Meta */
        .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
        }

        .meta-box {
            flex: 1;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 4px;
            border-left: 4px solid #1a237e;
        }

        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .meta-value {
            font-size: 12px;
            font-weight: 600;
            color: #333;
        }

        /* Parties */
        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
        }

        .party {
            flex: 1;
        }

        .party-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 8px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        .party-name {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .party-details {
            font-size: 10px;
            color: #555;
            line-height: 1.6;
        }

        /* Line Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table thead th {
            background: #1a237e;
            color: #fff;
            padding: 10px 8px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .items-table thead th:last-child,
        .items-table thead th:nth-child(n+4) {
            text-align: right;
        }

        .items-table tbody td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
        }

        .items-table tbody tr:nth-child(even) {
            background: #fafafa;
        }

        .items-table tbody td:last-child,
        .items-table tbody td:nth-child(n+4) {
            text-align: right;
        }

        .items-table .text-right {
            text-align: right;
        }

        .items-table .text-center {
            text-align: center;
        }

        .item-description {
            font-weight: 500;
        }

        .item-hsn {
            font-size: 9px;
            color: #888;
        }

        /* Totals */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }

        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 6px 10px;
            font-size: 11px;
        }

        .totals-table .label {
            text-align: right;
            color: #555;
        }

        .totals-table .value {
            text-align: right;
            font-weight: 500;
            width: 120px;
        }

        .totals-table .grand-total td {
            border-top: 2px solid #1a237e;
            font-size: 14px;
            font-weight: bold;
            color: #1a237e;
            padding-top: 10px;
        }

        /* Amount in Words */
        .amount-words {
            background: #f5f5f5;
            padding: 12px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .amount-words .label {
            font-weight: bold;
            color: #555;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }

        .amount-words .value {
            color: #333;
            font-style: italic;
        }

        /* Notes and Terms */
        .notes-section {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }

        .notes-box,
        .terms-box {
            flex: 1;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            border: 1px solid #eee;
        }

        .notes-box h4,
        .terms-box h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 8px;
        }

        .notes-box p,
        .terms-box p {
            font-size: 10px;
            color: #555;
            line-height: 1.6;
        }

        /* Footer */
        .invoice-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #888;
        }

        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 20px;
        }

        .signature-box {
            width: 200px;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 8px;
            font-size: 9px;
            color: #555;
        }

        /* Print Styles */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .invoice-container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="company-info">
                <div class="company-name">{{ company.name }}</div>
                <div class="company-details">
                    {% if company.address %}
                        {{ company.address | replace('\n', '<br>') | safe }}<br>
                    {% endif %}
                    {% if company.gst %}
                        GSTIN: {{ company.gst }}<br>
                    {% endif %}
                    {% if company.phone %}
                        Phone: {{ company.phone }}<br>
                    {% endif %}
                    {% if company.email %}
                        Email: {{ company.email }}
                    {% endif %}
                </div>
            </div>
            <div class="invoice-badge">
                <div class="invoice-title">Invoice</div>
                <div class="invoice-number">{{ invoice.invoice_number }}</div>
            </div>
        </div>

        <!-- Invoice Meta -->
        <div class="invoice-meta">
            <div class="meta-box">
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">{{ invoice_date }}</div>
            </div>
            {% if due_date %}
            <div class="meta-box">
                <div class="meta-label">Due Date</div>
                <div class="meta-value">{{ due_date }}</div>
            </div>
            {% endif %}
            <div class="meta-box">
                <div class="meta-label">Status</div>
                <div class="meta-value">{{ invoice.status | upper }}</div>
            </div>
        </div>

        <!-- Parties -->
        <div class="parties">
            <div class="party">
                <div class="party-title">Bill To</div>
                <div class="party-name">{{ customer.name }}</div>
                <div class="party-details">
                    {% if customer.address %}
                        {{ customer.address | replace('\n', '<br>') | safe }}<br>
                    {% endif %}
                    {% if customer.gst %}
                        GSTIN: {{ customer.gst }}<br>
                    {% endif %}
                    {% if customer.phone %}
                        Phone: {{ customer.phone }}<br>
                    {% endif %}
                    {% if customer.email %}
                        Email: {{ customer.email }}
                    {% endif %}
                </div>
            </div>
        </div>

        <!-- Line Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 30px;">#</th>
                    <th>Description</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {% for item in items %}
                <tr>
                    <td class="text-center">{{ loop.index }}</td>
                    <td>
                        <div class="item-description">{{ item.description }}</div>
                        {% if item.product_id %}
                            <div class="item-hsn">Ref: #{{ item.product_id }}</div>
                        {% endif %}
                    </td>
                    <td class="text-center">{{ item.hsn_code or '—' }}</td>
                    <td class="text-right">{{ item.quantity }}</td>
                    <td class="text-center">{{ item.unit or 'PCS' }}</td>
                    <td class="text-right">₹{{ "{:,.2f}".format(item.unit_price) }}</td>
                    <td class="text-right">
                        {% if item.discount_percent > 0 %}
                            {{ item.discount_percent }}%
                        {% else %}
                            —
                        {% endif %}
                    </td>
                    <td class="text-right">{{ item.tax_rate }}%</td>
                    <td class="text-right">₹{{ "{:,.2f}".format(item.total) }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">₹{{ "{:,.2f}".format(totals.subtotal) }}</td>
                </tr>
                {% if totals.discount > 0 %}
                <tr>
                    <td class="label">Discount:</td>
                    <td class="value">-₹{{ "{:,.2f}".format(totals.discount) }}</td>
                </tr>
                {% endif %}
                <tr>
                    <td class="label">Tax ({{ totals.tax_rate }}%):</td>
                    <td class="value">₹{{ "{:,.2f}".format(totals.tax_amount) }}</td>
                </tr>
                <tr class="grand-total">
                    <td class="label">Grand Total:</td>
                    <td class="value">₹{{ "{:,.2f}".format(totals.grand_total) }}</td>
                </tr>
            </table>
        </div>

        <!-- Amount in Words -->
        <div class="amount-words">
            <span class="label">Amount in Words: </span>
            <span class="value">{{ amount_in_words }}</span>
        </div>

        <!-- Notes and Terms -->
        <div class="notes-section">
            {% if invoice.notes %}
            <div class="notes-box">
                <h4>Notes</h4>
                <p>{{ invoice.notes }}</p>
            </div>
            {% endif %}
            {% if invoice.terms %}
            <div class="terms-box">
                <h4>Terms and Conditions</h4>
                <p>{{ invoice.terms }}</p>
            </div>
            {% endif %}
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">Authorized Signatory</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Customer Signature</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
            <p>Generated by {{ company.name }} | {{ invoice.invoice_number }}</p>
        </div>
    </div>
</body>
</html>
```

### 13.2 HTML Preview Template (Browser)

```html
<!-- bark/templates/invoices/invoice_preview.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ invoice.invoice_number }} — Preview</title>
    <link rel="stylesheet" href="/static/css/invoice.css">
    <style>
        /* Browser-specific preview styles */
        body {
            background: #e0e0e0;
            padding: 20px;
        }
        
        .preview-container {
            max-width: 210mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 2cm;
        }
        
        .preview-toolbar {
            max-width: 210mm;
            margin: 0 auto 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .preview-toolbar button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-download {
            background: #1a237e;
            color: #fff;
        }
        
        .btn-print {
            background: #4caf50;
            color: #fff;
        }
        
        .btn-back {
            background: #757575;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <a href="/admin/invoices" class="btn-back">Back to List</a>
        <div>
            <button class="btn-print" onclick="window.print()">Print</button>
            <a href="/api/invoices/{{ invoice.id }}/pdf" class="btn-download" download>
                Download PDF
            </a>
        </div>
    </div>
    
    <div class="preview-container">
        <!-- Same content as invoice.html but rendered in browser -->
        <!-- (Copy the invoice-container div from invoice.html here) -->
    </div>
</body>
</html>
```

---

## 14. Print-Ready CSS

### 14.1 Main Invoice CSS (WeasyPrint)

```css
/* bark/static/css/invoice.css */

/* ============================================
   CSS Paged Media for WeasyPrint
   ============================================ */

@page {
    size: A4 portrait;
    margin: 2cm 2cm 3cm 2cm;

    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9px;
        color: #666;
        font-family: 'DejaVu Sans', sans-serif;
    }
}

/* ============================================
   Reset and Base
   ============================================ */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', Arial, sans-serif;
    font-size: 11px;
    color: #333;
    line-height: 1.5;
    background: #fff;
}

/* ============================================
   Invoice Container
   ============================================ */

.invoice-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
}

/* ============================================
   Header
   ============================================ */

.invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 3px solid #1a237e;
}

.company-info {
    flex: 1;
}

.company-name {
    font-size: 22px;
    font-weight: bold;
    color: #1a237e;
    margin-bottom: 5px;
}

.company-details {
    font-size: 9px;
    color: #555;
    line-height: 1.6;
}

.invoice-badge {
    text-align: right;
    flex-shrink: 0;
    margin-left: 20px;
}

.invoice-title {
    font-size: 32px;
    font-weight: bold;
    color: #1a237e;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.invoice-number {
    font-size: 13px;
    color: #555;
    margin-top: 5px;
}

/* ============================================
   Invoice Meta
   ============================================ */

.invoice-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
    gap: 15px;
}

.meta-box {
    flex: 1;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 4px;
    border-left: 4px solid #1a237e;
}

.meta-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 4px;
    font-weight: bold;
}

.meta-value {
    font-size: 11px;
    font-weight: 600;
    color: #333;
}

/* ============================================
   Parties
   ============================================ */

.parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
    gap: 15px;
}

.party {
    flex: 1;
}

.party-title {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 6px;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
}

.party-name {
    font-size: 13px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
}

.party-details {
    font-size: 9px;
    color: #555;
    line-height: 1.6;
}

/* ============================================
   Line Items Table
   ============================================ */

.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.items-table thead th {
    background: #1a237e;
    color: #fff;
    padding: 8px 6px;
    text-align: left;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.items-table thead th:last-child,
.items-table thead th:nth-child(n+4) {
    text-align: right;
}

.items-table thead th:nth-child(1),
.items-table thead th:nth-child(4),
.items-table thead th:nth-child(5) {
    text-align: center;
}

.items-table tbody td {
    padding: 8px 6px;
    border-bottom: 1px solid #eee;
    font-size: 10px;
    vertical-align: top;
}

.items-table tbody tr:nth-child(even) {
    background: #fafafa;
}

.items-table tbody td:last-child,
.items-table tbody td:nth-child(n+6) {
    text-align: right;
}

.items-table tbody td:nth-child(1),
.items-table tbody td:nth-child(4),
.items-table tbody td:nth-child(5) {
    text-align: center;
}

.item-description {
    font-weight: 500;
}

.item-hsn {
    font-size: 8px;
    color: #888;
    margin-top: 2px;
}

/* ============================================
   Totals
   ============================================ */

.totals-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
}

.totals-table {
    width: 280px;
    border-collapse: collapse;
}

.totals-table td {
    padding: 5px 10px;
    font-size: 10px;
}

.totals-table .label {
    text-align: right;
    color: #555;
}

.totals-table .value {
    text-align: right;
    font-weight: 500;
    width: 110px;
}

.totals-table .grand-total td {
    border-top: 2px solid #1a237e;
    font-size: 13px;
    font-weight: bold;
    color: #1a237e;
    padding-top: 8px;
}

/* ============================================
   Amount in Words
   ============================================ */

.amount-words {
    background: #f5f5f5;
    padding: 10px 14px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-size: 9px;
}

.amount-words .label {
    font-weight: bold;
    color: #555;
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 0.5px;
}

.amount-words .value {
    color: #333;
    font-style: italic;
}

/* ============================================
   Notes and Terms
   ============================================ */

.notes-section {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
}

.notes-box,
.terms-box {
    flex: 1;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #eee;
}

.notes-box h4,
.terms-box h4 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 6px;
}

.notes-box p,
.terms-box p {
    font-size: 9px;
    color: #555;
    line-height: 1.6;
}

/* ============================================
   Signature
   ============================================ */

.signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-top: 15px;
}

.signature-box {
    width: 180px;
    text-align: center;
}

.signature-line {
    border-top: 1px solid #333;
    margin-top: 40px;
    padding-top: 6px;
    font-size: 8px;
    color: #555;
}

/* ============================================
   Footer
   ============================================ */

.invoice-footer {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
    text-align: center;
    font-size: 8px;
    color: #888;
}
```

### 14.2 Print CSS (Browser Direct Print)

```css
/* bark/static/css/invoice_print.css */

/* Print-specific styles for direct browser printing */

@media print {
    /* Hide browser chrome */
    body {
        background: #fff;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    /* Remove shadows and backgrounds */
    .preview-toolbar,
    .no-print {
        display: none !important;
    }

    /* Page setup */
    @page {
        size: A4 portrait;
        margin: 1.5cm 1.5cm 2cm 1.5cm;
    }

    /* Ensure colors print correctly */
    .invoice-header {
        border-bottom-color: #1a237e !important;
    }

    .items-table thead th {
        background: #1a237e !important;
        color: #fff !important;
    }

    .meta-box {
        border-left-color: #1a237e !important;
    }

    .totals-table .grand-total td {
        border-top-color: #1a237e !important;
        color: #1a237e !important;
    }

    /* Page break control */
    .items-table {
        page-break-inside: avoid;
    }

    .totals-section {
        page-break-inside: avoid;
    }

    .notes-section {
        page-break-inside: avoid;
    }

    .invoice-header {
        page-break-after: avoid;
    }

    .parties {
        page-break-after: avoid;
    }

    /* Avoid orphaned rows */
    .items-table tbody tr {
        page-break-inside: avoid;
    }

    /* Ensure links don't show URLs */
    a[href]::after {
        content: none !important;
    }

    /* Ensure images don't break layout */
    img {
        max-width: 100% !important;
        page-break-inside: avoid;
    }

    /* Footer on every page */
    .invoice-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 8px;
        color: #888;
        padding: 10px;
        background: #fff;
    }
}
```

---

## 15. Jinja2 Template Rendering

### 15.1 Template Configuration

```python
# app/template_config.py

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path


def create_jinja_environment() -> Environment:
    """
    Create configured Jinja2 environment for invoice templates.
    
    Features:
    - Template caching for performance
    - Auto-escaping for HTML safety
    - Custom filters for formatting
    """
    
    template_dir = Path(__file__).parent / "templates" / "invoices"
    
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )
    
    # Custom filters
    env.filters["currency"] = format_currency
    env.filters["dateformat"] = format_date
    env.filters["number"] = format_number
    
    return env


def format_currency(value, symbol="₹"):
    """Format a Decimal as currency: ₹1,234.56"""
    if value is None:
        return f"{symbol}0.00"
    return f"{symbol}{value:,.2f}"


def format_date(value, fmt="%d %B %Y"):
    """Format a date object."""
    if value is None:
        return ""
    return value.strftime(fmt)


def format_number(value, decimals=2):
    """Format a number with commas."""
    if value is None:
        return "0"
    return f"{value:,.{decimals}f}"
```

### 15.2 Rendering Service

```python
# app/services/template_renderer.py

from jinja2 import Environment
from app.models.invoice import Invoice


class TemplateRenderer:
    """
    Renders Jinja2 templates with invoice data.
    Handles context preparation and template loading.
    """

    def __init__(self, jinja_env: Environment):
        self.env = jinja_env

    def render_invoice(self, invoice: Invoice) -> str:
        """Render invoice HTML template."""
        template = self.env.get_template("invoice.html")
        context = self._build_context(invoice)
        return template.render(**context)

    def render_preview(self, invoice: Invoice) -> str:
        """Render invoice preview template."""
        template = self.env.get_template("invoice_preview.html")
        context = self._build_context(invoice)
        return template.render(**context)

    def _build_context(self, invoice: Invoice) -> dict:
        """Build template context from invoice model."""
        items = sorted(invoice.items, key=lambda x: x.sort_order)
        
        return {
            "invoice": invoice,
            "items": items,
            "company": {
                "name": invoice.company_name,
                "address": invoice.company_address,
                "gst": invoice.company_gst,
                "phone": invoice.company_phone,
                "email": invoice.company_email,
            },
            "customer": {
                "name": invoice.customer_name,
                "address": invoice.customer_address,
                "gst": invoice.customer_gst,
                "phone": invoice.customer_phone,
                "email": invoice.customer_email,
            },
            "totals": {
                "subtotal": invoice.subtotal,
                "discount": invoice.discount_amount,
                "tax_rate": invoice.tax_rate,
                "tax_amount": invoice.tax_amount,
                "cgst": invoice.cgst_amount,
                "sgst": invoice.sgst_amount,
                "igst": invoice.igst_amount,
                "grand_total": invoice.grand_total,
            },
            "invoice_date": (
                invoice.invoice_date.strftime("%d %B %Y")
                if invoice.invoice_date else ""
            ),
            "due_date": (
                invoice.due_date.strftime("%d %B %Y")
                if invoice.due_date else ""
            ),
            "amount_in_words": self._amount_in_words(invoice.grand_total),
        }

    def _amount_in_words(self, amount) -> str:
        from app.services.tax_calculator import TaxCalculator
        return TaxCalculator.amount_in_words(amount)
```

---

## 16. PDF Optimization

### 16.1 Optimization Strategies

```python
# app/services/pdf_optimizer.py

from pathlib import Path
from weasyprint import HTML, CSS


class PDFOptimizer:
    """Optimize PDF output for size and quality."""

    @staticmethod
    def optimize_for_web(pdf_bytes: bytes) -> bytes:
        """
        Optimize PDF for web delivery.
        
        Strategies:
        - Compress fonts (subset embedding)
        - Optimize images
        - Remove metadata where possible
        """
        return pdf_bytes

    @staticmethod
    def generate_with_options(
        html_content: str,
        css_content: str = None,
        base_url: str = ".",
        optimize: bool = True,
    ) -> bytes:
        """
        Generate PDF with optimization options.
        
        Args:
            html_content: Rendered HTML string
            css_content: Optional CSS string
            base_url: Base URL for resource resolution
            optimize: Enable size optimization
        
        Returns:
            PDF bytes
        """
        html_doc = HTML(string=html_content, base_url=base_url)
        
        stylesheets = []
        if css_content:
            stylesheets.append(CSS(string=css_content))
        
        kwargs = {}
        if optimize:
            kwargs["optimize_size"] = ("fonts", "images")
        
        return html_doc.write_pdf(stylesheets=stylesheets, **kwargs)

    @staticmethod
    def get_pdf_info(pdf_bytes: bytes) -> dict:
        """Get PDF metadata and statistics."""
        size_kb = len(pdf_bytes) / 1024
        
        return {
            "size_bytes": len(pdf_bytes),
            "size_kb": round(size_kb, 2),
            "size_mb": round(size_kb / 1024, 2),
        }
```

### 16.2 Performance Considerations

| Factor | Impact | Mitigation |
|---|---|---|
| Font loading | High - first render slow | Embed fonts, use system fonts |
| Image size | High - large PDFs | Compress images before rendering |
| Template complexity | Medium - render time | Cache compiled templates |
| WeasyPrint startup | Medium - cold start | Keep process warm, use connection pooling |
| Memory usage | Medium - large invoices | Stream PDF, avoid storing in memory |
| Concurrent requests | High - single-threaded | Offload to Celery/background tasks |

```python
# Background task for high-volume PDF generation

from fastapi import BackgroundTasks
from app.services.pdf_generator import PDFGeneratorService


@router.post("/{invoice_id}/pdf-async")
async def generate_pdf_async(
    invoice_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Generate PDF in background for large/complex invoices."""
    
    # Queue background task
    background_tasks.add_task(
        _generate_and_store_pdf,
        invoice_id=invoice_id,
    )
    
    return {"status": "processing", "invoice_id": invoice_id}


def _generate_and_store_pdf(invoice_id: int):
    """Background worker for PDF generation."""
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        service = InvoiceService(db)
        invoice = service.get_invoice(invoice_id)
        
        if invoice:
            pdf_gen = PDFGeneratorService()
            pdf_bytes = pdf_gen.generate_pdf(invoice)
            
            # Store PDF to disk or S3
            output_path = Path(f"uploads/invoices/{invoice.invoice_number}.pdf")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(pdf_bytes)
    finally:
        db.close()
```

---

## 17. Print Support

### 17.1 Browser Print Implementation

```javascript
// bark/static/js/invoice_print.js

/**
 * Invoice Print Support
 * Handles browser printing with proper formatting
 */

class InvoicePrint {
    constructor(invoiceId) {
        this.invoiceId = invoiceId;
    }

    /**
     * Print the invoice preview directly
     */
    printPreview() {
        // Load print stylesheet
        const printLink = document.createElement('link');
        printLink.rel = 'stylesheet';
        printLink.href = '/static/css/invoice_print.css';
        document.head.appendChild(printLink);

        // Trigger browser print
        window.print();
    }

    /**
     * Download PDF and trigger print
     */
    async printPDF() {
        try {
            const response = await fetch(`/api/invoices/${this.invoiceId}/pdf`);
            
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Open PDF in new window for printing
            const printWindow = window.open(url);
            printWindow.onload = () => {
                printWindow.print();
            };
            
            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Print error:', error);
            alert('Failed to generate PDF for printing');
        }
    }

    /**
     * Direct download without print dialog
     */
    async downloadPDF() {
        try {
            const response = await fetch(`/api/invoices/${this.invoiceId}/pdf`);
            
            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${this.invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF');
        }
    }
}

// Initialize on invoice preview page
document.addEventListener('DOMContentLoaded', () => {
    const invoiceId = document.querySelector('[data-invoice-id]')?.dataset.invoiceId;
    if (invoiceId) {
        window.invoicePrint = new InvoicePrint(invoiceId);
    }
});
```

### 17.2 Print Dialog Configuration

```python
# Print settings for different scenarios

PRINT_SETTINGS = {
    "standard": {
        "paper_size": "A4",
        "orientation": "portrait",
        "margins": {
            "top": "2cm",
            "bottom": "3cm",
            "left": "2cm",
            "right": "2cm",
        },
        "color_mode": "color",
        "dpi": 300,
    },
    "compact": {
        "paper_size": "A4",
        "orientation": "portrait",
        "margins": {
            "top": "1cm",
            "bottom": "2cm",
            "left": "1cm",
            "right": "1cm",
        },
        "color_mode": "grayscale",
        "dpi": 150,
    },
    "thermal": {
        "paper_size": "80mm",
        "orientation": "portrait",
        "margins": {
            "top": "5mm",
            "bottom": "10mm",
            "left": "5mm",
            "right": "5mm",
        },
        "color_mode": "grayscale",
        "dpi": 203,
    },
}
```

---

## 18. API Endpoints

### 18.1 Complete API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/invoices/` | Create new invoice |
| `GET` | `/api/invoices/` | List all invoices |
| `GET` | `/api/invoices/{id}` | Get invoice by ID |
| `PUT` | `/api/invoices/{id}` | Update draft invoice |
| `DELETE` | `/api/invoices/{id}` | Delete draft invoice |
| `POST` | `/api/invoices/{id}/items` | Add line item |
| `DELETE` | `/api/invoices/items/{item_id}` | Remove line item |
| `GET` | `/api/invoices/{id}/pdf` | Download PDF |
| `GET` | `/api/invoices/{id}/preview` | HTML preview |
| `GET` | `/api/invoices/number/preview` | Preview next number |
| `POST` | `/api/invoices/{id}/send` | Mark as sent |
| `POST` | `/api/invoices/{id}/pay` | Mark as paid |

### 18.2 API Request/Response Examples

**Create Invoice Request:**

```json
POST /api/invoices/
{
  "company_name": "Bark Technologies",
  "company_address": "123 Industrial Area\nMumbai, Maharashtra 400001",
  "company_gst": "27AABCU9603R1ZM",
  "customer_name": "ABC Manufacturing Pvt Ltd",
  "customer_address": "456 Factory Road\nPune, Maharashtra 411001",
  "customer_gst": "27CCCDY1234F1Z5",
  "invoice_date": "2026-07-04",
  "due_date": "2026-08-03",
  "tax_rate": 18,
  "notes": "Thank you for your business!",
  "terms": "Payment due within 30 days.",
  "items": [
    {
      "product_id": 1,
      "description": "Industrial Water Pump FMZ-1450H",
      "hsn_code": "8413",
      "quantity": 2,
      "unit_price": 45000.00,
      "discount_percent": 5,
      "tax_rate": 18
    },
    {
      "product_id": 2,
      "description": "Pump Installation Kit",
      "hsn_code": "8413",
      "quantity": 2,
      "unit_price": 2500.00,
      "discount_percent": 0,
      "tax_rate": 18
    }
  ]
}
```

**Create Invoice Response:**

```json
{
  "id": 1,
  "invoice_number": "INV-2026-000001",
  "invoice_date": "2026-07-04",
  "due_date": "2026-08-03",
  "company_name": "Bark Technologies",
  "customer_name": "ABC Manufacturing Pvt Ltd",
  "subtotal": 95000.00,
  "discount_percent": 0,
  "discount_amount": 4500.00,
  "tax_rate": 18,
  "tax_amount": 16380.00,
  "grand_total": 106880.00,
  "status": "draft",
  "items": [
    {
      "id": 1,
      "description": "Industrial Water Pump FMZ-1450H",
      "hsn_code": "8413",
      "quantity": 2,
      "unit_price": 45000.00,
      "discount_percent": 5,
      "discount_amount": 4500.00,
      "tax_rate": 18,
      "tax_amount": 15390.00,
      "total": 85890.00
    },
    {
      "id": 2,
      "description": "Pump Installation Kit",
      "hsn_code": "8413",
      "quantity": 2,
      "unit_price": 2500.00,
      "discount_percent": 0,
      "discount_amount": 0,
      "tax_rate": 18,
      "tax_amount": 900.00,
      "total": 5900.00
    }
  ]
}
```

**Download PDF Response:**

```
GET /api/invoices/1/pdf

Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-2026-000001.pdf"

[PDF binary data]
```

---

## 19. Implementation Plan

### 19.1 Phase 1: Core Infrastructure (Week 1)

| Task | Priority | Est. Hours |
|---|---|---|
| Create Invoice model | P0 | 4 |
| Create InvoiceItem model | P0 | 3 |
| Create NumberSequence model | P0 | 2 |
| Alembic migration | P0 | 2 |
| InvoiceService CRUD | P0 | 6 |
| NumberSequenceService | P0 | 3 |
| TaxCalculator | P1 | 4 |
| Unit tests | P0 | 6 |

**Total: ~30 hours**

### 19.2 Phase 2: PDF Generation (Week 2)

| Task | Priority | Est. Hours |
|---|---|---|
| Invoice HTML template | P0 | 6 |
| Invoice CSS (WeasyPrint) | P0 | 8 |
| Print CSS (browser) | P1 | 4 |
| PDFGeneratorService | P0 | 6 |
| TemplateRenderer | P1 | 3 |
| WeasyPrint config | P1 | 2 |
| PDF generation tests | P0 | 4 |

**Total: ~33 hours**

### 19.3 Phase 3: API and Integration (Week 3)

| Task | Priority | Est. Hours |
|---|---|---|
| API endpoints | P0 | 6 |
| Request/response schemas | P0 | 3 |
| Product catalog integration | P1 | 4 |
| Admin UI (Jinja2 pages) | P1 | 8 |
| Invoice preview page | P1 | 4 |
| PDF download endpoint | P0 | 2 |
| Integration tests | P0 | 6 |

**Total: ~33 hours**

### 19.4 Phase 4: Polish and Optimization (Week 4)

| Task | Priority | Est. Hours |
|---|---|---|
| Error handling | P1 | 4 |
| PDF optimization | P2 | 3 |
| Background task (Celery) | P2 | 4 |
| Docker setup | P1 | 3 |
| Performance testing | P2 | 4 |
| Documentation | P2 | 4 |
| UAT and bug fixes | P0 | 8 |

**Total: ~30 hours**

### 19.5 Total Effort

| Phase | Hours | Deliverable |
|---|---|---|
| Phase 1 | 30 | Core models + services |
| Phase 2 | 33 | PDF generation |
| Phase 3 | 33 | API + admin UI |
| Phase 4 | 30 | Polish + deploy |
| **Total** | **126** | **Production-ready invoice system** |

---

## 20. Code Implementation

### 20.1 Project Structure

```
bark/
+-- app/
|   +-- models/
|   |   +-- __init__.py
|   |   +-- invoice.py          # Invoice, InvoiceItem, NumberSequence
|   |   +-- product.py          # Existing product models
|   +-- schemas/
|   |   +-- __init__.py
|   |   +-- invoice.py          # Pydantic schemas
|   +-- services/
|   |   +-- __init__.py
|   |   +-- invoice.py          # InvoiceService
|   |   +-- number_sequence.py  # NumberSequenceService
|   |   +-- tax_calculator.py   # TaxCalculator
|   |   +-- pdf_generator.py    # PDFGeneratorService
|   |   +-- template_renderer.py # TemplateRenderer
|   +-- routers/
|   |   +-- __init__.py
|   |   +-- api_invoices.py     # Invoice API endpoints
|   +-- templates/
|   |   +-- invoices/
|   |       +-- invoice.html    # PDF template
|   |       +-- invoice_preview.html # Browser preview
|   |       +-- invoice_list.html    # Invoice listing
|   +-- static/
|       +-- css/
|           +-- invoice.css     # WeasyPrint CSS
|           +-- invoice_print.css # Print CSS
+-- alembic/
|   +-- versions/
|       +-- xxxx_create_invoice_tables.py
+-- tests/
    +-- test_invoice.py
```

### 20.2 Pydantic Schemas

```python
# app/schemas/invoice.py

from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class InvoiceItemCreate(BaseModel):
    """Schema for creating an invoice line item."""
    
    product_id: Optional[int] = None
    description: str = Field(..., min_length=1, max_length=500)
    hsn_code: Optional[str] = Field(None, max_length=20)
    unit: str = Field("PCS", max_length=20)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_percent: Decimal = Field(Decimal("0"), ge=0, le=100)
    tax_rate: Decimal = Field(Decimal("18"), ge=0, le=100)


class InvoiceCreate(BaseModel):
    """Schema for creating a new invoice."""
    
    company_name: str = Field(..., min_length=1, max_length=300)
    company_address: Optional[str] = Field(None, max_length=1000)
    company_gst: Optional[str] = Field(None, max_length=20)
    company_phone: Optional[str] = Field(None, max_length=30)
    company_email: Optional[str] = Field(None, max_length=200)
    
    customer_name: str = Field(..., min_length=1, max_length=300)
    customer_address: Optional[str] = Field(None, max_length=1000)
    customer_gst: Optional[str] = Field(None, max_length=20)
    customer_phone: Optional[str] = Field(None, max_length=30)
    customer_email: Optional[str] = Field(None, max_length=200)
    
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    
    tax_rate: Decimal = Field(Decimal("18"), ge=0, le=100)
    discount_percent: Decimal = Field(Decimal("0"), ge=0, le=100)
    
    notes: Optional[str] = Field(None, max_length=2000)
    terms: Optional[str] = Field(None, max_length=2000)
    
    items: List[InvoiceItemCreate] = Field(..., min_length=1)


class InvoiceItemResponse(BaseModel):
    """Schema for invoice item in API response."""
    
    id: int
    product_id: Optional[int]
    description: str
    hsn_code: Optional[str]
    unit: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    sort_order: int

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Schema for invoice in API response."""
    
    id: int
    invoice_number: str
    invoice_date: Optional[date]
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    
    company_name: str
    company_address: Optional[str]
    company_gst: Optional[str]
    company_phone: Optional[str]
    company_email: Optional[str]
    
    customer_name: str
    customer_address: Optional[str]
    customer_gst: Optional[str]
    customer_phone: Optional[str]
    customer_email: Optional[str]
    
    subtotal: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    grand_total: Decimal
    
    status: str
    notes: Optional[str]
    terms: Optional[str]
    
    items: List[InvoiceItemResponse]

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    """Schema for invoice list response."""
    
    invoices: List[InvoiceResponse]
    total: int
    limit: int
    offset: int
```

---

## 21. Testing Strategy

### 21.1 Unit Tests

```python
# tests/test_invoice.py

import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.invoice import Invoice, InvoiceItem, NumberSequence
from app.services.invoice import InvoiceService
from app.services.number_sequence import NumberSequenceService
from app.services.tax_calculator import TaxCalculator


@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


class TestInvoiceService:
    """Tests for InvoiceService."""

    def test_create_invoice(self, db_session):
        """Test invoice creation with line items."""
        service = InvoiceService(db_session)
        
        invoice = service.create_invoice(
            company_name="Test Company",
            customer_name="Test Customer",
            items=[
                {
                    "description": "Test Product",
                    "quantity": 2,
                    "unit_price": 1000,
                    "tax_rate": 18,
                }
            ],
        )
        
        assert invoice.invoice_number is not None
        assert invoice.company_name == "Test Company"
        assert invoice.customer_name == "Test Customer"
        assert len(invoice.items) == 1
        assert invoice.subtotal == Decimal("2000.00")
        assert invoice.tax_amount == Decimal("360.00")
        assert invoice.grand_total == Decimal("2360.00")

    def test_invoice_number_auto_increment(self, db_session):
        """Test invoice numbers auto-increment."""
        service = InvoiceService(db_session)
        
        inv1 = service.create_invoice(
            company_name="Test",
            customer_name="Test",
            items=[{"description": "Item", "quantity": 1, "unit_price": 100}],
        )
        inv2 = service.create_invoice(
            company_name="Test",
            customer_name="Test",
            items=[{"description": "Item", "quantity": 1, "unit_price": 100}],
        )
        
        assert inv1.invoice_number != inv2.invoice_number
        # Both should have same year prefix
        assert inv1.invoice_number[:4] == inv2.invoice_number[:4]

    def test_add_line_item(self, db_session):
        """Test adding a line item to existing invoice."""
        service = InvoiceService(db_session)
        
        invoice = service.create_invoice(
            company_name="Test",
            customer_name="Test",
            items=[{"description": "First", "quantity": 1, "unit_price": 100}],
        )
        
        service.add_line_item(invoice.id, {
            "description": "Second",
            "quantity": 3,
            "unit_price": 200,
        })
        
        updated = service.get_invoice(invoice.id)
        assert len(updated.items) == 2
        assert updated.grand_total == Decimal("700.00")

    def test_cannot_edit_non_draft(self, db_session):
        """Test that non-draft invoices cannot be edited."""
        service = InvoiceService(db_session)
        
        invoice = service.create_invoice(
            company_name="Test",
            customer_name="Test",
            items=[{"description": "Item", "quantity": 1, "unit_price": 100}],
        )
        
        # Mark as sent
        invoice.status = "sent"
        db_session.commit()
        
        with pytest.raises(ValueError, match="Only draft"):
            service.update_invoice(invoice.id, {"customer_name": "Updated"})


class TestNumberSequence:
    """Tests for NumberSequenceService."""

    def test_first_number(self, db_session):
        """Test first invoice number of the year."""
        number = NumberSequenceService.get_next(db_session)
        assert number.startswith("INV-")
        assert number.endswith("000001")

    def test_increment(self, db_session):
        """Test number increments correctly."""
        n1 = NumberSequenceService.get_next(db_session)
        n2 = NumberSequenceService.get_next(db_session)
        
        # Extract numbers
        num1 = int(n1.split("-")[-1])
        num2 = int(n2.split("-")[-1])
        
        assert num2 == num1 + 1

    def test_peek_does_not_increment(self, db_session):
        """Test peek does not consume sequence."""
        peek1 = NumberSequenceService.peek_next(db_session)
        peek2 = NumberSequenceService.peek_next(db_session)
        
        assert peek1 == peek2


class TestTaxCalculator:
    """Tests for TaxCalculator."""

    def test_basic_calculation(self):
        """Test basic tax calculation."""
        result = TaxCalculator.calculate(
            line_items=[
                {"quantity": 2, "unit_price": 1000, "discount_percent": 0}
            ],
            tax_rate=Decimal("18"),
        )
        
        assert result.subtotal == Decimal("2000.00")
        assert result.tax_amount == Decimal("360.00")
        assert result.grand_total == Decimal("2360.00")

    def test_with_discount(self):
        """Test calculation with discount."""
        result = TaxCalculator.calculate(
            line_items=[
                {"quantity": 1, "unit_price": 1000, "discount_percent": 10}
            ],
            tax_rate=Decimal("18"),
        )
        
        assert result.discount_amount == Decimal("100.00")
        assert result.taxable_amount == Decimal("900.00")
        assert result.tax_amount == Decimal("162.00")
        assert result.grand_total == Decimal("1062.00")

    def test_intra_state_tax(self):
        """Test CGST + SGST split for intra-state."""
        result = TaxCalculator.calculate(
            line_items=[
                {"quantity": 1, "unit_price": 1000, "discount_percent": 0}
            ],
            tax_rate=Decimal("18"),
            tax_type=TaxCalculator.INTRA_STATE,
        )
        
        assert result.cgst_rate == Decimal("9")
        assert result.sgst_rate == Decimal("9")
        assert result.igst_rate == Decimal("0")
        assert result.cgst_amount + result.sgst_amount == result.tax_amount

    def test_inter_state_tax(self):
        """Test IGST for inter-state."""
        result = TaxCalculator.calculate(
            line_items=[
                {"quantity": 1, "unit_price": 1000, "discount_percent": 0}
            ],
            tax_rate=Decimal("18"),
            tax_type=TaxCalculator.INTER_STATE,
        )
        
        assert result.igst_rate == Decimal("18")
        assert result.igst_amount == result.tax_amount
        assert result.cgst_amount == Decimal("0")

    def test_amount_in_words(self):
        """Test amount conversion to words."""
        words = TaxCalculator.amount_in_words(Decimal("1234.56"))
        assert "One Thousand" in words
        assert "Rupees" in words
        assert "56 Paise" in words
```

### 21.2 Integration Tests

```python
# tests/test_invoice_api.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    """Create a test client with in-memory database."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    
    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()


class TestInvoiceAPI:
    """Integration tests for invoice API endpoints."""

    def test_create_invoice(self, client):
        """Test POST /api/invoices/"""
        response = client.post("/api/invoices/", json={
            "company_name": "Test Co",
            "customer_name": "Customer Co",
            "items": [
                {
                    "description": "Product A",
                    "quantity": 5,
                    "unit_price": 1000,
                }
            ],
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"].startswith("INV-")
        assert data["grand_total"] == 6000.00

    def test_get_invoice(self, client):
        """Test GET /api/invoices/{id}"""
        # Create first
        create_resp = client.post("/api/invoices/", json={
            "company_name": "Test Co",
            "customer_name": "Customer Co",
            "items": [{"description": "Item", "quantity": 1, "unit_price": 100}],
        })
        invoice_id = create_resp.json()["id"]
        
        # Get
        response = client.get(f"/api/invoices/{invoice_id}")
        assert response.status_code == 200
        assert response.json()["id"] == invoice_id

    def test_list_invoices(self, client):
        """Test GET /api/invoices/"""
        # Create a few
        for i in range(3):
            client.post("/api/invoices/", json={
                "company_name": "Test",
                "customer_name": "Customer",
                "items": [{"description": f"Item {i}", "quantity": 1, "unit_price": 100}],
            })
        
        response = client.get("/api/invoices/")
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_download_pdf(self, client):
        """Test GET /api/invoices/{id}/pdf"""
        create_resp = client.post("/api/invoices/", json={
            "company_name": "Test Co",
            "customer_name": "Customer Co",
            "items": [{"description": "Item", "quantity": 1, "unit_price": 100}],
        })
        invoice_id = create_resp.json()["id"]
        
        response = client.get(f"/api/invoices/{invoice_id}/pdf")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    def test_preview_invoice_number(self, client):
        """Test GET /api/invoices/number/preview"""
        response = client.get("/api/invoices/number/preview")
        assert response.status_code == 200
        assert "next_invoice_number" in response.json()
```

---

## 22. Security Considerations

### 22.1 Input Validation

| Input | Validation |
|---|---|
| Invoice number | Auto-generated, not user-input |
| Company name | Required, max 300 chars |
| Customer name | Required, max 300 chars |
| GSTIN | Regex pattern validation |
| Quantities | Decimal, must be > 0 |
| Prices | Decimal, must be >= 0 |
| Discount % | 0-100 range |
| Tax rate | 0-100 range |
| Notes/Terms | Max 2000 chars |

### 22.2 Access Control

```python
# Role-based access for invoice operations

INVOICE_PERMISSIONS = {
    "admin": ["create", "read", "update", "delete", "pdf", "send"],
    "sales": ["create", "read", "pdf"],
    "viewer": ["read", "pdf"],
}

def require_invoice_permission(permission: str):
    """Dependency to check invoice permissions."""
    def check(user = Depends(get_current_user)):
        if permission not in INVOICE_PERMISSIONS.get(user.role, []):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return check
```

### 22.3 PDF Security

- Invoice numbers are auto-generated (not user-controlled)
- PDFs are generated server-side (no client-side rendering)
- PDF content is sanitized (Jinja2 auto-escaping)
- No executable content in PDFs (WeasyPrint does not execute JS)
- File downloads use `Content-Disposition: attachment` header

---

## 23. Performance Optimization

### 23.1 Caching Strategy

```python
# Template caching
from functools import lru_cache

@lru_cache(maxsize=10)
def get_cached_template(template_name: str):
    """Cache compiled Jinja2 templates."""
    env = create_jinja_environment()
    return env.get_template(template_name)

# Invoice data caching (for repeat access)
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=128)
def get_cached_invoice(invoice_id: int, _cache_buster: int = 0):
    """Cache invoice data with manual cache invalidation."""
    # _cache_buster changes when invoice is updated
    pass
```

### 23.2 Database Optimization

```sql
-- Indexes for invoice queries
CREATE INDEX ix_invoices_status ON invoices(status);
CREATE INDEX ix_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX ix_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX ix_invoices_customer ON invoices(customer_name);
CREATE INDEX ix_invoice_items_invoice ON invoice_items(invoice_id);

-- Composite index for common queries
CREATE INDEX ix_invoices_status_date ON invoices(status, invoice_date DESC);
```

### 23.3 PDF Generation Optimization

| Technique | Impact |
|---|---|
| Font subsetting | Reduce PDF size 30-50% |
| Image compression | Reduce PDF size 20-40% |
| Template caching | Reduce render time 50% |
| Background tasks | Prevent request timeout |
| Streaming response | Reduce memory usage |

---

## 24. Deployment Considerations

### 24.1 System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| Python | 3.10+ | 3.11+ |
| WeasyPrint | 62+ | Latest |
| PostgreSQL | 13+ | 15+ |
| RAM | 512MB | 2GB |
| CPU | 1 core | 2+ cores |
| Disk | 1GB | 10GB+ |

### 24.2 Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/bark
    volumes:
      - ./bark/static:/app/bark/static
      - ./bark/templates:/app/bark/templates
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=bark
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  worker:
    build: .
    command: celery -A app.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/bark
    depends_on:
      - db
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 24.3 Environment Variables

```bash
# .env

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bark

# App
APP_ENV=production
SECRET_KEY=your-secret-key

# WeasyPrint
WEASYPRINT_CACHE_FOLDER=/tmp/weasyprint-cache
WEASYPRINT_OPTIMIZE_SIZE=fonts,images

# Invoice defaults
INVOICE_TAX_RATE=18
INVOICE_PREFIX=INV
INVOICE_SEQUENCE_PADDING=6

# PDF storage
PDF_STORAGE_PATH=/app/uploads/invoices
```

### 24.4 Monitoring

```python
# Health check endpoint

@router.get("/health")
def health_check():
    """Invoice system health check."""
    checks = {
        "database": _check_database(),
        "weasyprint": _check_weasyprint(),
        "templates": _check_templates(),
    }
    
    return {
        "status": "healthy" if all(checks.values()) else "degraded",
        "checks": checks,
    }


def _check_weasyprint() -> bool:
    """Verify WeasyPrint is working."""
    try:
        from weasyprint import HTML
        HTML(string="<p>test</p>").write_pdf()
        return True
    except Exception:
        return False
```

---

## Appendix A: WeasyPrint CSS Reference

### A.1 CSS Paged Media Properties

| Property | Description | Example |
|---|---|---|
| `@page` | Page context | `@page { size: A4; margin: 2cm; }` |
| `size` | Page dimensions | `A4`, `letter`, `210mm 297mm` |
| `margin` | Page margins | `2cm`, `1in 2in` |
| `@top-center` | Running header | `content: "Title";` |
| `@bottom-center` | Running footer | `content: "Page " counter(page);` |
| `page-break-before` | Force page break | `always`, `avoid` |
| `page-break-after` | Page break after | `always`, `avoid` |
| `page-break-inside` | Break inside | `avoid` |
| `counter(page)` | Current page | `"Page " counter(page)` |
| `counter(pages)` | Total pages | `"of " counter(pages)` |

### A.2 WeasyPrint-Specific Properties

| Property | Description |
|---|---|
| `@page :first` | First page only |
| `@page :left` | Left (even) pages |
| `@page :right` | Right (odd) pages |
| `element()` | Running element reference |
| `target-counter()` | Cross-reference page number |
| `string-set()` | Set named string |
| `footnote` | Footnote styling |

---

## Appendix B: GST Reference

### B.1 GST Rate Slabs

| Rate | CGST | SGST | IGST | Category |
|---|---|---|---|---|
| 0% | 0% | 0% | 0% | Exempt |
| 5% | 2.5% | 2.5% | 5% | Essential |
| 12% | 6% | 6% | 12% | Standard |
| 18% | 9% | 9% | 18% | Most goods |
| 28% | 14% | 14% | 28% | Luxury |

### B.2 GSTIN Format

```
22AAAAA0000A1Z5
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | +-- Check digit
| | | | | | | | | | | | | | +---- Z (default)
| | | | | | | | | | | | | +------ Entity number (1-9, A-Z)
| | | | | | | | | | | | +-------- PAN last character
| | | | | | | | | | +------------- PAN number (5 chars)
| | | | | | | | | +--------------- PAN first character (A-Z)
| | | | | | | +------------------- State code (2 digits)
```

---

## Appendix C: Invoice Template Variants

### C.1 Minimal Invoice Template

```html
<!-- bark/templates/invoices/invoice_minimal.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ invoice.invoice_number }}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: sans-serif; font-size: 11px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; font-size: 14px; }
    </style>
</head>
<body>
    <h1>Invoice {{ invoice.invoice_number }}</h1>
    <p>Date: {{ invoice_date }}</p>
    
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {% for item in items %}
            <tr>
                <td>{{ loop.index }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.quantity }}</td>
                <td>₹{{ "{:,.2f}".format(item.unit_price) }}</td>
                <td>₹{{ "{:,.2f}".format(item.total) }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
    
    <p class="total">Grand Total: ₹{{ "{:,.2f}".format(totals.grand_total) }}</p>
</body>
</html>
```

---

*Document generated for Bark Technologies invoice generation system.*
*Stack: FastAPI + SQLAlchemy + Jinja2 + WeasyPrint + PostgreSQL*
*Version: 1.0 | Date: July 2026*
