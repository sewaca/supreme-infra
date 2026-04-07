import uuid

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.dependencies import ValidSession
from app.schemas.user import UserBrief, UserSearchResponse
from app.services.user_cache_service import get_cached_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    current_user: ValidSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
):
    items: list[UserBrief] = []

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.core_client_info_url}/profile/users/search",
                params={"q": q, "limit": limit},
            )
            if resp.status_code == 200:
                items.extend(
                    UserBrief(
                        user_id=uuid.UUID(u["id"]),
                        name=u.get("name", ""),
                        last_name=u.get("last_name", ""),
                        avatar=u.get("avatar"),
                        group_name=u.get("group"),
                        role=u.get("role"),
                    )
                    for u in resp.json()
                )
    except Exception:
        pass

    return UserSearchResponse(items=items)


@router.get("/{user_id}", response_model=UserBrief)
async def get_user(
    user_id: uuid.UUID,
    current_user: ValidSession,
):
    cached = await get_cached_user(user_id)
    if not cached:
        raise HTTPException(status_code=404, detail="User not found")

    return UserBrief(
        user_id=cached.user_id,
        name=cached.name,
        last_name=cached.last_name,
        avatar=cached.avatar,
        group_name=cached.group_name,
        role=cached.role,
    )
