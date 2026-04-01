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
    AuthRoute(path=re.compile(r"^/system-files-storage/upload$"), method="POST", auth_level="valid"),
]
