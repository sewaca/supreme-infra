"""FastAPI dependency functions for authentication and session validation."""

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .jwt_verify import decode_token_safe
from .session_check import check_session

_bearer_scheme = HTTPBearer(auto_error=False)


def _get_jwt_secret() -> str:
    import os

    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET environment variable is not set")
    return secret


def _get_core_auth_url() -> str:
    import os

    return os.environ.get("CORE_AUTH_URL", "http://core-auth.default.svc.cluster.local/core-auth")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """
    FastAPI dependency: verifies JWT signature.
    Raises HTTP 401 if the token is missing or invalid/expired.
    Returns the decoded token payload.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload, jwt_status = decode_token_safe(token, _get_jwt_secret())

    if jwt_status != "valid" or payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token {jwt_status}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def require_valid_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """
    FastAPI dependency: verifies JWT signature AND validates session via core-auth.
    Raises HTTP 401 if the token is missing, invalid, expired, or revoked.
    Returns the decoded token payload.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload, jwt_status = decode_token_safe(token, _get_jwt_secret())

    if jwt_status != "valid" or payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token {jwt_status}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_status = await check_session(token, _get_core_auth_url())

    if session_status != "valid":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session {session_status}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
