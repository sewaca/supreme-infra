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
    AuthRoute(path=re.compile(r"^/core-applications/applications$"), method="GET", auth_level="valid"),
    AuthRoute(
        path=re.compile(r"^/core-applications/applications/internal/init-user$"), method="POST", auth_level="none"
    ),
    AuthRoute(path=re.compile(r"^/core-applications/applications/notifications$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/dormitory/applications$"), method="POST", auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-applications/dormitory/parent-agreement$"), method="POST", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/orders$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/orders/[^/]+$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/orders/[^/]+/pdf$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/orders/counts$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/references$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/references/[^/]+$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/references/[^/]+/cancel$"), method="POST", auth_level="valid"),
    AuthRoute(
        path=re.compile(r"^/core-applications/references/[^/]+/extend-storage$"), method="POST", auth_level="valid"
    ),
    AuthRoute(path=re.compile(r"^/core-applications/references/[^/]+/pdf$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-applications/references/order$"), method="POST", auth_level="valid"),
]
