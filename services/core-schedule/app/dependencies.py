"""
FastAPI dependency helpers for authentication.

Usage:
    from app.dependencies import CurrentUser, ValidSession, AdminUser

    @router.get("/protected")
    async def handler(user: CurrentUser):
        return {"user_id": user["sub"]}

    @router.post("/admin-only")
    async def handler(user: AdminUser):
        return {"ok": True}
"""

from typing import Annotated, Any

from authorization_py.dependencies import get_current_user, require_valid_session
from fastapi import Depends, HTTPException

CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
ValidSession = Annotated[dict[str, Any], Depends(require_valid_session)]


async def _require_admin(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


AdminUser = Annotated[dict[str, Any], Depends(_require_admin)]
