# Bark Technologies — Deployment & DevOps Plan
## High-Level Design (HLD) & Low-Level Design (LLD)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [HIGH-LEVEL DEPLOYMENT ARCHITECTURE (HLD)](#2-high-level-deployment-architecture-hld)
3. [LOW-LEVEL DEPLOYMENT DESIGN (LLD)](#3-low-level-deployment-design-lld)
4. [SOLID PRINCIPLES IN DEVOPS](#4-solid-principles-in-devops)
5. [MERMAID DIAGRAMS](#5-mermaid-diagrams)
6. [IMPLEMENTATION DETAILS](#6-implementation-details)
7. [OPERATIONAL PROCEDURES](#7-operational-procedures)
8. [Troubleshooting Guide](#8-troubleshooting-guide)
9. [Quick Start Guide](#9-quick-start-guide)

---

## 1. Executive Summary

This document provides a comprehensive deployment and DevOps plan for the Bark Technologies website, built with **FastAPI** and **PostgreSQL**. The plan follows High-Level Design (HLD) and Low-Level Design (LLD) principles, incorporating SOLID design principles for maintainable and scalable infrastructure.

**Key Features:**
- Cost-effective deployment targeting Railway/Render/VPS
- Docker containerization with multi-stage builds
- Automated CI/CD pipelines with GitHub Actions
- Comprehensive monitoring and logging
- Security hardening and best practices
- Disaster recovery and backup strategies

**Project Context:**
- Traffic: Low (< 500 visitors/month)
- Stack: FastAPI + PostgreSQL + Docker
- Domain: barktechnologies.in

---

## 2. HIGH-LEVEL DEPLOYMENT ARCHITECTURE (HLD)

### 2.1 Deployment Topology Diagram

```mermaid
graph TB
    subgraph Internet
        Users[Users]
        CDN[CDN - Cloudflare]
    end
    subgraph LoadBalancerLayer
        LB[Load Balancer]
    end
    subgraph ApplicationLayer
        App1[FastAPI App 1]
        App2[FastAPI App 2]
    end
    subgraph ServiceLayer
        Redis[Redis Cache]
        Celery[Celery Workers]
    end
    subgraph DataLayer
        PG[PostgreSQL Primary]
        PG_Replica[PostgreSQL Replica]
    end
    subgraph MonitoringLayer
        Prometheus[Prometheus]
        Grafana[Grafana]
        Sentry[Sentry]
    end
    subgraph CICD
        GitHub[GitHub]
        Actions[GitHub Actions]
        Registry[Container Registry]
    end
    Users --> CDN
    CDN --> LB
    LB --> App1
    LB --> App2
    App1 --> Redis
    App2 --> Redis
    App1 --> Celery
    App2 --> Celery
    App1 --> PG
    App2 --> PG
    PG --> PG_Replica
    Celery --> Redis
    Celery --> PG
    App1 --> Prometheus
    App2 --> Prometheus
    Prometheus --> Grafana
    App1 --> Sentry
    App2 --> Sentry
    GitHub --> Actions
    Actions --> Registry
    Registry --> App1
    Registry --> App2
```

**Architecture Explanation:**

1. **Internet Layer**: Users access the website through the CDN, which caches static assets and provides DDoS protection.
2. **Load Balancer**: Distributes incoming traffic across multiple application instances.
3. **Application Layer**: FastAPI applications running with Uvicorn workers for async handling.
4. **Service Layer**: Redis for caching and Celery for background task processing.
5. **Data Layer**: PostgreSQL database with read replicas for scaling reads.
6. **Monitoring**: Prometheus for metrics, Grafana for visualization, and Sentry for error tracking.
7. **CI/CD**: GitHub Actions for automated testing, building, and deployment.

### 2.2 Platform Comparison with Cost Analysis

#### Platform Feature Comparison

| Platform | Cost | Pros | Cons | Best For |
|----------|------|------|------|----------|
| **Railway** | $5/mo | Easy setup, PostgreSQL included, auto-deploy from Git | Limited free tier, may have cold starts | **Recommended** for simplicity and low cost |
| **Render** | Free tier | Good free tier, PostgreSQL, easy setup | Cold starts on free tier, 15-min timeout | Budget-conscious, low traffic |
| **Fly.io** | Free tier | Global edge, fast, no cold starts | Complex config, steep learning curve | Performance-focused, global users |
| **DigitalOcean** | $12/mo | Reliable, good support, managed databases | More expensive, manual setup needed | Medium traffic, need for control |
| **VPS (Hetzner)** | 4 EUR/mo | Full control, cheapest, no restrictions | Manual setup, maintenance required | Full control, cost-sensitive |
| **AWS Lightsail** | $5/mo | AWS ecosystem, scalable | More complex, potential for unexpected costs | Future scaling, AWS familiarity |

#### Detailed Cost Comparison Table

| Item | Railway | Render Free | Hetzner VPS | DigitalOcean |
|------|---------|-------------|-------------|--------------|
| **Hosting** | $5/mo | $0 | ~$4.50/mo | $12/mo |
| **Database** | Included | Included | Self-hosted | Managed |
| **SSL** | Included | Included | Let's Encrypt | Included |
| **Monitoring** | $0 (basic) | $0 | $0 (self-hosted) | $0 (basic) |
| **Backups** | Included | $0 (manual) | $0 (manual) | Included |
| **Total** | **$5/mo** | **$0/mo** | **~$4.50/mo** | **$12/mo** |

#### Annual Cost Projection

| Scenario | Monthly | Annual |
|----------|---------|--------|
| **Minimum (Free)** | $0 | $0 |
| **Recommended (Railway)** | $5 | $60 |
| **Growth (DigitalOcean)** | $12 | $144 |

### 2.3 CDN and Caching Strategy

#### CDN Provider Options

1. **Cloudflare (Recommended for Free)**
   - Free plan available
   - Global CDN network
   - DDoS protection
   - SSL/TLS encryption
   - Page rules for caching

2. **AWS CloudFront**
   - Pay-as-you-go pricing
   - Integration with AWS services
   - Custom SSL certificates

3. **Cloudinary**
   - Image optimization
   - Media transformation
   - Free tier available

#### Caching Strategy Implementation

```python
# app/core/cache.py
from fastapi import FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as redis

class CacheManager:
    """Manages application caching with Redis"""
    
    def __init__(self):
        self.redis_client = None
        self.cache_prefix = "bark-cache"
    
    async def init_cache(self, app: FastAPI):
        """Initialize caching with Redis"""
        self.redis_client = redis.from_url(
            "redis://localhost:6379",
            encoding="utf-8",
            decode_responses=True
        )
        FastAPICache.init(
            RedisBackend(self.redis_client),
            prefix=self.cache_prefix
        )
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

# Cache configurations for different scenarios
CACHE_CONFIGS = {
    "products": {"expire": 300, "namespace": "products"},  # 5 minutes
    "categories": {"expire": 1800, "namespace": "categories"},  # 30 minutes
    "static_pages": {"expire": 3600, "namespace": "pages"},  # 1 hour
    "search_results": {"expire": 60, "namespace": "search"},  # 1 minute
    "user_sessions": {"expire": 86400, "namespace": "sessions"},  # 24 hours
}

# Usage example in routes
@router.get("/products")
@cache(expire=300, namespace="products")
async def get_products():
    """Get products with caching"""
    return await fetch_products_from_db()

@router.get("/categories")
@cache(expire=1800, namespace="categories")
async def get_categories():
    """Get categories with caching"""
    return await fetch_categories_from_db()
```

### 2.4 DNS and SSL Configuration

#### DNS Configuration

```
Type    Name    Value                   TTL
A       @       <server-ip-address>     3600
CNAME   www     barktechnologies.in     3600
MX      @       mail.barktechnologies.in 3600
TXT     @       v=spf1 include:...      3600
```

#### SSL Certificate Setup

**Option 1: Automatic SSL (Railway/Render)**
- Both platforms provide automatic SSL for custom domains

**Option 2: Let's Encrypt (VPS)**

```bash
#!/bin/bash
# scripts/ssl-setup.sh

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d barktechnologies.in -d www.barktechnologies.in

# Test renewal
sudo certbot renew --dry-run

# Set up cron job for renewal
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

**Option 3: Cloudflare (Additional Security)**
1. Sign up for Cloudflare (free plan)
2. Change nameservers to Cloudflare's
3. Enable SSL/TLS encryption mode: Full (strict)
4. Enable "Always Use HTTPS"

### 2.5 Backup and Disaster Recovery

#### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/barkdb_$DATE.sql"
RETENTION_DAYS=7
S3_BUCKET="s3://bark-backups"
LOG_FILE="/var/log/bark-backup.log"

mkdir -p $BACKUP_DIR

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Starting database backup..."

if pg_dump $DATABASE_URL > $BACKUP_FILE 2>/dev/null; then
    log "Database backup created: $BACKUP_FILE"
else
    log "ERROR: Database backup failed"
    exit 1
fi

gzip $BACKUP_FILE
COMPRESSED_FILE="${BACKUP_FILE}.gz"
log "Backup compressed: $COMPRESSED_FILE"

if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Uploading to S3..."
    aws s3 cp $COMPRESSED_FILE $S3_BUCKET/database/
fi

find $BACKUP_DIR -name "barkdb_*.sql.gz" -mtime +$RETENTION_DAYS -delete
log "Backup completed successfully!"
```

#### Docker-based Backup

```yaml
# docker-compose.backup.yml
version: '3.8'

services:
  backup:
    image: prodrigestivill/postgres-backup-local
    restart: always
    volumes:
      - ./backups:/backups
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=barkdb
      - POSTGRES_USER=bark
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - SCHEDULE=@daily
      - BACKUP_KEEP_DAYS=7
      - BACKUP_KEEP_WEEKS=4
      - BACKUP_KEEP_MONTHS=6
      - HEALTHCHECK_PORT=8080
    depends_on:
      - db
    networks:
      - bark-network
```

#### Restore Procedure

```bash
#!/bin/bash
# scripts/restore.sh

set -euo pipefail

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "Starting restoration from: $BACKUP_FILE"

# 1. Stop the application
docker-compose stop web

# 2. Restore database
gunzip -c $BACKUP_FILE | psql -U bark -d barkdb

# 3. Verify restoration
psql -U bark -d barkdb -c "SELECT COUNT(*) FROM users;"

# 4. Start the application
docker-compose start web

echo "Restoration completed successfully!"
```

---

## 3. LOW-LEVEL DEPLOYMENT DESIGN (LLD)

### 3.1 Docker Containerization

#### Production Dockerfile (Multi-Stage Build)

```dockerfile
# Dockerfile (Production - Multi-stage build)

# Stage 1: Build dependencies
FROM python:3.11-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim as runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    DEBUG=false

RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN adduser --disabled-password --gecos '' appuser

WORKDIR /app

COPY . .

RUN mkdir -p app/static/uploads app/static/images app/static/css app/static/js \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
```

#### Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=development \
    DEBUG=true

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir pytest pytest-asyncio httpx ruff mypy

COPY . .

RUN mkdir -p app/static/uploads app/static/images

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### .dockerignore

```
.git
.github
.vscode
.idea
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist
build
eggs
*.log
.env
.env.local
.env.production
.mypy_cache
.pytest_cache
.ruff_cache
htmlcov
.coverage
coverage.xml
*.cover
venv/
.venv/
env/
ENV/
node_modules/
.DS_Store
Thumbs.db
```

#### Build and Run Commands

```bash
#!/bin/bash
# scripts/docker-build.sh

# Build production image
docker build -t bark-technology:latest .

# Build development image
docker build -f Dockerfile.dev -t bark-technology:dev .

# Build with build arguments
docker build \
  --build-arg PYTHON_VERSION=3.11 \
  --build-arg APP_ENV=production \
  -t bark-technology:v1.0.0 .

# Tag for registry
docker tag bark-technology:latest bark-technology:v1.0.0
docker tag bark-technology:latest registry.example.com/bark-technology:latest

# Push to registry
docker push registry.example.com/bark-technology:latest

# Run production container
docker run -d \
  -p 8000:8000 \
  --name bark-prod \
  --env-file .env.production \
  --restart unless-stopped \
  --memory="512m" \
  --cpus="2" \
  bark-technology:latest

# Run development container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/bark/app/static:/app/app/static \
  -v $(pwd)/bark/app:/app/app \
  --name bark-dev \
  bark-technology:dev
```

### 3.2 Environment Configuration

#### Environment Variables Template

```bash
# .env.example
APP_ENV=production
DEBUG=false
APP_NAME=Bark Technologies
APP_URL=https://barktechnologies.in

# Security
SECRET_KEY=<generate-random-64-chars>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-password-min-12-chars>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_ECHO=false

# Redis
REDIS_URL=redis://localhost:6379/0

# API Keys
NVIDIA_API_KEY=<your-nvidia-api-key>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM=noreply@barktechnologies.in

# File Upload
UPLOAD_DIR=app/static/uploads
MAX_UPLOAD_SIZE=10485760

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# CORS
CORS_ORIGINS=["https://barktechnologies.in","https://www.barktechnologies.in"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
PROMETHEUS_ENABLED=true

# Railway
PORT=8000
```

#### Generating Secure Keys

```bash
#!/bin/bash
# scripts/generate-keys.sh

SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
echo "SECRET_KEY=$SECRET_KEY"

ADMIN_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(16))")
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD"

JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
echo "JWT_SECRET=$JWT_SECRET"

cat > .env << EOF
SECRET_KEY=$SECRET_KEY
ADMIN_PASSWORD=$ADMIN_PASSWORD
JWT_SECRET=$JWT_SECRET
EOF
```

#### Pydantic Settings Configuration

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List, Optional
from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    APP_NAME: str = "Bark Technologies"
    APP_URL: str = "https://barktechnologies.in"
    APP_ENV: Environment = Environment.DEVELOPMENT
    DEBUG: bool = False
    
    SECRET_KEY: str
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False
    
    REDIS_URL: str = "redis://localhost:6379/0"
    NVIDIA_API_KEY: Optional[str] = None
    
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@barktechnologies.in"
    
    UPLOAD_DIR: str = "app/static/uploads"
    MAX_UPLOAD_SIZE: int = 10485760
    
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600
    
    CORS_ORIGINS: List[str] = [
        "https://barktechnologies.in",
        "https://www.barktechnologies.in"
    ]
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

if settings.APP_ENV == Environment.PRODUCTION:
    if settings.DEBUG:
        raise ValueError("DEBUG must be False in production")
    if len(settings.SECRET_KEY) < 32:
        raise ValueError("SECRET_KEY must be at least 32 characters")
```

### 3.3 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: '3.11'
  DOCKER_IMAGE: bark-technology

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy

      - name: Run Ruff linter
        run: ruff check .

      - name: Run Ruff formatter check
        run: ruff format --check .

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_barkdb
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov httpx

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_barkdb
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key-for-testing
          APP_ENV: testing
        run: |
          pytest -v --tb=short --cov=app --cov-report=xml

  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pip-audit safety

      - name: Run pip-audit
        run: pip-audit

  docker:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/${{ env.DOCKER_IMAGE }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-railway:
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: web

      - name: Health check
        run: |
          sleep 30
          for i in {1..5}; do
            if curl -f https://barktechnologies.in/api/v1/health; then
              echo "Health check passed!"
              exit 0
            fi
            echo "Attempt $i failed, retrying in 10 seconds..."
            sleep 10
          done
          echo "Health check failed after 5 attempts"
          exit 1
```

#### Railway Configuration

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --workers 4 --timeout 120"
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[build.nixpacks]
pkgs = ["python3", "postgresql"]

[build.env]
PYTHON_VERSION = "3.11"
```

### 3.4 Monitoring and Logging

#### Health Check Endpoint

```python
# app/api/v1/endpoints/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from datetime import datetime
import psutil

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "checks": {}
    }
    
    try:
        await db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    memory = psutil.virtual_memory()
    health_status["checks"]["memory"] = {
        "total": memory.total,
        "available": memory.available,
        "percent": memory.percent,
        "status": "healthy" if memory.percent < 90 else "warning"
    }
    
    cpu_percent = psutil.cpu_percent(interval=0.1)
    health_status["checks"]["cpu"] = {
        "percent": cpu_percent,
        "status": "healthy" if cpu_percent < 80 else "warning"
    }
    
    disk = psutil.disk_usage('/')
    health_status["checks"]["disk"] = {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": disk.percent,
        "status": "healthy" if disk.percent < 85 else "warning"
    }
    
    return health_status

@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check for orchestrators"""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not ready"}

@router.get("/live")
async def liveness_check():
    """Simple liveness check"""
    return {"status": "alive"}
```

#### Structured Logging

```python
# app/core/logging.py
import logging
import logging.handlers
import sys
import json
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """JSON log formatter for production"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        return json.dumps(log_data)

def setup_logging(log_level: str = "INFO"):
    """Configure application logging"""
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        JSONFormatter() if log_level == "JSON" else logging.Formatter(log_format)
    )
    console_handler.setLevel(log_level)
    
    file_handler = logging.handlers.RotatingFileHandler(
        "logs/app.log", maxBytes=10*1024*1024, backupCount=5
    )
    file_handler.setFormatter(JSONFormatter())
    file_handler.setLevel(logging.INFO)
    
    error_handler = logging.handlers.RotatingFileHandler(
        "logs/error.log", maxBytes=10*1024*1024, backupCount=5
    )
    error_handler.setFormatter(JSONFormatter())
    error_handler.setLevel(logging.ERROR)
    
    logging.root.setLevel(logging.DEBUG)
    logging.root.addHandler(console_handler)
    logging.root.addHandler(file_handler)
    logging.root.addHandler(error_handler)
    
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

#### Sentry Integration

```python
# app/core/monitoring.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

def init_sentry(dsn: str, environment: str, sample_rate: float = 0.1):
    """Initialize Sentry error tracking"""
    
    def before_send(event, hint):
        if 'health' in str(event.get('request', {}).get('url', '')):
            return None
        
        if 'exception' in event:
            for exception in event['exception'].get('values', []):
                for frame in exception.get('stacktrace', {}).get('frames', []):
                    if 'vars' in frame:
                        for var_name, var_value in frame['vars'].items():
                            if 'password' in var_name.lower() or 'secret' in var_name.lower():
                                frame['vars'][var_name] = '[Filtered]'
        
        return event
    
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
        traces_sample_rate=sample_rate,
        profiles_sample_rate=sample_rate,
        send_default_pii=True,
        before_send=before_send,
    )
```

#### Prometheus Metrics

```python
# app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests'
)

class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics"""
    
    async def dispatch(self, request: Request, call_next):
        ACTIVE_REQUESTS.inc()
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code
            ).inc()
            
            duration = time.time() - start_time
            REQUEST_DURATION.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            
            return response
        finally:
            ACTIVE_REQUESTS.dec()

async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

#### Uptime Monitoring Script

```python
# scripts/monitor.py
import requests
import time
import json
from datetime import datetime
from typing import Dict

class HealthMonitor:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.endpoints = [
            '/',
            '/api/v1/health',
            '/api/v1/ready',
            '/api/v1/products',
        ]
    
    def check_endpoint(self, endpoint: str) -> Dict:
        url = f"{self.base_url}{endpoint}"
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            return {
                "endpoint": endpoint,
                "status": response.status_code,
                "response_time_ms": round(response_time, 2),
                "healthy": response.status_code == 200
            }
        except Exception as e:
            return {
                "endpoint": endpoint,
                "status": "error",
                "error": str(e),
                "healthy": False
            }
    
    def run_health_check(self) -> Dict:
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "base_url": self.base_url,
            "results": []
        }
        
        for endpoint in self.endpoints:
            result = self.check_endpoint(endpoint)
            results["results"].append(result)
        
        all_healthy = all(r["healthy"] for r in results["results"])
        results["overall_status"] = "healthy" if all_healthy else "unhealthy"
        
        return results
    
    def send_alert(self, results: Dict):
        if results["overall_status"] == "unhealthy":
            print(f"ALERT: Service is unhealthy at {results['timestamp']}")
            for result in results["results"]:
                if not result["healthy"]:
                    print(f"  - {result['endpoint']}: {result.get('status', 'error')}")

if __name__ == "__main__":
    monitor = HealthMonitor("https://barktechnologies.in")
    results = monitor.run_health_check()
    monitor.send_alert(results)
    
    with open(f"health_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(results, f, indent=2)
```

### 3.5 Security Hardening

#### Security Headers Middleware

```python
# app/middleware/security.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        response.headers["Content-Security-Policy"] = csp
        
        return response
```

#### Rate Limiting

```python
# app/core/rate_limiting.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)

RATE_LIMITS = {
    "default": "100/hour",
    "auth": "10/minute",
    "api": "60/minute",
    "health": "30/minute",
    "search": "30/minute",
}

async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests. Try again in {exc.detail}",
        },
    )
```

#### Input Validation

```python
# app/models/validation.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

class UserInput(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=12, max_length=100)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class ProductInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    price: float = Field(..., gt=0, le=1000000)
    sku: str = Field(..., min_length=3, max_length=50)
    
    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v):
        if not re.match(r'^[A-Z0-9-]+$', v):
            raise ValueError('SKU must contain only uppercase letters, numbers, and hyphens')
        return v
```

---

## 4. SOLID PRINCIPLES IN DEVOPS

### 4.1 Single Responsibility Principle

Each service container does one thing:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: bark-web
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
    restart: unless-stopped
    networks:
      - bark-network

  db:
    image: postgres:15-alpine
    container_name: bark-db
    environment:
      - POSTGRES_DB=barkdb
      - POSTGRES_USER=bark
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bark -d barkdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - bark-network

  redis:
    image: redis:7-alpine
    container_name: bark-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - bark-network

  nginx:
    image: nginx:alpine
    container_name: bark-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
    restart: unless-stopped
    networks:
      - bark-network

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: bark-worker
    command: celery -A app.celery_app worker --loglevel=info
    environment:
      - APP_ENV=production
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - db
    restart: unless-stopped
    networks:
      - bark-network

  scheduler:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: bark-scheduler
    command: celery -A app.celery_app beat --loglevel=info
    environment:
      - APP_ENV=production
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - bark-network

networks:
  bark-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### 4.2 Open/Closed Principle

Environment-specific configs without modifying core code:

```python
# app/core/environment.py
from abc import ABC, abstractmethod

class EnvironmentConfig(ABC):
    @abstractmethod
    def get_database_url(self) -> str: pass
    
    @abstractmethod
    def get_cache_url(self) -> str: pass
    
    @abstractmethod
    def get_log_level(self) -> str: pass
    
    @abstractmethod
    def is_debug(self) -> bool: pass

class DevelopmentConfig(EnvironmentConfig):
    def get_database_url(self) -> str:
        return "postgresql://bark:bark123@localhost:5432/barkdb"
    
    def get_cache_url(self) -> str:
        return "redis://localhost:6379/0"
    
    def get_log_level(self) -> str:
        return "DEBUG"
    
    def is_debug(self) -> bool:
        return True

class ProductionConfig(EnvironmentConfig):
    def __init__(self, database_url: str, cache_url: str):
        self._database_url = database_url
        self._cache_url = cache_url
    
    def get_database_url(self) -> str:
        return self._database_url
    
    def get_cache_url(self) -> str:
        return self._cache_url
    
    def get_log_level(self) -> str:
        return "INFO"
    
    def is_debug(self) -> bool:
        return False

class ConfigFactory:
    @staticmethod
    def create_config(environment: str, **kwargs) -> EnvironmentConfig:
        configs = {
            "development": lambda: DevelopmentConfig(),
            "production": lambda: ProductionConfig(
                database_url=kwargs.get("database_url"),
                cache_url=kwargs.get("cache_url")
            ),
        }
        
        if environment not in configs:
            raise ValueError(f"Unknown environment: {environment}")
        
        return configs[environment]()
```

### 4.3 Interface Segregation Principle

Separate dev/staging/prod configurations:

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./bark/app:/app/app
      - ./bark/app/static:/app/app/static
    environment:
      - APP_ENV=development
      - DEBUG=true
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=barkdb
      - POSTGRES_USER=bark
      - POSTGRES_PASSWORD=bark123

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@barktechnologies.in
      - PGADMIN_DEFAULT_PASSWORD=admin
```

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - DEBUG=false
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=barkdb
      - POSTGRES_USER=bark
      - POSTGRES_PASSWORD=${PROD_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bark -d barkdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:
```

### 4.4 Dependency Inversion Principle

Abstract deployment targets:

```python
# app/deployment/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any

class DeploymentTarget(ABC):
    @abstractmethod
    def deploy(self, config: Dict[str, Any]) -> bool: pass
    
    @abstractmethod
    def rollback(self, version: str) -> bool: pass
    
    @abstractmethod
    def get_status(self) -> Dict[str, Any]: pass
    
    @abstractmethod
    def get_logs(self, lines: int = 100) -> str: pass

class RailwayDeployment(DeploymentTarget):
    def __init__(self, token: str, project_id: str):
        self.token = token
        self.project_id = project_id
    
    def deploy(self, config: Dict[str, Any]) -> bool:
        print(f"Deploying to Railway: {config}")
        return True
    
    def rollback(self, version: str) -> bool:
        print(f"Rolling back to version: {version}")
        return True
    
    def get_status(self) -> Dict[str, Any]:
        return {"status": "healthy", "version": "1.0.0"}
    
    def get_logs(self, lines: int = 100) -> str:
        return "Logs from Railway..."

class RenderDeployment(DeploymentTarget):
    def __init__(self, api_key: str, service_id: str):
        self.api_key = api_key
        self.service_id = service_id
    
    def deploy(self, config: Dict[str, Any]) -> bool:
        print(f"Deploying to Render: {config}")
        return True
    
    def rollback(self, version: str) -> bool:
        print(f"Rolling back Render to version: {version}")
        return True
    
    def get_status(self) -> Dict[str, Any]:
        return {"status": "healthy", "version": "1.0.0"}
    
    def get_logs(self, lines: int = 100) -> str:
        return "Logs from Render..."

class VPSDeployment(DeploymentTarget):
    def __init__(self, host: str, username: str, key_path: str):
        self.host = host
        self.username = username
        self.key_path = key_path
    
    def deploy(self, config: Dict[str, Any]) -> bool:
        print(f"Deploying to VPS: {config}")
        return True
    
    def rollback(self, version: str) -> bool:
        print(f"Rolling back VPS to version: {version}")
        return True
    
    def get_status(self) -> Dict[str, Any]:
        return {"status": "healthy", "version": "1.0.0"}
    
    def get_logs(self, lines: int = 100) -> str:
        return "Logs from VPS..."

class DeploymentManager:
    def __init__(self, target: DeploymentTarget):
        self.target = target
    
    def deploy(self, config: Dict[str, Any]) -> bool:
        return self.target.deploy(config)
    
    def rollback(self, version: str) -> bool:
        return self.target.rollback(version)
    
    def get_status(self) -> Dict[str, Any]:
        return self.target.get_status()
    
    def get_logs(self, lines: int = 100) -> str:
        return self.target.get_logs(lines)
```

---

## 5. MERMAID DIAGRAMS

### 5.1 Deployment Infrastructure Diagram

```mermaid
graph TB
    subgraph InternetLayer
        Users[Users] --> CDN[CDN - Cloudflare]
    end
    subgraph LoadBalancerLayer
        CDN --> LB[Load Balancer]
    end
    subgraph ApplicationLayer
        LB --> App1[FastAPI App 1]
        LB --> App2[FastAPI App 2]
    end
    subgraph ServiceLayer
        App1 --> Redis[Redis Cache]
        App2 --> Redis
        App1 --> Celery[Celery Workers]
        App2 --> Celery
    end
    subgraph DataLayer
        App1 --> PG[PostgreSQL Primary]
        App2 --> PG
        PG --> PGReplica[PostgreSQL Replica]
    end
    subgraph MonitoringLayer
        App1 --> Prometheus[Prometheus]
        App2 --> Prometheus
        Prometheus --> Grafana[Grafana Dashboards]
        App1 --> Sentry[Sentry Error Tracking]
        App2 --> Sentry
    end
    subgraph CICDPipeline
        GitHub[GitHub Source] --> Actions[GitHub Actions]
        Actions --> Registry[Container Registry]
        Registry --> App1
        Registry --> App2
    end
```

### 5.2 CI/CD Pipeline Flowchart

```mermaid
graph TD
    A[Code Push] --> B{Branch?}
    B -->|Main| C[Run Linting]
    B -->|Develop| D[Run Tests]
    B -->|PR| E[Run All Checks]
    C --> F[Run Type Checking]
    F --> G[Security Scan]
    G --> H[Build Docker Image]
    H --> I[Push to Registry]
    I --> J[Deploy to Staging]
    J --> K[Run Integration Tests]
    K --> L{Tests Pass?}
    L -->|Yes| M[Deploy to Production]
    L -->|No| N[Notify Failure]
    D --> O[Run Unit Tests]
    O --> P[Run Coverage Report]
    P --> Q{Coverage > 80%?}
    Q -->|Yes| R[Run Linting]
    Q -->|No| S[Fail Build]
    E --> T[Run All Checks in Parallel]
    T --> U[Lint + Type + Security + Tests]
    U --> V{All Pass?}
    V -->|Yes| W[Approve PR]
    V -->|No| X[Request Changes]
    M --> Y[Health Check]
    Y --> Z{Health OK?}
    Z -->|Yes| AA[Deployment Successful]
    Z -->|No| AB[Rollback Deployment]
```

### 5.3 Database Migration Flow

```mermaid
graph TD
    A[Developer] --> B[Create Migration Script]
    B --> C[Review Migration]
    C --> D[Commit to Git]
    D --> E[CI/CD Pipeline]
    E --> F[Run Migration Tests]
    F --> G{Tests Pass?}
    G -->|Yes| H[Deploy to Staging]
    G -->|No| I[Fix Migration]
    I --> C
    H --> J[Run Migration on Staging]
    J --> K[Verify Data Integrity]
    K --> L{Verification OK?}
    L -->|Yes| M[Deploy to Production]
    L -->|No| N[Rollback Staging]
    N --> O[Fix Issues]
    O --> C
    M --> P[Run Migration on Production]
    P --> Q[Monitor Performance]
    Q --> R{Performance OK?}
    R -->|Yes| S[Migration Complete]
    R -->|No| T[Rollback Production]
    T --> U[Investigate Issues]
    U --> V[Fix and Redeploy]
```

### 5.4 Rollback Procedure Diagram

```mermaid
graph TD
    A[Issue Detected] --> B[Identify Root Cause]
    B --> C{Severity?}
    C -->|Critical| D[Immediate Rollback]
    C -->|High| E[Planned Rollback]
    C -->|Low| F[Monitor and Fix]
    D --> G[Stop Traffic to New Version]
    G --> H[Deploy Previous Version]
    H --> I[Verify Functionality]
    I --> J{Functionality OK?}
    J -->|Yes| K[Resume Traffic]
    J -->|No| L[Escalate to Team]
    E --> M[Schedule Maintenance Window]
    M --> N[Notify Users]
    N --> O[Stop Traffic]
    O --> P[Deploy Previous Version]
    P --> Q[Run Smoke Tests]
    Q --> R{Tests Pass?}
    R -->|Yes| S[Resume Traffic]
    R -->|No| T[Continue Investigation]
    F --> U[Monitor Metrics]
    U --> V{Metrics Stable?}
    V -->|Yes| W[Apply Hotfix]
    V -->|No| X[Escalate to Rollback]
    K --> Y[Post-mortem Analysis]
    T --> Y
    L --> Y
    X --> Y
    Y --> Z[Document Lessons Learned]
```

### 5.5 Monitoring and Alerting Flow

```mermaid
graph TD
    A[Application] --> B[Metrics Collection]
    A --> C[Log Collection]
    A --> D[Error Tracking]
    B --> E[Prometheus]
    C --> F[ELK Stack]
    D --> G[Sentry]
    E --> H[Grafana Dashboards]
    F --> H
    G --> H
    H --> I{Threshold Exceeded?}
    I -->|Yes| J[Alert Manager]
    I -->|No| K[Normal Operation]
    J --> L[Email Alert]
    J --> M[Slack Notification]
    J --> N[PagerDuty Alert]
    L --> O[On-call Engineer]
    M --> O
    N --> O
    O --> P[Investigate Issue]
    P --> Q{Issue Identified?}
    Q -->|Yes| R[Apply Fix]
    Q -->|No| S[Escalate]
    R --> T[Verify Fix]
    T --> U{Issue Resolved?}
    U -->|Yes| V[Update Documentation]
    U -->|No| W[Rollback if Needed]
    S --> X[Management Review]
    X --> Y[Process Improvement]
    V --> Z[Post-mortem]
    W --> Z
```

---

## 6. IMPLEMENTATION DETAILS

### 6.1 Dockerfile Optimization

**Key Optimizations:**
1. **Layer Caching**: Requirements.txt is copied before application code for better caching
2. **Minimal Image**: Uses python:3.11-slim instead of full Python image (~150MB vs ~1GB)
3. **Non-root User**: Runs as appuser for security
4. **Health Check**: Built-in health check for container orchestration
5. **Gunicorn + Uvicorn**: Production-grade process management with 4 workers

**Multi-stage Build Benefits:**
- Build stage installs compilation tools (gcc, libpq-dev) that are NOT in the runtime image
- Runtime image is significantly smaller (~150MB vs ~400MB)
- Better security surface with fewer packages in production

### 6.2 Docker Compose for Local Development

The development Docker Compose file includes:

| Service | Port | Purpose |
|---------|------|---------|
| web | 8000 | FastAPI application with hot-reload |
| db | 5432 | PostgreSQL database |
| redis | 6379 | Cache and session storage |
| pgadmin | 5050 | Database administration UI |
| flower | 5555 | Celery task monitoring |

#### Development Commands

```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "Setting up development environment..."

# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Run database migrations
docker-compose exec web alembic upgrade head

# Seed database
docker-compose exec web python scripts/seed_data.py

echo "Development environment ready!"
echo "Application: http://localhost:8000"
echo "API Docs: http://localhost:8000/api/v1/docs"
echo "pgAdmin: http://localhost:5050"
echo "Flower: http://localhost:5555"
```

### 6.3 Railway/Render Configuration

#### Railway Configuration

Key points for Railway deployment:
1. Use `$PORT` variable for dynamic port assignment
2. Use Gunicorn with Uvicorn workers for production
3. Set health check endpoint for Railway monitoring
4. Configure deploy hooks for database migrations

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --workers 4 --timeout 120"
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[build.nixpacks]
pkgs = ["python3", "postgresql"]

[build.env]
PYTHON_VERSION = "3.11"
```

#### Render Configuration

```yaml
# render.yaml
services:
  - type: web
    name: bark-technology
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --workers 4
    envVars:
      - key: APP_ENV
        value: production
      - key: DEBUG
        value: false
      - key: DATABASE_URL
        fromDatabase:
          name: bark-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true

databases:
  - name: bark-db
    databaseName: barkdb
    user: bark
```

### 6.4 Nginx Reverse Proxy Setup

#### Complete Nginx Configuration

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name barktechnologies.in www.barktechnologies.in;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name barktechnologies.in www.barktechnologies.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/barktechnologies.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/barktechnologies.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Logging
    access_log /var/log/nginx/bark_access.log;
    error_log /var/log/nginx/bark_error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml application/xml+rss;

    # Static files with caching
    location /static/ {
        alias /app/bark/app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
        
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Favicon
    location = /favicon.ico {
        alias /app/bark/app/static/images/favicon.ico;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Robots.txt
    location = /robots.txt {
        alias /app/bark/app/static/robots.txt;
        expires 1d;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location = /api/v1/health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Custom error pages
    error_page 404 /404.html;
    location = /404.html {
        root /app/bark/app/static;
        internal;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /app/bark/app/static;
        internal;
    }
}
```

#### Nginx Management Commands

```bash
#!/bin/bash
# scripts/nginx-setup.sh

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/bark_error.log

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 6.5 SSL Certificate Management

#### Let's Encrypt Setup

```bash
#!/bin/bash
# scripts/ssl-setup.sh

set -euo pipefail

DOMAIN="barktechnologies.in"
EMAIL="admin@barktechnologies.in"

echo "Setting up SSL certificate for $DOMAIN..."

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Test renewal
sudo certbot renew --dry-run

# Set up cron job for automatic renewal
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null

echo "SSL setup completed!"
```

#### Cloudflare Setup Steps

1. Sign up for Cloudflare (free plan)
2. Add domain barktechnologies.in
3. Change nameservers to Cloudflare's provided nameservers
4. Go to SSL/TLS settings
5. Set encryption mode to "Full (strict)"
6. Enable "Always Use HTTPS"
7. Enable "Automatic HTTPS Rewrites"
8. Go to Caching settings
9. Enable "Always Online"
10. Set cache level to "Standard"

### 6.6 Environment Variables Template

```bash
# .env.production
# Application
APP_ENV=production
DEBUG=false
APP_NAME=Bark Technologies
APP_URL=https://barktechnologies.in

# Security
SECRET_KEY=<generate-random-64-chars>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-password-min-12-chars>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_ECHO=false

# Redis
REDIS_URL=redis://localhost:6379/0

# API Keys
NVIDIA_API_KEY=<your-nvidia-api-key>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM=noreply@barktechnologies.in

# File Upload
UPLOAD_DIR=app/static/uploads
MAX_UPLOAD_SIZE=10485760

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# CORS
CORS_ORIGINS=["https://barktechnologies.in","https://www.barktechnologies.in"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
PROMETHEUS_ENABLED=true

# Railway
PORT=8000
```

---

## 7. OPERATIONAL PROCEDURES

### 7.1 Deployment Checklist

```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing in CI/CD
- [ ] Security scan completed (pip-audit, safety)
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Secrets properly managed (not in Git)
- [ ] Backup created
- [ ] Rollback plan documented

## Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Verify health checks passing
- [ ] Check error rates baseline
- [ ] Monitor performance metrics
- [ ] Deploy to production
- [ ] Verify production health endpoint
- [ ] Check all critical endpoints

## Post-Deployment
- [ ] Monitor error rates for 15 minutes
- [ ] Check response times
- [ ] Verify database connections stable
- [ ] Test critical user flows
- [ ] Update documentation
- [ ] Notify team of successful deployment
- [ ] Schedule post-mortem if issues found

## Rollback Triggers
- [ ] Error rate exceeds 5%
- [ ] Response time exceeds 2s
- [ ] Health check failures persist
- [ ] Database connection issues
- [ ] Critical functionality broken
```

### 7.2 Rollback Procedures

```bash
#!/bin/bash
# scripts/rollback.sh

set -euo pipefail

VERSION=$1
ENVIRONMENT=${2:-production}

echo "Rolling back to version $VERSION in $ENVIRONMENT..."

case $ENVIRONMENT in
    railway)
        echo "Rolling back Railway deployment..."
        railway rollback
        ;;
    
    docker)
        echo "Rolling back Docker deployment..."
        docker-compose down
        docker-compose up -d bark-technology:$VERSION
        ;;
    
    git)
        echo "Rolling back via Git..."
        git revert HEAD
        git push origin main
        ;;
    
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Wait for deployment to stabilize
echo "Waiting for deployment to stabilize..."
sleep 30

# Health check
echo "Running health check..."
if curl -f https://barktechnologies.in/api/v1/health; then
    echo "Rollback successful!"
else
    echo "Health check failed after rollback!"
    exit 1
fi
```

### 7.3 Scaling Guidelines

```python
# app/scaling/guidelines.py
from typing import Dict, Any

SCALING_GUIDELINES = {
    "low_traffic": {
        "description": "Less than 500 visitors/month",
        "workers": 2,
        "memory": "512MB",
        "cpu": "1 vCPU",
        "database_pool_size": 5,
        "cost": "$5-10/month"
    },
    "medium_traffic": {
        "description": "500-5000 visitors/month",
        "workers": 4,
        "memory": "1GB",
        "cpu": "2 vCPU",
        "database_pool_size": 10,
        "cost": "$20-50/month"
    },
    "high_traffic": {
        "description": "5000-50000 visitors/month",
        "workers": 8,
        "memory": "2GB",
        "cpu": "4 vCPU",
        "database_pool_size": 20,
        "cost": "$100-200/month"
    },
    "very_high_traffic": {
        "description": "50000+ visitors/month",
        "workers": "16+",
        "memory": "4GB+",
        "cpu": "8+ vCPU",
        "database_pool_size": 50,
        "cost": "$500+/month",
        "notes": "Consider load balancing and microservices"
    }
}

def get_scaling_recommendation(monthly_visitors: int) -> Dict[str, Any]:
    if monthly_visitors < 500:
        return SCALING_GUIDELINES["low_traffic"]
    elif monthly_visitors < 5000:
        return SCALING_GUIDELINES["medium_traffic"]
    elif monthly_visitors < 50000:
        return SCALING_GUIDELINES["high_traffic"]
    else:
        return SCALING_GUIDELINES["very_high_traffic"]
```

### 7.4 Cost Optimization Tips

**Infrastructure:**
1. Use free tiers wisely (Railway $5 credit, Render free tier)
2. Right-size your instances based on actual usage
3. Use CDN for static assets to reduce bandwidth costs

**Database:**
1. Use connection pooling to reduce connection overhead
2. Implement read replicas for read-heavy workloads
3. Archive old data to reduce storage costs

**Application:**
1. Implement caching to reduce database load
2. Optimize images and static assets
3. Use compression for API responses
4. Implement pagination to reduce data transfer

**Monitoring:**
1. Use open-source monitoring tools (Prometheus, Grafana)
2. Implement log rotation to manage storage
3. Use sampling for tracing to reduce costs

```python
# app/cost/optimization.py
from typing import Dict

def calculate_monthly_cost(
    workers: int,
    memory_mb: int,
    storage_gb: int,
    bandwidth_gb: float
) -> Dict[str, float]:
    worker_cost_per_hour = 0.005
    memory_cost_per_gb = 10
    storage_cost_per_gb = 0.1
    bandwidth_cost_per_gb = 0.1
    
    hours_per_month = 730
    
    costs = {
        "workers": workers * worker_cost_per_hour * hours_per_month,
        "memory": (memory_mb / 1024) * memory_cost_per_gb,
        "storage": storage_gb * storage_cost_per_gb,
        "bandwidth": bandwidth_gb * bandwidth_cost_per_gb,
    }
    
    costs["total"] = sum(costs.values())
    
    return costs
```

### 7.5 Security Audit Steps

```python
# app/security/audit.py
from typing import Dict, List, Any
from datetime import datetime

class SecurityAuditor:
    def get_checklist(self) -> List[Dict[str, Any]]:
        return [
            {
                "category": "Authentication",
                "items": [
                    "Check password policies (minimum length, complexity)",
                    "Verify session management (timeout, renewal)",
                    "Test multi-factor authentication if implemented",
                    "Review API key management",
                    "Check JWT token expiration and rotation"
                ]
            },
            {
                "category": "Authorization",
                "items": [
                    "Verify role-based access control (RBAC)",
                    "Test privilege escalation attacks",
                    "Check API endpoint permissions",
                    "Review database access controls",
                    "Verify file upload permissions"
                ]
            },
            {
                "category": "Data Protection",
                "items": [
                    "Verify encryption at rest",
                    "Verify encryption in transit (TLS)",
                    "Check sensitive data masking",
                    "Review backup encryption",
                    "Test data retention policies"
                ]
            },
            {
                "category": "Network Security",
                "items": [
                    "Review firewall rules",
                    "Test DDoS protection",
                    "Check SSL/TLS configuration",
                    "Verify CORS policies",
                    "Review rate limiting configuration"
                ]
            },
            {
                "category": "Application Security",
                "items": [
                    "Run dependency vulnerability scans",
                    "Test for SQL injection",
                    "Test for XSS vulnerabilities",
                    "Check CSRF protection",
                    "Review error handling and logging"
                ]
            },
            {
                "category": "Infrastructure",
                "items": [
                    "Review server hardening",
                    "Check SSH access controls",
                    "Verify monitoring and alerting",
                    "Test disaster recovery procedures",
                    "Review backup and restore processes"
                ]
            }
        ]
    
    def run_audit(self) -> Dict[str, Any]:
        checklist = self.get_checklist()
        
        audit_report = {
            "timestamp": datetime.utcnow().isoformat(),
            "checklist": checklist,
            "findings": [],
            "recommendations": [],
            "risk_level": "low"
        }
        
        critical_findings = len([
            f for f in audit_report["findings"] 
            if f.get("severity") == "critical"
        ])
        
        if critical_findings > 0:
            audit_report["risk_level"] = "critical"
        elif len(audit_report["findings"]) > 5:
            audit_report["risk_level"] = "high"
        elif len(audit_report["findings"]) > 2:
            audit_report["risk_level"] = "medium"
        
        return audit_report
    
    def generate_report(self, audit_report: Dict[str, Any]) -> str:
        report = f"""
Security Audit Report
====================
Date: {audit_report['timestamp']}
Risk Level: {audit_report['risk_level'].upper()}

Checklist Items: {len(audit_report['checklist'])}
Findings: {len(audit_report['findings'])}
Recommendations: {len(audit_report['recommendations'])}

"""
        
        if audit_report["findings"]:
            report += "Findings:\n"
            for i, finding in enumerate(audit_report["findings"], 1):
                report += f"{i}. {finding.get('description', 'No description')}\n"
        
        if audit_report["recommendations"]:
            report += "\nRecommendations:\n"
            for i, rec in enumerate(audit_report["recommendations"], 1):
                report += f"{i}. {rec}\n"
        
        return report
```

---

## 8. Troubleshooting Guide

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs web

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Port already in use

# Verify environment variables
docker-compose exec web env | grep DATABASE_URL

# Test database connection
docker-compose exec web python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"

# Check port availability
lsof -i :8000
```

#### 2. Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose exec db pg_isready

# Test connection
psql -h localhost -U bark -d barkdb

# Check database size
psql -h localhost -U bark -d barkdb -c "SELECT pg_size_pretty(pg_database_size('barkdb'));"

# Reset database (caution: destroys data)
docker-compose down -v
docker-compose up -d
```

#### 3. High Memory Usage

```bash
# Check memory usage
docker stats

# Find memory leaks
pip install memory_profiler

# Profile specific functions
from memory_profiler import profile

@profile
def my_function():
    pass
```

#### 4. Slow Response Times

```bash
# Check response times
curl -w "@curl-timing.txt" -o /dev/null -s https://barktechnologies.in

# Profile application
import time
from starlette.middleware.base import BaseHTTPMiddleware

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
```

### Monitoring Commands

```bash
# System monitoring
htop                    # Interactive process viewer
iotop                   # I/O monitoring
nethogs                 # Network monitoring per process

# Docker monitoring
docker stats            # Container resource usage
docker system df        # Docker disk usage
docker system prune     # Clean up unused resources

# Application monitoring
tail -f logs/app.log    # Real-time application logs
journalctl -u bark-service -f  # System service logs
```

### Emergency Procedures

#### 1. Rollback Deployment

```bash
# Railway
railway rollback

# Docker
docker-compose down
docker-compose up -d bark-technology:previous-tag

# Git
git revert HEAD
git push origin main
```

#### 2. Scale Down

```bash
# Stop non-essential services
docker-compose stop pgadmin redis

# Reduce workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

#### 3. Emergency Maintenance Mode

```python
# app/middleware/maintenance.py
from fastapi import Request
from fastapi.responses import HTMLResponse

MAINTENANCE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - Bark Technologies</title>
    <meta http-equiv="refresh" content="300">
</head>
<body>
    <h1>We are currently performing maintenance</h1>
    <p>Please check back in a few minutes.</p>
    <p>For urgent issues, contact support@barktechnologies.in</p>
</body>
</html>
"""

class MaintenanceMiddleware:
    def __init__(self, app):
        self.app = app
        self.maintenance_mode = False
    
    async def __call__(self, scope, receive, send):
        if self.maintenance_mode and scope["type"] == "http":
            response = HTMLResponse(MAINTENANCE_HTML, status_code=503)
            await response(scope, receive, send)
        else:
            await self.app(scope, receive, send)
```

---

## 9. Quick Start Guide

### For Development

```bash
# Clone repository
git clone https://github.com/yourusername/bark_technology.git
cd bark_technology

# Start development environment
docker-compose up -d

# Run migrations
docker-compose exec web alembic upgrade head

# Access application
# - Website: http://localhost:8000
# - API Docs: http://localhost:8000/api/v1/docs
# - pgAdmin: http://localhost:5050
# - Flower: http://localhost:5555
```

### For Production (Railway)

1. Push code to GitHub
2. Connect Railway to your repository
3. Add PostgreSQL database in Railway dashboard
4. Configure environment variables
5. Add custom domain
6. Deploy!

### For Production (VPS)

```bash
# SSH into server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/yourusername/bark_technology.git
cd bark_technology

# Create production environment
cp .env.example .env.production
# Edit .env.production with your settings

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL
sudo certbot --nginx -d barktechnologies.in -d www.barktechnologies.in
```

---

## Support

For issues or questions:
- **Documentation**: Check this file first
- **Logs**: `docker-compose logs -f`
- **Health Check**: `curl https://barktechnologies.in/api/v1/health`
- **Contact**: DevOps team at devops@barktechnologies.in

---

*Last updated: July 4, 2026*
*Version: 2.0.0*
