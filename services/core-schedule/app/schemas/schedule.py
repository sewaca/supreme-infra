from __future__ import annotations

import datetime
from uuid import UUID

from pydantic import BaseModel


class LessonSlot(BaseModel):
    slot_number: int | None
    start_time: str
    end_time: str
    subject_name: str
    lesson_type: str
    teacher_id: UUID | None
    teacher_name: str | None
    group_name: str
    classroom_name: str | None
    is_override: bool = False
    override_comment: str | None = None


class DaySchedule(BaseModel):
    date: datetime.date
    day_of_week: int
    day_name: str
    lessons: list[LessonSlot]
