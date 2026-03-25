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
    AuthRoute(path=re.compile(r"^/core-client-info/profile/personal-data$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/profile/user$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/achievements$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/grade-improvements$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/grades$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/level$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/rankings$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/stats$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/rating/streak$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/settings$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/settings$"), method="PUT", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/settings/email$"), method="POST", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/settings/password$"), method="POST", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/subjects/choices$"), method="GET", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/subjects/save-priorities$"), method="POST", auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-client-info/subjects/user-priorities/[^/]+$"), method="GET", auth_level="valid"),
]
