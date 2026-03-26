from __future__ import annotations

import datetime
from uuid import UUID

from pydantic import BaseModel


class OverrideCreate(BaseModel):
    semester_id: UUID
    date: datetime.date
    slot_number: int
    group_name: str
    action: str
    new_subject_name: str | None = None
    new_lesson_type: str | None = None
    new_teacher_name: str | None = None
    new_classroom_name: str | None = None
    new_start_time: str | None = None
    new_end_time: str | None = None
    comment: str | None = None


class OverrideUpdate(BaseModel):
    date: datetime.date | None = None
    slot_number: int | None = None
    group_name: str | None = None
    action: str | None = None
    new_subject_name: str | None = None
    new_lesson_type: str | None = None
    new_teacher_name: str | None = None
    new_classroom_name: str | None = None
    new_start_time: str | None = None
    new_end_time: str | None = None
    comment: str | None = None


class OverrideResponse(BaseModel):
    id: UUID
    semester_id: UUID
    date: datetime.date
    slot_number: int
    group_name: str
    action: str
    new_subject_name: str | None
    new_lesson_type: str | None
    new_teacher_name: str | None
    new_classroom_name: str | None
    new_start_time: str | None
    new_end_time: str | None
    comment: str | None
