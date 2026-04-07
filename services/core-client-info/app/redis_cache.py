import json
import logging
from uuid import UUID

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_cache_url, decode_responses=True)
    return _client


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _key(user_id: UUID) -> str:
    return f"user_profile:{user_id}"


async def cache_user(user_id: UUID, data: dict) -> None:
    try:
        await get_redis().setex(_key(user_id), settings.user_cache_ttl, json.dumps(data, default=str))
    except Exception:
        logger.debug("Redis cache write failed for user %s", user_id)


async def get_cached_user(user_id: UUID) -> dict | None:
    try:
        raw = await get_redis().get(_key(user_id))
        return json.loads(raw) if raw else None
    except Exception:
        logger.debug("Redis cache read failed for user %s", user_id)
        return None


async def invalidate_user(user_id: UUID) -> None:
    try:
        await get_redis().delete(_key(user_id))
    except Exception:
        logger.debug("Redis cache invalidation failed for user %s", user_id)
