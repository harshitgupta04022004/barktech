"""JWT token handler — create and verify JWTs.

Uses the same secret and algorithm as the Node.js backend (HS256).
Tokens are issued by the Node.js backend; this module verifies them
and extracts user context for LangGraph tools.
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

logger = logging.getLogger(__name__)

# Shared secret with Node.js backend — must match JWT_SECRET in .env
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"


class JWTHandler:
    """JWT token handling for agent authentication.

    The Node.js backend issues tokens with this structure:
    {
        "sub": "<user_id>",
        "email": "user@example.com",
        "role": "admin" | "super_admin" | "client",
        "scopes": ["product:read", "lead:write", ...],  (optional)
        "iat": ...,
        "exp": ...
    }
    """

    @staticmethod
    def create_access_token(
        user_id: str,
        email: str,
        role: str,
        scopes: Optional[list[str]] = None,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Create JWT access token with scopes.

        Primarily used by the Node backend, but available here for testing.
        """
        if not scopes:
            scopes = ScopeChecker.default_scopes_for_role(role)

        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "scopes": scopes,
            "iat": now,
            "exp": now + (expires_delta or timedelta(days=7)),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify and decode JWT token.

        Returns:
            dict with user_id, email, role, scopes on success; None on failure.
        """
        if not JWT_SECRET:
            logger.error("JWT_SECRET not configured — cannot verify tokens")
            return None

        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
            )
            return {
                "user_id": payload.get("sub", ""),
                "email": payload.get("email", ""),
                "name": payload.get("name", ""),
                "role": payload.get("role", "client"),
                "scopes": payload.get("scopes", []),
            }
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT validation failed: {e}")
            return None


class ScopeChecker:
    """Check if user has required scope for a tool operation.

    Scope hierarchy mirrors the Node.js backend's permission system.
    Admin role gets wildcard access to all scopes.
    """

    SCOPE_HIERARCHY: dict[str, list[str]] = {
        # Client scopes (user-scoped data access)
        "chat:read": ["chat:read"],
        "chat:write": ["chat:write"],
        "product:read": ["product:read"],
        "contact:read": ["contact:read"],
        "faq:read": ["faq:read"],
        "lead:create": ["lead:create"],

        # Admin scopes (full data access)
        "admin:*": [
            "product:read", "product:write", "product:delete",
            "lead:read", "lead:write", "lead:delete",
            "invoice:read", "invoice:write", "invoice:delete",
            "stock:read", "stock:write",
            "content:read", "content:write", "content:delete",
            "user:read", "user:write", "user:delete",
            "calendar:read", "calendar:write", "calendar:delete",
            "whatsapp:send",
            "ads:manage",
            "canvas:edit",
            "chat:read", "chat:write",
        ],
    }

    @staticmethod
    def default_scopes_for_role(role: str) -> list[str]:
        """Return default scopes for a role."""
        if role in ("admin", "super_admin"):
            return ["admin:*"]
        return ["chat:read", "chat:write", "product:read", "contact:read", "faq:read", "lead:create"]

    @staticmethod
    def check_scope(user_scopes: list[str], required_scope: str) -> bool:
        """Check if user has required scope.

        Admin wildcard check, then direct scope check, then hierarchical check.
        """
        if "admin:*" in user_scopes:
            return True

        if required_scope in user_scopes:
            return True

        for scope, hierarchy in ScopeChecker.SCOPE_HIERARCHY.items():
            if scope in user_scopes and required_scope in hierarchy:
                return True

        return False

    @staticmethod
    def has_any_scope(user_scopes: list[str], required_scopes: list[str]) -> bool:
        """Check if user has any of the required scopes."""
        return any(ScopeChecker.check_scope(user_scopes, s) for s in required_scopes)
