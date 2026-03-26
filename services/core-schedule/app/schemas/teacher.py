from uuid import UUID

from pydantic import BaseModel


class TeacherSyncItem(BaseModel):
    id: UUID
    name: str


class TeacherSyncRequest(BaseModel):
    items: list[TeacherSyncItem]


class TeacherCacheResponse(BaseModel):
    id: UUID
    name: str
