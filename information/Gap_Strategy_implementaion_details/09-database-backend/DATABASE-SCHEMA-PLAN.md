# Database Schema & Data Model Plan — Bark Technologies

> **Status:** Production-ready schema for Phase 1+ (FastAPI + PostgreSQL)
> **Stack:** FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL + pgvector
> **Created:** 2026-07-04

---

## Table of Contents

1. [Current Schema Assessment](#1-current-schema-assessment)
2. [Complete Entity Relationship Diagram](#2-complete-entity-relationship-diagram)
3. [All Tables — SQLAlchemy Models](#3-all-tables--sqlalchemy-models)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Migration Plan](#5-migration-plan)
6. [Seed Data Structure](#6-seed-data-structure)
7. [Backup Strategy](#7-backup-strategy)
8. [Future Scalability](#8-future-scalability)

---

## 1. Current Schema Assessment

### What Exists Today (Static HTML / Simple DB)

| Table | Columns | Status |
|-------|---------|--------|
| `products` | id, category_id, name, slug, model, summary, price_type, lead_time_days, warranty_months, published | Exists — basic, needs expansion |
| `categories` | id, name, slug, parent_id | Exists — functional |
| `product_specs` | product_id, spec_key, spec_value, unit, sort_order | Exists — key/value design is correct |
| `product_media` | product_id, type, url, alt, sort_order | Exists — covers images |
| `inquiries` | id, product_id, name, email, phone, company, city, source, status, message, created_at | Exists — basic lead capture |

### What's Missing

| Table | Purpose | Priority |
|-------|---------|----------|
| `users` | Authentication, RBAC, profiles | **Phase 1** |
| `roles` / role column | Admin vs customer distinction | **Phase 1** |
| `carts` | Shopping cart (logged-in + guest) | Phase 2 |
| `cart_items` | Individual cart entries | Phase 2 |
| `orders` | Purchase/order tracking | Phase 3 (e-commerce) |
| `order_items` | Line items per order | Phase 3 |
| `payments` | Payment records | Phase 3 |
| `product_reviews` | Customer reviews & ratings | Phase 2 |
| `product_videos` | Dedicated video management | **Phase 1** |
| `product_documents` | Downloadable datasheets, manuals | **Phase 1** |
| `rfq_items` | Structured quote requests | **Phase 1** |
| `conversations` | AI chat / WhatsApp session logs | **Phase 1** |
| `messages` | Individual messages in conversations | **Phase 1** |
| `case_studies` | B2B success stories linked to products | Phase 2 |
| `offices` | Branch locations for dealer locator | Phase 2 |
| `pages` | CMS-style static pages (about, legal) | Phase 2 |
| `site_settings` | Key/value site-wide config | **Phase 1** |
| `audit_logs` | Admin action tracking | Phase 2 |

---

## 2. Complete Entity Relationship Diagram

### Full Production Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION & USERS                           │
│                                                                         │
│   USERS ──────────< ORDERS ──────────< ORDER_ITEMS                     │
│     │                   │                     │                         │
│     │                   └──< PAYMENTS          └──> PRODUCTS            │
│     │                                                                     │
│     ├──< CARTS ──< CART_ITEMS ──> PRODUCTS                             │
│     │                                                                     │
│     ├──< PRODUCT_REVIEWS ──> PRODUCTS                                  │
│     │                                                                     │
│     ├──< INQUIRIES ──> PRODUCTS                                        │
│     │                                                                     │
│     └──< RFQ_ITEMS ──> PRODUCTS                                        │
│                                                                         │
│   (sessions)                                                            │
│   GUEST_SESSIONS ──< CARTS (for non-logged-in users)                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCT CATALOG                                  │
│                                                                         │
│   CATEGORIES ──< PRODUCTS                                               │
│                    ├──< PRODUCT_SPECS        (key/value pairs)          │
│                    ├──< PRODUCT_MEDIA        (images)                   │
│                    ├──< PRODUCT_VIDEOS       (YouTube/Vimeo/embed)      │
│                    ├──< PRODUCT_DOCUMENTS    (PDFs, datasheets)         │
│                    └──< PRODUCT_VARIANTS     (optional: multi-model)    │
│                                                                         │
│   CASE_STUDIES ──< CASE_STUDY_PRODUCTS ──> PRODUCTS (many-to-many)     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        CONVERSATIONS & LEADS                            │
│                                                                         │
│   CONVERSATIONS ──< MESSAGES                                           │
│     │ (session_id links to user or anonymous)                           │
│     └──> LEADS (optional, when conversation converts to lead)          │
│                                                                         │
│   LEADS ──< RFQ_ITEMS ──> PRODUCTS                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        CMS & SITE CONTENT                              │
│                                                                         │
│   OFFICES        (branch locations for dealer/service locator)         │
│   PAGES          (about, terms, privacy — versioned)                   │
│   SITE_SETTINGS  (key/value: logo, phone, email, social URLs)         │
│   BLOG_POSTS     (optional, SEO content)                               │
│   FAQS           (per-category or global)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Simplified ER (for quick reference)

```
CATEGORIES ──< PRODUCTS ──< PRODUCT_SPECS
                 ├──< PRODUCT_MEDIA
                 ├──< PRODUCT_VIDEOS
                 ├──< PRODUCT_DOCUMENTS
                 ├──< PRODUCT_REVIEWS
                 ├──< INQUIRIES
                 └──< RFQ_ITEMS

USERS ──< ORDERS ──< ORDER_ITEMS
  │         │
  │         └──< PAYMENTS
  │
  ├──< CARTS ──< CART_ITEMS
  ├──< PRODUCT_REVIEWS
  └──< INQUIRIES
```

---

## 3. All Tables — SQLAlchemy Models

### 3.1 Base Configuration

```python
# app/db/base.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3.2 Users & Authentication

```python
# app/models/user.py
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(200), nullable=True)
    role = Column(String(20), default=UserRole.CUSTOMER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="user", lazy="dynamic")
    cart = relationship("Cart", back_populates="user", uselist=False, lazy="selectin")
    reviews = relationship("ProductReview", back_populates="user", lazy="dynamic")
    inquiries = relationship("Inquiry", back_populates="user", lazy="dynamic")
```

### 3.3 Categories & Products

```python
# app/models/category.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category", lazy="dynamic")
```

```python
# app/models/product.py
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    Numeric, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    name = Column(String(300), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    # Pricing
    price_type = Column(String(20), default="quote")  # quote, fixed, range
    base_price = Column(Numeric(12, 2), nullable=True)
    price_currency = Column(String(3), default="INR")

    # Logistics
    lead_time_days = Column(Integer, nullable=True)
    warranty_months = Column(Integer, nullable=True)
    moq = Column(Integer, nullable=True)  # Minimum Order Quantity

    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    og_image_url = Column(String(500), nullable=True)

    # Status
    published = Column(Boolean, default=False, nullable=False, index=True)
    featured = Column(Boolean, default=False, nullable=False)

    # Extended attributes (JSON for flexible future fields)
    extra_attributes = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    videos = relationship("ProductVideo", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    documents = relationship("ProductDocument", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("ProductReview", back_populates="product", lazy="dynamic")
    inquiries = relationship("Inquiry", back_populates="product", lazy="dynamic")

    __table_args__ = (
        Index("ix_products_category_published", "category_id", "published"),
        Index("ix_products_featured", "featured", "published"),
    )
```

### 3.4 Product Specs (Key/Value)

```python
# app/models/product_spec.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductSpec(Base):
    """Key-value spec pairs — prevents banner vs table mismatch."""
    __tablename__ = "product_specs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    spec_key = Column(String(100), nullable=False)       # e.g. "Cutting Width", "Motor Power"
    spec_value = Column(Text, nullable=False)             # e.g. "320mm", "1.5 kW"
    unit = Column(String(50), nullable=True)              # e.g. "mm", "kW", "kg"
    category = Column(String(50), nullable=True)          # e.g. "general", "technical", "dimensions"
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="specs")

    __table_args__ = (
        Index("ix_product_specs_product_key", "product_id", "spec_key", unique=True),
    )
```

### 3.5 Product Media (Images)

```python
# app/models/product_media.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductMedia(Base):
    """Images for products — hero, gallery, lifestyle."""
    __tablename__ = "product_media"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(20), nullable=False, default="image")  # image, icon, diagram
    url = Column(String(500), nullable=False)
    alt = Column(String(300), nullable=True)
    caption = Column(String(300), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="media")

    __table_args__ = (
        Index("ix_product_media_product_order", "product_id", "sort_order"),
    )
```

### 3.6 Product Videos

```python
# app/models/product_video.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductVideo(Base):
    """Dedicated video management — YouTube, Vimeo, or self-hosted."""
    __tablename__ = "product_videos"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=True)
    description = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=False)       # YouTube/Vimeo URL or self-hosted path
    thumbnail_url = Column(String(500), nullable=True)
    video_type = Column(String(20), default="youtube")    # youtube, vimeo, self_hosted, embed
    duration_seconds = Column(Integer, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="videos")

    __table_args__ = (
        Index("ix_product_videos_product_order", "product_id", "sort_order"),
    )
```

### 3.7 Product Documents

```python
# app/models/product_document.py
from sqlalchemy import Column, Integer, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductDocument(Base):
    """Downloadable documents — datasheets, manuals, certificates."""
    __tablename__ = "product_documents"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    file_url = Column(String(500), nullable=False)
    doc_type = Column(String(50), nullable=False)          # datasheet, manual, certificate, catalog
    file_size_bytes = Column(Integer, nullable=True)
    language = Column(String(10), default="en")
    sort_order = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="documents")

    __table_args__ = (
        Index("ix_product_documents_product_type", "product_id", "doc_type"),
    )
```

### 3.8 Product Reviews

```python
# app/models/product_review.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ProductReview(Base):
    """Customer reviews and ratings for products."""
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)              # 1-5
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)  # Verified purchase
    is_approved = Column(Boolean, default=False, nullable=False)  # Admin approved
    helpful_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
        Index("ix_product_reviews_product_rating", "product_id", "rating"),
    )
```

### 3.9 Cart System (Phase 2)

```python
# app/models/cart.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Cart(Base):
    """Shopping cart — supports both logged-in users and guest sessions."""
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String(100), nullable=True, index=True)  # For guest users
    status = Column(String(20), default="active")         # active, abandoned, converted
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_cart_user"),
        UniqueConstraint("session_id", name="uq_cart_session"),
    )


class CartItem(Base):
    """Individual items in a shopping cart."""
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    customizations = Column(JSON, nullable=True)          # Future: color, size, engraving
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_item_product"),
    )
```

### 3.10 Orders & Payments (Phase 3 — E-commerce)

```python
# app/models/order.py
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, ForeignKey,
    JSON, Text, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Order(Base):
    """Customer orders — status tracks the fulfillment lifecycle."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g. BT-2026-00001
    status = Column(String(30), default="pending", nullable=False)
        # pending → confirmed → processing → shipped → delivered → completed
        # (or: cancelled, refunded)
    total_amount = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0)
    shipping_amount = Column(Numeric(12, 2), default=0)
    discount_amount = Column(Numeric(12, 2), default=0)
    currency = Column(String(3), default="INR")

    # Addresses (denormalized JSON — snapshot at time of order)
    shipping_address = Column(JSON, nullable=True)
    billing_address = Column(JSON, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    payments = relationship("Payment", back_populates="order", lazy="selectin")

    __table_args__ = (
        Index("ix_orders_user_status", "user_id", "status"),
        Index("ix_orders_created", "created_at"),
    )


class OrderItem(Base):
    """Line items within an order — price frozen at purchase time."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(300), nullable=False)     # Snapshot — product may change later
    product_model = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    customizations = Column(JSON, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    """Payment records — supports multiple payments per order (partial, installments)."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    payment_method = Column(String(50), nullable=False)    # razorpay, upi, bank_transfer, cod
    payment_gateway_id = Column(String(200), nullable=True)  # Gateway transaction ID
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String(30), default="pending", nullable=False)
        # pending → processing → completed → failed → refunded
    gateway_response = Column(JSON, nullable=True)        # Raw response from payment gateway
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payments")

    __table_args__ = (
        Index("ix_payments_order_status", "order_id", "status"),
    )
```

### 3.11 Inquiries & RFQ

```python
# app/models/inquiry.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Inquiry(Base):
    """Customer inquiries — contact forms, RFQ, AI chat, WhatsApp."""
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Contact info (denormalized — user may not be registered)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)

    # Inquiry details
    source = Column(String(30), nullable=False, default="web_form")
        # web_form, rfq, ai_chat, whatsapp, phone, email
    subject = Column(String(300), nullable=True)
    message = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=True)
    status = Column(String(30), default="new", nullable=False)
        # new, contacted, quoted, won, lost, spam
    priority = Column(String(20), default="normal")  # low, normal, high, urgent

    # Tracking
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(200), nullable=True)
    extra_data = Column(JSON, nullable=True)           # Flexible: custom fields from forms

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="inquiries")
    user = relationship("User", back_populates="inquiries")

    __table_args__ = (
        Index("ix_inquiries_status_created", "status", "created_at"),
        Index("ix_inquiries_source", "source"),
        Index("ix_inquiries_product", "product_id"),
    )


class RfqItem(Base):
    """Individual items in a structured RFQ (Request for Quote)."""
    __tablename__ = "rfq_items"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(300), nullable=True)      # Fallback if product deleted
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    inquiry = relationship("Inquiry")
    product = relationship("Product")
```

### 3.12 Conversations (AI Chat / WhatsApp)

```python
# app/models/conversation.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Conversation(Base):
    """Tracks AI chat or WhatsApp conversations."""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(30), nullable=False)          # ai_chat, whatsapp, web_widget
    status = Column(String(20), default="active")         # active, closed, converted
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", lazy="dynamic")

    __table_args__ = (
        Index("ix_conversations_channel_status", "channel", "status"),
    )


class Message(Base):
    """Individual messages in a conversation."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)             # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tool_calls_json = Column(JSON, nullable=True)        # For agentic tool calls
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("ix_messages_conversation_created", "conversation_id", "created_at"),
    )
```

### 3.13 CMS Content

```python
# app/models/content.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class CaseStudy(Base):
    """B2B success stories linked to products."""
    __tablename__ = "case_studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    client_name = Column(String(200), nullable=True)
    location = Column(String(200), nullable=True)
    industry = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)                 # Rich text / Markdown
    image_url = Column(String(500), nullable=True)
    published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Many-to-many with products
    products = relationship("Product", secondary="case_study_products", lazy="selectin")


class CaseStudyProduct(Base):
    """Join table for CaseStudy <-> Product many-to-many."""
    __tablename__ = "case_study_products"

    case_study_id = Column(Integer, ForeignKey("case_studies.id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)


class Office(Base):
    """Branch / dealer office locations."""
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    country = Column(String(50), default="India")
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Page(Base):
    """CMS-managed static pages (about, terms, privacy, etc.)."""
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)                 # Markdown or HTML
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SiteSetting(Base):
    """Key/value store for site-wide configuration."""
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string")     # string, int, bool, json
    description = Column(String(300), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Faq(Base):
    """Frequently asked questions — per-category or global."""
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_faqs_category", "category_id"),
    )
```

### 3.14 Audit Log

```python
# app/models/audit_log.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class AuditLog(Base):
    """Tracks admin actions for accountability."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)           # create, update, delete, login, export
    entity_type = Column(String(50), nullable=True)       # product, order, user, inquiry
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)                 # What changed
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
```

---

## 4. Indexing Strategy

### Composite & Performance Indexes

```python
# Additional indexes across all models (consolidated view)

# === PRODUCTS ===
# ix_products_category_published  — Category listing pages
# ix_products_slug                — Unique slug lookup (SEO URLs)
# ix_products_featured            — Homepage featured products
# ix_products_model               — Model number search

# === PRODUCT_SPECS ===
# ix_product_specs_product_key    — Unique per-product spec key
# ix_product_specs_category       — Filter specs by category

# === INQUIRIES ===
# ix_inquiries_status_created     — Admin dashboard: new inquiries first
# ix_inquiries_source             — Lead source analytics
# ix_inquiries_product            — Product page: show related inquiries

# === ORDERS ===
# ix_orders_user_status           — User's order history
# ix_orders_created               — Admin: chronological order view
# ix_orders_number                — Order lookup by number

# === CONVERSATIONS ===
# ix_conversations_channel_status — Channel-based filtering

# === USERS ===
# ix_users_email                  — Login lookup (unique)

# === FULL-TEXT SEARCH (PostgreSQL specific) ===
# CREATE INDEX ix_products_search ON products
#   USING GIN (to_tsvector('english', name || ' ' || COALESCE(summary, '')));
```

### When to Add Indexes

| Pattern | Index Type | Example |
|---------|-----------|---------|
| WHERE equality filter | B-tree | `WHERE published = true` |
| Range queries | B-tree | `WHERE created_at > '2026-01-01'` |
| LIKE 'prefix%' | B-tree | `WHERE name LIKE 'Die%'` |
| Full-text search | GIN | `to_tsvector(name)` |
| JSONB queries | GIN | `extra_attributes @> '{"warranty": true}'` |
| Low cardinality | Partial | `WHERE published = true` (not all rows) |

---

## 5. Migration Plan

### 5.1 Alembic Configuration

```ini
# alembic.ini
[alembic]
script_location = migrations
sqlalchemy.url = postgresql://user:password@localhost:5432/barktech

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic
```

```python
# migrations/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.db.base import Base
from app.models import user, category, product, product_spec, product_media, \
    product_video, product_document, product_review, cart, order, inquiry, \
    conversation, content, audit_log

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 5.2 Migration Execution Order

```bash
# Step 1: Initial schema creation
alembic revision --autogenerate -m "001_initial_schema"
alembic upgrade head

# Step 2: Seed admin user and categories
python scripts/seed_data.py

# Step 3: Import existing products from HTML
python scripts/import_products.py

# Step 4: Verify
python scripts/verify_import.py
```

### 5.3 Data Migration from Static HTML

```python
# scripts/import_products.py
"""
Parse existing HTML product pages and import into database.

Steps:
1. Read all HTML files from barktechnologies.in product pages
2. Extract: name, model, specs, images, description
3. Map to categories
4. Insert into products + product_specs + product_media
5. Fix known issues: Chinese text, model mismatches
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup
from app.db.base import SessionLocal
from app.models.product import Product
from app.models.product_spec import ProductSpec
from app.models.category import Category

HTML_DIR = Path("data/product_pages")

CATEGORY_MAP = {
    "die-cutting": "Die Cutting Machines",
    "laminating": "Laminating Machines",
    "stitching": "Stitching Machines",
    "creasing": "Creasing Machines",
    "folding": "Folding Machines",
    "hot-stamping": "Hot Stamping Machines",
    "paper-cutting": "Paper Cutting Machines",
}


def parse_product_html(html_path: Path) -> dict:
    """Extract product data from a single HTML page."""
    soup = BeautifulSoup(html_path.read_text(), "html.parser")
    
    name = soup.find("h1").get_text(strip=True) if soup.find("h1") else html_path.stem
    specs = {}
    
    for row in soup.select(".spec-row, table tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) >= 2:
            key = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            # Fix Chinese text issues
            value = re.sub(r'[\u4e00-\u9fff]+', '', value).strip()
            if key and value:
                specs[key] = value
    
    images = [img["src"] for img in soup.select("img") if img.get("src")]
    
    return {"name": name, "specs": specs, "images": images}


def import_all():
    db = SessionLocal()
    try:
        for html_file in HTML_DIR.glob("*.html"):
            data = parse_product_html(html_file)
            # ... insert into database
            print(f"Imported: {data['name']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    import_all()
```

---

## 6. Seed Data Structure

### 6.1 JSON Seed File

```json
{
  "categories": [
    {
      "name": "Die Cutting Machines",
      "slug": "die-cutting-machines",
      "description": "Precision die cutting solutions for packaging, printing, and manufacturing",
      "sort_order": 1,
      "children": [
        {
          "name": "Fully Automatic Die Cutting",
          "slug": "fully-automatic-die-cutting",
          "sort_order": 1
        },
        {
          "name": "Semi-Automatic Die Cutting",
          "slug": "semi-automatic-die-cutting",
          "sort_order": 2
        }
      ]
    },
    {
      "name": "Laminating Machines",
      "slug": "laminating-machines",
      "description": "Professional laminating equipment for documents, packaging, and materials",
      "sort_order": 2
    },
    {
      "name": "Stitching Machines",
      "slug": "stitching-machines",
      "description": "Industrial stitching and binding machines",
      "sort_order": 3
    },
    {
      "name": "Creasing Machines",
      "slug": "creasing-machines",
      "description": "Precision creasing and scoring machines",
      "sort_order": 4
    },
    {
      "name": "Folding Machines",
      "slug": "folding-machines",
      "description": "Paper and material folding equipment",
      "sort_order": 5
    },
    {
      "name": "Hot Stamping Machines",
      "slug": "hot-stamping-machines",
      "description": "Hot foil stamping and embossing machines",
      "sort_order": 6
    },
    {
      "name": "Paper Cutting Machines",
      "slug": "paper-cutting-machines",
      "description": "Guillotine and rotary paper cutting machines",
      "sort_order": 7
    }
  ],
  "admin_user": {
    "email": "admin@barktechnologies.in",
    "full_name": "Bark Technologies Admin",
    "role": "admin",
    "password": "CHANGE_ME_ON_FIRST_LOGIN"
  },
  "site_settings": [
    {"key": "site_name", "value": "Bark Technologies", "value_type": "string"},
    {"key": "site_email", "value": "info@barktechnologies.in", "value_type": "string"},
    {"key": "site_phone", "value": "+91-XXXXXXXXXX", "value_type": "string"},
    {"key": "whatsapp_number", "value": "+91XXXXXXXXXX", "value_type": "string"},
    {"key": "business_hours", "value": "Mon-Sat 9:00 AM - 6:00 PM", "value_type": "string"},
    {"key": "primary_color", "value": "#1a56db", "value_type": "string"},
    {"key": "gst_number", "value": "", "value_type": "string"}
  ],
  "offices": [
    {
      "name": "Bark Technologies - Head Office",
      "city": "New Delhi",
      "state": "Delhi",
      "country": "India",
      "address": "",
      "is_active": true
    }
  ],
  "pages": [
    {
      "slug": "about",
      "title": "About Bark Technologies",
      "content": "# About Us\n\nBark Technologies is a leading manufacturer and supplier of...",
      "published": true
    },
    {
      "slug": "terms",
      "title": "Terms & Conditions",
      "content": "",
      "published": false
    },
    {
      "slug": "privacy",
      "title": "Privacy Policy",
      "content": "",
      "published": false
    }
  ]
}
```

### 6.2 Seed Script

```python
# scripts/seed_data.py
"""Seed the database with initial data from seed_data.json."""
import json
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from app.db.base import SessionLocal
from app.models.category import Category
from app.models.user import User, UserRole
from app.models.content import Office, Page, SiteSetting

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SEED_FILE = Path("data/seed_data.json")


def seed():
    data = json.loads(SEED_FILE.read_text())
    db = SessionLocal()
    
    try:
        # Seed categories
        for cat_data in data["categories"]:
            cat = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data.get("description"),
                sort_order=cat_data.get("sort_order", 0),
            )
            db.add(cat)
            db.flush()
            
            for child_data in cat_data.get("children", []):
                child = Category(
                    name=child_data["name"],
                    slug=child_data["slug"],
                    parent_id=cat.id,
                    sort_order=child_data.get("sort_order", 0),
                )
                db.add(child)
        
        # Seed admin user
        admin = data["admin_user"]
        user = User(
            email=admin["email"],
            hashed_password=pwd_context.hash(admin["password"]),
            full_name=admin["full_name"],
            role=UserRole.ADMIN.value,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        
        # Seed site settings
        for setting in data["site_settings"]:
            db.add(SiteSetting(
                key=setting["key"],
                value=setting["value"],
                value_type=setting.get("value_type", "string"),
            ))
        
        # Seed offices
        for office_data in data["offices"]:
            db.add(Office(**office_data))
        
        # Seed pages
        for page_data in data["pages"]:
            db.add(Page(**page_data))
        
        db.commit()
        print("Seed data inserted successfully.")
    
    except IntegrityError as e:
        db.rollback()
        print(f"Seed data already exists or error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
```

---

## 7. Backup Strategy

### 7.1 SQLite (Development)

```bash
# Quick backup — file copy
cp barktech.db barktech_backup_$(date +%Y%m%d_%H%M%S).db

# Automated daily backup (cron)
0 2 * * * cp /path/to/barktech.db /backups/barktech_$(date +\%Y\%m\%d).db
find /backups/ -name "barktech_*.db" -mtime +30 -delete
```

### 7.2 PostgreSQL (Production)

```bash
# Manual backup
pg_dump -U barktech_user -d barktech -F c -f backups/barktech_$(date +%Y%m%d_%H%M%S).dump

# Restore
pg_restore -U barktech_user -d barktech backups/barktech_20260704.dump

# Automated daily backup (cron)
0 2 * * * pg_dump -U barktech_user -d barktech -F c | gzip > /backups/barktech_$(date +\%Y\%m\%d).dump.gz
find /backups/ -name "barktech_*.dump.gz" -mtime +30 -delete
```

### 7.3 Supabase / Managed PostgreSQL

```
- Daily automatic backups (Supabase: 7 days free, 30 days Pro)
- Point-in-time recovery (PITR) for Pro plans
- Manual backup via dashboard: Database > Backups
- Export to S3/GCS for long-term retention
```

### 7.4 Backup Schedule

| Frequency | Method | Retention | Storage |
|-----------|--------|-----------|---------|
| Daily 2 AM | pg_dump compressed | 30 days | Local + S3 |
| Weekly Sunday | Full dump + verify | 12 weeks | S3 |
| Monthly 1st | Archive + test restore | 12 months | S3 Glacier |
| On deploy | Pre-migration snapshot | Until next backup | Local |

### 7.5 Restore Verification

```bash
# Monthly restore test
createdb barktech_restore_test
pg_restore -U barktech_user -d barktech_restore_test backups/latest.dump
psql -U barktech_user -d barktech_restore_test -c "SELECT COUNT(*) FROM products;"
# Expected: matches production count
dropdb barktech_restore_test
```

---

## 8. Future Scalability

### 8.1 Connection Pooling

```python
# Production engine config
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,              # Base connections
    max_overflow=10,           # Burst connections
    pool_pre_ping=True,        # Verify connections before use
    pool_recycle=3600,         # Recycle connections after 1 hour
    pool_timeout=30,           # Wait max 30s for connection
)
```

For high-traffic, add PgBouncer:

```ini
# pgbouncer.ini
[databases]
barktech = host=localhost port=5432 dbname=barktech

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### 8.2 Read Replicas

```python
# app/db/replica.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Write operations → primary
write_engine = create_engine(settings.DATABASE_URL_PRIMARY)

# Read operations → replica
read_engine = create_engine(settings.DATABASE_URL_REPLICAS[0])

WriteSession = sessionmaker(bind=write_engine)
ReadSession = sessionmaker(bind=read_engine)


def get_read_db():
    db = ReadSession()
    try:
        yield db
    finally:
        db.close()


def get_write_db():
    db = WriteSession()
    try:
        yield db
    finally:
        db.close()
```

### 8.3 Caching Layer (Redis)

```python
# app/cache/redis.py
import json
from functools import wraps
from redis import Redis

redis_client = Redis(host="localhost", port=6379, db=0)


def cache_product(seconds=300):
    """Cache product queries for 5 minutes."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"product:{kwargs.get('product_id', args[1] if len(args) > 1 else 'all')}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, seconds, json.dumps(result, default=str))
            return result
        return wrapper
    return decorator


def invalidate_product_cache(product_id: int):
    """Invalidate cache when product is updated."""
    redis_client.delete(f"product:{product_id}")
```

### 8.4 Database Sharding (Far Future)

```
When to consider:
- > 10M products
- > 1M concurrent users
- Write throughput > 10K inserts/sec

Strategy:
- Shard by category_id (product catalog)
- Shard by user_id (orders, carts)
- Use Citus (PostgreSQL extension) for transparent sharding
```

### 8.5 Full-Text Search (PostgreSQL Native)

```sql
-- Product search index
CREATE INDEX ix_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(summary, '') || ' ' || COALESCE(model, '')));

-- Search query
SELECT id, name, slug, ts_rank(
  to_tsvector('english', name || ' ' || COALESCE(summary, '')),
  plainto_tsquery('english', 'die cutting 320mm')
) AS rank
FROM products
WHERE to_tsvector('english', name || ' ' || COALESCE(summary, '')) @@
  plainto_tsquery('english', 'die cutting 320mm')
ORDER BY rank DESC
LIMIT 20;
```

### 8.6 pgvector for AI RAG

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Product embeddings for AI product advisor
ALTER TABLE products ADD COLUMN embedding vector(1536);

-- Similarity search
CREATE INDEX ix_products_embedding ON products
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Find similar products
SELECT id, name, 1 - (embedding <=> $1) AS similarity
FROM products
WHERE 1 - (embedding <=> $1) > 0.7
ORDER BY similarity DESC
LIMIT 5;
```

---

## Summary: Table Count by Phase

| Phase | Tables | Purpose |
|-------|--------|---------|
| **Phase 0** (Current) | 5 | products, categories, product_specs, product_media, inquiries |
| **Phase 1** (Backend) | +8 | users, product_videos, product_documents, rfq_items, conversations, messages, site_settings, audit_logs |
| **Phase 2** (Features) | +7 | carts, cart_items, product_reviews, case_studies, case_study_products, offices, pages, faqs |
| **Phase 3** (E-commerce) | +3 | orders, order_items, payments |
| **Total** | **23** | Complete production schema |

---

> **Next Steps:**
> 1. Initialize Alembic in `backend/` directory
> 2. Create migration `001_initial_schema`
> 3. Seed admin user + categories
> 4. Import existing 15+ HTML product pages
> 5. Verify all relationships and constraints
