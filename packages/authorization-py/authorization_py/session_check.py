import time
from typing import Literal

import httpx

from .metrics import session_check_duration, session_check_total

SessionStatus = Literal["valid", "revoked", "expired", "invalid", "error"]


async def check_session(
    token: str,
    core_auth_url: str,
    timeout: float = 5.0,
) -> SessionStatus:
    """Call core-auth /auth/validate-session and return session status."""
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{core_auth_url}/auth/validate-session",
                json={"token": token},
            )
        data = response.json()
        status: SessionStatus = data.get("status", "invalid")
    except Exception:
        status = "error"

    duration_ms = (time.perf_counter() - start) * 1000
    session_check_duration.record(duration_ms, {"status": status})
    session_check_total.add(1, {"status": status})

    return status
