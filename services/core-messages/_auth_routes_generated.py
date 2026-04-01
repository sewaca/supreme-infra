# AUTO-GENERATED from router.yaml — DO NOT EDIT
# Run pnpm generate:router to regenerate

import re
from dataclasses import dataclass
from typing import Literal

AuthLevel = Literal['none', 'valid']


@dataclass
class AuthRoute:
    path: re.Pattern
    method: str | None
    auth_level: AuthLevel


AUTH_ROUTES: list[AuthRoute] = [
    AuthRoute(path=re.compile(r'^/core-messages/broadcasts$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/broadcasts$'), method='POST', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/broadcasts/groups$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+$'), method='DELETE', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+/messages$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+/messages$'), method='POST', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+/messages/[^/]+$'), method='DELETE', auth_level='none'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+/messages/[^/]+$'), method='PATCH', auth_level='none'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/[^/]+/messages/read$'), method='POST', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/direct$'), method='POST', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/conversations/updates$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/files$'), method='POST', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/messages/search$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/users/[^/]+$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/users/search$'), method='GET', auth_level='valid'),
    AuthRoute(path=re.compile(r'^/core-messages/ws$'), method='GET', auth_level='none'),
]
