import time
from typing import Any

import jwt

from .metrics import jwt_verify_duration, jwt_verify_total

type Payload = dict[str, Any]
type Status = str  # "valid" | "expired" | "invalid"


def decode_token_safe(token: str, secret: str) -> tuple[Payload | None, Status]:
    """Verify and decode a JWT token. Returns (payload, status)."""
    start = time.perf_counter()
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        duration_ms = (time.perf_counter() - start) * 1000
        jwt_verify_duration.record(duration_ms, {"result": "valid"})
        jwt_verify_total.add(1, {"result": "valid"})
        return payload, "valid"
    except jwt.ExpiredSignatureError:
        duration_ms = (time.perf_counter() - start) * 1000
        jwt_verify_duration.record(duration_ms, {"result": "expired"})
        jwt_verify_total.add(1, {"result": "expired"})
        return None, "expired"
    except jwt.InvalidTokenError:
        duration_ms = (time.perf_counter() - start) * 1000
        jwt_verify_duration.record(duration_ms, {"result": "invalid"})
        jwt_verify_total.add(1, {"result": "invalid"})
        return None, "invalid"
