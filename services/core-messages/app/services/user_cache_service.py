import logging
from datetime import UTC, datetime
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user_cache import UserCache

logger = logging.getLogger(__name__)


async def get_cached_user(user_id: UUID, db: AsyncSession) -> UserCache | None:
    """Получить пользователя из кэша. Если устарел или отсутствует — обновить из core-client-info."""
    result = await db.execute(select(UserCache).where(UserCache.user_id == user_id))
    cached = result.scalar_one_or_none()

    now = datetime.now(UTC)
    if cached and (now - cached.cached_at.replace(tzinfo=UTC)).total_seconds() < settings.user_cache_ttl_seconds:
        return cached

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.core_client_info_url}/profile/user",
                params={"user_id": str(user_id)},
            )
            if resp.status_code != 200:
                logger.warning("core-client-info returned %d for user %s", resp.status_code, user_id)
                return cached

            data = resp.json()
    except Exception:
        logger.exception("Failed to fetch user %s from core-client-info", user_id)
        return cached

    stmt = (
        insert(UserCache)
        .values(
            user_id=user_id,
            name=data.get("name", ""),
            last_name=data.get("last_name", ""),
            middle_name=data.get("middle_name"),
            email=data.get("email", ""),
            avatar=data.get("avatar"),
            group_name=data.get("group"),
            faculty=data.get("faculty"),
            role=data.get("role"),
            cached_at=now,
        )
        .on_conflict_do_update(
            index_elements=["user_id"],
            set_={
                "name": data.get("name", ""),
                "last_name": data.get("last_name", ""),
                "middle_name": data.get("middle_name"),
                "email": data.get("email", ""),
                "avatar": data.get("avatar"),
                "group_name": data.get("group"),
                "faculty": data.get("faculty"),
                "role": data.get("role"),
                "cached_at": now,
            },
        )
    )
    await db.execute(stmt)
    await db.flush()

    result = await db.execute(select(UserCache).where(UserCache.user_id == user_id))
    return result.scalar_one_or_none()


async def get_cached_users_batch(user_ids: list[UUID], db: AsyncSession) -> dict[UUID, UserCache]:
    """Получить несколько пользователей. Для отсутствующих/устаревших — подгрузить."""
    if not user_ids:
        return {}

    result = await db.execute(select(UserCache).where(UserCache.user_id.in_(user_ids)))
    cached = {u.user_id: u for u in result.scalars().all()}

    now = datetime.now(UTC)
    stale_ids = [
        uid
        for uid in user_ids
        if uid not in cached
        or (now - cached[uid].cached_at.replace(tzinfo=UTC)).total_seconds() >= settings.user_cache_ttl_seconds
    ]

    if stale_ids:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.core_client_info_url}/profile/users/batch",
                    json={"user_ids": [str(uid) for uid in stale_ids]},
                )
                if resp.status_code == 200:
                    users_data = resp.json()
                    for u in users_data:
                        uid = UUID(u["id"])
                        stmt = (
                            insert(UserCache)
                            .values(
                                user_id=uid,
                                name=u.get("name", ""),
                                last_name=u.get("last_name", ""),
                                middle_name=u.get("middle_name"),
                                email=u.get("email", ""),
                                avatar=u.get("avatar"),
                                group_name=u.get("group"),
                                faculty=u.get("faculty"),
                                role=u.get("role"),
                                cached_at=now,
                            )
                            .on_conflict_do_update(
                                index_elements=["user_id"],
                                set_={
                                    "name": u.get("name", ""),
                                    "last_name": u.get("last_name", ""),
                                    "cached_at": now,
                                },
                            )
                        )
                        await db.execute(stmt)
                    await db.flush()

                    result = await db.execute(select(UserCache).where(UserCache.user_id.in_(user_ids)))
                    cached = {u.user_id: u for u in result.scalars().all()}
        except Exception:
            logger.exception("Failed batch fetch from core-client-info")

    return cached
