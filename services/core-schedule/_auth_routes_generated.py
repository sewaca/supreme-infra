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
    AuthRoute(path=re.compile(r"^/core-schedule/admin/classrooms$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/classrooms$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/classrooms/[^/]+$"), method='DELETE', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/classrooms/[^/]+$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/classrooms/[^/]+$"), method='PUT', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/overrides$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/overrides$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/overrides/[^/]+$"), method='DELETE', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/overrides/[^/]+$"), method='PUT', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/semesters$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/semesters$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/semesters/[^/]+$"), method='DELETE', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/semesters/[^/]+$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/semesters/[^/]+$"), method='PUT', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/session-events$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/session-events$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/session-events/[^/]+$"), method='DELETE', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/session-events/[^/]+$"), method='PUT', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/teachers$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/teachers/sync$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/templates$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/templates$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/templates/[^/]+$"), method='DELETE', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/templates/[^/]+$"), method='PUT', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/admin/templates/bulk$"), method='POST', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/caldav/[^/]+/groups/[^/]+/calendar.ics$"), method='GET', auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-schedule/caldav/[^/]+/teachers/[^/]+/calendar.ics$"), method='GET', auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-schedule/groups$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/groups/[^/]+/exams$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/groups/[^/]+/schedule$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/groups/[^/]+/template$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/teachers$"), method='GET', auth_level="none"),
    AuthRoute(path=re.compile(r"^/core-schedule/teachers/[^/]+/exams$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/teachers/[^/]+/schedule$"), method='GET', auth_level="valid"),
    AuthRoute(path=re.compile(r"^/core-schedule/teachers/[^/]+/template$"), method='GET', auth_level="valid"),
]
