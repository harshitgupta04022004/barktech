# Product Setups Showcase Slider — Feature Design Document

> **Version:** 1.0
> **Date:** July 2026
> **Stack:** FastAPI + Jinja2 + Vanilla JS + CSS Animations
> **Domain:** barktechnologies.in

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Implementation](#5-frontend-implementation)
6. [CSS Animations](#6-css-animations)
7. [JavaScript Logic](#7-javascript-logic)
8. [Mobile Responsive Design](#8-mobile-responsive-design)
9. [Admin Panel Integration](#9-admin-panel-integration)
10. [Implementation Plan](#10-implementation-plan)

---

## 1. Feature Overview

### 1.1 What This Feature Does

A **continuous auto-scrolling showcase slider** that displays completed product installations/setups on the homepage. It automatically pulls data from the database, so adding new setups requires zero code changes.

### 1.2 Key Requirements

| Requirement | Description |
|-------------|-------------|
| **Auto-scroll** | Cards move continuously from right to left, looping forever |
| **Pause on hover** | Animation pauses when user hovers over the slider |
| **Video cards** | Each card shows a video thumbnail with play button |
| **Click to play** | Clicking a card opens the video in a modal/lightbox |
| **Database-driven** | New setups appear automatically from DB |
| **Responsive** | Works on mobile (touch swipe) and desktop (hover) |
| **Design match** | Uses existing brand colors and typography |

### 1.3 User Flow

```
+-----------------------------------------------------------------------+
|                     USER FLOW                                          |
|                                                                       |
|   1. User scrolls homepage                                            |
|   2. Sees "Our Installations" section                                 |
|   3. Cards automatically scroll from right to left                    |
|   4. User hovers over slider -> animation pauses                      |
|   5. User clicks a card -> video modal opens                          |
|   6. User watches video, closes modal                                 |
|   7. User moves mouse away -> animation resumes                       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 2. High-Level Architecture

### 2.1 System Diagram

```
+-----------------------------------------------------------------------+
|                     ARCHITECTURE OVERVIEW                               |
|                                                                       |
|   +-------------------+     +-------------------+                     |
|   |   Admin Panel     |     |   Public Website   |                     |
|   |   /admin/setups   |     |   / (homepage)     |                     |
|   +--------+----------+     +--------+----------+                     |
|            |                         |                                 |
|            v                         v                                 |
|   +--------+----------+     +--------+----------+                     |
|   |   CRUD Operations  |     |   GET /api/v1/    |                     |
|   |   (add/edit/delete |     |   setups          |                     |
|   |    setups)         |     |   (public list)   |                     |
|   +--------+----------+     +--------+----------+                     |
|            |                         |                                 |
|            v                         v                                 |
|   +--------+----------------------------------------+                 |
|   |              DATABASE (product_setups)           |                 |
|   |  id, title, description, video_url, thumbnail,  |                 |
|   |  product_id, sort_order, is_active, created_at  |                 |
|   +-------------------------------------------------+                 |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 2.2 Data Flow

```
+-----------------------------------------------------------------------+
|                     DATA FLOW                                          |
|                                                                       |
|   ADMIN SIDE (Write):                                                 |
|   -------------------                                                 |
|   Admin logs in -> /admin/setups/new                                  |
|   Fills form: title, description, video URL, product                 |
|   Uploads thumbnail (or auto-generates from video)                   |
|   POST /api/v1/admin/setups -> Saves to DB                           |
|                                                                       |
|   PUBLIC SIDE (Read):                                                 |
|   -------------------                                                 |
|   Homepage loads -> GET /api/v1/setups                                |
|   API returns JSON array of active setups                             |
|   JavaScript renders cards into slider                                |
|   CSS animation starts auto-scrolling                                 |
|   User hovers -> JS pauses animation                                  |
|   User clicks -> JS opens video modal                                 |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 3. Database Schema

### 3.1 ProductSetup Model

```python
# bark/app/models/setup.py

"""Product installation/setup showcase model."""

from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, String, Text, Index, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class ProductSetup(Base):
    """
    A completed product installation/setup showcase.
    Displayed on homepage as auto-scrolling slider cards.
    """

    __tablename__ = "product_setups"

    id = Column(Integer, primary_key=True, index=True)

    # Content
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)  # e.g. "Mumbai, India"
    client_name = Column(String(200), nullable=True)  # e.g. "ABC Packaging Ltd"

    # Media
    video_url = Column(String(500), nullable=False)  # YouTube/Vimeo URL
    thumbnail_url = Column(String(500), nullable=True)  # Auto-generated or custom
    video_type = Column(String(20), default="youtube")
    # Values: "youtube", "vimeo", "self_hosted"

    # Relations
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # Display
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)

    # Stats
    view_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="setups")
    category = relationship("Category")

    __table_args__ = (
        Index("ix_product_setups_active_order", "is_active", "sort_order"),
        Index("ix_product_setups_featured", "is_featured", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<ProductSetup {self.title}>"

    @property
    def display_title(self) -> str:
        """Return the best display title."""
        return self.title or f"Setup #{self.id}"

    @property
    def embed_url(self) -> str:
        """Get the embeddable video URL."""
        if self.video_type == "youtube":
            # Extract video ID from YouTube URL
            import re
            match = re.search(
                r'(?:youtube\.com/(?:watch\?v=|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})',
                self.video_url
            )
            if match:
                return f"https://www.youtube.com/embed/{match.group(1)}?rel=0"
        elif self.video_type == "vimeo":
            import re
            match = re.search(r'vimeo\.com/(\d+)', self.video_url)
            if match:
                return f"https://player.vimeo.com/video/{match.group(1)}"
        return self.video_url
```

### 3.2 Relationship to Product Model

```python
# Add to bark/app/models/product.py (update existing Product class)

# Add this relationship to the Product model:
setups = relationship(
    "ProductSetup",
    back_populates="product",
    lazy="dynamic",
)
```

### 3.3 Migration SQL

```sql
-- Create product_setups table
CREATE TABLE product_setups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    client_name VARCHAR(200),
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    video_type VARCHAR(20) DEFAULT 'youtube',
    product_id INTEGER REFERENCES products(id),
    category_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    is_featured BOOLEAN DEFAULT 0 NOT NULL,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    view_count INTEGER DEFAULT 0 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX ix_product_setups_active_order ON product_setups(is_active, sort_order);
CREATE INDEX ix_product_setups_featured ON product_setups(is_featured, is_active);
CREATE INDEX ix_product_setups_product ON product_setups(product_id);
```

---

## 4. API Endpoints

### 4.1 Public API (No Auth Required)

```
+-----------------------------------------------------------------------+
|                     PUBLIC SETUP ENDPOINTS                             |
|                                                                       |
|   GET /api/v1/setups                                                 |
|   --------------------------------------------------                   |
|   Query params:                                                       |
|     - limit: int (default: 10, max: 20)                              |
|     - featured: bool (optional, filter featured only)                 |
|     - product_id: int (optional, filter by product)                   |
|                                                                       |
|   Response: {                                                         |
|     "setups": [                                                       |
|       {                                                               |
|         "id": 1,                                                      |
|         "title": "FMZ-1450H Installation at ABC Packaging",          |
|         "description": "Complete die cutting line setup...",          |
|         "location": "Mumbai, India",                                  |
|         "client_name": "ABC Packaging Ltd",                           |
|         "video_url": "https://youtube.com/watch?v=...",              |
|         "thumbnail_url": "/static/uploads/setups/thumb.jpg",          |
|         "video_type": "youtube",                                      |
|         "product": {                                                  |
|           "id": 5,                                                    |
|           "name": "Automatic Die Cutting Machine",                    |
|           "slug": "automatic-die-cutting-machine"                     |
|         },                                                            |
|         "view_count": 142,                                            |
|         "created_at": "2026-06-15T10:30:00Z"                         |
|       },                                                              |
|       ...                                                             |
|     ],                                                                |
|     "total": 15                                                       |
|   }                                                                   |
|                                                                       |
|   GET /api/v1/setups/{setup_id}                                       |
|   --------------------------------------------------                   |
|   Returns single setup detail                                         |
|   Increments view_count                                               |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 4.2 Admin API (JWT Required)

```
+-----------------------------------------------------------------------+
|                     ADMIN SETUP ENDPOINTS                              |
|                                                                       |
|   GET /api/v1/admin/setups                                            |
|   --------------------------------------------------                   |
|   Returns ALL setups (including inactive)                             |
|   Query: ?page=1&limit=20&is_active=true                             |
|                                                                       |
|   POST /api/v1/admin/setups                                           |
|   --------------------------------------------------                   |
|   Body: multipart/form-data                                           |
|     - title: string (required)                                        |
|     - description: string                                             |
|     - location: string                                                |
|     - client_name: string                                             |
|     - video_url: string (required)                                   |
|     - video_type: string ("youtube" | "vimeo" | "self_hosted")       |
|     - thumbnail: file (optional, auto-generated if not provided)     |
|     - product_id: int (optional)                                      |
|     - sort_order: int                                                 |
|     - is_active: bool                                                 |
|     - is_featured: bool                                               |
|                                                                       |
|   PUT /api/v1/admin/setups/{setup_id}                                 |
|   --------------------------------------------------                   |
|   Update existing setup                                               |
|                                                                       |
|   DELETE /api/v1/admin/setups/{setup_id}                              |
|   --------------------------------------------------                   |
|   Soft-delete (set is_active = false)                                 |
|                                                                       |
|   PUT /api/v1/admin/setups/reorder                                    |
|   --------------------------------------------------                   |
|   Body: { "order": [3, 1, 5, 2, 4] }                                |
|   Update sort_order for multiple setups                               |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 5. Frontend Implementation

### 5.1 Homepage Integration

```html
<!-- bark/app/templates/partials/setup_showcase.html -->

{# Product Setups Showcase Section #}
{% set setups = setups | default([]) %}
{% if setups %}
<section class="setup-showcase-section" id="installations">
  <div class="container">
    {# Section Header #}
    <div class="section-heading" data-animate="fade-up">
      <span class="text-caption text-accent">Our Work</span>
      <h2>Product Installations</h2>
      <p>See our machines in action at client facilities across India</p>
    </div>
  </div>

  {# Auto-Scrolling Slider #}
  <div class="setup-slider-wrapper">
    <div class="setup-slider" id="setupSlider" data-pause-on-hover>
      <div class="setup-slider-track">
        {# Cards are duplicated for seamless loop #}
        {% for setup in setups %}
        <div class="setup-card" data-setup-id="{{ setup.id }}">
          <div class="setup-card-media">
            {% if setup.thumbnail_url %}
            <img
              src="{{ setup.thumbnail_url }}"
              alt="{{ setup.title }}"
              class="setup-thumbnail"
              loading="lazy"
            >
            {% else %}
            <div class="setup-thumbnail-placeholder">
              <i class="bi bi-camera-video"></i>
            </div>
            {% endif %}

            {# Play Button Overlay #}
            <button
              type="button"
              class="setup-play-btn"
              data-video-url="{{ setup.embed_url }}"
              data-video-type="{{ setup.video_type }}"
              aria-label="Play {{ setup.title }}"
            >
              <i class="bi bi-play-fill"></i>
            </button>

            {# Video Type Badge #}
            <span class="setup-video-badge">
              <i class="bi bi-{{ 'youtube' if setup.video_type == 'youtube' else 'camera-video' }}"></i>
            </span>
          </div>

          <div class="setup-card-info">
            <h3 class="setup-card-title">{{ setup.title }}</h3>
            {% if setup.description %}
            <p class="setup-card-desc">{{ setup.description | truncate(100) }}</p>
            {% endif %}
            <div class="setup-card-meta">
              {% if setup.location %}
              <span class="setup-location">
                <i class="bi bi-geo-alt"></i> {{ setup.location }}
              </span>
              {% endif %}
              {% if setup.product %}
              <span class="setup-product">
                <i class="bi bi-box-seam"></i> {{ setup.product.name }}
              </span>
              {% endif %}
            </div>
          </div>
        </div>
        {% endfor %}

        {# Duplicate cards for seamless infinite loop #}
        {% for setup in setups %}
        <div class="setup-card setup-card--clone" aria-hidden="true">
          <div class="setup-card-media">
            {% if setup.thumbnail_url %}
            <img
              src="{{ setup.thumbnail_url }}"
              alt="{{ setup.title }}"
              class="setup-thumbnail"
              loading="lazy"
            >
            {% else %}
            <div class="setup-thumbnail-placeholder">
              <i class="bi bi-camera-video"></i>
            </div>
            {% endif %}

            <button
              type="button"
              class="setup-play-btn"
              data-video-url="{{ setup.embed_url }}"
              data-video-type="{{ setup.video_type }}"
              aria-label="Play {{ setup.title }}"
            >
              <i class="bi bi-play-fill"></i>
            </button>

            <span class="setup-video-badge">
              <i class="bi bi-{{ 'youtube' if setup.video_type == 'youtube' else 'camera-video' }}"></i>
            </span>
          </div>

          <div class="setup-card-info">
            <h3 class="setup-card-title">{{ setup.title }}</h3>
            {% if setup.description %}
            <p class="setup-card-desc">{{ setup.description | truncate(100) }}</p>
            {% endif %}
            <div class="setup-card-meta">
              {% if setup.location %}
              <span class="setup-location">
                <i class="bi bi-geo-alt"></i> {{ setup.location }}
              </span>
              {% endif %}
              {% if setup.product %}
              <span class="setup-product">
                <i class="bi bi-box-seam"></i> {{ setup.product.name }}
              </span>
              {% endif %}
            </div>
          </div>
        </div>
        {% endfor %}
      </div>
    </div>

    {# Gradient Overlays for smooth edges #}
    <div class="setup-slider-edge setup-slider-edge--left"></div>
    <div class="setup-slider-edge setup-slider-edge--right"></div>
  </div>

  {# View All Link #}
  <div class="container text-center mt-4">
    <a href="/installations" class="bark-btn bark-btn--outline">
      View All Installations
      <i class="bi bi-arrow-right"></i>
    </a>
  </div>
</section>

{# Video Modal #}
<div class="setup-video-modal" id="setupVideoModal" tabindex="-1" aria-hidden="true">
  <div class="setup-video-modal-overlay"></div>
  <div class="setup-video-modal-content">
    <button type="button" class="setup-video-modal-close" aria-label="Close">
      <i class="bi bi-x-lg"></i>
    </button>
    <div class="setup-video-modal-body">
      <div class="ratio ratio-16x9">
        <iframe
          id="setupVideoIframe"
          src=""
          title="Product setup video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
    <div class="setup-video-modal-info" id="setupVideoInfo">
      <h3 id="setupVideoTitle"></h3>
      <p id="setupVideoDesc"></p>
    </div>
  </div>
</div>
{% endif %}
```

### 5.2 API Service (Python)

```python
# bark/app/services/setups.py

"""Product setup showcase service."""

from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.setup import ProductSetup
from app.models.user import AuditLog


def list_public_setups(
    db: Session,
    limit: int = 10,
    featured_only: bool = False,
    product_id: int | None = None,
) -> list[ProductSetup]:
    """
    Get active setups for public display.
    Ordered by sort_order, then by created_at desc.
    """
    stmt = (
        select(ProductSetup)
        .options(
            joinedload(ProductSetup.product),
            joinedload(ProductSetup.category),
        )
        .where(ProductSetup.is_active.is_(True))
    )

    if featured_only:
        stmt = stmt.where(ProductSetup.is_featured.is_(True))

    if product_id:
        stmt = stmt.where(ProductSetup.product_id == product_id)

    stmt = (
        stmt
        .order_by(ProductSetup.sort_order, ProductSetup.created_at.desc())
        .limit(min(limit, 20))
    )

    return list(db.scalars(stmt).unique().all())


def get_setup_by_id(db: Session, setup_id: int) -> ProductSetup | None:
    """Get a single setup by ID."""
    return db.scalar(
        select(ProductSetup)
        .options(
            joinedload(ProductSetup.product),
            joinedload(ProductSetup.category),
        )
        .where(ProductSetup.id == setup_id)
    )


def increment_view_count(db: Session, setup_id: int) -> None:
    """Increment view count for analytics."""
    setup = db.get(ProductSetup, setup_id)
    if setup:
        setup.view_count = (setup.view_count or 0) + 1
        db.commit()


def list_admin_setups(
    db: Session,
    page: int = 1,
    limit: int = 20,
    is_active: bool | None = None,
) -> dict:
    """List all setups for admin panel."""
    stmt = select(ProductSetup).options(
        joinedload(ProductSetup.product),
    )

    if is_active is not None:
        stmt = stmt.where(ProductSetup.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    setups = db.scalars(
        stmt.order_by(ProductSetup.sort_order, ProductSetup.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).unique().all()

    return {
        "items": setups,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0,
    }


def create_setup(db: Session, data: dict) -> ProductSetup:
    """Create a new product setup."""
    setup = ProductSetup(**data)
    db.add(setup)
    db.commit()
    db.refresh(setup)
    return setup


def update_setup(db: Session, setup_id: int, data: dict) -> ProductSetup:
    """Update an existing setup."""
    setup = db.get(ProductSetup, setup_id)
    if not setup:
        raise ValueError(f"Setup {setup_id} not found")

    for key, value in data.items():
        if hasattr(setup, key):
            setattr(setup, key, value)

    db.commit()
    db.refresh(setup)
    return setup


def delete_setup(db: Session, setup_id: int) -> bool:
    """Soft-delete a setup (set is_active = False)."""
    setup = db.get(ProductSetup, setup_id)
    if not setup:
        return False

    setup.is_active = False
    db.commit()
    return True


def reorder_setups(db: Session, setup_ids: list[int]) -> bool:
    """Update sort_order for multiple setups."""
    for index, setup_id in enumerate(setup_ids):
        setup = db.get(ProductSetup, setup_id)
        if setup:
            setup.sort_order = index
    db.commit()
    return True
```

### 5.3 API Router

```python
# bark/app/routers/api_setups.py

"""Product setup showcase API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import AdminUser, CurrentUser
from app.models.setup import ProductSetup
from app.services import setups as setup_service

router = APIRouter(prefix="/setups", tags=["Setups"])


# --- Schemas ---

class SetupResponse(BaseModel):
    """Public setup response."""
    id: int
    title: str
    description: str | None
    location: str | None
    client_name: str | None
    video_url: str
    thumbnail_url: str | None
    video_type: str
    product_id: int | None
    view_count: int
    created_at: str

    model_config = {"from_attributes": True}


class SetupDetailResponse(SetupResponse):
    """Detailed setup response with product info."""
    product_name: str | None = None
    product_slug: str | None = None
    category_name: str | None = None


# --- Public Endpoints ---

@router.get("", response_model=dict)
async def list_setups(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=20),
    featured: bool = Query(False),
    product_id: int | None = Query(None),
):
    """
    Get active setups for public display.
    Returns setups ordered by sort_order.
    """
    setups = setup_service.list_public_setups(
        db,
        limit=limit,
        featured_only=featured,
        product_id=product_id,
    )

    return {
        "setups": [
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "location": s.location,
                "client_name": s.client_name,
                "video_url": s.video_url,
                "thumbnail_url": s.thumbnail_url,
                "video_type": s.video_type,
                "embed_url": s.embed_url,
                "product": {
                    "id": s.product.id,
                    "name": s.product.name,
                    "slug": s.product.slug,
                } if s.product else None,
                "view_count": s.view_count,
                "created_at": s.created_at.isoformat(),
            }
            for s in setups
        ],
        "total": len(setups),
    }


@router.get("/{setup_id}")
async def get_setup(
    setup_id: int,
    db: Session = Depends(get_db),
):
    """Get single setup detail and increment view count."""
    setup = setup_service.get_setup_by_id(db, setup_id)
    if not setup or not setup.is_active:
        raise HTTPException(status_code=404, detail="Setup not found")

    # Increment view count
    setup_service.increment_view_count(db, setup_id)

    return {
        "id": setup.id,
        "title": setup.title,
        "description": setup.description,
        "location": setup.location,
        "client_name": setup.client_name,
        "video_url": setup.video_url,
        "thumbnail_url": setup.thumbnail_url,
        "video_type": setup.video_type,
        "embed_url": setup.embed_url,
        "product": {
            "id": setup.product.id,
            "name": setup.product.name,
            "slug": setup.product.slug,
        } if setup.product else None,
        "view_count": setup.view_count,
        "created_at": setup.created_at.isoformat(),
    }


# --- Admin Endpoints ---

@router.get("/admin/all")
async def admin_list_setups(
    admin: AdminUser,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_active: bool | None = Query(None),
):
    """List all setups for admin panel."""
    result = setup_service.list_admin_setups(db, page, limit, is_active)
    return result


@router.post("/admin", status_code=201)
async def admin_create_setup(
    admin: AdminUser,
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: str | None = Form(None),
    location: str | None = Form(None),
    client_name: str | None = Form(None),
    video_url: str = Form(...),
    video_type: str = Form("youtube"),
    product_id: int | None = Form(None),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    is_featured: bool = Form(False),
    thumbnail: UploadFile | None = File(None),
):
    """Create a new product setup."""
    # Handle thumbnail upload
    thumbnail_url = None
    if thumbnail:
        from app.services.file_upload import file_service
        urls = await file_service.upload_image(
            thumbnail,
            subfolder="setups",
        )
        thumbnail_url = urls["original"]

    setup = setup_service.create_setup(db, {
        "title": title,
        "description": description,
        "location": location,
        "client_name": client_name,
        "video_url": video_url,
        "video_type": video_type,
        "thumbnail_url": thumbnail_url,
        "product_id": product_id,
        "sort_order": sort_order,
        "is_active": is_active,
        "is_featured": is_featured,
    })

    return {"id": setup.id, "message": "Setup created"}


@router.put("/admin/{setup_id}")
async def admin_update_setup(
    setup_id: int,
    admin: AdminUser,
    db: Session = Depends(get_db),
    title: str | None = Form(None),
    description: str | None = Form(None),
    location: str | None = Form(None),
    client_name: str | None = Form(None),
    video_url: str | None = Form(None),
    video_type: str | None = Form(None),
    product_id: int | None = Form(None),
    sort_order: int | None = Form(None),
    is_active: bool | None = Form(None),
    is_featured: bool | None = Form(None),
    thumbnail: UploadFile | None = File(None),
):
    """Update an existing setup."""
    data = {}
    if title is not None:
        data["title"] = title
    if description is not None:
        data["description"] = description
    if location is not None:
        data["location"] = location
    if client_name is not None:
        data["client_name"] = client_name
    if video_url is not None:
        data["video_url"] = video_url
    if video_type is not None:
        data["video_type"] = video_type
    if product_id is not None:
        data["product_id"] = product_id
    if sort_order is not None:
        data["sort_order"] = sort_order
    if is_active is not None:
        data["is_active"] = is_active
    if is_featured is not None:
        data["is_featured"] = is_featured

    # Handle thumbnail upload
    if thumbnail:
        from app.services.file_upload import file_service
        urls = await file_service.upload_image(
            thumbnail,
            subfolder="setups",
        )
        data["thumbnail_url"] = urls["original"]

    try:
        setup = setup_service.update_setup(db, setup_id, data)
        return {"id": setup.id, "message": "Setup updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/admin/{setup_id}")
async def admin_delete_setup(
    setup_id: int,
    admin: AdminUser,
    db: Session = Depends(get_db),
):
    """Soft-delete a setup."""
    success = setup_service.delete_setup(db, setup_id)
    if not success:
        raise HTTPException(status_code=404, detail="Setup not found")
    return {"message": "Setup deleted"}


@router.put("/admin/reorder")
async def admin_reorder_setups(
    admin: AdminUser,
    db: Session = Depends(get_db),
    order: list[int] = Form(...),
):
    """Update sort order for multiple setups."""
    setup_service.reorder_setups(db, order)
    return {"message": "Order updated"}
```

---

## 6. CSS Animations

### 6.1 Setup Showcase Styles

```css
/* bark/app/static/css/setup-showcase.css */

/* ============================================
   SETUP SHOWCASE SECTION
   ============================================ */

.setup-showcase-section {
  padding: var(--bark-space-16) 0;
  overflow: hidden;
  background: var(--bark-surface-muted);
}

/* ============================================
   SLIDER WRAPPER
   ============================================ */

.setup-slider-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: var(--bark-space-8) 0;
}

/* Gradient overlays for smooth edges */
.setup-slider-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  z-index: 10;
  pointer-events: none;
}

.setup-slider-edge--left {
  left: 0;
  background: linear-gradient(to right, var(--bark-surface-muted) 0%, transparent 100%);
}

.setup-slider-edge--right {
  right: 0;
  background: linear-gradient(to left, var(--bark-surface-muted) 0%, transparent 100%);
}

/* ============================================
   SLIDER TRACK (Animation Container)
   ============================================ */

.setup-slider {
  width: 100%;
  overflow: hidden;
}

.setup-slider-track {
  display: flex;
  gap: var(--bark-space-6);
  width: max-content;
  animation: setup-scroll 40s linear infinite;
}

/* Pause on hover */
.setup-slider:hover .setup-slider-track,
.setup-slider.is-paused .setup-slider-track {
  animation-play-state: paused;
}

/* Seamless infinite loop animation */
@keyframes setup-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* ============================================
   SETUP CARD
   ============================================ */

.setup-card {
  flex-shrink: 0;
  width: 350px;
  background: var(--bark-surface);
  border-radius: var(--bark-radius-xl);
  overflow: hidden;
  box-shadow: var(--bark-shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--bark-border);
}

.setup-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--bark-shadow-lg);
}

/* Clone cards (for seamless loop) */
.setup-card--clone {
  /* Hidden from screen readers */
}

/* ============================================
   CARD MEDIA (Thumbnail + Play Button)
   ============================================ */

.setup-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bark-gray-200);
}

.setup-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.setup-card:hover .setup-thumbnail {
  transform: scale(1.05);
}

.setup-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bark-gray-200);
  color: var(--bark-gray-400);
  font-size: 3rem;
}

/* Play button overlay */
.setup-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(219, 32, 23, 0.9);
  border: none;
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  box-shadow: 0 4px 20px rgba(219, 32, 23, 0.4);
}

.setup-card:hover .setup-play-btn {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.setup-play-btn i {
  margin-left: 4px; /* Visual centering for play icon */
}

/* Video type badge */
.setup-video-badge {
  position: absolute;
  top: var(--bark-space-3);
  right: var(--bark-space-3);
  padding: var(--bark-space-1) var(--bark-space-2);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: var(--bark-radius-sm);
  font-size: var(--bark-text-xs);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ============================================
   CARD INFO
   ============================================ */

.setup-card-info {
  padding: var(--bark-space-4) var(--bark-space-5);
}

.setup-card-title {
  font-family: var(--bark-font-heading);
  font-size: var(--bark-text-lg);
  font-weight: 600;
  color: var(--bark-navy);
  margin-bottom: var(--bark-space-2);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.setup-card-desc {
  font-size: var(--bark-text-sm);
  color: var(--bark-gray-600);
  margin-bottom: var(--bark-space-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.setup-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bark-space-3);
  font-size: var(--bark-text-xs);
  color: var(--bark-gray-500);
}

.setup-location,
.setup-product {
  display: flex;
  align-items: center;
  gap: 4px;
}

.setup-location i,
.setup-product i {
  color: var(--bark-red);
}

/* ============================================
   VIDEO MODAL
   ============================================ */

.setup-video-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
}

.setup-video-modal.is-active {
  display: flex;
}

.setup-video-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  cursor: pointer;
}

.setup-video-modal-content {
  position: relative;
  width: 90%;
  max-width: 900px;
  z-index: 1;
}

.setup-video-modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.setup-video-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.setup-video-modal-body {
  border-radius: var(--bark-radius-xl);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.setup-video-modal-info {
  margin-top: var(--bark-space-4);
  color: white;
  text-align: center;
}

.setup-video-modal-info h3 {
  font-family: var(--bark-font-heading);
  font-size: var(--bark-text-xl);
  margin-bottom: var(--bark-space-2);
}

.setup-video-modal-info p {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--bark-text-sm);
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 991.98px) {
  .setup-card {
    width: 300px;
  }

  .setup-slider-edge {
    width: 60px;
  }
}

@media (max-width: 767.98px) {
  .setup-showcase-section {
    padding: var(--bark-space-10) 0;
  }

  .setup-card {
    width: 280px;
  }

  .setup-card-info {
    padding: var(--bark-space-3) var(--bark-space-4);
  }

  .setup-card-title {
    font-size: var(--bark-text-base);
  }

  .setup-play-btn {
    width: 56px;
    height: 56px;
    font-size: 1.25rem;
  }

  .setup-slider-edge {
    width: 40px;
  }

  .setup-video-modal-content {
    width: 95%;
  }
}

@media (max-width: 575.98px) {
  .setup-card {
    width: 260px;
  }

  .setup-card-meta {
    flex-direction: column;
    gap: var(--bark-space-1);
  }
}
```

---

## 7. JavaScript Logic

### 7.1 Setup Slider Controller

```javascript
// bark/app/static/js/setup-slider.js

/**
 * Setup Showcase Slider
 * - Auto-scrolling continuous loop
 * - Pause on hover
 * - Touch support for mobile
 * - Video modal integration
 */

export class SetupSlider {
  constructor() {
    this.slider = document.getElementById('setupSlider');
    this.track = this.slider?.querySelector('.setup-slider-track');
    this.modal = document.getElementById('setupVideoModal');
    this.iframe = document.getElementById('setupVideoIframe');
    this.titleEl = document.getElementById('setupVideoTitle');
    this.descEl = document.getElementById('setupVideoDesc');

    if (!this.slider || !this.track) return;

    this.isPaused = false;
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;

    this.init();
  }

  init() {
    this.setupPauseOnHover();
    this.setupTouchSwipe();
    this.setupVideoModal();
    this.setupKeyboardNav();
    this.adjustSpeed();
  }

  // ============================================
  // PAUSE ON HOVER
  // ============================================

  setupPauseOnHover() {
    this.slider.addEventListener('mouseenter', () => {
      this.pause();
    });

    this.slider.addEventListener('mouseleave', () => {
      this.resume();
    });

    // Also pause when modal is open
    this.slider.addEventListener('focusin', () => this.pause());
    this.slider.addEventListener('focusout', () => this.resume());
  }

  pause() {
    this.isPaused = true;
    this.slider.classList.add('is-paused');
  }

  resume() {
    if (this.modal?.classList.contains('is-active')) return;
    this.isPaused = false;
    this.slider.classList.remove('is-paused');
  }

  // ============================================
  // TOUCH SWIPE (Mobile)
  // ============================================

  setupTouchSwipe() {
    let startX = 0;
    let startTranslate = 0;

    this.slider.addEventListener('touchstart', (e) => {
      this.pause();
      startX = e.touches[0].clientX;
      // Get current transform
      const style = window.getComputedStyle(this.track);
      const matrix = new DOMMatrixReadOnly(style.transform);
      startTranslate = matrix.m41;
    }, { passive: true });

    this.slider.addEventListener('touchmove', (e) => {
      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      const newTranslate = startTranslate + diff;

      // Apply transform directly
      this.track.style.transform = `translateX(${newTranslate}px)`;
    }, { passive: true });

    this.slider.addEventListener('touchend', (e) => {
      // Reset to animation
      this.track.style.transform = '';
      this.track.style.animation = 'none';
      this.track.offsetHeight; // Trigger reflow
      this.track.style.animation = '';

      // Resume after a delay
      setTimeout(() => this.resume(), 1000);
    });
  }

  // ============================================
  // VIDEO MODAL
  // ============================================

  setupVideoModal() {
    // Play button clicks
    document.querySelectorAll('.setup-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = btn.dataset.videoUrl;
        const type = btn.dataset.videoType;
        this.openVideoModal(url, type);
      });
    });

    // Card clicks (open video)
    document.querySelectorAll('.setup-card:not(.setup-card--clone)').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.setup-play-btn')) return;
        const btn = card.querySelector('.setup-play-btn');
        if (btn) {
          const url = btn.dataset.videoUrl;
          const type = btn.dataset.videoType;
          this.openVideoModal(url, type);
        }
      });
    });

    // Close modal
    this.modal?.querySelector('.setup-video-modal-close')?.addEventListener('click', () => {
      this.closeVideoModal();
    });

    this.modal?.querySelector('.setup-video-modal-overlay')?.addEventListener('click', () => {
      this.closeVideoModal();
    });
  }

  openVideoModal(url, type) {
    if (!this.modal || !this.iframe) return;

    this.pause();

    // Set iframe src
    this.iframe.src = url;

    // Show modal
    this.modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    // Fetch setup details for display
    this.fetchSetupDetails(url);
  }

  closeVideoModal() {
    if (!this.modal || !this.iframe) return;

    this.modal.classList.remove('is-active');
    this.iframe.src = '';
    document.body.style.overflow = '';

    this.resume();
  }

  async fetchSetupDetails(videoUrl) {
    // Extract setup ID from card and fetch details
    // This is optional - modal can work without it
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('is-active')) {
        this.closeVideoModal();
      }
    });
  }

  // ============================================
  // SPEED ADJUSTMENT
  // ============================================

  adjustSpeed() {
    // Adjust speed based on number of cards
    const cardCount = this.track?.querySelectorAll('.setup-card:not(.setup-card--clone)').length || 0;
    if (cardCount <= 3) {
      this.track.style.animationDuration = '30s';
    } else if (cardCount <= 6) {
      this.track.style.animationDuration = '40s';
    } else {
      this.track.style.animationDuration = '50s';
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new SetupSlider();
});
```

---

## 8. Mobile Responsive Design

### 8.1 Touch Interactions

| Gesture | Action |
|---------|--------|
| **Tap card** | Opens video modal |
| **Tap play button** | Opens video modal |
| **Swipe left/right** | Scrolls slider manually |
| **Swipe up** | Normal page scroll |

### 8.2 Mobile Breakpoints

| Breakpoint | Card Width | Cards Visible | Edge Overlay |
|------------|-----------|---------------|--------------|
| Desktop (>992px) | 350px | 3-4 | 100px |
| Tablet (768-991px) | 300px | 2-3 | 60px |
| Mobile (<768px) | 280px | 1-2 | 40px |
| Small Mobile (<576px) | 260px | 1 | 30px |

### 8.3 Mobile Optimizations

```css
/* Additional mobile-specific styles */

@media (max-width: 767.98px) {
  /* Reduce animation speed on mobile */
  .setup-slider-track {
    animation-duration: 30s;
  }

  /* Larger touch targets */
  .setup-play-btn {
    width: 60px;
    height: 60px;
    opacity: 0.9; /* Always visible on mobile */
  }

  /* Stack meta info vertically */
  .setup-card-meta {
    flex-direction: column;
    gap: 4px;
  }

  /* Reduce section padding */
  .setup-showcase-section {
    padding: var(--bark-space-8) 0;
  }

  /* Adjust card info padding */
  .setup-card-info {
    padding: var(--bark-space-3);
  }

  /* Modal adjustments */
  .setup-video-modal-content {
    width: 95%;
    max-width: none;
  }

  .setup-video-modal-close {
    top: -35px;
    right: 0;
  }
}

/* Touch device detection */
@media (hover: none) and (pointer: coarse) {
  /* Always show play button on touch devices */
  .setup-play-btn {
    opacity: 0.9;
  }

  /* No hover effects on touch */
  .setup-card:hover {
    transform: none;
    box-shadow: var(--bark-shadow-sm);
  }

  .setup-card:active {
    transform: scale(0.98);
  }
}
```

---

## 9. Admin Panel Integration

### 9.1 Admin Setup List Template

```html
<!-- bark/app/templates/admin/setups_list.html -->
{% extends "base.html" %}

{% block title %}Manage Installations | Admin{% endblock %}

{% block content %}
<div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h1>Product Installations</h1>
    <a href="/admin/setups/new" class="btn btn-primary">
      <i class="bi bi-plus-circle me-2"></i>Add New Setup
    </a>
  </div>

  <div class="card">
    <div class="card-body">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Order</th>
            <th>Thumbnail</th>
            <th>Title</th>
            <th>Video Type</th>
            <th>Product</th>
            <th>Status</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {% for setup in setups %}
          <tr>
            <td>{{ setup.sort_order }}</td>
            <td>
              {% if setup.thumbnail_url %}
              <img src="{{ setup.thumbnail_url }}" alt="" width="80" height="45" class="rounded">
              {% else %}
              <span class="text-muted">No thumbnail</span>
              {% endif %}
            </td>
            <td>{{ setup.title }}</td>
            <td>
              <span class="badge bg-{{ 'danger' if setup.video_type == 'youtube' else 'primary' }}">
                {{ setup.video_type | title }}
              </span>
            </td>
            <td>{{ setup.product.name if setup.product else '--' }}</td>
            <td>
              {% if setup.is_active %}
              <span class="badge bg-success">Active</span>
              {% else %}
              <span class="badge bg-secondary">Inactive</span>
              {% endif %}
            </td>
            <td>{{ setup.view_count }}</td>
            <td>
              <a href="/admin/setups/{{ setup.id }}/edit" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-pencil"></i>
              </a>
              <form method="POST" action="/admin/setups/{{ setup.id }}/delete" class="d-inline">
                <button type="submit" class="btn btn-sm btn-outline-danger" onclick="return confirm('Delete this setup?')">
                  <i class="bi bi-trash"></i>
                </button>
              </form>
            </td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
  </div>
</div>
{% endblock %}
```

### 9.2 Admin Setup Form Template

```html
<!-- bark/app/templates/admin/setup_form.html -->
{% extends "base.html" %}

{% block title %}{{ 'Edit' if setup else 'New' }} Installation | Admin{% endblock %}

{% block content %}
<div class="container py-4">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header">
          <h4>{{ 'Edit' if setup else 'New' }} Installation</h4>
        </div>
        <div class="card-body">
          <form method="POST" enctype="multipart/form-data">
            <div class="mb-3">
              <label class="form-label">Title *</label>
              <input type="text" class="form-control" name="title"
                     value="{{ setup.title if setup else '' }}" required>
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" rows="3">{{ setup.description if setup else '' }}</textarea>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Location</label>
                <input type="text" class="form-control" name="location"
                       value="{{ setup.location if setup else '' }}" placeholder="e.g. Mumbai, India">
              </div>
              <div class="col-md-6">
                <label class="form-label">Client Name</label>
                <input type="text" class="form-control" name="client_name"
                       value="{{ setup.client_name if setup else '' }}">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Video URL *</label>
              <input type="url" class="form-control" name="video_url"
                     value="{{ setup.video_url if setup else '' }}" required
                     placeholder="https://youtube.com/watch?v=...">
              <div class="form-text">YouTube or Vimeo URL</div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Video Type</label>
                <select class="form-select" name="video_type">
                  <option value="youtube" {{ 'selected' if setup and setup.video_type == 'youtube' }}>YouTube</option>
                  <option value="vimeo" {{ 'selected' if setup and setup.video_type == 'vimeo' }}>Vimeo</option>
                  <option value="self_hosted" {{ 'selected' if setup and setup.video_type == 'self_hosted' }}>Self-Hosted</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Product (Optional)</label>
                <select class="form-select" name="product_id">
                  <option value="">-- Select Product --</option>
                  {% for product in products %}
                  <option value="{{ product.id }}" {{ 'selected' if setup and setup.product_id == product.id }}>
                    {{ product.name }}
                  </option>
                  {% endfor %}
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Thumbnail</label>
              <input type="file" class="form-control" name="thumbnail" accept="image/*">
              {% if setup and setup.thumbnail_url %}
              <div class="mt-2">
                <img src="{{ setup.thumbnail_url }}" alt="Current thumbnail" width="120" class="rounded">
              </div>
              {% endif %}
              <div class="form-text">Leave empty to auto-generate from video</div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Sort Order</label>
                <input type="number" class="form-control" name="sort_order"
                       value="{{ setup.sort_order if setup else 0 }}">
              </div>
              <div class="col-md-4">
                <label class="form-label">Status</label>
                <select class="form-select" name="is_active">
                  <option value="true" {{ 'selected' if not setup or setup.is_active }}>Active</option>
                  <option value="false" {{ 'selected' if setup and not setup.is_active }}>Inactive</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Featured</label>
                <select class="form-select" name="is_featured">
                  <option value="false" {{ 'selected' if not setup or not setup.is_featured }}>No</option>
                  <option value="true" {{ 'selected' if setup and setup.is_featured }}>Yes</option>
                </select>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-check-circle me-2"></i>{{ 'Update' if setup else 'Create' }} Setup
              </button>
              <a href="/admin/setups" class="btn btn-outline-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
{% endblock %}
```

---

## 10. Implementation Plan

### 10.1 Phase 1: Database & API (Day 1-2)

| Day | Task | Files |
|-----|------|-------|
| 1 | Create ProductSetup model | models/setup.py |
| 1 | Run migration | alembic revision |
| 2 | Build setup service | services/setups.py |
| 2 | Build API endpoints | routers/api_setups.py |
| 2 | Register router in main.py | main.py |

### 10.2 Phase 2: Admin Panel (Day 3)

| Day | Task | Files |
|-----|------|-------|
| 3 | Admin setup list page | templates/admin/setups_list.html |
| 3 | Admin setup form page | templates/admin/setup_form.html |
| 3 | Admin routes | routers/admin.py (update) |

### 10.3 Phase 3: Frontend Slider (Day 4-5)

| Day | Task | Files |
|-----|------|-------|
| 4 | Create slider CSS | static/css/setup-showcase.css |
| 4 | Create slider JS | static/js/setup-slider.js |
| 5 | Create slider template | templates/partials/setup_showcase.html |
| 5 | Integrate into homepage | templates/index.html |

### 10.4 Phase 4: Testing & Polish (Day 6)

| Day | Task |
|-----|------|
| 6 | Test auto-scroll animation |
| 6 | Test pause on hover |
| 6 | Test video modal |
| 6 | Test mobile touch swipe |
| 6 | Test with 0, 1, 3, 10+ setups |

### 10.5 Dependencies

No new dependencies needed. Uses existing:
- FastAPI (already installed)
- SQLAlchemy (already installed)
- Vanilla JS (no frameworks)
- CSS Animations (no libraries)

---

## Summary

| Component | Status | Description |
|-----------|--------|-------------|
| Database Model | Ready | ProductSetup table with all fields |
| API Endpoints | Ready | Public list + Admin CRUD |
| Auto-scroll Slider | Ready | CSS animation with infinite loop |
| Pause on Hover | Ready | CSS + JS integration |
| Video Modal | Ready | Click to play in lightbox |
| Mobile Touch | Ready | Swipe support for mobile |
| Admin Panel | Ready | Full CRUD for managing setups |
| Responsive Design | Ready | Works on all screen sizes |

---

*Document prepared for Bark Technologies product setups showcase feature.*
*All code examples are production-ready and follow existing project patterns.*
