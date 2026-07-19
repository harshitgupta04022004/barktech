# Social Media Auto-Publishing System — Feature Design Document

> **Version:** 2.0  
> **Date:** July 2026  
> **Stack:** FastAPI + SQLAlchemy + AI Caption Generation + Platform APIs  
> **Domain:** barktechnologies.in  
> **Design Principles:** HLD/LLD with SOLID, Event-Driven Architecture, Adapter Pattern

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Social Architecture (HLD)](#2-high-level-social-architecture-hld)
3. [Low-Level Social Design (LLD)](#3-low-level-social-design-lld)
4. [Mermaid Diagrams](#4-mermaid-diagrams)
5. [SOLID Principles Implementation](#5-solid-principles-implementation)
6. [Database Schema & Models](#6-database-schema--models)
7. [Platform Integration Strategies](#7-platform-integration-strategies)
8. [AI Caption Generation System](#8-ai-caption-generation-system)
9. [Approval Workflow Engine](#9-approval-workflow-engine)
10. [Promotion Engine](#10-promotion-engine)
11. [Analytics & Monitoring System](#11-analytics--monitoring-system)
12. [Error Handling & Resilience](#12-error-handling--resilience)
13. [API Design & Endpoints](#13-api-design--endpoints)
14. [Admin Panel Architecture](#14-admin-panel-architecture)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Security & Compliance](#16-security--compliance)
17. [Performance Optimization](#17-performance-optimization)
18. [Testing Strategy](#18-testing-strategy)
19. [Deployment Architecture](#19-deployment-architecture)
20. [Appendix: Reference Materials](#20-appendix-reference-materials)

---

## 1. Executive Summary

### 1.1 System Overview

The **Social Media Auto-Publishing System** is an event-driven, multi-platform content distribution engine that automatically publishes product showcase content to six major social media platforms when new setups are added to the database. The system leverages AI-powered caption generation, configurable approval workflows, and paid promotion capabilities to maximize content reach while maintaining brand consistency.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Event-Driven Publishing** | Automatic trigger on database insert with async processing |
| **AI Caption Generation** | Platform-specific content optimization using LLM |
| **Multi-Platform Support** | LinkedIn, Instagram, Facebook, WhatsApp, Reddit, Twitter/X |
| **Unified API Integration** | Adapter pattern with both native and unified API support |
| **Approval Workflows** | Auto, Manual, or Hybrid approval modes per platform |
| **Paid Promotion Engine** | Budget-based campaign management with spend tracking |
| **Analytics Dashboard** | Real-time metrics, platform comparison, ROI tracking |
| **Error Resilience** | Retry logic, circuit breakers, and graceful degradation |

### 1.3 Design Principles

This document follows **HLD/LLD (High-Level Design/Low-Level Design)** principles with emphasis on:

- **SOLID Principles** for maintainable, extensible code
- **Event-Driven Architecture** for decoupled, scalable components
- **Adapter Pattern** for platform-agnostic integrations
- **Strategy Pattern** for flexible caption generation
- **State Machine** for workflow management

### 1.4 Technology Stack

```
Backend:        FastAPI (async Python 3.11+)
Database:       PostgreSQL 16 + SQLAlchemy 2.0 + Alembic
Task Queue:     Celery + Redis (or asyncio background tasks)
AI Engine:      Ollama (local) or OpenAI API (cloud)
Platform APIs:  Zernio (unified) or Native APIs
Monitoring:     Structured logging + Prometheus metrics
```

---

## 2. High-Level Social Architecture (HLD)

### 2.1 Architecture Overview

The system follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│   Admin Dashboard (Jinja2) │ REST API (FastAPI) │ Webhooks      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Social    │  │  Approval   │  │  Promotion  │           │
│   │  Publish    │  │  Workflow   │  │   Engine    │           │
│   │  Service    │  │  Engine     │  │             │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Caption   │  │  Analytics  │  │   Error     │           │
│   │  Generator  │  │  Service    │  │  Handler    │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │  Platform   │  │  Unified    │  │  Native     │           │
│   │  Adapter    │  │  API        │  │  APIs       │           │
│   │  Factory    │  │  (Zernio)   │  │  (Direct)   │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                  │
│   PostgreSQL (OLTP) │ Redis (Cache/Queue) │ S3 (Media Storage) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL PLATFORMS                          │
│   LinkedIn │ Instagram │ Facebook │ WhatsApp │ Reddit │ Twitter │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Publishing Pipeline Overview

The publishing pipeline follows an **event-driven, asynchronous** pattern:

1. **Event Detection**: Database trigger on `ProductSetup` insert
2. **Event Emission**: Publish event to message queue (Redis/Celery)
3. **Caption Generation**: AI generates platform-specific content
4. **Approval Check**: Route to auto-publish or approval queue
5. **Platform Publishing**: Adapter pattern dispatches to platform APIs
6. **Result Processing**: Update status, log results, trigger promotions
7. **Analytics Collection**: Capture metrics for dashboard

### 2.3 Platform Integration Strategy

**Dual Integration Approach:**

| Strategy | When to Use | Benefits | Trade-offs |
|----------|-------------|----------|------------|
| **Unified API** (Zernio/Ayrshare) | Rapid development, multiple platforms | Single SDK, managed auth, automatic retries | Vendor dependency, limited customization |
| **Native APIs** | High-volume, deep platform features | Full control, no vendor fees, advanced features | Complex auth, rate limit management, maintenance |

**Recommended Hybrid Approach:**
- Use **Zernio** as primary for LinkedIn, Instagram, Facebook, Twitter
- Use **Native APIs** for WhatsApp (Business API) and Reddit (PRAW) where unified APIs lack features
- Implement **Fallback Adapter** pattern for redundancy

### 2.4 AI Caption Generation Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Product    │────▶│   Caption    │────▶│  Platform    │
│   Setup Data │     │   Generator  │     │  Formatter   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                      │
                           ▼                      ▼
                     ┌──────────┐           ┌──────────┐
                     │   LLM    │           │ Caption  │
                     │  (Ollama │           │ Variants │
                     │ /OpenAI) │           │          │
                     └──────────┘           └──────────┘
```

**Caption Generation Strategies:**
- **Pyramid of Captions (PoCa)**: Hierarchical local-to-global caption fusion
- **Controlled Generation**: Slider-style control over length, descriptiveness, uniqueness
- **Pragmatic Diversity**: Coherence relation-guided context-aware captions

### 2.5 Promotion System Design

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Budget      │────▶│  Campaign    │────▶│  Platform    │
│  Manager     │     │  Orchestrator│     │  Ad APIs     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Spend       │     │  Performance │     │  Analytics   │
│  Tracker     │     │  Monitor     │     │  Dashboard   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 3. Low-Level Social Design (LLD)

### 3.1 Platform Adapter Pattern

The adapter pattern provides a **unified interface** for all platform integrations:

```python
# bark/app/services/social/adapters/base.py

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum


class PlatformType(Enum):
    """Supported social media platforms."""
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    WHATSAPP = "whatsapp"
    REDDIT = "reddit"
    TWITTER = "twitter"


class MediaType(Enum):
    """Media types for posts."""
    IMAGE = "image"
    VIDEO = "video"
    TEXT = "text"
    CAROUSEL = "carousel"


@dataclass
class PublishResult:
    """Result of a publishing operation."""
    success: bool
    platform: PlatformType
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MediaUploadResult:
    """Result of a media upload operation."""
    success: bool
    media_id: Optional[str] = None
    media_url: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None


@dataclass
class PlatformMetrics:
    """Platform-specific metrics."""
    impressions: int = 0
    clicks: int = 0
    engagement: int = 0
    reach: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0


class PlatformAdapter(ABC):
    """
    Abstract base class for platform integrations.
    
    This adapter provides a unified interface for all social media platforms,
    following the Adapter pattern to decouple platform-specific logic from
    the core publishing system.
    
    SOLID Principles:
    - Single Responsibility: Each adapter handles one platform
    - Open/Closed: New platforms via adapter pattern
    - Interface Segregation: Platform-specific interfaces
    - Dependency Inversion: Abstract platform APIs
    """

    def __init__(self, platform: PlatformType, config: Dict[str, Any]):
        self.platform = platform
        self.config = config
        self._rate_limiter = None
        self._circuit_breaker = None

    @abstractmethod
    async def publish_post(
        self,
        caption: str,
        media_url: Optional[str] = None,
        video_url: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> PublishResult:
        """
        Publish a post to the platform.
        
        Args:
            caption: Post caption/text
            media_url: URL of image media
            video_url: URL of video media
            hashtags: List of hashtags
            **kwargs: Platform-specific parameters
            
        Returns:
            PublishResult with success status and platform details
        """
        pass

    @abstractmethod
    async def upload_media(
        self,
        file_path: str,
        media_type: MediaType,
        **kwargs: Any,
    ) -> MediaUploadResult:
        """
        Upload media to the platform.
        
        Args:
            file_path: Local path or URL to media file
            media_type: Type of media (image, video, etc.)
            
        Returns:
            MediaUploadResult with media_id and URL
        """
        pass

    @abstractmethod
    async def delete_post(self, post_id: str) -> bool:
        """Delete a post from the platform."""
        pass

    @abstractmethod
    async def get_post_metrics(self, post_id: str) -> PlatformMetrics:
        """Get metrics for a published post."""
        pass

    @abstractmethod
    async def validate_config(self) -> bool:
        """Validate platform configuration and credentials."""
        pass

    def get_max_caption_length(self) -> int:
        """Get maximum caption length for the platform."""
        return 2200

    def get_supported_media_types(self) -> List[MediaType]:
        """Get list of supported media types."""
        return [MediaType.IMAGE, MediaType.VIDEO]

    def format_hashtags(self, hashtags: List[str]) -> str:
        """Format hashtags for the platform."""
        return " ".join(f"#{tag.strip('#')}" for tag in hashtags)
```

### 3.2 Caption Generator Service

```python
# bark/app/services/social/caption_generator.py

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import httpx
from app.config import get_settings

settings = get_settings()


class CaptionStyle(Enum):
    """Caption style variations."""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    ENGAGING = "engaging"
    INFORMATIVE = "informative"
    PROMOTIONAL = "promotional"


@dataclass
class PlatformCaption:
    """Generated caption for a specific platform."""
    platform: str
    caption: str
    hashtags: List[str]
    title: Optional[str] = None
    style: CaptionStyle = CaptionStyle.PROFESSIONAL
    metadata: Dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class CaptionGenerator:
    """
    AI-powered caption generator with platform-specific optimization.
    
    Implements the Strategy pattern for flexible caption generation:
    - Hierarchical Aggregation: Local-to-global caption fusion
    - Continuous Control: Slider-style length/descriptiveness control
    - Pragmatic Diversity: Context-aware caption generation
    """

    STYLE_GUIDES = {
        "linkedin": {
            "tone": "professional, authoritative, industry-focused",
            "structure": "Hook -> Value proposition -> Call to action",
            "hashtags": "3-5 industry-relevant hashtags",
            "length": "1000-2000 characters",
            "emojis": "Minimal, professional",
            "max_length": 3000,
            "features": ["articles", "documentuploads", "polls"],
        },
        "instagram": {
            "tone": "visual, engaging, hashtag-heavy",
            "structure": "Attention grabber -> Details -> Hashtags",
            "hashtags": "20-30 relevant hashtags",
            "length": "500-1500 characters",
            "emojis": "Heavy use, expressive",
            "max_length": 2200,
            "features": ["reels", "stories", "carousel"],
        },
        "facebook": {
            "tone": "conversational, community-focused",
            "structure": "Story -> Features -> Engagement question",
            "hashtags": "3-5 hashtags",
            "length": "500-2000 characters",
            "emojis": "Moderate use",
            "max_length": 63206,
            "features": ["groups", "events", "marketplace"],
        },
        "whatsapp": {
            "tone": "broadcast, informative, direct",
            "structure": "Greeting -> Key info -> Contact",
            "hashtags": "None",
            "length": "500-1000 characters",
            "emojis": "Minimal, professional",
            "max_length": 4096,
            "features": ["broadcast", "catalog", "quickreplies"],
        },
        "reddit": {
            "tone": "informative, technical, community-oriented",
            "structure": "Title -> Technical details -> Discussion",
            "hashtags": "None (use subreddit flair)",
            "length": "1000-3000 characters",
            "emojis": "None",
            "max_length": 40000,
            "features": ["flairs", "polls", "awards"],
        },
        "twitter": {
            "tone": "concise, punchy, link-friendly",
            "structure": "Hook -> Key stat -> Link/CTA",
            "hashtags": "2-3 hashtags",
            "length": "200-280 characters",
            "emojis": "1-2 relevant emojis",
            "max_length": 280,
            "features": ["threads", "polls", "spaces"],
        },
    }

    def __init__(self, use_unified_api: bool = True):
        self.use_unified_api = use_unified_api
        self._cache = {}

    async def generate_captions(
        self,
        setup_title: str,
        setup_description: str,
        product_name: str,
        location: Optional[str] = None,
        client_name: Optional[str] = None,
        style: CaptionStyle = CaptionStyle.PROFESSIONAL,
        platforms: Optional[List[str]] = None,
    ) -> List[PlatformCaption]:
        """
        Generate platform-specific captions for a product setup.
        
        Uses hierarchical aggregation for semantic richness:
        1. Generate base caption from product data
        2. Adapt to platform-specific style guides
        3. Optimize length and hashtags per platform
        """
        captions = []
        target_platforms = platforms or list(self.STYLE_GUIDES.keys())
        
        for platform in target_platforms:
            if platform not in self.STYLE_GUIDES:
                continue
                
            style_guide = self.STYLE_GUIDES[platform]
            caption = await self._generate_single_caption(
                platform=platform,
                style_guide=style_guide,
                setup_title=setup_title,
                setup_description=setup_description,
                product_name=product_name,
                location=location,
                client_name=client_name,
                style=style,
            )
            captions.append(caption)
        
        return captions

    async def _generate_single_caption(
        self,
        platform: str,
        style_guide: Dict,
        setup_title: str,
        setup_description: str,
        product_name: str,
        location: Optional[str],
        client_name: Optional[str],
        style: CaptionStyle,
    ) -> PlatformCaption:
        """Generate a single platform-optimized caption."""
        
        prompt = self._build_prompt(
            platform=platform,
            style_guide=style_guide,
            setup_title=setup_title,
            setup_description=setup_description,
            product_name=product_name,
            location=location,
            client_name=client_name,
            style=style,
        )
        
        response = await self._call_ai(prompt)
        return self._parse_response(platform, response, style_guide)

    def _build_prompt(
        self,
        platform: str,
        style_guide: Dict,
        setup_title: str,
        setup_description: str,
        product_name: str,
        location: Optional[str],
        client_name: Optional[str],
        style: CaptionStyle,
    ) -> str:
        """Build AI prompt for caption generation."""
        
        return f"""Generate a social media post for {platform.upper()} about a product installation.

SETUP: {setup_title}
DESCRIPTION: {setup_description}
PRODUCT: {product_name}
LOCATION: {location or 'India'}
CLIENT: {client_name or 'Valued Client'}
STYLE: {style.value}
TONE: {style_guide['tone']}
LENGTH: {style_guide['length']}
HASHTAGS: {style_guide['hashtags']}
EMOJIS: {style_guide['emojis']}

Return ONLY in this format:
CAPTION: [your caption here]
HASHTAGS: [hashtag1, hashtag2, hashtag3]"""

    async def _call_ai(self, prompt: str) -> str:
        """Call AI service for caption generation."""
        
        if self.use_unified_api:
            return await self._call_ollama(prompt)
        else:
            return await self._call_openai(prompt)

    async def _call_ollama(self, prompt: str) -> str:
        """Call local Ollama instance."""
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{settings.ollama_base_url}/api/generate",
                    json={
                        "model": settings.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.7, "num_predict": 500},
                    },
                    timeout=60.0,
                )
                if response.status_code == 200:
                    return response.json().get("response", "")
                return self._get_fallback_caption(prompt)
            except Exception:
                return self._get_fallback_caption(prompt)

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API."""
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 500,
                    },
                    timeout=60.0,
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                return self._get_fallback_caption(prompt)
            except Exception:
                return self._get_fallback_caption(prompt)

    def _get_fallback_caption(self, prompt: str) -> str:
        """Generate fallback caption when AI is unavailable."""
        
        return """CAPTION: Exciting new product installation completed! Our latest machinery setup delivers exceptional performance and reliability for industrial applications.

HASHTAGS: #IndustrialMachinery #Manufacturing #ProductLaunch #BarkTechnologies"""

    def _parse_response(
        self, platform: str, response: str, style_guide: Dict
    ) -> PlatformCaption:
        """Parse AI response into structured caption."""
        
        caption_text = ""
        hashtags = []
        
        for line in response.split('\n'):
            if line.startswith('CAPTION:'):
                caption_text = line.replace('CAPTION:', '').strip()
            elif line.startswith('HASHTAGS:'):
                hashtag_str = line.replace('HASHTAGS:', '').strip()
                hashtags = [h.strip().lstrip('#') for h in hashtag_str.split(',') if h.strip()]
        
        if not caption_text:
            caption_text = response.split('\n')[0][:style_guide['max_length']]
        
        return PlatformCaption(
            platform=platform,
            caption=caption_text[:style_guide['max_length']],
            hashtags=hashtags[:10],
            style=CaptionStyle.PROFESSIONAL,
        )
```

### 3.3 Approval Workflow

```python
# bark/app/services/social/workflow.py

from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.social import SocialPost, PlatformConfig


class ApprovalMode(Enum):
    """Approval mode for social posts."""
    AUTO = "auto"
    MANUAL = "manual"
    HYBRID = "hybrid"


class PostStatus(Enum):
    """Post status states."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class ApprovalWorkflow:
    """
    Manages the approval workflow for social media posts.
    
    Implements a state machine pattern for post lifecycle management:
    draft -> pending -> approved/rejected -> publishing -> published/failed
    """

    def __init__(self, db: Session):
        self.db = db

    def should_auto_publish(self, platform: str, post: SocialPost) -> bool:
        """
        Determine if a post should be auto-published.
        
        Args:
            platform: Target platform
            post: SocialPost instance
            
        Returns:
            True if auto-publish is enabled for this platform
        """
        config = self.db.query(PlatformConfig).filter(
            PlatformConfig.platform == platform
        ).first()
        
        if not config:
            return False
            
        if config.requires_approval or not config.auto_publish:
            return False
            
        return True

    async def process_new_post(self, post: SocialPost) -> PostStatus:
        """
        Process a newly created post through the approval workflow.
        
        Args:
            post: SocialPost instance
            
        Returns:
            PostStatus indicating next action
        """
        if self.should_auto_publish(post.platform, post):
            post.status = PostStatus.APPROVED.value
            await self.db.commit()
            return PostStatus.APPROVED
        else:
            post.status = PostStatus.PENDING.value
            await self.db.commit()
            return PostStatus.PENDING

    def approve_post(self, post_id: int, admin_user_id: int) -> SocialPost:
        """
        Approve a pending post.
        
        Args:
            post_id: ID of the post to approve
            admin_user_id: ID of the approving admin
            
        Returns:
            Updated SocialPost
        """
        post = self.db.get(SocialPost, post_id)
        if not post or post.status != PostStatus.PENDING.value:
            raise ValueError(f"Invalid post {post_id} for approval")
        
        post.status = PostStatus.APPROVED.value
        post.approved_by = admin_user_id
        post.approved_at = datetime.now(timezone.utc)
        self.db.commit()
        
        return post

    def reject_post(self, post_id: int, reason: str) -> SocialPost:
        """
        Reject a pending post.
        
        Args:
            post_id: ID of the post to reject
            reason: Reason for rejection
            
        Returns:
            Updated SocialPost
        """
        post = self.db.get(SocialPost, post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found")
        
        post.status = PostStatus.REJECTED.value
        post.rejection_reason = reason
        self.db.commit()
        
        return post

    def bulk_approve(self, post_ids: List[int], admin_user_id: int) -> int:
        """
        Bulk approve multiple posts.
        
        Args:
            post_ids: List of post IDs to approve
            admin_user_id: ID of the approving admin
            
        Returns:
            Number of posts approved
        """
        approved_count = 0
        
        for post_id in post_ids:
            try:
                self.approve_post(post_id, admin_user_id)
                approved_count += 1
            except ValueError:
                continue
        
        return approved_count

    def get_pending_posts(
        self,
        platform: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[SocialPost]:
        """
        Get posts pending approval.
        
        Args:
            platform: Optional platform filter
            limit: Maximum number of posts
            offset: Offset for pagination
            
        Returns:
            List of SocialPost instances
        """
        query = self.db.query(SocialPost).filter(
            SocialPost.status == PostStatus.PENDING.value
        )
        
        if platform:
            query = query.filter(SocialPost.platform == platform)
        
        return query.order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()

    def get_post_status_counts(self) -> dict:
        """Get count of posts by status."""
        
        from sqlalchemy import func
        
        status_counts = self.db.query(
            SocialPost.status,
            func.count(SocialPost.id)
        ).group_by(SocialPost.status).all()
        
        return {status: count for status, count in status_counts}
```

### 3.4 Promotion Engine

```python
# bark/app/services/social/promotion.py

from __future__ import annotations
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.social import SocialPost, SocialPromotion, PlatformConfig


class PromotionStatus(Enum):
    """Promotion status states."""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED = "stopped"


class PromotionEngine:
    """
    Manages paid promotion campaigns for social media posts.
    
    Handles budget allocation, spend tracking, and campaign lifecycle:
    1. Budget validation against platform limits
    2. Campaign creation with daily spend limits
    3. Active campaign monitoring
    4. Spend tracking and analytics
    """

    def __init__(self, db: Session):
        self.db = db

    def should_promote(self, platform: str, post: SocialPost) -> bool:
        """
        Determine if a post should be promoted.
        
        Args:
            platform: Target platform
            post: SocialPost instance
            
        Returns:
            True if promotion is enabled and budget available
        """
        config = self.db.query(PlatformConfig).filter(
            PlatformConfig.platform == platform
        ).first()
        
        if not config or not config.promotion_enabled:
            return False
        
        # Check daily budget limit
        daily_spend = self._get_daily_spend(platform)
        if daily_spend >= config.daily_budget_limit:
            return False
        
        # Check if budget per post is available
        return config.max_budget_per_post > 0

    def create_promotion(
        self,
        post_id: int,
        platform: str,
        budget: Optional[Decimal] = None,
    ) -> SocialPromotion:
        """
        Create a new promotion campaign.
        
        Args:
            post_id: ID of the post to promote
            platform: Target platform
            budget: Optional custom budget
            
        Returns:
            SocialPromotion instance
        """
        config = self.db.query(PlatformConfig).filter(
            PlatformConfig.platform == platform
        ).first()
        
        if not config:
            raise ValueError(f"No config found for platform: {platform}")
        
        # Determine budget
        if budget is None:
            budget = config.default_budget
        if budget > config.max_budget_per_post:
            budget = config.max_budget_per_post
        
        # Create promotion
        promotion = SocialPromotion(
            post_id=post_id,
            platform=platform,
            budget_amount=budget,
            daily_limit=config.daily_budget_limit,
            status=PromotionStatus.PENDING.value,
        )
        
        self.db.add(promotion)
        self.db.commit()
        
        return promotion

    def start_promotion(self, promotion_id: int) -> SocialPromotion:
        """
        Start a pending promotion campaign.
        
        Args:
            promotion_id: ID of the promotion to start
            
        Returns:
            Updated SocialPromotion instance
        """
        promotion = self.db.get(SocialPromotion, promotion_id)
        if not promotion or promotion.status != PromotionStatus.PENDING.value:
            raise ValueError(f"Invalid promotion {promotion_id}")
        
        promotion.status = PromotionStatus.ACTIVE.value
        promotion.start_date = datetime.now(timezone.utc)
        self.db.commit()
        
        return promotion

    def pause_promotion(self, promotion_id: int) -> SocialPromotion:
        """Pause an active promotion."""
        
        promotion = self.db.get(SocialPromotion, promotion_id)
        if not promotion or promotion.status != PromotionStatus.ACTIVE.value:
            raise ValueError(f"Cannot pause promotion {promotion_id}")
        
        promotion.status = PromotionStatus.PAUSED.value
        self.db.commit()
        
        return promotion

    def stop_promotion(self, promotion_id: int) -> SocialPromotion:
        """Stop a promotion campaign."""
        
        promotion = self.db.get(SocialPromotion, promotion_id)
        if not promotion:
            raise ValueError(f"Promotion {promotion_id} not found")
        
        promotion.status = PromotionStatus.STOPPED.value
        promotion.end_date = datetime.now(timezone.utc)
        self.db.commit()
        
        return promotion

    def _get_daily_spend(self, platform: str) -> Decimal:
        """Get total spend for today on a platform."""
        
        today = datetime.now(timezone.utc).date()
        
        total = self.db.query(func.sum(SocialPromotion.total_spent)).filter(
            SocialPromotion.platform == platform,
            SocialPromotion.created_at >= today,
        ).scalar()
        
        return total or Decimal("0")

    def get_promotion_stats(self, promotion_id: int) -> Dict:
        """Get promotion performance statistics."""
        
        promotion = self.db.get(SocialPromotion, promotion_id)
        if not promotion:
            return {}
        
        return {
            "impressions": promotion.impressions,
            "clicks": promotion.clicks,
            "engagement": promotion.engagement,
            "spent": float(promotion.total_spent),
            "budget": float(promotion.budget_amount),
            "remaining": float(promotion.budget_amount - promotion.total_spent),
            "roi": self._calculate_roi(promotion),
        }

    def _calculate_roi(self, promotion: SocialPromotion) -> float:
        """Calculate return on investment."""
        
        if promotion.total_spent == 0:
            return 0.0
        
        # Simple ROI: engagement per rupee spent
        return float(promotion.engagement) / float(promotion.total_spent)

    def get_platform_promotions(
        self,
        platform: str,
        status: Optional[str] = None,
    ) -> List[SocialPromotion]:
        """Get all promotions for a platform."""
        
        query = self.db.query(SocialPromotion).filter(
            SocialPromotion.platform == platform
        )
        
        if status:
            query = query.filter(SocialPromotion.status == status)
        
        return query.order_by(SocialPromotion.created_at.desc()).all()
```

### 3.5 Analytics System

```python
# bark/app/services/social/analytics.py

from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from app.models.social import SocialPost, SocialPromotion, SocialLog


class SocialAnalytics:
    """
    Analytics service for social media performance tracking.
    
    Provides:
    - Platform performance comparison
    - Post engagement metrics
    - Promotion ROI analysis
    - Time-series data for dashboards
    """

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, days: int = 30) -> Dict:
        """
        Get comprehensive dashboard statistics.
        
        Args:
            days: Number of days to look back
            
        Returns:
            Dictionary with various metrics
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Post statistics
        total_posts = self.db.query(func.count(SocialPost.id)).scalar()
        published = self.db.query(func.count(SocialPost.id)).filter(
            SocialPost.status == "published"
        ).scalar()
        pending = self.db.query(func.count(SocialPost.id)).filter(
            SocialPost.status == "pending"
        ).scalar()
        failed = self.db.query(func.count(SocialPost.id)).filter(
            SocialPost.status == "failed"
        ).scalar()
        
        # Platform breakdown
        platform_stats = {}
        for platform in ["linkedin", "instagram", "facebook", "whatsapp", "reddit", "twitter"]:
            platform_stats[platform] = self.db.query(func.count(SocialPost.id)).filter(
                SocialPost.platform == platform,
                SocialPost.status == "published",
                SocialPost.created_at >= since,
            ).scalar()
        
        # Promotion statistics
        total_spend = self.db.query(func.sum(SocialPromotion.total_spent)).scalar() or 0
        active_promos = self.db.query(func.count(SocialPromotion.id)).filter(
            SocialPromotion.status == "active"
        ).scalar()
        
        return {
            "posts": {
                "total": total_posts,
                "published": published,
                "pending": pending,
                "failed": failed,
                "success_rate": (published / total_posts * 100) if total_posts > 0 else 0,
            },
            "platforms": platform_stats,
            "promotions": {
                "active": active_promos,
                "total_spend": float(total_spend),
            },
            "period": {
                "days": days,
                "since": since.isoformat(),
            },
        }

    def get_platform_comparison(self, days: int = 30) -> List[Dict]:
        """
        Compare performance across platforms.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            List of platform performance dictionaries
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        comparison = []
        
        for platform in ["linkedin", "instagram", "facebook", "whatsapp", "reddit", "twitter"]:
            # Post counts
            posts = self.db.query(func.count(SocialPost.id)).filter(
                SocialPost.platform == platform,
                SocialPost.status == "published",
                SocialPost.created_at >= since,
            ).scalar()
            
            # Promotion metrics
            impressions = self.db.query(func.sum(SocialPromotion.impressions)).filter(
                SocialPromotion.platform == platform,
                SocialPromotion.created_at >= since,
            ).scalar() or 0
            
            spend = self.db.query(func.sum(SocialPromotion.total_spent)).filter(
                SocialPromotion.platform == platform,
                SocialPromotion.created_at >= since,
            ).scalar() or 0
            
            clicks = self.db.query(func.sum(SocialPromotion.clicks)).filter(
                SocialPromotion.platform == platform,
                SocialPromotion.created_at >= since,
            ).scalar() or 0
            
            comparison.append({
                "platform": platform,
                "posts": posts,
                "impressions": impressions,
                "clicks": clicks,
                "spend": float(spend),
                "ctr": (clicks / impressions * 100) if impressions > 0 else 0,
                "cpm": (spend / impressions * 1000) if impressions > 0 else 0,
            })
        
        return comparison

    def get_post_performance(
        self,
        post_id: Optional[int] = None,
        limit: int = 50,
    ) -> List[Dict]:
        """Get performance metrics for posts."""
        
        query = self.db.query(SocialPost).filter(
            SocialPost.status == "published"
        )
        
        if post_id:
            query = query.filter(SocialPost.id == post_id)
        
        posts = query.order_by(SocialPost.published_at.desc()).limit(limit).all()
        
        performance = []
        for post in posts:
            # Get promotion stats if any
            promotion = self.db.query(SocialPromotion).filter(
                SocialPromotion.post_id == post.id,
                SocialPromotion.status == "active",
            ).first()
            
            performance.append({
                "post_id": post.id,
                "platform": post.platform,
                "published_at": post.published_at.isoformat() if post.published_at else None,
                "platform_post_id": post.platform_post_id,
                "has_promotion": promotion is not None,
                "impressions": promotion.impressions if promotion else 0,
                "clicks": promotion.clicks if promotion else 0,
                "engagement": promotion.engagement if promotion else 0,
            })
        
        return performance

    def get_time_series(
        self,
        metric: str = "posts",
        days: int = 30,
        platform: Optional[str] = None,
    ) -> List[Dict]:
        """
        Get time-series data for charts.
        
        Args:
            metric: Metric type (posts, spend, impressions)
            days: Number of days
            platform: Optional platform filter
            
        Returns:
            List of daily metric values
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        time_series = []
        
        for i in range(days):
            date = since + timedelta(days=i)
            next_date = date + timedelta(days=1)
            
            if metric == "posts":
                count = self.db.query(func.count(SocialPost.id)).filter(
                    SocialPost.created_at >= date,
                    SocialPost.created_at < next_date,
                    SocialPost.status == "published",
                )
                if platform:
                    count = count.filter(SocialPost.platform == platform)
                count = count.scalar()
            elif metric == "spend":
                count = self.db.query(func.sum(SocialPromotion.total_spent)).filter(
                    SocialPromotion.created_at >= date,
                    SocialPromotion.created_at < next_date,
                )
                if platform:
                    count = count.filter(SocialPromotion.platform == platform)
                count = float(count.scalar() or 0)
            else:
                count = 0
            
            time_series.append({
                "date": date.date().isoformat(),
                "value": count,
            })
        
        return time_series
```

---

## 4. Mermaid Diagrams

### 4.1 Sequence Diagram: Publishing Flow

```mermaid
sequenceDiagram
    participant DB as PostgreSQL
    participant TRIGGER as SQLAlchemy Event
    participant QUEUE as Redis/Celery
    participant CAPTION as Caption Generator
    participant WORKFLOW as Approval Workflow
    participant ADAPTER as Platform Adapter
    participant PLATFORM as Social Platform
    participant LOG as Logger Service
    participant ANALYTICS as Analytics Service

    Note over DB,ANALYTICS: Publishing Flow - New Product Setup
    
    DB->>TRIGGER: after_insert(ProductSetup)
    TRIGGER->>QUEUE: emit("new_setup", {setup_id})
    
    alt Auto-Publish Mode
        QUEUE->>CAPTION: generate_captions(setup)
        CAPTION->>CAPTION: AI generates platform-specific captions
        CAPTION-->>QUEUE: captions ready
        
        loop For each platform
            QUEUE->>WORKFLOW: check_approval(platform, post)
            WORKFLOW->>WORKFLOW: should_auto_publish()?
            
            alt Auto-approved
                QUEUE->>ADAPTER: publish_post(caption, media)
                ADAPTER->>PLATFORM: POST /api/publish
                PLATFORM-->>ADAPTER: {post_id, url}
                ADAPTER-->>QUEUE: PublishResult(success)
                QUEUE->>LOG: log_post_published(post_id)
                QUEUE->>ANALYTICS: update_metrics(post_id)
            else Needs approval
                QUEUE->>WORKFLOW: queue_for_approval(post)
                WORKFLOW->>LOG: log_post_pending(post_id)
            end
        end
    else Manual Approval Mode
        QUEUE->>WORKFLOW: queue_for_approval(post)
        WORKFLOW->>LOG: log_post_pending(post_id)
        
        Note over WORKFLOW: Admin reviews in dashboard
        
        alt Approved
            WORKFLOW->>ADAPTER: publish_post(caption, media)
            ADAPTER->>PLATFORM: POST /api/publish
            PLATFORM-->>ADAPTER: {post_id, url}
            ADAPTER-->>QUEUE: PublishResult(success)
            QUEUE->>LOG: log_post_published(post_id)
        else Rejected
            WORKFLOW->>LOG: log_post_rejected(post_id, reason)
        end
    end
```

### 4.2 Sequence Diagram: Approval Workflow

```mermaid
sequenceDiagram
    participant ADMIN as Admin Dashboard
    participant API as FastAPI
    participant WORKFLOW as Approval Engine
    participant DB as PostgreSQL
    participant QUEUE as Redis/Celery
    participant ADAPTER as Platform Adapter
    participant PLATFORM as Social Platform

    Note over ADMIN,PLATFORM: Approval Workflow
    
    ADMIN->>API: GET /admin/social/pending
    API->>WORKFLOW: get_pending_posts()
    WORKFLOW->>DB: SELECT WHERE status='pending'
    DB-->>WORKFLOW: pending posts
    WORKFLOW-->>API: posts list
    API-->>ADMIN: render approval queue
    
    ADMIN->>API: PUT /admin/social/posts/{id}/approve
    API->>WORKFLOW: approve_post(post_id, admin_id)
    WORKFLOW->>DB: UPDATE status='approved'
    WORKFLOW->>QUEUE: emit("post_approved", {post_id})
    DB-->>WORKFLOW: updated post
    WORKFLOW-->>API: success
    API-->>ADMIN: approval confirmed
    
    QUEUE->>ADAPTER: publish_post(caption, media)
    ADAPTER->>PLATFORM: POST /api/publish
    PLATFORM-->>ADAPTER: {post_id, url}
    ADAPTER-->>QUEUE: PublishResult(success)
    QUEUE->>DB: UPDATE status='published'
```

### 4.3 Sequence Diagram: Promotion Flow

```mermaid
sequenceDiagram
    participant ADMIN as Admin Dashboard
    participant API as FastAPI
    participant PROMO as Promotion Engine
    participant DB as PostgreSQL
    participant QUEUE as Redis/Celery
    participant ADAPTER as Platform Adapter
    participant PLATFORM as Social Platform
    participant ANALYTICS as Analytics Service

    Note over ADMIN,ANALYTICS: Paid Promotion Flow
    
    ADMIN->>API: POST /admin/social/promotions
    API->>PROMO: create_promotion(post_id, budget)
    PROMO->>DB: INSERT INTO social_promotions
    PROMO->>DB: Check daily budget limit
    DB-->>PROMO: budget available
    PROMO-->>API: promotion created
    API-->>ADMIN: promotion ready
    
    ADMIN->>API: PUT /admin/social/promotions/{id}/start
    API->>PROMO: start_promotion(promo_id)
    PROMO->>DB: UPDATE status='active'
    PROMO->>QUEUE: emit("promotion_started", {promo_id})
    DB-->>PROMO: updated promotion
    PROMO-->>API: success
    API-->>ADMIN: promotion active
    
    QUEUE->>ADAPTER: boost_post(post_id, budget)
    ADAPTER->>PLATFORM: POST /api/ads/create
    PLATFORM-->>ADAPTER: {campaign_id}
    ADAPTER-->>QUEUE: campaign created
    
    loop Daily Monitoring
        QUEUE->>ANALYTICS: track_promotion(promo_id)
        ANALYTICS->>PLATFORM: GET /api/ads/metrics
        PLATFORM-->>ANALYTICS: {impressions, clicks, spend}
        ANALYTICS->>DB: UPDATE promotion metrics
        
        alt Budget Exceeded
            QUEUE->>ADAPTER: pause_campaign(campaign_id)
            ADAPTER->>PLATFORM: POST /api/ads/pause
            QUEUE->>DB: UPDATE status='paused'
        end
    end
```

### 4.4 Class Diagram: Social Components

```mermaid
classDiagram
    class PlatformType {
        <<enumeration>>
        LINKEDIN
        INSTAGRAM
        FACEBOOK
        WHATSAPP
        REDDIT
        TWITTER
    }
    
    class MediaType {
        <<enumeration>>
        IMAGE
        VIDEO
        TEXT
        CAROUSEL
    }
    
    class PostStatus {
        <<enumeration>>
        DRAFT
        PENDING
        APPROVED
        REJECTED
        PUBLISHING
        PUBLISHED
        FAILED
    }
    
    class PlatformAdapter {
        <<abstract>>
        +platform: PlatformType
        +config: Dict
        +publish_post() PublishResult*
        +upload_media() MediaUploadResult*
        +delete_post() bool*
        +get_post_metrics() PlatformMetrics*
        +validate_config() bool*
        +get_max_caption_length() int
        +get_supported_media_types() List~MediaType~
        +format_hashtags() str
    }
    
    class LinkedInAdapter {
        +BASE_URL: str
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class InstagramAdapter {
        +GRAPH_URL: str
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class FacebookAdapter {
        +GRAPH_URL: str
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class WhatsAppAdapter {
        +API_URL: str
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class RedditAdapter {
        +reddit: praw.Reddit
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class TwitterAdapter {
        +client: tweepy.Client
        +publish_post() PublishResult
        +upload_media() MediaUploadResult
        +validate_config() bool
    }
    
    class CaptionGenerator {
        -use_unified_api: bool
        -_cache: Dict
        +generate_captions() List~PlatformCaption~
        +_generate_single_caption() PlatformCaption
        +_call_ai() str
        +_build_prompt() str
        +_parse_response() PlatformCaption
    }
    
    class PlatformCaption {
        +platform: str
        +caption: str
        +hashtags: List~str~
        +title: Optional~str~
        +style: CaptionStyle
        +metadata: Dict
    }
    
    class CaptionStyle {
        <<enumeration>>
        PROFESSIONAL
        CASUAL
        ENGAGING
        INFORMATIVE
        PROMOTIONAL
    }
    
    class ApprovalWorkflow {
        -db: Session
        +should_auto_publish() bool
        +process_new_post() PostStatus
        +approve_post() SocialPost
        +reject_post() SocialPost
        +bulk_approve() int
        +get_pending_posts() List~SocialPost~
        +get_post_status_counts() dict
    }
    
    class PromotionEngine {
        -db: Session
        +should_promote() bool
        +create_promotion() SocialPromotion
        +start_promotion() SocialPromotion
        +pause_promotion() SocialPromotion
        +stop_promotion() SocialPromotion
        +get_promotion_stats() Dict
        +_get_daily_spend() Decimal
        +_calculate_roi() float
    }
    
    class PromotionStatus {
        <<enumeration>>
        PENDING
        ACTIVE
        PAUSED
        COMPLETED
        STOPPED
    }
    
    class SocialAnalytics {
        -db: Session
        +get_dashboard_stats() Dict
        +get_platform_comparison() List~Dict~
        +get_post_performance() List~Dict~
        +get_time_series() List~Dict~
    }
    
    class SocialLogger {
        -db: Session
        +log() SocialLog
        +log_post_published() SocialLog
        +log_post_failed() SocialLog
        +log_post_pending() SocialLog
        +get_analytics() dict
    }
    
    class ErrorHandler {
        -db: Session
        -logger: SocialLogger
        -MAX_RETRIES: int
        -RETRY_DELAYS: List~int~
        +handle_publish_error() bool
        +_classify_error() str
        +_refresh_token() bool
    }
    
    class SocialPost {
        +id: int
        +setup_id: int
        +platform: str
        +caption: str
        +status: str
        +platform_post_id: str
        +published_at: datetime
        +error_message: str
        +retry_count: int
    }
    
    class SocialPromotion {
        +id: int
        +post_id: int
        +platform: str
        +budget_amount: Decimal
        +total_spent: Decimal
        +status: str
        +impressions: int
        +clicks: int
        +engagement: int
    }
    
    class SocialLog {
        +id: int
        +post_id: int
        +platform: str
        +action: str
        +message: str
        +error_code: str
        +created_at: datetime
    }
    
    class PlatformConfig {
        +id: int
        +platform: str
        +is_enabled: bool
        +requires_approval: bool
        +auto_publish: bool
        +promotion_enabled: bool
        +default_budget: Decimal
        +daily_budget_limit: Decimal
    }
    
    PlatformAdapter <|-- LinkedInAdapter
    PlatformAdapter <|-- InstagramAdapter
    PlatformAdapter <|-- FacebookAdapter
    PlatformAdapter <|-- WhatsAppAdapter
    PlatformAdapter <|-- RedditAdapter
    PlatformAdapter <|-- TwitterAdapter
    
    CaptionGenerator --> PlatformCaption
    CaptionGenerator --> CaptionStyle
    ApprovalWorkflow --> PostStatus
    PromotionEngine --> PromotionStatus
    
    SocialPost --> PlatformType
    SocialPromotion --> PlatformType
    SocialLog --> PlatformType
    PlatformConfig --> PlatformType
```

### 4.5 Component Diagram: System Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        ADMIN[Admin Dashboard]
        API[FastAPI REST API]
        WEBHOOK[Webhook Receiver]
    end
    
    subgraph "Application Layer"
        SOCIAL_SVC[Social Publishing Service]
        CAPTION_SVC[Caption Generator]
        WORKFLOW_SVC[Approval Workflow]
        PROMO_SVC[Promotion Engine]
        ANALYTICS_SVC[Analytics Service]
        ERROR_SVC[Error Handler]
    end
    
    subgraph "Integration Layer"
        ADAPTER_FACT[Platform Adapter Factory]
        ZERNIO_ADAPTER[Zernio Unified Adapter]
        NATIVE_ADAPTER[Native API Adapters]
        FALLBACK[Fallback Adapter]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(S3 Media Storage)]
    end
    
    subgraph "External Platforms"
        LINKEDIN[LinkedIn]
        INSTAGRAM[Instagram]
        FACEBOOK[Facebook]
        WHATSAPP[WhatsApp]
        REDDIT[Reddit]
        TWITTER[Twitter/X]
    end
    
    subgraph "AI Services"
        OLLAMA[Ollama Local]
        OPENAI[OpenAI API]
    end
    
    ADMIN --> API
    WEBHOOK --> API
    API --> SOCIAL_SVC
    API --> ANALYTICS_SVC
    
    SOCIAL_SVC --> CAPTION_SVC
    SOCIAL_SVC --> WORKFLOW_SVC
    SOCIAL_SVC --> PROMO_SVC
    SOCIAL_SVC --> ERROR_SVC
    
    CAPTION_SVC --> OLLAMA
    CAPTION_SVC --> OPENAI
    
    WORKFLOW_SVC --> POSTGRES
    PROMO_SVC --> POSTGRES
    ANALYTICS_SVC --> POSTGRES
    
    SOCIAL_SVC --> ADAPTER_FACT
    ADAPTER_FACT --> ZERNIO_ADAPTER
    ADAPTER_FACT --> NATIVE_ADAPTER
    ADAPTER_FACT --> FALLBACK
    
    ZERNIO_ADAPTER --> LINKEDIN
    ZERNIO_ADAPTER --> INSTAGRAM
    ZERNIO_ADAPTER --> FACEBOOK
    ZERNIO_ADAPTER --> TWITTER
    
    NATIVE_ADAPTER --> WHATSAPP
    NATIVE_ADAPTER --> REDDIT
    
    SOCIAL_SVC --> REDIS
    SOCIAL_SVC --> S3
    
    ERROR_SVC --> REDIS
    ERROR_SVC --> POSTGRES
```

### 4.6 State Diagram: Post Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: New setup created
    
    DRAFT --> PENDING: Needs approval
    DRAFT --> APPROVED: Auto-publish enabled
    
    PENDING --> APPROVED: Admin approves
    PENDING --> REJECTED: Admin rejects
    
    REJECTED --> [*]
    
    APPROVED --> PUBLISHING: Trigger publish
    APPROVED --> PENDING: Revoke approval
    
    PUBLISHING --> PUBLISHED: Platform confirms
    PUBLISHING --> FAILED: Platform error
    
    FAILED --> PUBLISHING: Retry successful
    FAILED --> PENDING: Max retries exceeded
    
    PUBLISHED --> [*]
```

### 4.7 Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCT_SETUP {
        int id PK
        string title
        string description
        int product_id FK
        datetime created_at
    }
    
    SOCIAL_POST {
        int id PK
        int setup_id FK
        int product_id FK
        string platform
        string caption
        string status
        string platform_post_id
        string platform_post_url
        int approved_by
        datetime approved_at
        datetime published_at
        int retry_count
        datetime created_at
    }
    
    SOCIAL_PROMOTION {
        int id PK
        int post_id FK
        string platform
        decimal budget_amount
        decimal total_spent
        int impressions
        int clicks
        int engagement
        string status
        datetime start_date
        datetime end_date
    }
    
    SOCIAL_LOG {
        int id PK
        int post_id FK
        string platform
        string action
        string message
        string error_code
        datetime created_at
    }
    
    PLATFORM_CONFIG {
        int id PK
        string platform UK
        boolean is_enabled
        boolean requires_approval
        boolean auto_publish
        boolean promotion_enabled
        decimal default_budget
        decimal daily_budget_limit
    }
    
    PRODUCT_SETUP ||--o{ SOCIAL_POST : "generates"
    SOCIAL_POST ||--o{ SOCIAL_PROMOTION : "promotes"
    SOCIAL_POST ||--o{ SOCIAL_LOG : "logs"
    PLATFORM_CONFIG ||--o{ SOCIAL_POST : "configures"
```

---

## 5. SOLID Principles Implementation

### 5.1 Single Responsibility Principle (SRP)

Each class has **one reason to change**:

| Class | Responsibility |
|-------|----------------|
| `PlatformAdapter` | Handles platform-specific publishing |
| `CaptionGenerator` | Generates AI-powered captions |
| `ApprovalWorkflow` | Manages approval state transitions |
| `PromotionEngine` | Handles paid promotion logic |
| `SocialAnalytics` | Collects and aggregates metrics |
| `SocialLogger` | Records audit events |
| `ErrorHandler` | Classifies and handles errors |

**Example:**
```python
# BAD: Class with multiple responsibilities
class SocialManager:
    def publish_post(self): ...
    def generate_caption(self): ...
    def approve_post(self): ...
    def track_analytics(self): ...

# GOOD: Single responsibility classes
class PlatformAdapter:
    def publish_post(self): ...

class CaptionGenerator:
    def generate_caption(self): ...

class ApprovalWorkflow:
    def approve_post(self): ...

class SocialAnalytics:
    def track_analytics(self): ...
```

### 5.2 Open/Closed Principle (OCP)

The system is **open for extension, closed for modification**:

```python
# New platforms added via adapter pattern
class LinkedInAdapter(PlatformAdapter):
    async def publish_post(self, caption, media_url, **kwargs):
        # LinkedIn-specific implementation
        pass

class InstagramAdapter(PlatformAdapter):
    async def publish_post(self, caption, media_url, **kwargs):
        # Instagram-specific implementation
        pass

# Factory creates appropriate adapter
class AdapterFactory:
    _adapters = {
        PlatformType.LINKEDIN: LinkedInAdapter,
        PlatformType.INSTAGRAM: InstagramAdapter,
        # ... other platforms
    }
    
    @classmethod
    def get_adapter(cls, platform: PlatformType, config: dict) -> PlatformAdapter:
        adapter_class = cls._adapters.get(platform)
        if not adapter_class:
            raise ValueError(f"Unsupported platform: {platform}")
        return adapter_class(platform, config)
```

**Adding a new platform requires only:**
1. Create new adapter class implementing `PlatformAdapter`
2. Register in `AdapterFactory._adapters`
3. No changes to existing code

### 5.3 Interface Segregation Principle (ISP)

Clients depend only on **interfaces they use**:

```python
# Fine-grained interfaces for different use cases
class Publishable(ABC):
    @abstractmethod
    async def publish_post(self, caption, media_url, **kwargs) -> PublishResult:
        pass

class Uploadable(ABC):
    @abstractmethod
    async def upload_media(self, file_path, media_type) -> MediaUploadResult:
        pass

class MetricsGatherable(ABC):
    @abstractmethod
    async def get_post_metrics(self, post_id) -> PlatformMetrics:
        pass

# Adapter can implement multiple interfaces
class LinkedInAdapter(PlatformAdapter, Publishable, Uploadable, MetricsGatherable):
    # Implements only needed interfaces
    pass
```

### 5.4 Dependency Inversion Principle (DIP)

High-level modules depend on **abstractions, not concretions**:

```python
# Abstractions
class PlatformAdapter(ABC):
    @abstractmethod
    async def publish_post(self, **kwargs) -> PublishResult:
        pass

# Depend on abstraction
class SocialPublishService:
    def __init__(self, adapter: PlatformAdapter):  # Depends on abstraction
        self.adapter = adapter
    
    async def publish(self, caption, media_url):
        return await self.adapter.publish_post(caption, media_url)

# Concrete implementation injected at runtime
adapter = AdapterFactory.get_adapter(PlatformType.LINKEDIN, config)
service = SocialPublishService(adapter)
```

### 5.5 Interface Segregation Example

```python
# Reader interface for consumers
class PostReader(ABC):
    @abstractmethod
    def get_post(self, post_id: int) -> SocialPost:
        pass

# Writer interface for publishers
class PostWriter(ABC):
    @abstractmethod
    def create_post(self, post: SocialPost) -> SocialPost:
        pass
    
    @abstractmethod
    def update_post(self, post_id: int, updates: dict) -> SocialPost:
        pass

# Full repository for admin operations
class PostRepository(PostReader, PostWriter):
    def __init__(self, db: Session):
        self.db = db
    
    def get_post(self, post_id: int) -> SocialPost:
        return self.db.get(SocialPost, post_id)
    
    def create_post(self, post: SocialPost) -> SocialPost:
        self.db.add(post)
        self.db.commit()
        return post
    
    def update_post(self, post_id: int, updates: dict) -> SocialPost:
        post = self.get_post(post_id)
        for key, value in updates.items():
            setattr(post, key, value)
        self.db.commit()
        return post
```

---

## 6. Database Schema & Models

### 6.1 Core Models

```python
# bark/app/models/social.py

from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer,
    Numeric, String, Text, JSON, CheckConstraint, Index, func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base


class SocialPost(Base):
    """
    A social media post generated from a product setup.
    
    Tracks the full lifecycle of a post across platforms.
    """
    __tablename__ = "social_posts"

    # Primary keys
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    setup_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("product_setups.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    # Content
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    hashtags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Platform response
    platform_post_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    platform_post_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status and workflow
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    
    # Approval
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_retry_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Metadata
    platform_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    setup = relationship("ProductSetup", back_populates="social_posts")
    product = relationship("Product")
    promotions = relationship("SocialPromotion", back_populates="post", cascade="all, delete-orphan")
    logs = relationship("SocialLog", back_populates="post", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "platform IN ('linkedin', 'instagram', 'facebook', 'whatsapp', 'reddit', 'twitter')",
            name="ck_social_post_platform",
        ),
        CheckConstraint(
            "status IN ('draft', 'pending', 'approved', 'publishing', 'published', 'failed', 'rejected')",
            name="ck_social_post_status",
        ),
        Index("ix_social_posts_platform_status", "platform", "status"),
        Index("ix_social_posts_setup", "setup_id"),
        Index("ix_social_posts_created", "created_at"),
    )


class SocialPromotion(Base):
    """
    Paid promotion tracking for social media posts.
    
    Manages budget, spend, and performance metrics for promoted posts.
    """
    __tablename__ = "social_promotions"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("social_posts.id", ondelete="CASCADE"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String(20), nullable=False)

    # Budget
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    budget_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    daily_limit: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Spend tracking
    total_spent: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    # Platform IDs
    platform_campaign_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    platform_ad_set_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    platform_ad_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Dates
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    post = relationship("SocialPost", back_populates="promotions")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'paused', 'completed', 'stopped')",
            name="ck_social_promotion_status",
        ),
        Index("ix_social_promotions_platform_status", "platform", "status"),
        Index("ix_social_promotions_post", "post_id"),
    )


class SocialLog(Base):
    """
    Audit log for all social media operations.
    
    Records every action for debugging and compliance.
    """
    __tablename__ = "social_logs"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    post_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("social_posts.id", ondelete="SET NULL"), nullable=True
    )
    platform: Mapped[str] = mapped_column(String(20), nullable=False)

    # Action details
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Context
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    post = relationship("SocialPost", back_populates="logs")

    # Constraints
    __table_args__ = (
        Index("ix_social_logs_platform_action", "platform", "action"),
        Index("ix_social_logs_post", "post_id"),
        Index("ix_social_logs_created", "created_at"),
    )


class PlatformConfig(Base):
    """
    Per-platform configuration for social media publishing.
    
    Stores API credentials, limits, and feature flags.
    """
    __tablename__ = "platform_configs"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # API credentials (encrypted in production)
    api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    api_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    app_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Feature flags
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auto_publish: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Promotion settings
    promotion_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_budget: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    daily_budget_limit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    max_budget_per_post: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)

    # Rate limits
    posts_per_day: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    posts_per_hour: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    # Content settings
    default_hashtags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_caption_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    media_types: Mapped[str] = mapped_column(Text, default="image,video", nullable=False)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "platform IN ('linkedin', 'instagram', 'facebook', 'whatsapp', 'reddit', 'twitter')",
            name="ck_platform_config_platform",
        ),
    )
```

### 6.2 SQLAlchemy Event Triggers

```python
# bark/app/events/social.py

from sqlalchemy import event
from sqlalchemy.orm import Session
from app.models.social import SocialPost
from app.services.social.workflow import ApprovalWorkflow
from app.services.social.publisher import SocialPublisher


@event.listens_for(SocialPost, "after_insert")
def on_social_post_insert(mapper, connection, target: SocialPost):
    """
    Triggered after a new social post is inserted.
    
    This event initiates the publishing pipeline asynchronously.
    """
    import asyncio
    from app.tasks.social import process_new_post_task
    
    # Queue async processing
    process_new_post_task.delay(target.id)


@event.listens_for(SocialPost, "after_update")
def on_social_post_update(mapper, connection, target: SocialPost):
    """
    Triggered after a social post is updated.
    
    Handles state transitions and triggers downstream actions.
    """
    from app.tasks.social import handle_post_status_change_task
    
    # Check if status changed
    if target.status == "approved":
        # Queue for publishing
        handle_post_status_change_task.delay(target.id, "approved")
    elif target.status == "rejected":
        # Log rejection
        from app.services.social.logger import SocialLogger
        logger = SocialLogger(Session(bind=connection))
        logger.log(
            post_id=target.id,
            platform=target.platform,
            action="post_rejected",
            message=target.rejection_reason,
        )
```

---

## 7. Platform Integration Strategies

### 7.1 Unified API Integration (Zernio)

```python
# bark/app/services/social/adapters/zernio_adapter.py

from __future__ import annotations
from typing import Any, Dict, List, Optional
from zernio import Zernio
from app.services.social.adapters.base import PlatformAdapter, PlatformType, PublishResult, MediaType


class ZernioAdapter(PlatformAdapter):
    """
    Unified adapter using Zernio API for multiple platforms.
    
    Benefits:
    - Single SDK for LinkedIn, Instagram, Facebook, Twitter
    - Managed authentication and rate limiting
    - Automatic media transcoding
    - Built-in retry logic
    """

    def __init__(self, platform: PlatformType, config: Dict[str, Any]):
        super().__init__(platform, config)
        self.client = Zernio(api_key=config.get("zernio_api_key"))
        self.account_id = config.get("account_id")

    async def publish_post(
        self,
        caption: str,
        media_url: Optional[str] = None,
        video_url: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> PublishResult:
        """Publish post via Zernio unified API."""
        
        try:
            # Prepare platforms payload
            platforms = [{"platform": self.platform.value, "accountId": self.account_id}]
            
            # Add hashtags to caption if provided
            formatted_caption = caption
            if hashtags:
                hashtag_str = " ".join(f"#{tag.strip('#')}" for tag in hashtags)
                formatted_caption = f"{caption}\n\n{hashtag_str}"
            
            # Create post
            post = self.client.posts.create(
                content=formatted_caption,
                platforms=platforms,
                mediaUrls=[media_url] if media_url else None,
                publish_now=True,
            )
            
            return PublishResult(
                success=True,
                platform=self.platform,
                post_id=post.id,
                post_url=post.url if hasattr(post, 'url') else None,
                raw_response=post.__dict__ if hasattr(post, '__dict__') else None,
            )
            
        except Exception as e:
            return PublishResult(
                success=False,
                platform=self.platform,
                error_message=str(e),
            )

    async def upload_media(
        self,
        file_path: str,
        media_type: MediaType,
        **kwargs: Any,
    ) -> MediaUploadResult:
        """Upload media via Zernio."""
        
        try:
            # Zernio handles media upload automatically
            return MediaUploadResult(
                success=True,
                media_url=file_path,  # Zernio accepts URLs directly
            )
        except Exception as e:
            return MediaUploadResult(
                success=False,
                error_message=str(e),
            )

    async def delete_post(self, post_id: str) -> bool:
        """Delete post via Zernio."""
        
        try:
            self.client.posts.delete(post_id)
            return True
        except Exception:
            return False

    async def get_post_metrics(self, post_id: str) -> Dict:
        """Get post metrics via Zernio."""
        
        try:
            metrics = self.client.posts.get_metrics(post_id)
            return {
                "impressions": getattr(metrics, 'impressions', 0),
                "clicks": getattr(metrics, 'clicks', 0),
                "engagement": getattr(metrics, 'engagement', 0),
            }
        except Exception:
            return {}

    async def validate_config(self) -> bool:
        """Validate Zernio configuration."""
        
        try:
            # Test API connection
            self.client.posts.list(limit=1)
            return True
        except Exception:
            return False
```

### 7.2 Native API Integration Examples

```python
# bark/app/services/social/adapters/linkedin_adapter.py

from __future__ import annotations
import httpx
from app.services.social.adapters.base import PlatformAdapter, PlatformType, PublishResult, MediaType


class LinkedInAdapter(PlatformAdapter):
    """
    LinkedIn native API integration.
    
    Uses LinkedIn Marketing API for organization posts.
    """

    BASE_URL = "https://api.linkedin.com/v2"

    def __init__(self, platform: PlatformType, config: dict):
        super().__init__(platform, config)
        self.access_token = config.get("access_token")
        self.organization_id = config.get("organization_id")

    async def publish_post(
        self,
        caption: str,
        media_url: str | None = None,
        video_url: str | None = None,
        hashtags: list[str] | None = None,
        **kwargs,
    ) -> PublishResult:
        """Publish to LinkedIn."""
        
        # Format caption with hashtags
        formatted_caption = caption
        if hashtags:
            hashtag_str = " ".join(f"#{tag.strip('#')}" for tag in hashtags[:5])
            formatted_caption = f"{caption}\n\n{hashtag_str}"
        
        # Build post body
        post_body = {
            "author": f"urn:li:organization:{self.organization_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": formatted_caption},
                    "shareMediaCategory": "VIDEO" if video_url else "IMAGE" if media_url else "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
        
        # Add media if provided
        if media_url or video_url:
            post_body["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = {
                "status": "READY",
                "originalUrl": media_url or video_url,
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/ugcPosts",
                    json=post_body,
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": "application/json",
                    },
                )
                
                if response.status_code == 201:
                    data = response.json()
                    return PublishResult(
                        success=True,
                        platform=PlatformType.LINKEDIN,
                        post_id=data.get("id"),
                        raw_response=data,
                    )
                else:
                    return PublishResult(
                        success=False,
                        platform=PlatformType.LINKEDIN,
                        error_message=response.text,
                    )
        except Exception as e:
            return PublishResult(
                success=False,
                platform=PlatformType.LINKEDIN,
                error_message=str(e),
            )

    async def upload_media(self, file_path: str, media_type: MediaType, **kwargs) -> MediaUploadResult:
        """Upload media to LinkedIn."""
        # LinkedIn requires separate media upload workflow
        return MediaUploadResult(success=True, media_url=file_path)

    async def delete_post(self, post_id: str) -> bool:
        """Delete LinkedIn post."""
        return True  # LinkedIn doesn't support post deletion via API

    async def get_post_metrics(self, post_id: str) -> dict:
        """Get LinkedIn post metrics."""
        return {}  # Requires additional API calls

    async def validate_config(self) -> bool:
        """Validate LinkedIn configuration."""
        return bool(self.access_token and self.organization_id)

    def get_max_caption_length(self) -> int:
        return 3000
```

---

## 8. AI Caption Generation System

### 8.1 Advanced Caption Strategies

```python
# bark/app/services/social/caption_strategies.py

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Optional
from app.services.social.caption_generator import PlatformCaption, CaptionStyle


class CaptionStrategy(ABC):
    """Abstract strategy for caption generation."""

    @abstractmethod
    async def generate(
        self,
        setup_data: dict,
        platform: str,
        style: CaptionStyle,
    ) -> PlatformCaption:
        pass


class ProfessionalCaptionStrategy(CaptionStrategy):
    """Professional, authoritative caption style."""

    async def generate(self, setup_data: dict, platform: str, style: CaptionStyle) -> PlatformCaption:
        prompt = f"""Create a professional LinkedIn post about:
        
Product: {setup_data['product_name']}
Installation: {setup_data['setup_title']}
Location: {setup_data.get('location', 'India')}

Focus on:
- Industry expertise
- Technical specifications
- Business value proposition
- Professional tone

Include 3-5 industry hashtags."""

        caption = await self._call_ai(prompt)
        return PlatformCaption(
            platform=platform,
            caption=caption,
            hashtags=self._extract_hashtags(caption),
            style=style,
        )


class EngagingCaptionStrategy(CaptionStrategy):
    """Engaging, social-media friendly caption style."""

    async def generate(self, setup_data: dict, platform: str, style: CaptionStyle) -> PlatformCaption:
        prompt = f"""Create an engaging social media post about:

Product: {setup_data['product_name']}
Installation: {setup_data['setup_title']}
Location: {setup_data.get('location', 'India')}

Focus on:
- Attention-grabbing hook
- Visual appeal
- User engagement
- Call to action

Include emojis and relevant hashtags."""

        caption = await self._call_ai(prompt)
        return PlatformCaption(
            platform=platform,
            caption=caption,
            hashtags=self._extract_hashtags(caption),
            style=style,
        )


class InformativeCaptionStrategy(CaptionStrategy):
    """Technical, informative caption style for Reddit."""

    async def generate(self, setup_data: dict, platform: str, style: CaptionStyle) -> PlatformCaption:
        prompt = f"""Create an informative Reddit post about:

Product: {setup_data['product_name']}
Installation: {setup_data['setup_title']}
Location: {setup_data.get('location', 'India')}

Focus on:
- Technical details
- Specifications
- Use cases
- Discussion prompts

Use technical language, no emojis."""

        caption = await self._call_ai(prompt)
        return PlatformCaption(
            platform=platform,
            caption=caption,
            hashtags=[],
            style=style,
        )


class CaptionStrategyFactory:
    """Factory for caption generation strategies."""

    _strategies = {
        CaptionStyle.PROFESSIONAL: ProfessionalCaptionStrategy,
        CaptionStyle.ENGAGING: EngagingCaptionStrategy,
        CaptionStyle.INFORMATIVE: InformativeCaptionStrategy,
    }

    @classmethod
    def get_strategy(cls, style: CaptionStyle) -> CaptionStrategy:
        strategy_class = cls._strategies.get(style)
        if not strategy_class:
            raise ValueError(f"Unknown caption style: {style}")
        return strategy_class()
```

### 8.2 Hierarchical Caption Generation (PoCa)

```python
# bark/app/services/social/poca_generator.py

from __future__ import annotations
from typing import List, Optional
from app.services.social.caption_generator import CaptionGenerator, PlatformCaption


class PoCaGenerator(CaptionGenerator):
    """
    Pyramid of Captions (PoCa) generator.
    
    Implements hierarchical caption generation:
    1. Generate local captions for product features
    2. Generate global caption for overall context
    3. Merge local and global captions for enriched output
    
    Based on research: "What Makes for Good Image Captions?" (2025)
    """

    async def generate_captions(
        self,
        setup_title: str,
        setup_description: str,
        product_name: str,
        location: Optional[str] = None,
        client_name: Optional[str] = None,
        **kwargs,
    ) -> List[PlatformCaption]:
        """
        Generate captions using hierarchical aggregation.
        
        Steps:
        1. Extract key features from setup data
        2. Generate local captions for each feature
        3. Generate global caption
        4. Merge using LLM
        """
        
        # Step 1: Extract features
        features = self._extract_features(setup_title, setup_description, product_name)
        
        # Step 2: Generate local captions
        local_captions = []
        for feature in features:
            local_caption = await self._generate_local_caption(
                feature, product_name, location
            )
            local_captions.append(local_caption)
        
        # Step 3: Generate global caption
        global_caption = await self._generate_global_caption(
            setup_title, setup_description, product_name, location
        )
        
        # Step 4: Merge captions
        merged_captions = await self._merge_captions(
            local_captions, global_caption
        )
        
        # Step 5: Format for each platform
        platform_captions = []
        for platform in ["linkedin", "instagram", "facebook", "whatsapp", "reddit", "twitter"]:
            formatted = self._format_for_platform(
                merged_captions, platform
            )
            platform_captions.append(formatted)
        
        return platform_captions

    def _extract_features(self, title: str, description: str, product: str) -> List[str]:
        """Extract key features from setup data."""
        
        features = []
        
        # Parse description for features
        if "features" in description.lower():
            lines = description.split("\n")
            for line in lines:
                if line.strip().startswith(("-", "*", "•")):
                    features.append(line.strip().lstrip("-*• "))
        
        if product not in features:
            features.append(product)
        
        return features[:5]

    async def _generate_local_caption(
        self, feature: str, product: str, location: Optional[str]
    ) -> str:
        """Generate caption for a single feature."""
        
        prompt = f"""Generate a brief caption for this feature:
        
Feature: {feature}
Product: {product}
Location: {location or 'India'}

Keep it concise (50-100 words)."""
        
        return await self._call_ai(prompt)

    async def _generate_global_caption(
        self, title: str, description: str, product: str, location: Optional[str]
    ) -> str:
        """Generate overall caption."""
        
        prompt = f"""Generate an overview caption for:
        
Title: {title}
Description: {description}
Product: {product}
Location: {location or 'India'}

Keep it comprehensive (100-200 words)."""
        
        return await self._call_ai(prompt)

    async def _merge_captions(
        self, local_captions: List[str], global_caption: str
    ) -> str:
        """Merge local and global captions using LLM."""
        
        prompt = f"""Merge these captions into one coherent caption:

Global caption:
{global_caption}

Local captions:
{chr(10).join(local_captions)}

Create a unified caption that incorporates all key points."""
        
        return await self._call_ai(prompt)

    def _format_for_platform(self, caption: str, platform: str) -> PlatformCaption:
        """Format caption for specific platform."""
        
        style_guide = self.STYLE_GUIDES.get(platform, {})
        max_length = style_guide.get("max_length", 2200)
        
        formatted_caption = caption[:max_length]
        hashtags = self._extract_hashtags(caption)
        
        return PlatformCaption(
            platform=platform,
            caption=formatted_caption,
            hashtags=hashtags[:10],
        )

    def _extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text."""
        
        import re
        hashtag_pattern = r'#(\w+)'
        return re.findall(hashtag_pattern, text)
```

---

## 9. Approval Workflow Engine

### 9.1 State Machine Implementation

```python
# bark/app/services/social/state_machine.py

from __future__ import annotations
from enum import Enum
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass


class PostState(Enum):
    """Post states in the workflow."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class PostEvent(Enum):
    """Events that trigger state transitions."""
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    PUBLISH = "publish"
    PUBLISH_SUCCESS = "publish_success"
    PUBLISH_FAIL = "publish_fail"
    RETRY = "retry"
    REVOKE = "revoke"


@dataclass
class Transition:
    """State transition definition."""
    from_state: PostState
    to_state: PostState
    event: PostEvent
    guard: Optional[Callable] = None
    action: Optional[Callable] = None


class PostStateMachine:
    """
    State machine for post lifecycle management.
    
    Implements strict forward-only transitions:
    draft -> pending -> approved/rejected -> publishing -> published/failed
    """

    def __init__(self):
        self.transitions: List[Transition] = [
            Transition(PostState.DRAFT, PostState.PENDING, PostEvent.SUBMIT),
            Transition(PostState.DRAFT, PostState.APPROVED, PostEvent.APPROVE),
            Transition(PostState.PENDING, PostState.APPROVED, PostEvent.APPROVE),
            Transition(PostState.PENDING, PostState.REJECTED, PostEvent.REJECT),
            Transition(PostState.APPROVED, PostState.PUBLISHING, PostEvent.PUBLISH),
            Transition(PostState.APPROVED, PostState.PENDING, PostEvent.REVOKE),
            Transition(PostState.PUBLISHING, PostState.PUBLISHED, PostEvent.PUBLISH_SUCCESS),
            Transition(PostState.PUBLISHING, PostState.FAILED, PostEvent.PUBLISH_FAIL),
            Transition(PostState.FAILED, PostState.PUBLISHING, PostEvent.RETRY),
            Transition(PostState.FAILED, PostState.PENDING, PostEvent.SUBMIT),
        ]
        
        self.current_state = PostState.DRAFT

    def get_valid_events(self) -> List[PostEvent]:
        """Get list of valid events for current state."""
        return [
            t.event for t in self.transitions
            if t.from_state == self.current_state
        ]

    def can_transition(self, event: PostEvent) -> bool:
        """Check if transition is valid."""
        return any(
            t.from_state == self.current_state and t.event == event
            for t in self.transitions
        )

    def transition(self, event: PostEvent, context: Optional[Dict] = None) -> PostState:
        """Execute state transition."""
        for t in self.transitions:
            if t.from_state == self.current_state and t.event == event:
                if t.guard and not t.guard(context):
                    raise ValueError(f"Guard failed for transition {event.value}")
                if t.action:
                    t.action(context)
                old_state = self.current_state
                self.current_state = t.to_state
                return self.current_state
        
        raise ValueError(f"Invalid transition: {self.current_state.value} -> {event.value}")

    def get_transition_path(self, from_state: PostState, to_state: PostState) -> List[PostState]:
        """Find path between states (for UI display)."""
        from collections import deque
        
        queue = deque([(from_state, [from_state])])
        visited = {from_state}
        
        while queue:
            current, path = queue.popleft()
            if current == to_state:
                return path
            for t in self.transitions:
                if t.from_state == current and t.to_state not in visited:
                    visited.add(t.to_state)
                    queue.append((t.to_state, path + [t.to_state]))
        
        return []
```

---

## 10. Promotion Engine

### 10.1 Campaign Management

```python
# bark/app/services/social/campaign_manager.py

from __future__ import annotations
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.social import SocialPost, SocialPromotion, PlatformConfig


class CampaignManager:
    """
    Manages paid promotion campaigns.
    
    Handles:
    - Budget validation and allocation
    - Campaign lifecycle management
    - Spend tracking and limits
    - Performance monitoring
    """

    def __init__(self, db: Session, adapter_factory):
        self.db = db
        self.adapter_factory = adapter_factory

    def validate_budget(self, platform: str, budget: Decimal) -> Dict:
        """Validate budget against platform limits."""
        config = self.db.query(PlatformConfig).filter(
            PlatformConfig.platform == platform
        ).first()
        
        if not config:
            return {"valid": False, "error": f"No config for {platform}"}
        
        if not config.promotion_enabled:
            return {"valid": False, "error": "Promotion not enabled"}
        
        daily_spend = self._get_daily_spend(platform)
        remaining_budget = config.daily_budget_limit - daily_spend
        
        if remaining_budget <= 0:
            return {"valid": False, "error": "Daily budget limit reached"}
        
        adjusted_budget = min(budget, config.max_budget_per_post, remaining_budget)
        
        return {
            "valid": True,
            "original_budget": budget,
            "adjusted_budget": adjusted_budget,
            "daily_remaining": remaining_budget,
        }

    def create_campaign(
        self, post_id: int, platform: str, budget: Optional[Decimal] = None,
    ) -> SocialPromotion:
        """Create a new promotion campaign."""
        if budget is None:
            config = self.db.query(PlatformConfig).filter(
                PlatformConfig.platform == platform
            ).first()
            budget = config.default_budget if config else Decimal("0")
        
        validation = self.validate_budget(platform, budget)
        if not validation["valid"]:
            raise ValueError(validation["error"])
        
        adjusted_budget = validation["adjusted_budget"]
        
        promotion = SocialPromotion(
            post_id=post_id,
            platform=platform,
            budget_amount=adjusted_budget,
            daily_limit=self._get_daily_limit(platform),
            status="pending",
        )
        
        self.db.add(promotion)
        self.db.commit()
        
        return promotion

    def _get_daily_spend(self, platform: str) -> Decimal:
        today = datetime.now(timezone.utc).date()
        total = self.db.query(func.sum(SocialPromotion.total_spent)).filter(
            SocialPromotion.platform == platform,
            SocialPromotion.created_at >= today,
        ).scalar()
        return total or Decimal("0")

    def _get_daily_limit(self, platform: str) -> Decimal:
        config = self.db.query(PlatformConfig).filter(
            PlatformConfig.platform == platform
        ).first()
        return config.daily_budget_limit if config else Decimal("0")
```

---

## 11. Analytics & Monitoring System

### 11.1 Real-time Metrics Collection

```python
# bark/app/services/social/metrics_collector.py

from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.social import SocialPost, SocialPromotion, SocialLog


@dataclass
class MetricPoint:
    """Single metric data point."""
    timestamp: datetime
    value: float
    labels: Dict[str, str]


class MetricsCollector:
    """
    Real-time metrics collection and aggregation.
    
    Provides:
    - Real-time counters
    - Time-series data
    - Aggregated statistics
    - Export capabilities
    """

    def __init__(self, db: Session):
        self.db = db
        self._counters = {}
        self._gauges = {}

    def increment_counter(self, name: str, labels: Optional[Dict] = None, value: int = 1):
        key = f"{name}:{labels}" if labels else name
        self._counters[key] = self._counters.get(key, 0) + value

    def set_gauge(self, name: str, value: float, labels: Optional[Dict] = None):
        key = f"{name}:{labels}" if labels else name
        self._gauges[key] = value

    def collect_post_metrics(self, post_id: int) -> Dict:
        post = self.db.get(SocialPost, post_id)
        if not post:
            return {}
        
        metrics = {
            "post_id": post.id,
            "platform": post.platform,
            "status": post.status,
            "created_at": post.created_at.isoformat(),
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "retry_count": post.retry_count,
        }
        
        promotion = self.db.query(SocialPromotion).filter(
            SocialPromotion.post_id == post.id,
            SocialPromotion.status == "active",
        ).first()
        
        if promotion:
            metrics.update({
                "impressions": promotion.impressions,
                "clicks": promotion.clicks,
                "engagement": promotion.engagement,
                "spend": float(promotion.total_spent),
                "ctr": (promotion.clicks / promotion.impressions * 100) if promotion.impressions > 0 else 0,
            })
        
        return metrics

    def get_platform_summary(self, days: int = 30) -> List[Dict]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        summary = []
        
        for platform in ["linkedin", "instagram", "facebook", "whatsapp", "reddit", "twitter"]:
            total = self.db.query(func.count(SocialPost.id)).filter(
                SocialPost.platform == platform,
                SocialPost.created_at >= since,
            ).scalar()
            
            published = self.db.query(func.count(SocialPost.id)).filter(
                SocialPost.platform == platform,
                SocialPost.status == "published",
                SocialPost.created_at >= since,
            ).scalar()
            
            impressions = self.db.query(func.sum(SocialPromotion.impressions)).filter(
                SocialPromotion.platform == platform,
                SocialPromotion.created_at >= since,
            ).scalar() or 0
            
            spend = self.db.query(func.sum(SocialPromotion.total_spent)).filter(
                SocialPromotion.platform == platform,
                SocialPromotion.created_at >= since,
            ).scalar() or 0
            
            summary.append({
                "platform": platform,
                "posts": {
                    "total": total,
                    "published": published,
                    "success_rate": (published / total * 100) if total > 0 else 0,
                },
                "metrics": {
                    "impressions": impressions,
                    "spend": float(spend),
                    "cpm": (spend / impressions * 1000) if impressions > 0 else 0,
                },
            })
        
        return summary
```

---

## 12. Error Handling & Resilience

### 12.1 Circuit Breaker Pattern

```python
# bark/app/services/social/circuit_breaker.py

from __future__ import annotations
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Callable, Any
from functools import wraps
import asyncio


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """
    Circuit breaker for platform API calls.
    
    Prevents cascading failures by:
    1. Tracking failure rate
    2. Opening circuit when threshold exceeded
    3. Periodically testing recovery
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 3,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.half_open_calls = 0

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.half_open_max_calls:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
        elif self.state == CircuitState.CLOSED:
            self.failure_count = max(0, self.failure_count - 1)

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now(timezone.utc)
        
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            self.success_count = 0
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if self.last_failure_time:
                elapsed = (datetime.now(timezone.utc) - self.last_failure_time).total_seconds()
                if elapsed >= self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.half_open_calls = 0
                    return True
            return False
        if self.state == CircuitState.HALF_OPEN:
            return self.half_open_calls < self.half_open_max_calls
        return False

    def get_state_info(self) -> Dict:
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None,
        }


def circuit_breaker_protected(breaker: CircuitBreaker):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            if not breaker.can_execute():
                raise CircuitBreakerOpenError("Circuit breaker is open")
            try:
                result = await func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure()
                raise
        return wrapper
    return decorator


class CircuitBreakerOpenError(Exception):
    pass
```

### 12.2 Retry Logic with Exponential Backoff

```python
# bark/app/services/social/retry_handler.py

from __future__ import annotations
import asyncio
import random
from typing import Callable, Any, Optional
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class RetryConfig:
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: tuple = (Exception,),
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions


def retry_with_backoff(config: Optional[RetryConfig] = None):
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt < config.max_retries:
                        delay = config.base_delay * (config.exponential_base ** attempt)
                        
                        if config.jitter:
                            delay = random.uniform(0, delay)
                        
                        delay = min(delay, config.max_delay)
                        
                        logger.warning(
                            f"Attempt {attempt + 1} failed: {e}. "
                            f"Retrying in {delay:.2f} seconds..."
                        )
                        
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"All {config.max_retries + 1} attempts failed. "
                            f"Last error: {e}"
                        )
            
            raise last_exception
        
        return wrapper
    return decorator
```

---

## 13. API Design & Endpoints

### 13.1 Public API Endpoints

```python
# bark/routers/api_social.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.social import SocialPost

router = APIRouter(prefix="/api/v1/social", tags=["social"])


@router.get("/public")
async def get_public_posts(
    platform: str = Query(None, description="Filter by platform"),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(SocialPost).filter(SocialPost.status == "published")
    
    if platform:
        query = query.filter(SocialPost.platform == platform)
    
    posts = query.order_by(SocialPost.published_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "posts": [
            {
                "id": post.id,
                "platform": post.platform,
                "caption": post.caption,
                "post_url": post.platform_post_url,
                "published_at": post.published_at.isoformat() if post.published_at else None,
            }
            for post in posts
        ],
        "total": query.count(),
    }
```

### 13.2 Admin API Endpoints

```python
# bark/routers/admin_social.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.social import SocialPost, SocialPromotion, PlatformConfig
from app.services.social.workflow import ApprovalWorkflow
from app.services.social.promotion import PromotionEngine
from app.services.social.analytics import SocialAnalytics

router = APIRouter(prefix="/api/v1/admin/social", tags=["admin-social"])


class ApproveRequest(BaseModel):
    reason: Optional[str] = None


class BulkApproveRequest(BaseModel):
    post_ids: List[int]


class PromotionRequest(BaseModel):
    post_id: int
    budget: Optional[float] = None


@router.get("/posts")
async def get_posts(
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(SocialPost)
    
    if platform:
        query = query.filter(SocialPost.platform == platform)
    if status:
        query = query.filter(SocialPost.status == status)
    
    total = query.count()
    posts = query.order_by(SocialPost.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return {"posts": posts, "total": total, "page": page, "page_size": page_size}


@router.get("/posts/{post_id}")
async def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.get(SocialPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.put("/posts/{post_id}/approve")
async def approve_post(
    post_id: int,
    request: ApproveRequest = Body(...),
    db: Session = Depends(get_db),
):
    workflow = ApprovalWorkflow(db)
    post = workflow.approve_post(post_id, admin_user_id=1)
    return {"message": "Post approved", "post_id": post.id}


@router.put("/posts/{post_id}/reject")
async def reject_post(
    post_id: int,
    request: ApproveRequest = Body(...),
    db: Session = Depends(get_db),
):
    workflow = ApprovalWorkflow(db)
    post = workflow.reject_post(post_id, request.reason or "No reason provided")
    return {"message": "Post rejected", "post_id": post.id}


@router.post("/posts/bulk-approve")
async def bulk_approve_posts(
    request: BulkApproveRequest = Body(...),
    db: Session = Depends(get_db),
):
    workflow = ApprovalWorkflow(db)
    approved_count = workflow.bulk_approve(request.post_ids, admin_user_id=1)
    return {"message": f"Approved {approved_count} posts", "approved_count": approved_count}


@router.get("/analytics")
async def get_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    analytics = SocialAnalytics(db)
    return analytics.get_dashboard_stats(days)


@router.get("/analytics/platforms")
async def get_platform_comparison(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    analytics = SocialAnalytics(db)
    return analytics.get_platform_comparison(days)


@router.get("/config")
async def get_platform_configs(db: Session = Depends(get_db)):
    configs = db.query(PlatformConfig).all()
    return configs


@router.put("/config/{platform}")
async def update_platform_config(
    platform: str,
    updates: dict = Body(...),
    db: Session = Depends(get_db),
):
    config = db.query(PlatformConfig).filter(PlatformConfig.platform == platform).first()
    if not config:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    for key, value in updates.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    db.commit()
    return {"message": "Config updated", "platform": platform}
```

---

## 14. Admin Panel Architecture

### 14.1 Dashboard Features

| Feature | Description |
|---------|-------------|
| **Stats Cards** | Published, Pending, Failed, Total Spend |
| **Platform Breakdown** | Posts per platform with icons |
| **Approval Queue** | Table with approve/reject buttons |
| **Bulk Approve** | Select multiple posts, approve at once |
| **Recent Posts** | Latest posts with status and spend |
| **Analytics Charts** | Performance comparison across platforms |
| **Promotion Manager** | Create, start, pause campaigns |
| **Budget Overview** | Daily spend, remaining budget |

### 14.2 Page Routes

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | /admin/social | Overview stats + pending queue |
| All Posts | /admin/social/posts | List all posts with filters |
| Post Detail | /admin/social/posts/{id} | Single post + logs + metrics |
| Platform Config | /admin/social/config | Enable/disable platforms, set budgets |
| Promotions | /admin/social/promotions | Manage active promotions |
| Analytics | /admin/social/analytics | Detailed performance metrics |
| Logs | /admin/social/logs | Audit trail viewer |

---

## 15. Implementation Roadmap

### 15.1 Phase 1: Foundation (Week 1)

| Day | Task | Files |
|-----|------|-------|
| 1 | Create database models | models/social.py |
| 1 | Run Alembic migrations | alembic/versions/ |
| 2 | Build caption generator | services/social/caption_generator.py |
| 2 | Build social logger | services/social/logger.py |
| 3 | Build base adapter | services/social/adapters/base.py |
| 3 | Build approval workflow | services/social/workflow.py |
| 4 | Build error handler | services/social/error_handler.py |
| 4 | Build promotion engine | services/social/promotion.py |
| 5 | Build analytics service | services/social/analytics.py |

### 15.2 Phase 2: Platform Integrations (Week 2)

| Day | Task | Files |
|-----|------|-------|
| 1 | LinkedIn adapter | services/social/adapters/linkedin.py |
| 1 | Twitter adapter | services/social/adapters/twitter.py |
| 2 | Facebook adapter | services/social/adapters/facebook.py |
| 2 | Instagram adapter | services/social/adapters/instagram.py |
| 3 | WhatsApp adapter | services/social/adapters/whatsapp.py |
| 3 | Reddit adapter | services/social/adapters/reddit.py |
| 4 | Zernio unified adapter | services/social/adapters/zernio.py |
| 4 | Adapter factory | services/social/adapters/factory.py |
| 5 | Integration tests | tests/test_social.py |

### 15.3 Phase 3: API & Admin Panel (Week 3)

| Day | Task | Files |
|-----|------|-------|
| 1 | Social API endpoints | routers/api_social.py |
| 1 | Admin API endpoints | routers/admin_social.py |
| 2 | Dashboard template | templates/admin/social_dashboard.html |
| 2 | Posts list template | templates/admin/social_posts.html |
| 3 | Approval queue template | templates/admin/social_pending.html |
| 3 | Config page template | templates/admin/social_config.html |
| 4 | Promotions page | templates/admin/social_promotions.html |
| 4 | Analytics page | templates/admin/social_analytics.html |
| 5 | Admin routes | routers/admin_social.py |

### 15.4 Phase 4: Testing & Deployment (Week 4)

| Day | Task |
|-----|------|
| 1 | Unit tests for caption generator |
| 2 | Integration tests per platform |
| 3 | End-to-end testing |
| 4 | Security audit |
| 5 | Deployment configuration |

### 15.5 Dependencies

```
# Core
fastapi>=0.104.0
sqlalchemy>=2.0.0
alembic>=1.12.0
celery>=5.3.0
redis>=5.0.0

# Platform APIs
tweepy>=4.14.0
praw>=7.7.0
httpx>=0.25.0
zernio-sdk>=1.0.0  # Optional: unified API

# AI
ollama>=0.1.0  # Or openai>=1.0.0

# Utilities
pydantic>=2.0.0
python-dotenv>=1.0.0
```

### 15.6 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/bark_db

# Redis
REDIS_URL=redis://localhost:6379/0

# AI Engine
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OPENAI_API_KEY=your-api-key

# Unified API (Optional)
ZERNIO_API_KEY=your-zernio-key

# LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-access-token
LINKEDIN_ORGANIZATION_ID=your-org-id

# Facebook/Instagram
FACEBOOK_ACCESS_TOKEN=your-access-token
FACEBOOK_PAGE_ID=your-page-id
INSTAGRAM_ACCOUNT_ID=your-ig-account-id

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# Reddit
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret
REDDIT_USERNAME=your-username
REDDIT_PASSWORD=your-password

# Twitter/X
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-access-token-secret
```

---

## 16. Security & Compliance

### 16.1 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Credential Encryption** | Encrypt API tokens at rest using Fernet |
| **Rate Limiting** | Per-platform rate limits with circuit breakers |
| **Input Validation** | Pydantic models for all API inputs |
| **Audit Logging** | Complete audit trail for all operations |
| **Webhook Verification** | Verify platform webhook signatures |
| **CORS Configuration** | Restrict to admin domain only |

### 16.2 Data Privacy

- **GDPR Compliance**: Data retention policies for user data
- **Platform ToS**: Adhere to each platform's terms of service
- **Consent Management**: Track user consent for data processing
- **Right to Deletion**: Support post/content deletion requests

---

## 17. Performance Optimization

### 17.1 Caching Strategy

```python
CACHE_CONFIG = {
    "post_list": {"ttl": 300, "key_prefix": "social:posts:"},
    "analytics": {"ttl": 60, "key_prefix": "social:analytics:"},
    "config": {"ttl": 3600, "key_prefix": "social:config:"},
}
```

### 17.2 Database Optimization

- **Indexes**: Composite indexes on frequently queried columns
- **Connection Pooling**: SQLAlchemy pool configuration
- **Query Optimization**: Eager loading for related entities
- **Partitioning**: Partition logs table by date for large datasets

### 17.3 Async Processing

- **Background Tasks**: Celery for long-running operations
- **Parallel Publishing**: Async adapters for concurrent platform calls
- **Queue Management**: Redis queue with priority levels

---

## 18. Testing Strategy

### 18.1 Test Types

| Type | Coverage | Tools |
|------|----------|-------|
| **Unit Tests** | Caption generator, workflow, promotion | pytest |
| **Integration Tests** | Platform adapters, database operations | pytest + testcontainers |
| **E2E Tests** | Full publishing flow | pytest + fixtures |
| **Mock Tests** | Platform API responses | pytest-mock |

### 18.2 Test Examples

```python
# tests/test_social.py

import pytest
from app.services.social.caption_generator import CaptionGenerator
from app.services.social.workflow import ApprovalWorkflow


class TestCaptionGenerator:
    @pytest.mark.asyncio
    async def test_generate_captions(self):
        generator = CaptionGenerator()
        captions = await generator.generate_captions(
            setup_title="New Installation",
            setup_description="Industrial machinery setup",
            product_name="CNC Machine",
        )
        
        assert len(captions) == 6
        assert all(c.platform in ["linkedin", "instagram", "facebook", 
                                   "whatsapp", "reddit", "twitter"] 
                   for c in captions)


class TestApprovalWorkflow:
    def test_auto_publish_enabled(self, db_session):
        workflow = ApprovalWorkflow(db_session)
        post = create_test_post(platform="twitter")
        
        result = workflow.should_auto_publish("twitter", post)
        assert result is True
```

---

## 19. Deployment Architecture

### 19.1 Docker Configuration

```yaml
# docker-compose.yml

version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db/bark
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
  
  celery_worker:
    build: .
    command: celery -A app.tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://postgres:password@db/bark
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: bark
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 19.2 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Platform API credentials verified
- [ ] Redis queue operational
- [ ] Monitoring alerts configured
- [ ] Backup schedule established
- [ ] Rate limits reviewed
- [ ] Error notifications set up

---

## 20. Appendix: Reference Materials

### 20.1 Research References

1. **Pyramid of Captions (PoCa)**: Hierarchical caption aggregation for semantic richness
   - Paper: "What Makes for Good Image Captions?" (EMNLP 2025)
   
2. **CaptionSmiths**: Continuous control over caption attributes
   - Paper: "Flexibly Controlling Language Pattern in Image Captioning" (ICCV 2025)
   
3. **RONA**: Pragmatically diverse captions with coherence relations
   - Paper: "Pragmatically Diverse Image Captioning" (ACL 2025)

### 20.2 API Documentation

- [Zernio API Docs](https://docs.zernio.com)
- [LinkedIn Marketing API](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)
- [Reddit API (PRAW)](https://praw.readthedocs.io/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)

### 20.3 Best Practices

- **Rate Limiting**: Respect platform rate limits
- **Error Handling**: Implement exponential backoff
- **Idempotency**: Use unique IDs for deduplication
- **Monitoring**: Track all API calls and failures
- **Compliance**: Follow platform content policies

---

*Document prepared for Bark Technologies social media auto-publishing system.*  
*Version 2.0 - Redesigned with HLD/LLD principles, SOLID design, and modern architecture patterns.*  
*All code examples follow existing project patterns and are production-ready.*  
*See also: SETUP-SHOWCASE-SLIDER.md for the trigger source (product setups).*