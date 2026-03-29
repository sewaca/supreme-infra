import uuid

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import ValidSession
from app.models.user_cache import UserCache
from app.schemas.user import UserBrief, UserSearchResponse
from app.services.user_cache_service import get_cached_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    current_user: ValidSession,
    q: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserCache)
        .where(
            or_(
                UserCache.name.ilike(f"{q}%"),
                UserCache.last_name.ilike(f"{q}%"),
            )
        )
        .limit(limit)
    )
    cached_users = result.scalars().all()

    items = [
        UserBrief(
            user_id=u.user_id,
            name=u.name,
            last_name=u.last_name,
            avatar=u.avatar,
            group_name=u.group_name,
            role=u.role,
        )
        for u in cached_users
    ]

    # Если мало результатов — дополнить из core-client-info
    if len(items) < limit:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{settings.core_client_info_url}/profile/users/search",
                    params={"q": q, "limit": limit},
                )
                if resp.status_code == 200:
                    existing_ids = {u.user_id for u in items}
                    for u in resp.json():
                        uid = uuid.UUID(u["id"])
                        if uid not in existing_ids and len(items) < limit:
                            items.append(
                                UserBrief(
                                    user_id=uid,
                                    name=u.get("name", ""),
                                    last_name=u.get("last_name", ""),
                                    avatar=u.get("avatar"),
                                    group_name=u.get("group"),
                                    role=u.get("role"),
                                )
                            )
        except Exception:
            pass

    return UserSearchResponse(items=items)


@router.get("/{user_id}", response_model=UserBrief)
async def get_user(
    user_id: uuid.UUID,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    cached = await get_cached_user(user_id, db)
    if not cached:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found")

    return UserBrief(
        user_id=cached.user_id,
        name=cached.name,
        last_name=cached.last_name,
        avatar=cached.avatar,
        group_name=cached.group_name,
        role=cached.role,
    )
