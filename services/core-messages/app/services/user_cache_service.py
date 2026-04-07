import json
import logging
from dataclasses import dataclass
from uuid import UUID

import httpx
import redis.asyncio as aioredis

from app.config import settings

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


@dataclass
class CachedUser:
    user_id: UUID
    name: str
    last_name: str
    middle_name: str | None
    email: str
    avatar: str | None
    group_name: str | None
    faculty: str | None
    role: str | None


def _from_dict(data: dict) -> CachedUser:
    return CachedUser(
        user_id=UUID(data["id"]) if "id" in data else UUID(str(data.get("user_id", ""))),
        name=data.get("name", ""),
        last_name=data.get("last_name", ""),
        middle_name=data.get("middle_name"),
        email=data.get("email", ""),
        avatar=data.get("avatar"),
        group_name=data.get("group") or data.get("group_name"),
        faculty=data.get("faculty"),
        role=data.get("role"),
    )


async def _redis_get(user_id: UUID) -> CachedUser | None:
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = await r.get(_cache_key(user_id))
        return _from_dict(json.loads(raw)) if raw else None
    except Exception:
        logger.debug("Redis read failed for user %s", user_id)
        return None


async def _redis_get_batch(user_ids: list[UUID]) -> dict[UUID, CachedUser]:
    r = _get_redis()
    if r is None or not user_ids:
        return {}
    try:
        values = await r.mget([_cache_key(uid) for uid in user_ids])
        result: dict[UUID, CachedUser] = {}
        for uid, raw in zip(user_ids, values):
            if raw:
                result[uid] = _from_dict(json.loads(raw))
        return result
    except Exception:
        logger.debug("Redis batch read failed")
        return {}


async def get_cached_user(user_id: UUID) -> CachedUser | None:
    """Redis → HTTP to core-client-info (which populates Redis as side effect)."""
    cached = await _redis_get(user_id)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.core_client_info_url}/profile/user",
                params={"user_id": str(user_id)},
            )
            if resp.status_code == 200:
                return _from_dict(resp.json())
            logger.warning("core-client-info returned %d for user %s", resp.status_code, user_id)
    except Exception:
        logger.exception("Failed to fetch user %s from core-client-info", user_id)

    return None


async def get_cached_users_batch(user_ids: list[UUID]) -> dict[UUID, CachedUser]:
    """Redis batch → HTTP batch for misses."""
    if not user_ids:
        return {}

    result = await _redis_get_batch(user_ids)
    missing = [uid for uid in user_ids if uid not in result]

    if not missing:
        return result

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.core_client_info_url}/profile/users/batch",
                json={"user_ids": [str(uid) for uid in missing]},
            )
            if resp.status_code == 200:
                for u in resp.json():
                    cached = _from_dict(u)
                    result[cached.user_id] = cached
    except Exception:
        logger.exception("Failed batch fetch from core-client-info")

    return result
