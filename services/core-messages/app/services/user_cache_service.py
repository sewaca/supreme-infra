import json
import logging
from datetime import UTC, datetime
from uuid import UUID

import httpx
import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user_cache import UserCache

logger = logging.getLogger(__name__)

_redis_client: aioredis.Redis | None = None


def _get_redis() -> aioredis.Redis | None:
    if not settings.redis_cache_url:
        return None
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.redis_cache_url, decode_responses=True)
    return _redis_client


def _cache_key(user_id: UUID) -> str:
    return f"user_profile:{user_id}"


async def _read_from_redis(user_id: UUID) -> dict | None:
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = await r.get(_cache_key(user_id))
        return json.loads(raw) if raw else None
    except Exception:
        logger.debug("Redis read failed for user %s", user_id)
        return None


async def _read_batch_from_redis(user_ids: list[UUID]) -> dict[UUID, dict]:
    r = _get_redis()
    if r is None or not user_ids:
        return {}
    try:
        keys = [_cache_key(uid) for uid in user_ids]
        values = await r.mget(keys)
        result: dict[UUID, dict] = {}
        for uid, raw in zip(user_ids, values):
            if raw:
                result[uid] = json.loads(raw)
        return result
    except Exception:
        logger.debug("Redis batch read failed")
        return {}


def _redis_to_user_cache(user_id: UUID, data: dict) -> UserCache:
    obj = UserCache()
    obj.user_id = user_id
    obj.name = data.get("name", "")
    obj.last_name = data.get("last_name", "")
    obj.middle_name = data.get("middle_name")
    obj.email = data.get("email", "")
    obj.avatar = data.get("avatar")
    obj.group_name = data.get("group")
    obj.faculty = data.get("faculty")
    obj.role = data.get("role")
    obj.cached_at = datetime.now(UTC)
    return obj


async def get_cached_user(user_id: UUID, db: AsyncSession) -> UserCache | None:
    """Get user from Redis cache, fall back to HTTP, then local DB."""
    # 1. Redis hit
    cached_data = await _read_from_redis(user_id)
    if cached_data:
        return _redis_to_user_cache(user_id, cached_data)

    # 2. HTTP to core-client-info (which populates Redis as a side effect)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.core_client_info_url}/profile/user",
                params={"user_id": str(user_id)},
            )
            if resp.status_code != 200:
                logger.warning("core-client-info returned %d for user %s", resp.status_code, user_id)
            else:
                data = resp.json()
                now = datetime.now(UTC)
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
    except Exception:
        logger.exception("Failed to fetch user %s from core-client-info", user_id)

    # 3. Local DB fallback
    result = await db.execute(select(UserCache).where(UserCache.user_id == user_id))
    return result.scalar_one_or_none()


async def get_cached_users_batch(user_ids: list[UUID], db: AsyncSession) -> dict[UUID, UserCache]:
    """Get multiple users. Redis first, then batch HTTP for misses, then local DB fallback."""
    if not user_ids:
        return {}

    # 1. Check Redis for all IDs
    redis_hits = await _read_batch_from_redis(user_ids)
    result_map: dict[UUID, UserCache] = {uid: _redis_to_user_cache(uid, data) for uid, data in redis_hits.items()}

    missing_ids = [uid for uid in user_ids if uid not in result_map]
    if not missing_ids:
        return result_map

    # 2. Batch HTTP for missing IDs (core-client-info populates Redis as side effect)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.core_client_info_url}/profile/users/batch",
                json={"user_ids": [str(uid) for uid in missing_ids]},
            )
            if resp.status_code == 200:
                now = datetime.now(UTC)
                for u in resp.json():
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

                db_result = await db.execute(select(UserCache).where(UserCache.user_id.in_(missing_ids)))
                for uc in db_result.scalars().all():
                    result_map[uc.user_id] = uc

                return result_map
    except Exception:
        logger.exception("Failed batch fetch from core-client-info")

    # 3. Local DB fallback for remaining missing IDs
    still_missing = [uid for uid in missing_ids if uid not in result_map]
    if still_missing:
        db_result = await db.execute(select(UserCache).where(UserCache.user_id.in_(still_missing)))
        for uc in db_result.scalars().all():
            result_map[uc.user_id] = uc

    return result_map
