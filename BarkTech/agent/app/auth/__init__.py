"""Auth module — JWT handling, scope checking, and FastAPI middleware.

Integrates with the Node.js backend's JWT tokens (same secret, same algorithm).
Supports both Google OAuth and email/password login tokens.
"""

from app.auth.jwt_handler import JWTHandler, ScopeChecker
from app.auth.middleware import AgentAuthMiddleware

__all__ = ["JWTHandler", "ScopeChecker", "AgentAuthMiddleware"]
