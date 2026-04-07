from uuid import UUID

import redis.asyncio as aioredis

from app.config import settings

_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_auth_cache_url, decode_responses=True)
    return _client


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _key(jti: UUID) -> str:
    return f"session:{jti}"


async def get_session_status(jti: UUID) -> str | None:
    try:
        return await get_redis().get(_key(jti))
    except Exception:
        return None


async def set_session_status(jti: UUID, status: str, ttl_seconds: int) -> None:
    try:
        if ttl_seconds > 0:
            await get_redis().setex(_key(jti), ttl_seconds, status)
    except Exception:
        pass


async def set_session_revoked(jti: UUID, ttl_seconds: int) -> None:
    await set_session_status(jti, "revoked", ttl_seconds)
