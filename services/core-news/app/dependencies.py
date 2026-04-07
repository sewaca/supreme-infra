"""
FastAPI dependency helpers for authentication.

Usage:
    from app.dependencies import CurrentUser, ValidSession

    @router.get("/protected")
    async def handler(user: CurrentUser):
        return {"user_id": user["sub"]}

    @router.get("/session-protected")
    async def handler(user: ValidSession):
        return {"user_id": user["sub"]}
"""

from typing import Annotated, Any

from authorization_py.dependencies import get_current_user, require_valid_session
from fastapi import Depends

# Type aliases for use with Annotated — cleaner endpoint signatures
CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
ValidSession = Annotated[dict[str, Any], Depends(require_valid_session)]
