from uuid import UUID

from pydantic import BaseModel


class ClassroomCreate(BaseModel):
    name: str
    building: str | None = None
    capacity: int | None = None


class ClassroomUpdate(BaseModel):
    name: str | None = None
    building: str | None = None
    capacity: int | None = None


class ClassroomResponse(BaseModel):
    id: UUID
    name: str
    building: str | None
    capacity: int | None
