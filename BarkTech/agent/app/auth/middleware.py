"""Agent authentication middleware — FastAPI dependencies for JWT verification.

Provides authenticate_client and authenticate_admin dependencies that:
1. Extract and verify the JWT from the Authorization header
2. Return validated user payload for use in agent tools
3. Bind user context to tools via closure (scope-based access)
"""

import logging
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt_handler import JWTHandler, ScopeChecker

logger = logging.getLogger(__name__)

# Reusable bearer token extractor
_bearer = HTTPBearer(auto_error=False)


async def _extract_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    request: Request = None,
) -> str:
    """Extract Bearer token from Authorization header.

    Also supports passing token via query parameter for SSE streaming
    (EventSource/EventSourcePolyfill cannot set custom headers).
    """
    if credentials and credentials.credentials:
        return credentials.credentials

    # Fallback: check query param (needed for EventSource/SSE which can't set headers)
    if request:
        token = request.query_params.get("token")
        if token:
            return token

    raise HTTPException(status_code=401, detail="Missing authentication token")


async def authenticate_client(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    request: Request = None,
) -> dict:
    """FastAPI dependency: authenticate client agent requests.

    Verifies JWT and returns user payload with scopes.
    Clients can only access read operations and inquiry creation.
    """
    token = await _extract_token(credentials, request)
    payload = JWTHandler.verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Ensure scopes are set
    if not payload.get("scopes"):
        payload["scopes"] = ScopeChecker.default_scopes_for_role(payload.get("role", "client"))

    return payload


async def authenticate_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    request: Request = None,
) -> dict:
    """FastAPI dependency: authenticate admin agent requests.

    Verifies JWT and checks for admin role.
    Returns user payload with full admin scopes.
    """
    token = await _extract_token(credentials, request)
    payload = JWTHandler.verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = payload.get("role", "")
    if role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    # Ensure admin gets wildcard scopes
    if not payload.get("scopes"):
        payload["scopes"] = ScopeChecker.default_scopes_for_role(role)

    return payload


def require_scope(required_scope: str):
    """Decorator to require specific scope for a tool or endpoint."""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            user = kwargs.get("user") or kwargs.get("user_context")
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")

            scopes = user.get("scopes", [])
            if not ScopeChecker.check_scope(scopes, required_scope):
                raise HTTPException(
                    status_code=403,
                    detail=f"Required scope: {required_scope}",
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
