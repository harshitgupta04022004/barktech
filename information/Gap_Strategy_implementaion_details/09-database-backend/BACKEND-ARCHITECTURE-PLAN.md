# Backend Architecture Plan — Bark Technologies

> **Version**: 2.0 | **Date**: July 2026 | **Status**: HLD/LLD Implementation Guide
> **Stack**: FastAPI + SQLAlchemy 2.0 + PostgreSQL + Jinja2
> **Domain**: barktechnologies.in — Corrugated Machinery Company

---

## Table of Contents

1. [High-Level System Design (HLD)](#1-high-level-system-design-hld)
   - 1.1 [System Overview & Component Diagram](#11-system-overview--component-diagram)
   - 1.2 [Technology Stack Justification](#12-technology-stack-justification)
   - 1.3 [Deployment Architecture](#13-deployment-architecture)
   - 1.4 [Data Flow Overview](#14-data-flow-overview)
   - 1.5 [External Integrations](#15-external-integrations)
   - 1.6 [Security Architecture](#16-security-architecture)
2. [Low-Level System Design (LLD)](#2-low-level-system-design-lld)
   - 2.1 [Layered Architecture: API → Service → Repository → Database](#21-layered-architecture-api--service--repository--database)
   - 2.2 [SOLID Principles Application](#22-solid-principles-application)
   - 2.3 [Dependency Injection Patterns](#23-dependency-injection-patterns)
   - 2.4 [Error Handling Strategy](#24-error-handling-strategy)
   - 2.5 [Configuration Management](#25-configuration-management)
   - 2.6 [Authentication & Authorization Flow](#26-authentication--authorization-flow)
3. [Detailed Class/Module Structure](#3-detailed-classmodule-structure)
   - 3.1 [Package Structure with Responsibilities](#31-package-structure-with-responsibilities)
   - 3.2 [Key Interfaces and Abstractions](#32-key-interfaces-and-abstractions)
   - 3.3 [Service Layer Design](#33-service-layer-design)
   - 3.4 [Repository Pattern](#34-repository-pattern)
   - 3.5 [Schema Definitions (Pydantic v2)](#35-schema-definitions-pydantic-v2)
4. [Mermaid Diagrams](#4-mermaid-diagrams)
   - 4.1 [LLD Diagram: Class/Module Level Structure](#41-lld-diagram-classmodule-level-structure)
   - 4.2 [Flowchart: Request/Data Flow](#42-flowchart-requestdata-flow)
   - 4.3 [Sequence Diagram: Authenticated Request Lifecycle](#43-sequence-diagram-authenticated-request-lifecycle)
   - 4.4 [Component Diagram: Service Interactions](#44-component-diagram-service-interactions)
5. [Implementation Details (FastAPI-Specific)](#5-implementation-details-fastapi-specific)
   - 5.1 [Router Structure and Organization](#51-router-structure-and-organization)
   - 5.2 [Dependency Injection with Depends()](#52-dependency-injection-with-depends)
   - 5.3 [Pydantic v2 Schemas for Request/Response](#53-pydantic-v2-schemas-for-requestresponse)
   - 5.4 [SQLAlchemy 2.0 Async Patterns](#54-sqlalchemy-20-async-patterns)
   - 5.5 [Background Tasks with FastAPI BackgroundTasks](#55-background-tasks-with-fastapi-backgroundtasks)
   - 5.6 [OpenAPI Documentation Setup](#56-openapi-documentation-setup)
6. [Explanation Text: Connecting Diagrams to Design Decisions](#6-explanation-text-connecting-diagrams-to-design-decisions)
   - 6.1 [Why Layered Architecture](#61-why-layered-architecture)
   - 6.2 [Why Repository Pattern](#62-why-repository-pattern)
   - 6.3 [Why This Error Handling Strategy](#63-why-this-error-handling-strategy)
   - 6.4 [Trade-offs Considered](#64-trade-offs-considered)
   - 6.5 [How Components Interact End-to-End](#65-how-components-interact-end-to-end)
7. [Implementation Priority & Migration Plan](#7-implementation-priority--migration-plan)

---

## 1. High-Level System Design (HLD)

### 1.1 System Overview & Component Diagram

Bark Technologies is a corrugated machinery company website that serves as both a product catalog and a lead generation platform. The system is designed as a **modular monolith** — a single deployable unit with clear internal boundaries — because the team is small (1-2 developers) and the domain is cohesive.

The architecture follows the principle of **progressive decoupling**: start monolithic with clean internal boundaries, and extract services later only when scaling demands it.

#### System Component Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["Web Browser<br/>(HTML/CSS/JS)"]
        API_CLIENT["API Client<br/>(Future Mobile App)"]
        ADMIN["Admin Panel<br/>(Jinja2 + HTMX)"]
    end

    subgraph "Edge / CDN"
        CDN["Cloudflare CDN<br/>Static Assets"]
        WAF["Cloudflare WAF<br/>DDoS Protection"]
    end

    subgraph "Application Layer (FastAPI)"
        direction TB
        MW["Middleware Stack<br/>Security Headers, CORS, CSRF, Rate Limiting"]
        ROUTER["API Routers<br/>/api/v1/*"]
        AUTH["Auth Module<br/>JWT + RBAC"]
        SVC["Service Layer<br/>Business Logic"]
        REPO["Repository Layer<br/>Data Access"]
    end

    subgraph "AI Layer"
        LG["LangGraph Agent<br/>Chat Pipeline"]
        RETRIEVAL["Product Retrieval<br/>Grounded Context"]
        LLM["LLM Providers<br/>NVIDIA / Ollama"]
    end

    subgraph "Data Layer"
        PG["PostgreSQL<br/>Primary Database"]
        REDIS["Redis<br/>Cache + Rate Limit"]
        FS["File System<br/>Upload Storage"]
    end

    subgraph "External Services"
        SMTP["SMTP Email<br/>Gmail / Custom"]
        R2["Cloudflare R2<br/>Image Storage (Optional)"]
        NVIDIA_API["NVIDIA API<br/>LLM Inference"]
    end

    WEB --> CDN --> WAF --> MW
    API_CLIENT --> MW
    ADMIN --> MW
    MW --> ROUTER
    ROUTER --> AUTH
    ROUTER --> SVC
    SVC --> LG
    LG --> RETRIEVAL
    LG --> LLM
    SVC --> REPO
    REPO --> PG
    REPO --> REDIS
    SVC --> SMTP
    SVC --> R2
    SVC --> FS
    LLM --> NVIDIA_API
```

#### What the System Does

| Capability | Description |
|---|---|
| **Product Catalog** | Display corrugated machinery products with specs, media, documents, and related products |
| **AI Chat Assistant** | LLM-powered chat grounded in the product catalog for customer inquiries |
| **Lead Capture** | Inquiry forms with anti-spam, rate limiting, and email notifications |
| **Admin Dashboard** | Product CRUD, inquiry management, analytics overview |
| **SEO** | Server-rendered HTML pages with structured data, sitemap, robots.txt |

### 1.2 Technology Stack Justification

| Layer | Technology | Why This Choice | Alternatives Rejected |
|---|---|---|---|
| **Runtime** | Python 3.12 | Team knows Python; rich ecosystem for AI/ML | Node.js (no AI ecosystem advantage), Go (overkill for team size) |
| **Web Framework** | FastAPI 0.115+ | Async-native, auto OpenAPI docs, dependency injection built-in, Pydantic v2 validation | Django (heavier), Flask (no async, no DI), Litestar (smaller community) |
| **ORM** | SQLAlchemy 2.0 | Industry standard, async support, Alembic migrations, type-safe queries | Tortoise ORM (less mature), SQLModel (thin wrapper, same engine) |
| **Database** | PostgreSQL 16 | Full ACID, concurrent writes, full-text search, pgvector for future embeddings | MySQL (weaker JSON/search), SQLite (single-writer, no production scale) |
| **Template Engine** | Jinja2 | Server-side rendering for SEO, already in FastAPI, fast rendering | React (overkill, breaks SEO), HTMX (added as enhancement only) |
| **Validation** | Pydantic v2 | FastAPI native, type-safe, fast validation, serialization built-in | Marshmallow (slower), attrs (less ecosystem) |
| **Auth** | python-jose + passlib | JWT tokens, bcrypt hashing, battle-tested, lightweight | OAuth2 library (overkill for internal admin), Session-based (stateful) |
| **Cache/Queue** | Redis 7 | Rate limiting backing store, session cache, future task queue | Memcached (no persistence), RabbitMQ (overkill) |
| **Migrations** | Alembic | SQLAlchemy native, autogenerate, rollback support | Django-style (requires Django), manual SQL (error-prone) |
| **AI/LLM** | LangGraph + NVIDIA/Ollama | Stateful graph-based agent, local fallback, multi-provider support | LangChain alone (less control), raw API calls (no state management) |
| **Testing** | pytest + pytest-asyncio | Fast, async support, extensive plugin ecosystem | unittest (verbose), nose (deprecated) |
| **Containerization** | Docker + Docker Compose | Reproducible environments, easy deployment | Podman (less ecosystem), no container (deployment inconsistency) |

### 1.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (Edge)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   CDN    │  │   WAF    │  │   DDoS   │  │   SSL    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴─────────────┴──────────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Railway / Render (PaaS Hosting)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Docker Container                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Uvicorn  │  │ FastAPI  │  │ BackgroundTasks  │   │   │
│  │  │ Workers  │  │  App     │  │  (in-process)    │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  PostgreSQL      │  │  Redis           │                 │
│  │  (Railway)       │  │  (Upstash)       │                 │
│  │  500MB free      │  │  10K cmds/day    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘

Monthly Cost: ~$0-10/month (free tiers)
```

#### Environment Matrix

| Environment | Database | LLM | File Storage | Debug |
|---|---|---|---|---|
| **Development** | SQLite (local) | Ollama (local) | Local filesystem | True |
| **Staging** | PostgreSQL (Railway) | NVIDIA API | Local filesystem | True |
| **Production** | PostgreSQL (Railway) | NVIDIA API + Ollama fallback | Cloudflare R2 | False |

### 1.4 Data Flow Overview

```
Customer visits barktechnologies.in
        │
        ├── Product Browsing Flow
        │   Browser → CDN (static) → FastAPI → PostgreSQL → HTML Response
        │
        ├── AI Chat Flow
        │   Browser → FastAPI Chat Endpoint → LangGraph Agent
        │       → Retrieve Catalog Context → LLM (NVIDIA/Ollama)
        │       → Generate Grounded Response → Stream Back
        │
        ├── Inquiry Submission Flow
        │   Browser → FastAPI Inquiry Endpoint → Rate Limiter Check
        │       → Validation → PostgreSQL (save) → Email Notification
        │
        └── Admin Flow
            Admin Panel → FastAPI Admin Endpoint → JWT Auth Check
                → RBAC Check → Service → Repository → PostgreSQL
```

### 1.5 External Integrations

| Integration | Protocol | Purpose | Failure Handling |
|---|---|---|---|
| **NVIDIA LLM API** | HTTPS REST | AI chat inference | Fallback to Ollama -> offline reply |
| **Ollama (Local)** | HTTP REST | Local LLM fallback | Fallback to offline canned response |
| **SMTP (Gmail)** | SMTP/TLS | Inquiry notifications | Log failure, don't block inquiry creation |
| **Cloudflare R2** | S3-compatible | Image storage (production) | Fallback to local filesystem |
| **Redis (Upstash)** | HTTPS REST | Rate limiting, cache | In-memory fallback for development |

### 1.6 Security Architecture

```
┌──────────────────────────────────────────────────┐
│                  Security Layers                  │
├──────────────────────────────────────────────────┤
│  Layer 1: Edge (Cloudflare WAF, DDoS, SSL)       │
├──────────────────────────────────────────────────┤
│  Layer 2: Transport (HTTPS enforced, HSTS)       │
├──────────────────────────────────────────────────┤
│  Layer 3: Application                            │
│    ├── Security Headers (CSP, X-Frame-Options)   │
│    ├── CORS (origin whitelist)                   │
│    ├── CSRF Protection (state-changing endpoints) │
│    ├── Rate Limiting (slowapi, per-IP/per-user)  │
│    └── Input Validation (Pydantic at boundary)   │
├──────────────────────────────────────────────────┤
│  Layer 4: Authentication (JWT Bearer tokens)     │
├──────────────────────────────────────────────────┤
│  Layer 5: Authorization (RBAC: admin/editor)     │
├──────────────────────────────────────────────────┤
│  Layer 6: Data (parameterized queries, no raw SQL)│
└──────────────────────────────────────────────────┘
```

#### Role-Based Access Control (RBAC)

| Role | Products | Inquiries | Users | Analytics | System |
|---|---|---|---|---|---|
| **admin** | Full CRUD | Full CRUD | Full CRUD | Full access | Full access |
| **editor** | Create, Update | Read, Update status | — | View only | — |
| **viewer** | Read only | Read only | — | — | — |
| **anonymous** | Read (published only) | Create (rate-limited) | — | — | — |

---

## 2. Low-Level System Design (LLD)

### 2.1 Layered Architecture: API -> Service -> Repository -> Database

The system follows a strict **4-layer architecture** where dependencies flow **inward only** (API -> Service -> Repository -> Database). Each layer has a single responsibility and only communicates with its immediate neighbor.

```
┌─────────────────────────────────────────────────────┐
│                  API Layer (Routers)                  │
│  - HTTP request parsing                             │
│  - Pydantic validation                              │
│  - Authentication/Authorization checks              │
│  - Call service methods                             │
│  - Format HTTP responses                            │
│  - NO business logic                                │
│  - NO database access                               │
├─────────────────────────────────────────────────────┤
│               Service Layer (Business Logic)         │
│  - Business rules and validation                    │
│  - Orchestration across repositories                │
│  - Transaction coordination                         │
│  - Domain-specific transformations                  │
│  - External service integration (email, storage)    │
│  - NO HTTP/Request objects                          │
│  - NO Pydantic schemas (except for output)          │
├─────────────────────────────────────────────────────┤
│              Repository Layer (Data Access)          │
│  - SQLAlchemy ORM queries                           │
│  - CRUD operations                                  │
│  - Query building and filtering                     │
│  - flush() (NOT commit) — transaction managed by    │
│    the dependency                                   │
│  - NO business logic                                │
│  - NO HTTP concepts                                 │
├─────────────────────────────────────────────────────┤
│                 Database Layer (PostgreSQL)          │
│  - Table definitions (via Alembic migrations)       │
│  - Indexes and constraints                          │
│  - Stored procedures (if needed)                    │
│  - Connection pooling (asyncpg)                     │
└─────────────────────────────────────────────────────┘

DEPENDENCY RULE: Arrows point INWARD only.
  API → Service → Repository → Database
  A lower layer NEVER imports from a higher layer.
```

#### Why This Layering

1. **Testability**: Services can be unit-tested by mocking repositories. Routers can be tested with a test client without touching the database.
2. **Swappability**: The database can be changed (SQLite -> PostgreSQL -> MongoDB) by only modifying the repository layer.
3. **Maintainability**: Business logic lives in one place (services), not scattered across route handlers.
4. **Clarity**: Every developer knows exactly where to find business rules, database queries, and HTTP handling.

#### Dependency Flow Rules

| Layer | CAN Import From | CANNOT Import From |
|---|---|---|
| **API (Routers)** | Service, Schema, Core (deps, security) | Repository, Database, Model |
| **Service** | Repository, Schema (output only), Core | Router, Request/Response |
| **Repository** | Model, Database session | Service, Router, Schema |
| **Schema** | (Pure Pydantic — no imports from above) | Any layer |

### 2.2 SOLID Principles Application

#### Single Responsibility Principle (SRP)

Each module/class has exactly **one reason to change**:

| Component | Responsibility | Why One Responsibility |
|---|---|---|
| `ProductRouter` | HTTP request handling for products | Changes only when API contract changes |
| `ProductService` | Product business logic | Changes only when product rules change |
| `ProductRepository` | Product data access | Changes only when DB schema changes |
| `ProductSchema` | Product API contract definition | Changes only when API shape changes |
| `InquiryService` | Inquiry business logic | Changes only when inquiry rules change |
| `EmailService` | Email delivery | Changes only when email provider changes |
| `ChatGraph` | LLM orchestration flow | Changes only when agent architecture changes |
| `SecurityModule` | JWT + password hashing | Changes only when auth scheme changes |

**Current Violation Fixed**: The existing `chat_graph.py` (271 lines) mixes graph definition, LLM provider selection, prompt management, and fallback logic. This must be split into:
- `chat/orchestrator.py` — LangGraph graph definition and node wiring
- `chat/providers.py` — LLM provider registry and selection
- `chat/prompts.py` — System prompt templates
- `chat/fallback.py` — Offline/fallback response logic

#### Open/Closed Principle (OCP)

Software entities should be **open for extension, closed for modification**:

```python
# GOOD: LLM provider registry — new providers added without modifying existing code
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """Abstract base for all LLM providers."""

    @abstractmethod
    async def generate(self, messages: list[dict], **kwargs) -> str:
        """Generate a response from the LLM."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this provider is currently reachable."""
        ...


class NVIDIAProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    async def generate(self, messages: list[dict], **kwargs) -> str:
        # NVIDIA API implementation
        ...

    def is_available(self) -> bool:
        return bool(self.api_key)


class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model

    async def generate(self, messages: list[dict], **kwargs) -> str:
        # Ollama API implementation
        ...

    def is_available(self) -> bool:
        # Check if Ollama is running locally
        ...


class LLMProviderRegistry:
    """Registry of available LLM providers with fallback chain."""

    def __init__(self):
        self._providers: list[LLMProvider] = []

    def register(self, provider: LLMProvider) -> None:
        self._providers.append(provider)

    async def generate(self, messages: list[dict], **kwargs) -> str:
        for provider in self._providers:
            if provider.is_available():
                return await provider.generate(messages, **kwargs)
        raise LLMUnavailable("No LLM providers available")

# Adding a new provider requires NO changes to existing code:
# registry.register(AnthropicProvider(api_key="..."))
```

**Current Violation Fixed**: The existing if/elif chain in `chat_graph.py` (provider == "ollama" / provider == "nvidia") must be replaced with this registry pattern.

#### Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types without altering correctness:

```python
# GOOD: All repository implementations are interchangeable
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional

ModelType = TypeVar("ModelType")

class BaseRepository(ABC, Generic[ModelType]):
    """Abstract repository interface that all implementations must satisfy."""

    @abstractmethod
    async def get_by_id(self, id: int) -> Optional[ModelType]:
        ...

    @abstractmethod
    async def create(self, data: dict) -> ModelType:
        ...

    @abstractmethod
    async def update(self, id: int, data: dict) -> Optional[ModelType]:
        ...

    @abstractmethod
    async def delete(self, id: int) -> bool:
        ...

    @abstractmethod
    async def list(
        self, offset: int = 0, limit: int = 100, **filters
    ) -> list[ModelType]:
        ...


class PostgresProductRepository(BaseRepository[Product]):
    """PostgreSQL implementation — can be swapped with SQLite, In-Memory, etc."""

    async def get_by_id(self, id: int) -> Optional[Product]:
        result = await self.session.execute(
            select(Product).where(Product.id == id)
        )
        return result.scalar_one_or_none()
    # ... other methods

# This works identically regardless of which repository implementation is used
async def get_product(repo: BaseRepository[Product], product_id: int) -> Product:
    product = await repo.get_by_id(product_id)
    if product is None:
        raise ProductNotFoundError(product_id)
    return product
```

#### Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they don't use:

```python
# GOOD: Thin, focused interfaces
class ProductReadRepository(ABC):
    """Read-only product operations."""
    async def get_by_id(self, id: int) -> Optional[Product]: ...
    async def get_by_slug(self, slug: str) -> Optional[Product]: ...
    async def list_published(self, offset: int, limit: int) -> list[Product]: ...
    async def search(self, query: str, offset: int, limit: int) -> list[Product]: ...


class ProductWriteRepository(ABC):
    """Write-only product operations."""
    async def create(self, data: ProductCreate) -> Product: ...
    async def update(self, id: int, data: ProductUpdate) -> Optional[Product]: ...
    async def delete(self, id: int) -> bool: ...
    async def toggle_publish(self, id: int) -> bool: ...


# Services use only what they need:
class PublicProductService:
    """Public-facing product service — only reads."""
    def __init__(self, read_repo: ProductReadRepository):
        self.read_repo = read_repo  # Doesn't need write operations

class AdminProductService:
    """Admin product service — reads and writes."""
    def __init__(
        self,
        read_repo: ProductReadRepository,
        write_repo: ProductWriteRepository,
    ):
        self.read_repo = read_repo
        self.write_repo = write_repo
```

#### Dependency Inversion Principle (DIP)

High-level modules should depend on abstractions, not concretions:

```python
# GOOD: Services depend on repository interfaces, not database sessions directly
class ProductService:
    """Business logic depends on repository abstraction, not SQLAlchemy."""

    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo  # Depends on abstraction

    async def get_product_detail(self, slug: str) -> dict:
        product = await self.product_repo.get_by_slug(slug)
        if not product:
            raise ProductNotFoundError(slug)
        # Business rule: only published products visible publicly
        if not product.published:
            raise ProductNotFoundError(slug)
        return product_to_detail(product)


# Wiring via FastAPI dependency injection:
def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    repo = PostgresProductRepository(session=db)
    return ProductService(product_repo=repo)
```

### 2.3 Dependency Injection Patterns

FastAPI's `Depends()` is the primary DI mechanism. We use three patterns:

#### Pattern 1: Annotated Type Aliases (Cleanest)

```python
# app/dependencies.py
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User

# Clean type aliases — import these instead of writing Depends() everywhere
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin)]
EditorUser = Annotated[User, Depends(require_editor)]
```

```python
# app/routers/v1/products.py — using annotated aliases
@router.get("/{slug}", response_model=ProductDetailOut)
async def get_product(
    slug: str,
    db: DbSession,           # Clean! No Depends() in route signatures
    service: ProductService = Depends(get_product_service),
):
    return await service.get_by_slug(slug)
```

#### Pattern 2: Factory Dependencies (for services that need DB)

```python
# app/dependencies.py

def get_product_service(db: DbSession) -> ProductService:
    """Create a ProductService with the current request's DB session."""
    repo = PostgresProductRepository(session=db)
    return ProductService(product_repo=repo)

def get_inquiry_service(db: DbSession) -> InquiryService:
    repo = PostgresInquiryRepository(session=db)
    return InquiryService(
        inquiry_repo=repo,
        email_service=get_email_service(),
    )
```

#### Pattern 3: Override Dependencies (for testing)

```python
# tests/conftest.py
from app.main import app
from app.dependencies import get_product_service

class FakeProductRepository(BaseRepository[Product]):
    """In-memory repository for testing."""
    def __init__(self):
        self._store: dict[int, Product] = {}

    async def get_by_id(self, id: int) -> Optional[Product]:
        return self._store.get(id)
    # ... other methods

def override_get_product_service():
    repo = FakeProductRepository()
    return ProductService(product_repo=repo)

# Override in test setup
app.dependency_overrides[get_product_service] = override_get_product_service
```

### 2.4 Error Handling Strategy

Errors are handled at three levels: **domain exceptions**, **global handlers**, and **response formatting**.

#### Domain Exception Hierarchy

```python
# app/core/exceptions.py

class AppError(Exception):
    """Base application error — all custom exceptions inherit from this."""
    status_code: int = 500
    error_code: str = "internal_error"
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None):
        if message:
            self.message = message
        super().__init__(self.message)


class NotFoundError(AppError):
    """Resource not found."""
    status_code = 404
    error_code = "not_found"


class ProductNotFoundError(NotFoundError):
    error_code = "product_not_found"
    message = "Product not found"


class InquiryNotFoundError(NotFoundError):
    error_code = "inquiry_not_found"
    message = "Inquiry not found"


class ValidationError(AppError):
    """Business rule validation failed."""
    status_code = 400
    error_code = "validation_error"


class DuplicateEmailError(ValidationError):
    error_code = "duplicate_email"
    message = "An inquiry with this email already exists"


class AuthenticationError(AppError):
    """Authentication failed."""
    status_code = 401
    error_code = "unauthorized"
    message = "Invalid or expired credentials"


class AuthorizationError(AppError):
    """Insufficient permissions."""
    status_code = 403
    error_code = "forbidden"
    message = "You don't have permission to perform this action"


class RateLimitError(AppError):
    """Rate limit exceeded."""
    status_code = 429
    error_code = "rate_limited"
    message = "Too many requests. Please try again later."
```

#### Global Exception Handlers

```python
# app/middleware/exception_handlers.py

from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError

def setup_exception_handlers(app: FastAPI):
    """Register global exception handlers on the app."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        if request.url.path.startswith("/api/"):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": {
                        "code": exc.error_code,
                        "message": exc.message,
                    }
                },
            )
        # For HTML pages, return appropriate template
        # ...

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        if request.url.path.startswith("/api/"):
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "internal_error",
                        "message": "An unexpected error occurred",
                    }
                },
            )
        # ...
```

#### Error Response Schema

```python
# app/schemas/errors.py

from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: list[dict] | None = None  # For validation errors

class ErrorResponse(BaseModel):
    error: ErrorDetail
```

### 2.5 Configuration Management

All configuration is centralized in a single `Settings` class using `pydantic-settings`. Settings are loaded from `.env` and validated at startup.

```python
# app/config.py

from __future__ import annotations
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "Bark Technologies"
    app_env: str = "development"  # development | staging | production
    debug: bool = True
    secret_key: str = Field(description="JWT signing secret — generate with openssl rand -hex 32")
    base_url: str = "http://localhost:8000"

    # Database
    database_url: str = "sqlite+aiosqlite:///./bark.db"
    # Production: postgresql+asyncpg://user:pass@host:5432/bark_db

    # JWT Authentication
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Admin (seeded on first run)
    admin_email: str = "admin@barktechnologies.in"
    admin_password: str = Field(description="Set a strong password for production")

    # LLM / Chat
    chat_provider: str = "nvidia"
    nvidia_api_key: str = ""
    nvidia_model: str = Field(
        default="meta/llama-3.1-8b-instruct",
        validation_alias="NVIDIA_MODEL",
    )
    nvidia_api_base: str = "https://integrate.api.nvidia.com/v1"
    nvidia_timeout: float = 120.0
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3.5:9b"
    ollama_timeout: float = 120.0

    # Email (SMTP)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "info@barktechnologies.in"
    smtp_from_name: str = "Bark Technologies"

    # File Storage
    upload_dir: str = "app/static/uploads"
    max_upload_size_mb: int = 10
    allowed_image_types: list[str] = ["image/jpeg", "image/png", "image/webp"]

    # Cloudflare R2 (optional, for production)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    # Rate Limiting
    rate_limit_default: str = "200/minute"
    rate_limit_public_api: str = "60/minute"
    rate_limit_admin_api: str = "120/minute"
    rate_limit_chat: str = "30/minute"
    rate_limit_inquiry: str = "10/hour"

    # Site Contact Info
    contact_phone: str = "+91 8810597980"
    contact_email: str = "info@barktechnologies.in"
    whatsapp_number: str = "918810597980"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings instance — cached after first call."""
    return Settings()
```

### 2.6 Authentication & Authorization Flow

#### JWT Token Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant Auth
    participant DB

    Note over Client,DB: LOGIN FLOW
    Client->>Router: POST /api/v1/auth/login {email, password}
    Router->>Auth: verify_credentials(email, password)
    Auth->>DB: get_user_by_email(email)
    DB-->>Auth: User row
    Auth-->>Auth: bcrypt.verify(password, hashed)
    Auth-->>Router: User object
    Router-->>Client: {access_token, refresh_token, expires_in}

    Note over Client,DB: AUTHENTICATED REQUEST
    Client->>Router: GET /api/v1/admin/products<br/>Authorization: Bearer <token>
    Router->>Auth: get_current_user(token)
    Auth-->>Auth: decode JWT -> TokenData{sub, role}
    Auth->>DB: get_user_by_id(sub)
    DB-->>Auth: User row
    Auth-->>Router: User with role
    Router->>Auth: require_role("admin", "editor")
    Auth-->>Router: Role matches
    Router->>Router: call service method
    Router-->>Client: Product list response

    Note over Client,DB: TOKEN REFRESH
    Client->>Router: POST /api/v1/auth/refresh {refresh_token}
    Router->>Auth: decode_token(refresh_token)
    Auth-->>Auth: verify type=="refresh", not expired
    Router-->>Client: New access_token + refresh_token
```

#### RBAC Implementation

```python
# app/core/security.py

def require_role(*allowed_roles: str):
    """Dependency factory — checks if current user has an allowed role."""

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise AuthorizationError(
                message=f"Required role: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


# Pre-built role dependencies
require_admin = require_role("admin")
require_editor = require_role("admin", "editor")
require_viewer = require_role("admin", "editor", "viewer")
```

```python
# app/routers/v1/admin.py — using role dependencies

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: DbSession,
    _: AdminUser = Depends(require_admin),  # Admin only
):
    """Delete a product — admin only."""
    await product_service.delete_product(db, product_id)
    return {"message": "Product deleted"}


@router.put("/products/{product_id}/publish")
async def toggle_publish(
    product_id: int,
    db: DbSession,
    _: EditorUser = Depends(require_editor),  # Editor+ role
):
    """Toggle publish status — editor or admin."""
    return await product_service.toggle_publish(db, product_id)
```

---

## 3. Detailed Class/Module Structure

### 3.1 Package Structure with Responsibilities

```
bark/
├── app/
│   ├── __init__.py
│   ├── main.py                    # App factory, lifespan, middleware registration
│   ├── config.py                  # Pydantic Settings (typed, validated)
│   ├── database.py                # Engine, SessionLocal, Base, get_db()
│   ├── dependencies.py            # Annotated type aliases (DbSession, CurrentUser)
│   │
│   ├── core/                      # Cross-cutting concerns
│   │   ├── __init__.py
│   │   ├── security.py            # JWT creation/verification, password hashing
│   │   ├── deps.py                # Auth dependency functions (get_current_user, require_role)
│   │   ├── exceptions.py          # Domain exception hierarchy (AppError, NotFoundError, etc.)
│   │   └── events.py              # Background task utilities
│   │
│   ├── models/                    # SQLAlchemy ORM models (database tables)
│   │   ├── __init__.py            # Re-exports all models for Alembic autogenerate
│   │   ├── base.py                # Base class with common columns (id, created_at, updated_at)
│   │   ├── product.py             # Category, Product, ProductSpec, ProductMedia, ProductDocument
│   │   ├── lead.py                # Inquiry
│   │   ├── chat.py                # ChatSession, ChatMessage
│   │   ├── user.py                # User (for authentication)
│   │   ├── site.py                # SiteSetting
│   │   └── cart.py                # Cart, CartItem (future e-commerce)
│   │
│   ├── schemas/                   # Pydantic v2 models (API contract)
│   │   ├── __init__.py
│   │   ├── common.py              # PaginationParams, PaginatedResponse, ErrorResponse
│   │   ├── product.py             # ProductCreate, ProductUpdate, ProductCardOut, ProductDetailOut
│   │   ├── inquiry.py             # InquiryCreate, InquiryOut
│   │   ├── chat.py                # ChatRequest, ChatResponse, ChatHistoryOut
│   │   ├── auth.py                # LoginRequest, TokenResponse, RegisterRequest
│   │   ├── user.py                # UserCreate, UserUpdate, UserOut
│   │   └── errors.py              # ErrorDetail, ErrorResponse
│   │
│   ├── repositories/              # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py                # BaseRepository[ModelType] — generic CRUD
│   │   ├── product_repo.py        # ProductRepository — product-specific queries
│   │   ├── category_repo.py       # CategoryRepository — category queries
│   │   ├── inquiry_repo.py        # InquiryRepository — inquiry queries
│   │   ├── chat_repo.py           # ChatRepository — chat session/message queries
│   │   ├── user_repo.py           # UserRepository — user queries
│   │   └── site_repo.py           # SiteSettingRepository
│   │
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── product_service.py     # Product CRUD, slug validation, publish toggle
│   │   ├── inquiry_service.py     # Inquiry creation, validation, deduplication
│   │   ├── chat_service.py        # Chat orchestration (not LLM-specific)
│   │   ├── auth_service.py        # Login, register, token refresh
│   │   ├── email_service.py       # SMTP email delivery
│   │   ├── file_service.py        # Image upload, optimization, deletion
│   │   └── analytics_service.py   # Dashboard statistics, inquiry trends
│   │
│   ├── chat/                      # AI/LLM subsystem (isolated module)
│   │   ├── __init__.py
│   │   ├── orchestrator.py        # LangGraph graph definition and node wiring
│   │   ├── providers.py           # LLM provider registry (NVIDIA, Ollama, fallback)
│   │   ├── prompts.py             # System prompt templates
│   │   ├── retrieval.py           # Product catalog retrieval for grounded context
│   │   ├── fallback.py            # Offline/canned responses
│   │   └── log.py                 # Chat session/message persistence
│   │
│   ├── routers/                   # API layer (HTTP handling only)
│   │   ├── __init__.py
│   │   ├── pages.py               # Server-rendered HTML pages (product list, detail, about)
│   │   └── v1/                    # Versioned API endpoints
│   │       ├── __init__.py
│   │       ├── products.py        # GET /products, GET /products/{slug}
│   │       ├── categories.py      # GET /categories
│   │       ├── inquiries.py       # POST /inquiries
│   │       ├── chat.py            # POST /chat, GET /chat/history
│   │       ├── auth.py            # POST /auth/login, POST /auth/refresh
│   │       └── admin.py           # Admin CRUD endpoints
│   │
│   ├── middleware/                 # HTTP middleware
│   │   ├── __init__.py
│   │   ├── security.py            # Security headers (CSP, HSTS, X-Frame-Options)
│   │   ├── cors.py                # CORS configuration
│   │   ├── rate_limit.py          # slowapi rate limiter setup
│   │   └── request_logging.py     # Request timing and correlation IDs
│   │
│   ├── templates/                 # Jinja2 HTML templates
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── product_list.html
│   │   ├── product_detail.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── news.html
│   │   ├── compare.html
│   │   ├── creasing-matrix.html
│   │   ├── 404.html
│   │   ├── 500.html
│   │   ├── admin/                 # Admin panel templates
│   │   └── partials/              # Reusable template components
│   │
│   └── static/                    # Static assets
│       ├── css/
│       ├── js/
│       └── uploads/
│
├── alembic/                       # Database migrations
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
│
├── tests/
│   ├── conftest.py                # Test fixtures, dependency overrides
│   ├── test_services/             # Service unit tests
│   ├── test_repositories/         # Repository tests
│   ├── test_routers/              # API endpoint tests
│   └── test_chat/                 # Chat subsystem tests
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── requirements.txt
└── README.md
```

### 3.2 Key Interfaces and Abstractions

#### Repository Base Interface

```python
# app/repositories/base.py

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Type, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(ABC, Generic[ModelType]):
    """Generic repository providing standard CRUD operations.

    Subclass this and set `model` to get free get/list/create/update/delete.
    Add domain-specific query methods as needed.
    """

    model: Type[ModelType]

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        return await self.session.get(self.model, id)

    async def create(self, data: dict) -> ModelType:
        """Create a new record from a dictionary."""
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: int, data: dict) -> Optional[ModelType]:
        """Update a record by ID with the given fields."""
        instance = await self.get_by_id(id)
        if instance is None:
            return None
        for key, value in data.items():
            if hasattr(instance, key) and value is not None:
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, id: int) -> bool:
        """Delete a record by ID. Returns True if deleted."""
        instance = await self.get_by_id(id)
        if instance is None:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True

    async def list(
        self,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """List records with pagination."""
        stmt = (
            select(self.model)
            .offset(offset)
            .limit(min(limit, 200))
            .order_by(self.model.id.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, **filters) -> int:
        """Count records matching optional filters."""
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar_one()
```

#### Product Repository (Domain-Specific)

```python
# app/repositories/product_repo.py

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.product import Product, Category
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """Product-specific database operations."""

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        """Fetch a product by its URL slug."""
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.specs),
                selectinload(Product.media),
                selectinload(Product.documents),
            )
            .where(Product.slug == slug)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_published(
        self, offset: int = 0, limit: int = 20
    ) -> list[Product]:
        """List published products for public display."""
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.media),
            )
            .where(Product.published.is_(True))
            .order_by(Product.id.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def search(
        self, query: str, offset: int = 0, limit: int = 20
    ) -> list[Product]:
        """Full-text search on product name and summary."""
        stmt = (
            select(Product)
            .where(Product.published.is_(True))
            .where(
                Product.name.ilike(f"%{query}%")
                | Product.summary.ilike(f"%{query}%")
            )
            .order_by(Product.id.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_with_relations(
        self, offset: int = 0, limit: int = 20, **filters
    ) -> tuple[list[Product], int]:
        """List products with category/media relations, with total count."""
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.media),
            )
        )

        # Apply filters
        if "published" in filters:
            stmt = stmt.where(Product.published.is_(filters["published"]))
        if "category_slug" in filters:
            stmt = stmt.join(Category).where(
                Category.slug == filters["category_slug"]
            )
        if "search" in filters:
            stmt = stmt.where(
                Product.name.ilike(f"%{filters['search']}%")
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        # Fetch page
        stmt = stmt.order_by(Product.id.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        products = list(result.scalars().unique().all())

        return products, total
```

### 3.3 Service Layer Design

Services contain business logic and orchestrate repositories. They are **framework-agnostic** — they don't import FastAPI, Request, or any HTTP concepts.

```python
# app/services/product_service.py

from __future__ import annotations

import re
from typing import Optional

from app.repositories.product_repo import ProductRepository
from app.models.product import Product
from app.core.exceptions import (
    ProductNotFoundError,
    ValidationError,
    DuplicateSlugError,
)


class ProductService:
    """Product business logic — orchestrates ProductRepository.

    This class has NO knowledge of FastAPI, HTTP, or Request objects.
    It depends only on the ProductRepository interface (Dependency Inversion).
    """

    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    async def get_by_slug(self, slug: str) -> Product:
        """Get a published product by slug. Raises if not found or unpublished."""
        product = await self.product_repo.get_by_slug(slug)
        if product is None:
            raise ProductNotFoundError(f"Product '{slug}' not found")
        if not product.published:
            raise ProductNotFoundError(f"Product '{slug}' not found")
        return product

    async def get_by_id(self, product_id: int) -> Product:
        """Get any product by ID (admin use — includes unpublished)."""
        product = await self.product_repo.get_by_id(product_id)
        if product is None:
            raise ProductNotFoundError(f"Product ID {product_id} not found")
        return product

    async def list_published(
        self, page: int = 1, limit: int = 20
    ) -> dict:
        """List published products with pagination."""
        offset = max(0, (page - 1) * limit)
        products, total = await self.product_repo.list_with_relations(
            offset=offset,
            limit=limit,
            published=True,
        )
        pages = (total + limit - 1) // limit if total else 0
        return {
            "items": products,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1,
        }

    async def create_product(self, data: dict) -> Product:
        """Create a new product with business rule validation."""
        # Validate slug format
        self._validate_slug(data.get("slug", ""))

        # Check slug uniqueness
        existing = await self.product_repo.get_by_slug(data["slug"])
        if existing:
            raise DuplicateSlugError(f"Slug '{data['slug']}' already exists")

        return await self.product_repo.create(data)

    async def update_product(self, product_id: int, data: dict) -> Product:
        """Update product with business rule validation."""
        # Ensure product exists
        await self.get_by_id(product_id)

        # Validate slug if being changed
        if "slug" in data:
            self._validate_slug(data["slug"])

        updated = await self.product_repo.update(product_id, data)
        if updated is None:
            raise ProductNotFoundError(f"Product ID {product_id} not found")
        return updated

    async def toggle_publish(self, product_id: int) -> dict:
        """Toggle the published status of a product."""
        product = await self.get_by_id(product_id)
        product.published = not product.published
        await self.product_repo.session.flush()
        return {"id": product.id, "published": product.published}

    async def delete_product(self, product_id: int) -> None:
        """Delete a product by ID."""
        deleted = await self.product_repo.delete(product_id)
        if not deleted:
            raise ProductNotFoundError(f"Product ID {product_id} not found")

    async def search_products(
        self, query: str, page: int = 1, limit: int = 20
    ) -> dict:
        """Search products by name or summary."""
        offset = max(0, (page - 1) * limit)
        products = await self.product_repo.search(
            query=query, offset=offset, limit=limit
        )
        return {
            "items": products,
            "total": len(products),
            "page": page,
            "limit": limit,
        }

    async def get_related_products(
        self, product_id: int, limit: int = 4
    ) -> list[Product]:
        """Get products in the same category as the given product."""
        product = await self.get_by_id(product_id)
        if product.category_id is None:
            return []
        all_in_category = await self.product_repo.list_with_relations(
            limit=limit + 1, category_id=product.category_id
        )
        return [
            p for p in all_in_category
            if p.id != product_id
        ][:limit]

    @staticmethod
    def _validate_slug(slug: str) -> None:
        """Validate slug format — lowercase alphanumeric with hyphens only."""
        if not slug or not re.match(r"^[a-z0-9\-]+$", slug):
            raise ValidationError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )
        if len(slug) < 3:
            raise ValidationError("Slug must be at least 3 characters")
```

### 3.4 Repository Pattern

The repository pattern abstracts database operations behind an interface, enabling:

1. **Testability**: Swap real DB with in-memory stores during tests
2. **Separation**: Business logic never touches SQLAlchemy directly
3. **Flexibility**: Change database engine without touching services

#### Transaction Management

```python
# app/database.py

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """Yield a database session per request.

    CRITICAL: Repositories call flush() — NOT commit().
    The commit happens here after the route handler returns successfully.
    If the handler raises an exception, the session rolls back automatically.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

**Key Rule**: Repository methods call `session.flush()`, never `session.commit()`. The `get_db` dependency handles commit/rollback. This ensures multiple repository calls in one request share a single atomic transaction.

### 3.5 Schema Definitions (Pydantic v2)

Schemas define the API contract — what goes in and what comes out. They are completely separate from SQLAlchemy models.

```python
# app/schemas/product.py

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# -- Output Schemas (what the API returns) --

class CategoryOut(BaseModel):
    """Category as returned in API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class SpecOut(BaseModel):
    """Product specification key-value pair."""
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str


class MediaOut(BaseModel):
    """Product media (image/document)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    media_type: str
    url: str
    alt_text: str | None = None
    is_primary: bool = False
    sort_order: int = 0


class DocumentOut(BaseModel):
    """Product document (PDF, etc.)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str


class ProductCardOut(BaseModel):
    """Minimal product data for card/list views."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    summary: str
    models: str | None = None
    category: CategoryOut | None = None
    primary_image: str | None = None

    @classmethod
    def from_product(cls, product) -> ProductCardOut:
        """Convert a Product ORM object to ProductCardOut."""
        primary_media = next(
            (m for m in product.media if m.is_primary),
            product.media[0] if product.media else None,
        )
        return cls(
            id=product.id,
            name=product.name,
            slug=product.slug,
            summary=product.summary,
            models=product.models,
            category=CategoryOut.model_validate(product.category) if product.category else None,
            primary_image=primary_media.url if primary_media else None,
        )


class ProductDetailOut(BaseModel):
    """Full product data for detail views."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    summary: str
    description: str | None = None
    models: str | None = None
    category: CategoryOut | None = None
    specs: list[SpecOut] = []
    media: list[MediaOut] = []
    documents: list[DocumentOut] = []
    meta_title: str | None = None
    meta_description: str | None = None
    published: bool = True
    created_at: datetime | None = None

    @classmethod
    def from_product(cls, product) -> ProductDetailOut:
        """Convert a full Product ORM object to ProductDetailOut."""
        return cls(
            id=product.id,
            name=product.name,
            slug=product.slug,
            summary=product.summary,
            description=product.description,
            models=product.models,
            category=CategoryOut.model_validate(product.category) if product.category else None,
            specs=[SpecOut.model_validate(s) for s in product.specs],
            media=[MediaOut.model_validate(m) for m in sorted(product.media, key=lambda m: m.sort_order)],
            documents=[DocumentOut.model_validate(d) for d in product.documents],
            meta_title=product.meta_title,
            meta_description=product.meta_description,
            published=product.published,
            created_at=product.created_at,
        )


# -- Input Schemas (what the API accepts) --

class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(..., min_length=2, max_length=300)
    slug: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=10, max_length=1000)
    description: str | None = None
    models: str | None = None
    category_id: int | None = None
    meta_title: str | None = Field(None, max_length=300)
    meta_description: str | None = Field(None, max_length=500)


class ProductUpdate(BaseModel):
    """Schema for updating an existing product (all fields optional)."""
    name: str | None = Field(None, min_length=2, max_length=300)
    slug: str | None = Field(None, min_length=3, max_length=200)
    summary: str | None = Field(None, min_length=10, max_length=1000)
    description: str | None = None
    models: str | None = None
    category_id: int | None = None
    meta_title: str | None = Field(None, max_length=300)
    meta_description: str | None = Field(None, max_length=500)


# -- Pagination Schema --

class PaginatedProducts(BaseModel):
    """Standard paginated response for product lists."""
    items: list[ProductCardOut]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
```

---

## 4. Mermaid Diagrams

### 4.1 LLD Diagram: Class/Module Level Structure

This diagram shows the class and module-level architecture, including how key abstractions connect:

```mermaid
classDiagram
    direction TB

    class FastAPIApp {
        +setup_middleware()
        +include_routers()
        +setup_exception_handlers()
    }

    class ProductRouter {
        +list_products()
        +get_product(slug)
        +get_related(slug)
    }

    class AdminRouter {
        +list_all_products()
        +create_product()
        +update_product()
        +delete_product()
        +toggle_publish()
        +list_inquiries()
        +update_inquiry_status()
    }

    class InquiryRouter {
        +create_inquiry()
    }

    class ChatRouter {
        +send_message()
        +get_history()
        +end_session()
    }

    class AuthRouter {
        +login()
        +refresh_token()
        +get_profile()
        +register_user()
    }

    class ProductService {
        -product_repo: ProductRepository
        +get_by_slug(slug)
        +get_by_id(id)
        +list_published(page, limit)
        +create_product(data)
        +update_product(id, data)
        +delete_product(id)
        +toggle_publish(id)
        +search_products(query)
        +get_related_products(id)
    }

    class InquiryService {
        -inquiry_repo: InquiryRepository
        -email_service: EmailService
        +create_inquiry(data)
        +list_inquiries(filters)
        +update_status(id, status)
    }

    class ChatService {
        -chat_repo: ChatRepository
        -orchestrator: ChatOrchestrator
        +send_message(session_id, message)
        +get_history(session_id)
        +end_session(session_id)
    }

    class AuthService {
        -user_repo: UserRepository
        +login(email, password)
        +register(data)
        +refresh(refresh_token)
        +get_profile(user_id)
    }

    class BaseRepository~ModelType~ {
        &lt;&lt;abstract&gt;&gt;
        +session: AsyncSession
        +get_by_id(id)
        +create(data)
        +update(id, data)
        +delete(id)
        +list(offset, limit)
        +count()
    }

    class ProductRepository {
        +get_by_slug(slug)
        +list_published(offset, limit)
        +search(query, offset, limit)
        +list_with_relations(offset, limit, filters)
    }

    class InquiryRepository {
        +list_with_product(offset, limit, filters)
        +count_by_status()
    }

    class UserRepository {
        +get_by_email(email)
        +get_by_username(username)
    }

    class ChatRepository {
        +get_or_create_session(session_id)
        +add_message(session_id, role, content)
        +get_messages(session_id, limit)
    }

    class EmailService {
        +send_email(to, subject, html)
        +send_inquiry_notification(inquiry)
        +send_inquiry_confirmation(to, name)
    }

    class ChatOrchestrator {
        -graph: StateGraph
        -providers: LLMProviderRegistry
        +invoke(session_id, message)
    }

    class LLMProviderRegistry {
        -providers: list~LLMProvider~
        +register(provider)
        +generate(messages)
    }

    class LLMProvider {
        &lt;&lt;abstract&gt;&gt;
        +generate(messages)
        +is_available()
    }

    class NVIDIAProvider {
        +api_key: str
        +model: str
        +generate(messages)
        +is_available()
    }

    class OllamaProvider {
        +base_url: str
        +model: str
        +generate(messages)
        +is_available()
    }

    class SecurityModule {
        +hash_password(password)
        +verify_password(plain, hashed)
        +create_access_token(data)
        +create_refresh_token(data)
        +decode_token(token)
    }

    class RBACMiddleware {
        +get_current_user(token)
        +require_role(*roles)
    }

    FastAPIApp --> ProductRouter
    FastAPIApp --> AdminRouter
    FastAPIApp --> InquiryRouter
    FastAPIApp --> ChatRouter
    FastAPIApp --> AuthRouter

    ProductRouter --> ProductService
    AdminRouter --> ProductService
    InquiryRouter --> InquiryService
    ChatRouter --> ChatService
    AuthRouter --> AuthService

    ProductService --> ProductRepository
    InquiryService --> InquiryRepository
    ChatService --> ChatRepository
    AuthService --> UserRepository

    ProductRepository --|> BaseRepository~Product~
    InquiryRepository --|> BaseRepository~Inquiry~
    UserRepository --|> BaseRepository~User~

    InquiryService --> EmailService
    ChatService --> ChatOrchestrator
    ChatOrchestrator --> LLMProviderRegistry
    LLMProviderRegistry --> LLMProvider
    NVIDIAProvider --|> LLMProvider
    OllamaProvider --|> LLMProvider

    AdminRouter --> RBACMiddleware
    AuthRouter --> SecurityModule
```

### 4.2 Flowchart: Request/Data Flow

This flowchart shows how an HTTP request flows through every layer, including error handling paths:

```mermaid
graph TD
    START([HTTP Request]) --> MW{Middleware Check}
    MW -->|Security Headers| CORS{CORS Check}
    MW -->|Rate Limit Exceeded| RATE_ERR[429 Too Many Requests]

    CORS -->|Origin Allowed| AUTH_CHECK{Requires Auth?}
    CORS -->|Origin Blocked| CORS_ERR[403 CORS Forbidden]

    AUTH_CHECK -->|No| VALIDATE{Pydantic Validation}
    AUTH_CHECK -->|Yes| JWT_CHECK{JWT Valid?}

    JWT_CHECK -->|Invalid/Expired| AUTH_ERR[401 Unauthorized]
    JWT_CHECK -->|Valid| ROLE_CHECK{Role Sufficient?}
    ROLE_CHECK -->|No| FORBID_ERR[403 Forbidden]
    ROLE_CHECK -->|Yes| VALIDATE

    VALIDATE -->|Invalid| VALID_ERR[422 Validation Error]
    VALIDATE -->|Valid| SVC_CALL[Call Service Method]

    SVC_CALL --> SVC_LOGIC{Business Logic}
    SVC_LOGIC -->|Not Found| NOT_FOUND_ERR[404 Not Found]
    SVC_LOGIC -->|Validation Rule| BIZ_ERR[400 Bad Request]
    SVC_LOGIC -->|Success| REPO_CALL[Call Repository]

    REPO_CALL --> DB_QUERY[Execute Database Query]
    DB_QUERY -->|Success| DB_RESULT[Return Result]
    DB_QUERY -->|DB Error| DB_ERR[500 Database Error]

    DB_RESULT --> REPO_RETURN[Repository Returns to Service]
    REPO_RETURN --> SVC_TRANSFORM[Service Transforms Data]
    SVC_TRANSFORM --> SCHEMA_VALIDATE[Pydantic Schema Serialization]
    SCHEMA_VALIDATE --> RESPONSE[200 JSON Response]

    NOT_FOUND_ERR --> ERROR_HANDLER[Global Exception Handler]
    BIZ_ERR --> ERROR_HANDLER
    AUTH_ERR --> ERROR_HANDLER
    FORBID_ERR --> ERROR_HANDLER
    VALID_ERR --> ERROR_HANDLER
    RATE_ERR --> ERROR_HANDLER
    DB_ERR --> ERROR_HANDLER
    CORS_ERR --> ERROR_HANDLER

    ERROR_HANDLER --> ERROR_FORMAT[Format Error Response]
    ERROR_FORMAT --> ERROR_RESP[Error JSON Response]

    RESPONSE --> END([Response Sent])
    ERROR_RESP --> END

    style START fill:#4CAF50,color:#fff
    style END fill:#4CAF50,color:#fff
    style ERROR_HANDLER fill:#FF5722,color:#fff
    style SVC_CALL fill:#2196F3,color:#fff
    style REPO_CALL fill:#9C27B0,color:#fff
    style DB_QUERY fill:#FF9800,color:#fff
```

### 4.3 Sequence Diagram: Authenticated Request Lifecycle

This shows the complete lifecycle of a JWT-authenticated admin request:

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Middleware
    participant AuthDeps as Auth Dependencies
    participant Router as API Router
    participant Service
    participant Repository
    participant DB as PostgreSQL

    Browser->>Middleware: GET /api/v1/admin/products<br/>Authorization: Bearer eyJhbG...

    Note over Middleware: Security headers added<br/>CORS validated<br/>Rate limit checked

    Middleware->>AuthDeps: get_current_user(token)
    AuthDeps->>AuthDeps: decode JWT -> TokenData{sub: "1", role: "admin"}
    AuthDeps->>DB: SELECT * FROM users WHERE id = 1
    DB-->>AuthDeps: User row
    AuthDeps->>AuthDeps: Check is_active == True
    AuthDeps-->>Router: User(id=1, role="admin")

    Router->>AuthDeps: require_role("admin", "editor")
    AuthDeps->>AuthDeps: "admin" in ["admin", "editor"] -> OK
    AuthDeps-->>Router: User(id=1, role="admin")

    Router->>Service: list_all_products(page=1, limit=20)
    Service->>Repository: list_with_relations(offset=0, limit=20)
    Repository->>DB: SELECT products.*, categories.*, media.*<br/>FROM products<br/>LEFT JOIN categories ...<br/>LIMIT 20 OFFSET 0
    DB-->>Repository: Product rows with relations
    Repository-->>Service: list[Product]

    Service->>Service: Transform to response format
    Service-->>Router: PaginatedResponse{items, total, ...}

    Router-->>Browser: 200 OK<br/>{"items": [...], "total": 45, ...}
```

### 4.4 Component Diagram: Service Interactions

This shows how different services interact with each other and external systems:

```mermaid
graph LR
    subgraph "Public API"
        P1[Product Router] --> P2[Product Service]
        I1[Inquiry Router] --> I2[Inquiry Service]
        C1[Chat Router] --> C2[Chat Service]
    end

    subgraph "Admin API"
        A1[Admin Router] --> A2[Product Service]
        A1 --> A3[Inquiry Service]
        A1 --> A4[Analytics Service]
    end

    subgraph "Auth"
        AUTH1[Auth Router] --> AUTH2[Auth Service]
    end

    subgraph "Data Access"
        P2 --> PREPO[Product Repository]
        I2 --> IREPO[Inquiry Repository]
        C2 --> CREPO[Chat Repository]
        AUTH2 --> UREPO[User Repository]
        A4 --> PREPO
        A4 --> IREPO
    end

    subgraph "External Services"
        I2 --> EMAIL[Email Service]
        EMAIL --> SMTP[(SMTP Server)]
        C2 --> ORCH[Chat Orchestrator]
        ORCH --> REG[Provider Registry]
        REG --> NVIDIA[NVIDIA API]
        REG --> OLLAMA[Ollama Local]
    end

    subgraph "Database"
        PREPO --> PG[(PostgreSQL)]
        IREPO --> PG
        CREPO --> PG
        UREPO --> PG
    end

    subgraph "Storage"
        A1 --> FS[File Service]
        FS --> LOCAL[Local Filesystem]
        FS --> R2[Cloudflare R2]
    end
```

---

## 5. Implementation Details (FastAPI-Specific)

### 5.1 Router Structure and Organization

Routers are thin — they parse HTTP requests, validate input, call services, and format responses. Business logic never lives in routers.

```python
# app/routers/v1/products.py

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.dependencies import DbSession
from app.schemas.product import (
    ProductCardOut,
    ProductDetailOut,
    PaginatedProducts,
)
from app.services.product_service import ProductService
from app.dependencies import get_product_service

router = APIRouter(tags=["Products"])


@router.get("", response_model=PaginatedProducts)
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Category slug"),
    db: DbSession = None,
    service: ProductService = Depends(get_product_service),
):
    """List published products with pagination, search, and category filter."""
    result = await service.list_published(
        page=page,
        limit=limit,
        search=search,
        category=category,
    )
    # Convert ORM objects to Pydantic schemas
    items = [ProductCardOut.from_product(p) for p in result["items"]]
    return PaginatedProducts(
        items=items,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        pages=result["pages"],
        has_next=result["has_next"],
        has_prev=result["has_prev"],
    )


@router.get("/{slug}", response_model=ProductDetailOut)
async def get_product(
    slug: str,
    db: DbSession = None,
    service: ProductService = Depends(get_product_service),
):
    """Get a single product by its URL slug."""
    product = await service.get_by_slug(slug)
    return ProductDetailOut.from_product(product)


@router.get("/{slug}/related", response_model=list[ProductCardOut])
async def get_related_products(
    slug: str,
    limit: int = Query(4, ge=1, le=10),
    db: DbSession = None,
    service: ProductService = Depends(get_product_service),
):
    """Get products related to the given product (same category)."""
    product = await service.get_by_slug(slug)
    related = await service.get_related_products(product.id, limit=limit)
    return [ProductCardOut.from_product(p) for p in related]
```

### 5.2 Dependency Injection with Depends()

FastAPI's `Depends()` is the backbone of our DI system. Every external dependency flows through it.

```python
# app/dependencies.py

from __future__ import annotations

from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, require_admin, require_editor
from app.models.user import User

# -- Database Session --
DbSession = Annotated[AsyncSession, Depends(get_db)]

# -- Authentication --
CurrentUser = Annotated[User, Depends(get_current_user)]

# -- Role-Based Authorization --
AdminUser = Annotated[User, Depends(require_admin)]
EditorUser = Annotated[User, Depends(require_editor)]
```

```python
# app/dependencies.py — service factories

from app.services.product_service import ProductService
from app.services.inquiry_service import InquiryService
from app.services.chat_service import ChatService
from app.services.auth_service import AuthService
from app.repositories.product_repo import PostgresProductRepository
from app.repositories.inquiry_repo import PostgresInquiryRepository
from app.repositories.user_repo import PostgresUserRepository
from app.services.email_service import EmailService


def get_product_service(db: DbSession) -> ProductService:
    """Factory: create ProductService with current request's DB session."""
    repo = PostgresProductRepository(session=db)
    return ProductService(product_repo=repo)


def get_inquiry_service(db: DbSession) -> InquiryService:
    """Factory: create InquiryService with dependencies."""
    repo = PostgresInquiryRepository(session=db)
    email_svc = EmailService()
    return InquiryService(inquiry_repo=repo, email_service=email_svc)


def get_chat_service(db: DbSession) -> ChatService:
    """Factory: create ChatService with dependencies."""
    from app.repositories.chat_repo import PostgresChatRepository
    from app.chat.orchestrator import ChatOrchestrator

    repo = PostgresChatRepository(session=db)
    orchestrator = ChatOrchestrator()
    return ChatService(chat_repo=repo, orchestrator=orchestrator)


def get_auth_service(db: DbSession) -> AuthService:
    """Factory: create AuthService with user repository."""
    user_repo = PostgresUserRepository(session=db)
    return AuthService(user_repo=user_repo)
```

### 5.3 Pydantic v2 Schemas for Request/Response

Pydantic v2 is used for all request validation and response serialization. Key practices:

```python
# app/schemas/inquiry.py

from __future__ import annotations

import re
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime


class InquiryCreate(BaseModel):
    """Schema for incoming inquiry form submissions."""
    name: str = Field(..., min_length=2, max_length=200)
    email: str = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=200)
    city: str | None = Field(None, max_length=100)
    message: str | None = Field(None, max_length=5000)
    product_id: int | None = None
    source: str = Field(default="web", max_length=50)

    # Honeypot field — should be empty for real users
    website: str = Field(default="", max_length=200)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = re.sub(r"[\s\-\+]", "", v)
        if not cleaned.isdigit() or len(cleaned) < 8:
            raise ValueError("Invalid phone number")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if re.search(r"['\";\\<>]", v):
            raise ValueError("Invalid characters in name")
        return v

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class InquiryOut(BaseModel):
    """Inquiry as returned in API/admin responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None = None
    company: str | None = None
    city: str | None = None
    message: str | None = None
    source: str
    status: str
    product_name: str | None = None
    created_at: datetime


class InquiryListResponse(BaseModel):
    """Paginated list of inquiries."""
    items: list[InquiryOut]
    total: int
    page: int
    limit: int
    pages: int
```

### 5.4 SQLAlchemy 2.0 Async Patterns

The project uses SQLAlchemy 2.0 with async support via `asyncpg` (PostgreSQL) or `aiosqlite` (development):

```python
# app/models/base.py

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models.

    Provides common columns that every table should have.
    Uses SQLAlchemy 2.0 Mapped[] type annotations.
    """
    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```

```python
# app/models/product.py

from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Text, Float, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    summary = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    models = Column(String(500), nullable=True)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="products")

    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    documents = relationship("ProductDocument", back_populates="product", cascade="all, delete-orphan")

    published = Column(Boolean, default=False, nullable=False, index=True)

    meta_title = Column(String(300), nullable=True)
    meta_description = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ProductSpec(Base):
    __tablename__ = "product_specs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(200), nullable=False)
    value = Column(String(1000), nullable=False)
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="specs")


class ProductMedia(Base):
    __tablename__ = "product_media"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(50), nullable=False, default="image")  # image, video, document
    url = Column(String(500), nullable=False)
    alt_text = Column(String(300), nullable=True)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="media")


class ProductDocument(Base):
    __tablename__ = "product_documents"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    url = Column(String(500), nullable=False)

    product = relationship("Product", back_populates="documents")


class RelatedProduct(Base):
    __tablename__ = "related_products"
    __table_args__ = (
        UniqueConstraint("product_id", "related_id", name="uq_product_related"),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    related_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
```

### 5.5 Background Tasks with FastAPI BackgroundTasks

Non-blocking operations (email, file processing) are offloaded to background tasks:

```python
# app/routers/v1/inquiries.py

from fastapi import APIRouter, BackgroundTasks, Depends
from app.dependencies import DbSession
from app.schemas.inquiry import InquiryCreate, InquiryOut
from app.services.inquiry_service import InquiryService
from app.dependencies import get_inquiry_service

router = APIRouter(tags=["Inquiries"])


@router.post("", response_model=InquiryOut, status_code=201)
async def create_inquiry(
    data: InquiryCreate,
    background_tasks: BackgroundTasks,
    db: DbSession,
    service: InquiryService = Depends(get_inquiry_service),
):
    """Submit a new inquiry. Email notifications sent in background."""
    # Honeypot check
    if data.website:
        return InquiryOut(
            id=0, name="", email="", source="web",
            status="spam", created_at=datetime.now(),
        )

    inquiry = await service.create_inquiry(data)

    # Email notifications happen in background — don't block the response
    background_tasks.add_task(
        service.send_notifications,
        inquiry=inquiry,
    )

    return InquiryOut.model_validate(inquiry)
```

```python
# app/services/inquiry_service.py — background task method

class InquiryService:
    """Business logic for inquiry management."""

    def __init__(self, inquiry_repo, email_service):
        self.inquiry_repo = inquiry_repo
        self.email_service = email_service

    async def create_inquiry(self, data: InquiryCreate) -> Inquiry:
        """Create a new inquiry with business rule validation."""
        # Check honeypot
        if data.website:
            raise ValidationError("Invalid submission")

        # Business rule: check for duplicate recent inquiry
        recent = await self.inquiry_repo.find_recent_by_email(
            email=data.email, hours=24
        )
        if recent:
            raise DuplicateInquiryError(
                "You've already submitted an inquiry recently. We'll get back to you."
            )

        return await self.inquiry_repo.create(data.model_dump(exclude={"website"}))

    def send_notifications(self, inquiry: Inquiry) -> None:
        """Send email notifications — runs as a background task.

        Note: This method is synchronous because FastAPI BackgroundTasks
        run in a thread pool for sync functions.
        """
        try:
            self.email_service.send_inquiry_notification({
                "name": inquiry.name,
                "email": inquiry.email,
                "phone": inquiry.phone,
                "company": inquiry.company,
                "source": inquiry.source,
                "message": inquiry.message,
            })
            self.email_service.send_inquiry_confirmation(
                to_email=inquiry.email,
                name=inquiry.name,
            )
        except Exception as e:
            logger.error(f"Failed to send inquiry notifications: {e}")
            # Don't raise — background task failures shouldn't affect the response
```

### 5.6 OpenAPI Documentation Setup

FastAPI auto-generates OpenAPI docs. We customize them for clarity:

```python
# app/main.py

from fastapi import FastAPI
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Bark Technologies API",
    description="""
    ## Bark Technologies — Corrugated Machinery Platform

    ### Public Endpoints
    - **Products**: Browse the product catalog with search, filter, and pagination
    - **Categories**: List product categories
    - **Inquiries**: Submit product inquiries (rate-limited)
    - **Chat**: AI-powered product assistant

    ### Admin Endpoints (JWT Required)
    - **Auth**: Login, register, token refresh
    - **Product Management**: Full CRUD for products, specs, media
    - **Inquiry Management**: View and update inquiry status
    - **Analytics**: Dashboard statistics and trends
    """,
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    openapi_tags=[
        {
            "name": "Products",
            "description": "Public product catalog endpoints",
        },
        {
            "name": "Categories",
            "description": "Product category listings",
        },
        {
            "name": "Inquiries",
            "description": "Customer inquiry submission",
        },
        {
            "name": "Chat",
            "description": "AI-powered product assistant",
        },
        {
            "name": "Authentication",
            "description": "Login, register, and token management",
        },
        {
            "name": "Admin — Products",
            "description": "Product CRUD for admin/editor roles",
        },
        {
            "name": "Admin — Inquiries",
            "description": "Inquiry management for admin/editor roles",
        },
        {
            "name": "Admin — Analytics",
            "description": "Dashboard statistics and trends",
        },
    ],
)
```

---

## 6. Explanation Text: Connecting Diagrams to Design Decisions

### 6.1 Why Layered Architecture

The 4-layer architecture (API -> Service -> Repository -> Database) was chosen over alternatives for several concrete reasons:

**Compared to "fat route handlers"** (putting business logic directly in route handlers):
- Fat handlers work for 5-10 endpoints but become unmaintainable at 50+ endpoints
- Business logic gets duplicated across handlers (e.g., the existing codebase has product queries in both `api_products.py` and `api_admin.py`)
- Testing requires spinning up a web server and HTTP client
- The layered approach lets us unit test business logic in isolation with simple Python functions

**Compared to full Clean Architecture (DDD)** (with Use Cases, Interactors, Entity objects):
- DDD adds 3-4 extra abstraction layers that are overkill for a product catalog site
- The team size (1-2 developers) doesn't justify the overhead of maintaining domain entities separate from ORM models
- Clean Architecture is designed for complex domains with many business rules — corrugated machinery product listings don't have that complexity
- We get 80% of the benefit with 30% of the complexity using a simpler layered approach

**The practical benefit**: When we need to add a new feature (e.g., "product comparison"), we know exactly where to put each piece:
- New endpoint -> `routers/v1/products.py`
- New business rule -> `services/product_service.py`
- New database query -> `repositories/product_repo.py`
- New API contract -> `schemas/product.py`

### 6.2 Why Repository Pattern

The repository pattern was introduced to fix a specific problem in the current codebase: **direct ORM access from routers**.

**Current violation** (from `api_admin.py`):
```python
# BAD: Router directly queries the ORM
product = db.get(Product, product_id)
if not product:
    raise HTTPException(status_code=404, detail="Product not found")
```

**Fixed with repository pattern**:
```python
# GOOD: Router calls service, service calls repository
product = await service.get_by_id(product_id)  # Service handles not-found logic
```

The repository pattern provides:
1. **Single source of truth for queries**: If "get product by slug with relations" needs to change (e.g., adding `selectinload` for performance), it changes in one place, not in 5 different routers
2. **Transaction safety**: Repositories call `flush()` instead of `commit()`. The `get_db` dependency handles commit/rollback. This means if a service makes 3 repository calls and the third fails, all three are rolled back atomically
3. **Testability**: In tests, we replace `PostgresProductRepository` with `FakeProductRepository` (in-memory dict). No database needed for service unit tests

**Why flush() instead of commit()**: This is the most critical implementation detail. If repositories call `commit()`, then:
- Each repository call commits immediately — no atomic transactions across multiple calls
- If the second of three calls fails, the first is already committed — data inconsistency
- The `get_db` dependency can't control the transaction boundary

With `flush()`, all changes are written to the database buffer but not committed until `get_db` calls `commit()` after the route handler returns successfully. If any exception occurs, `get_db` calls `rollback()` and everything is undone.

### 6.3 Why This Error Handling Strategy

The three-tier error handling strategy (domain exceptions -> global handlers -> response formatting) was designed to solve the current codebase's inconsistencies:

**Current problem**: HTTP error codes are mixed with business logic:
```python
# BAD: Business logic knows about HTTP status codes
raise HTTPException(status_code=404, detail="Product not found")
```

**Fixed approach**: Business logic raises domain exceptions, handlers convert to HTTP:
```python
# Service layer — knows nothing about HTTP
raise ProductNotFoundError(f"Product '{slug}' not found")

# Global handler converts to HTTP response
@app.exception_handler(ProductNotFoundError)
async def handle_not_found(request, exc):
    return JSONResponse(
        status_code=exc.status_code,  # 404
        content={"error": {"code": exc.error_code, "message": exc.message}},
    )
```

Benefits:
1. **Services are framework-agnostic**: They can be called from CLI scripts, background tasks, or tests without needing FastAPI
2. **Consistent error format**: All API errors follow the same `{"error": {"code": "...", "message": "..."}}` structure
3. **Easy to add new exception types**: Just subclass `AppError` and set the status code
4. **Separation of concerns**: HTTP status codes are a presentation detail, not a business rule

### 6.4 Trade-offs Considered

| Decision | Chose | Rejected | Why |
|---|---|---|---|
| **Sync vs Async DB** | Async (SQLAlchemy 2.0 + asyncpg) | Sync with `run_in_executor` | True concurrency for I/O-bound operations; future-proof for growth |
| **Repository as classes** | Class-based repositories | Function-based repositories | Better for testing (mock the class), clearer interface, supports inheritance |
| **Schema converters in schemas/** | `ProductCardOut.from_product()` | `product_to_card()` standalone functions | Encapsulates conversion with the schema that uses it; IDE-friendly |
| **Annotated type aliases** | `DbSession = Annotated[Session, Depends(get_db)]` | Repeating `Depends(get_db)` everywhere | Cleaner route signatures, single place to change session type |
| **LLM provider registry** | Strategy pattern with registry | if/elif chain | Open for extension (new providers) without modifying existing code |
| **Email in background tasks** | `BackgroundTasks` | Celery/Redis Queue | Team size doesn't justify separate worker infrastructure; free |
| **Alembic for migrations** | Alembic autogenerate | Manual SQL, `create_all()` | Version-controlled schema, rollback support, team collaboration |
| **Jinja2 for admin** | Server-rendered HTML | React SPA | Faster to build, SEO-friendly, team knows HTML/CSS/JS |
| **Error hierarchy** | Custom `AppError` subclasses | Raw `HTTPException` everywhere | Framework-agnostic services, consistent error format |

### 6.5 How Components Interact End-to-End

Let's trace a real user journey to show how all components work together:

**Scenario**: A visitor searches for "flexo printer" on the website.

1. **Browser** sends `GET /api/v1/products?search=flexo+printer&page=1`

2. **Middleware** adds security headers, checks CORS, checks rate limit (60/min for public API — OK)

3. **Router** (`products.py:list_products`):
   - Extracts query params: `search="flexo printer"`, `page=1`, `limit=20`
   - Validates via Pydantic Query parameters
   - Calls `service.list_published(page=1, limit=20, search="flexo printer")`

4. **Service** (`product_service.py:list_published`):
   - Calculates offset: `(1-1) * 20 = 0`
   - Calls `product_repo.list_with_relations(offset=0, limit=20, published=True, search="flexo printer")`

5. **Repository** (`product_repo.py:list_with_relations`):
   - Builds SQLAlchemy query: `SELECT products.* FROM products WHERE published = true AND (name ILIKE '%flexo printer%' OR summary ILIKE '%flexo printer%')`
   - Executes query, returns `list[Product]`

6. **Back in Service**: Calculates pagination metadata (total, pages, has_next, has_prev)

7. **Back in Router**: Converts ORM objects to `ProductCardOut` schemas using `ProductCardOut.from_product()`

8. **Response**: `200 OK` with `{"items": [...], "total": 3, "page": 1, ...}`

**Scenario**: An admin creates a new product.

1. **Browser** sends `POST /api/v1/admin/products` with JWT token

2. **Middleware** -> CORS OK -> Rate limit OK

3. **Auth Dependency** (`get_current_user`):
   - Extracts JWT from `Authorization: Bearer ...` header
   - Decodes JWT -> `TokenData{sub: "1", role: "admin"}`
   - Fetches user from database
   - Checks `is_active == True`

4. **Role Dependency** (`require_role("admin", "editor")`):
   - Checks `"admin" in ["admin", "editor"]` -> OK

5. **Router** (`admin.py:create_product`):
   - Parses JSON body into `ProductCreate` schema (Pydantic validation)
   - Calls `service.create_product(data.model_dump())`

6. **Service** (`product_service.py:create_product`):
   - Validates slug format (business rule)
   - Checks slug uniqueness via repository
   - Calls `product_repo.create(data)`

7. **Repository** (`product_repo.py`):
   - Creates `Product` ORM object from data dict
   - `session.add(product)` -> `session.flush()` (writes to DB buffer, gets auto-generated ID)

8. **Back in Service**: Returns created `Product` object

9. **Back in Router**: Returns `201 Created` with `{"id": 42, "slug": "flexo-printer-1200", "message": "Product created"}`

10. **get_db dependency**: Calls `session.commit()` — all changes are now permanent in PostgreSQL

---

## 7. Implementation Priority & Migration Plan

### Phase 1: Foundation (Week 1-2)

| Task | Effort | Priority |
|---|---|---|
| Create `core/` package (exceptions, security, deps) | 2 days | Critical |
| Create `repositories/` package (base + product) | 2 days | Critical |
| Refactor `ProductService` to use repository | 1 day | Critical |
| Switch to PostgreSQL + Alembic | 1 day | Critical |
| Add User model + JWT auth | 2 days | High |
| Update all routers to use service layer | 1 day | High |

### Phase 2: Core Features (Week 3-4)

| Task | Effort | Priority |
|---|---|---|
| Complete all repositories (inquiry, chat, user) | 2 days | High |
| Refactor all services to use repositories | 2 days | High |
| Add email notifications (background tasks) | 1 day | Medium |
| Add file upload service + optimization | 1 day | Medium |
| Refactor chat subsystem (split monolith) | 2 days | Medium |

### Phase 3: Hardening (Week 5)

| Task | Effort | Priority |
|---|---|---|
| Add request logging middleware | 1 day | Medium |
| Docker + docker-compose setup | 1 day | High |
| Environment variable documentation | 0.5 day | Medium |
| Security headers + CORS hardening | 0.5 day | High |

### Phase 4: Polish (Week 6+)

| Task | Effort | Priority |
|---|---|---|
| Unit tests for services | 2 days | High |
| Unit tests for repositories | 1 day | Medium |
| Integration tests for API endpoints | 1 day | Medium |
| E-commerce preparation (Cart/Order models) | 3 days | Low |

### Cost Summary

| Service | Free Tier | Paid (if needed) |
|---|---|---|
| PostgreSQL (Railway) | 500MB, 100hrs | $5/mo for 1GB |
| Redis (Upstash) | 10K cmds/day | $0.2/10K cmds |
| Cloudflare R2 | 10GB storage | $0.015/GB/month |
| Hosting (Railway/Render) | — | $5-10/mo |
| **Total** | **~$0/month** | **~$10-15/month** |

---

## Appendix: Research Sources (2026 Best Practices)

This architecture document was informed by the following 2026 sources:

1. **"Full-Stack Clean Architecture: Best Practices with FastAPI, React, and PostgreSQL"** (Medium, May 2026) — Confirmed the Routes -> Services -> Repositories -> Models one-way dependency flow, DIP through dependency injection via `app/core/container.py`, and LSP through interchangeable repository implementations.

2. **"Building a Production-Grade FastAPI Backend with Clean Layered Architecture"** (Stackademic, 2026) — Validated the layered architecture approach with strict dependency rules: API talks to Service, Service talks to Domain and Data, Data talks to Infrastructure. Emphasized that the service layer must not import FastAPI or any HTTP concepts.

3. **"Production-Ready FastAPI Project Structure (2026 Guide)"** (DEV Community, 2026) — Confirmed the recommended package structure (api/, services/, repositories/, schemas/, models/, core/), typed configuration via Pydantic Settings, and the three-layer pattern as the highest-value pattern for maintainability.

4. **"Python Design Patterns for Clean Architecture"** (Glukhov, 2026) — Provided the Concentric Layers model (Entities -> Use Cases -> Interface Adapters -> Frameworks & Drivers) and validated that SOLID principles form the foundation of clean architecture in Python.

5. **"CLAUDE.md Example for FastAPI + SQLAlchemy"** (Claude Code Guides, 2026) — Confirmed the `BaseRepository[ModelType]` generic pattern, the rule that repositories call `flush()` not `commit()`, and the Annotated type alias pattern for dependency injection.

6. **"Conceptual AI Agents Universe — System Design Document"** (Engineering Notes, Feb 2026) — Provided the FastAPI + SQLAlchemy 2.0 async + Redis + PostgreSQL stack reference for AI-integrated applications, and validated the modular monolith approach with in-process middleware.

7. **"LLD and HLD in Software Engineering"** (Medium, 2026) — Confirmed the HLD/LLD document structure: HLD covers system overview, tech stack, deployment architecture, and data flow; LLD covers class structures, database schemas, API specifications, and error handling.

---

*Document prepared for Bark Technologies backend architecture redesign. All code examples follow 2026 FastAPI best practices with SOLID principles applied throughout. Version 2.0 — HLD/LLD structured.*
