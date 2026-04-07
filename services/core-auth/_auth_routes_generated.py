# AUTO-GENERATED from router.yaml — DO NOT EDIT
# Run pnpm generate:router to regenerate

import re
from dataclasses import dataclass
from typing import Literal

AuthLevel = Literal["none", "valid"]


@dataclass
class AuthRoute:
    path: re.Pattern
    method: str | None
    auth_level: AuthLevel


AUTH_ROUTES: list[AuthRoute] = [
    AuthRoute(path=re.compile(r"^/core-auth/auth/caldav-tokens$"), method="GET", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/caldav-tokens$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/caldav-tokens/[^/]+$"), method="DELETE", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/challenge$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/challenge/[^/]+/check$"), method="GET", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/challenge/[^/]+/verify$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/forgot-password$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/forgot-password/[^/]+/reset$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/forgot-password/[^/]+/verify$"), method="POST", auth_level="none"),
    AuthRoute(
        path=re.compile(r"^/core-auth/auth/internal/caldav-tokens/validate/[^/]+$"), method="GET", auth_level="none"
    ),
    AuthRoute(path=re.compile(r"^/core-auth/auth/internal/users/[^/]+/email$"), method="PATCH", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/internal/users/[^/]+/password$"), method="PATCH", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/login$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/lookup$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/me$"), method="GET", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/register$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/sessions$"), method="GET", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/sessions/[^/]+$"), method="DELETE", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-auth/auth/validate-session$"), method="POST", auth_level="none"),
]
