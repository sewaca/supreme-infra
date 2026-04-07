from uuid import UUID

import redis.asyncio as aioredis

from app.config import settings

_state: dict = {"client": None}


def get_redis() -> aioredis.Redis:
    if _state["client"] is None:
        _state["client"] = aioredis.from_url(settings.redis_auth_cache_url, decode_responses=True)
    return _state["client"]


async def close_redis() -> None:
    if _state["client"] is not None:
        await _state["client"].aclose()
        _state["client"] = None


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
