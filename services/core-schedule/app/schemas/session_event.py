from __future__ import annotations

import datetime
from uuid import UUID

from pydantic import BaseModel


class SessionEventCreate(BaseModel):
    semester_id: UUID
    date: datetime.date
    slot_number: int | None = None
    start_time: str
    end_time: str
    subject_name: str
    lesson_type: str
    teacher_name: str | None = None
    group_name: str
    classroom_name: str | None = None


class SessionEventUpdate(BaseModel):
    date: datetime.date | None = None
    slot_number: int | None = None
    start_time: str | None = None
    end_time: str | None = None
    subject_name: str | None = None
    lesson_type: str | None = None
    teacher_name: str | None = None
    group_name: str | None = None
    classroom_name: str | None = None


class SessionEventResponse(BaseModel):
    id: UUID
    semester_id: UUID
    date: datetime.date
    slot_number: int | None
    start_time: str
    end_time: str
    subject_name: str
    lesson_type: str
    teacher_name: str | None
    group_name: str
    classroom_name: str | None
