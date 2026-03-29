from uuid import UUID

from pydantic import BaseModel


class UserBrief(BaseModel):
    user_id: UUID
    name: str
    last_name: str
    avatar: str | None = None
    group_name: str | None = None
    role: str | None = None


class UserSearchResponse(BaseModel):
    items: list[UserBrief]
