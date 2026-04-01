import threading
import time
from dataclasses import dataclass, field

# Sliding window: max files per window before penalty kicks in
WINDOW_SECONDS = 60
MAX_FILES_PER_WINDOW = 20

# Exponential backoff: 30s, 60s, 120s, 240s, ... capped at 1 hour
BASE_PENALTY_SECONDS = 30
MAX_PENALTY_SECONDS = 3600


@dataclass
class _UserState:
    timestamps: list[float] = field(default_factory=list)
    violations: int = 0
    blocked_until: float = 0.0


_states: dict[str, _UserState] = {}
_lock = threading.Lock()


def check_rate_limit(user_id: str, file_count: int) -> tuple[bool, float]:
    """
    Returns (allowed, retry_after_seconds).

    Allows up to MAX_FILES_PER_WINDOW files per WINDOW_SECONDS.
    On each violation the user is blocked for BASE_PENALTY_SECONDS * 2^(violations-1),
    capped at MAX_PENALTY_SECONDS.
    """
    now = time.time()
    with _lock:
        state = _states.setdefault(user_id, _UserState())

        if now < state.blocked_until:
            return False, state.blocked_until - now

        cutoff = now - WINDOW_SECONDS
        state.timestamps = [t for t in state.timestamps if t > cutoff]

        if len(state.timestamps) + file_count > MAX_FILES_PER_WINDOW:
            state.violations += 1
            penalty = min(
                BASE_PENALTY_SECONDS * (2 ** (state.violations - 1)),
                MAX_PENALTY_SECONDS,
            )
            state.blocked_until = now + penalty
            return False, penalty

        state.timestamps.extend([now] * file_count)
        return True, 0.0
