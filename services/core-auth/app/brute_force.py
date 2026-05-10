import contextlib

from app.auth_cache import get_redis

MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60

MAX_LOOKUP_ATTEMPTS = 10
LOOKUP_LOCKOUT_SECONDS = 15 * 60


def _key(email: str) -> str:
    return f"brute:login:{email.lower()}"


def _lookup_key(ip: str) -> str:
    return f"brute:lookup:{ip}"


async def is_locked(email: str) -> tuple[bool, int]:
    """Returns (locked, ttl_seconds). ttl is remaining lockout time if locked."""
    try:
        redis = get_redis()
        count_raw = await redis.get(_key(email))
        if count_raw is None:
            return False, 0
        count = int(count_raw)
        if count < MAX_ATTEMPTS:
            return False, 0
        ttl = await redis.ttl(_key(email))
        return True, max(ttl, 0)
    except Exception:
        return False, 0


async def record_failed_attempt(email: str) -> int:
    """Increments failure counter. Returns remaining attempts before lockout."""
    try:
        redis = get_redis()
        count = await redis.incr(_key(email))
        if count == 1:
            await redis.expire(_key(email), LOCKOUT_SECONDS)
        return max(0, MAX_ATTEMPTS - count)
    except Exception:
        return MAX_ATTEMPTS


async def reset_attempts(email: str) -> None:
    with contextlib.suppress(Exception):
        await get_redis().delete(_key(email))


async def is_lookup_locked(ip: str) -> tuple[bool, int]:
    try:
        redis = get_redis()
        count_raw = await redis.get(_lookup_key(ip))
        if count_raw is None:
            return False, 0
        count = int(count_raw)
        if count < MAX_LOOKUP_ATTEMPTS:
            return False, 0
        ttl = await redis.ttl(_lookup_key(ip))
        return True, max(ttl, 0)
    except Exception:
        return False, 0


async def record_lookup_attempt(ip: str) -> None:
    try:
        redis = get_redis()
        count = await redis.incr(_lookup_key(ip))
        if count == 1:
            await redis.expire(_lookup_key(ip), LOOKUP_LOCKOUT_SECONDS)
    except Exception:
        pass
