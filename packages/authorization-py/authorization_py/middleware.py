"""
Route-aware auth middleware for FastAPI.

Usage in main.py:
    from app._auth_routes_generated import AUTH_ROUTES
    from authorization_py.middleware import AuthMiddleware

    app.add_middleware(
        AuthMiddleware,
        routes=AUTH_ROUTES,
        core_auth_url=settings.core_auth_url,
        jwt_secret=settings.jwt_secret,
    )
"""

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from .jwt_verify import decode_token_safe
from .session_check import check_session

if TYPE_CHECKING:
    import re
    from typing import Literal

    AuthLevel = Literal["none", "valid"]

    @dataclass
    class AuthRoute:
        path: "re.Pattern"
        method: "str | None"
        auth_level: "AuthLevel"


logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, routes: list, core_auth_url: str, jwt_secret: str) -> None:
        super().__init__(app)
        self._routes = routes
        self._core_auth_url = core_auth_url
        self._jwt_secret = jwt_secret

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method

        matched = next(
            (
                r
                for r in self._routes
                if r.path.fullmatch(path) and (r.method is None or r.method.upper() == method.upper())
            ),
            None,
        )
        auth_level = matched.auth_level if matched else "none"

        if auth_level == "none":
            return await call_next(request)

        # auth_level == 'valid': require Bearer + valid session
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Authentication required"}, status_code=401)

        token = auth_header[7:]
        payload, jwt_status = decode_token_safe(token, self._jwt_secret)
        print("jwt status: ", jwt_status)
        if payload is None:
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)

        session_status = await check_session(token, self._core_auth_url)
        if session_status in ("revoked", "expired", "invalid"):
            return JSONResponse({"detail": "Session invalid"}, status_code=401)
        if session_status == "error":
            # core-auth unreachable — fail-open, log warning
            logger.warning("core-auth unreachable during session check for path %s; allowing request", path)

        return await call_next(request)
