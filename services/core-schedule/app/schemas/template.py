from uuid import UUID

from pydantic import BaseModel


class TemplateSlotCreate(BaseModel):
    semester_id: UUID
    week_number: int
    day_of_week: int
    slot_number: int
    start_time: str
    end_time: str
    subject_name: str
    lesson_type: str
    teacher_name: str | None = None
    group_name: str
    classroom_name: str | None = None


class TemplateSlotUpdate(BaseModel):
    week_number: int | None = None
    day_of_week: int | None = None
    slot_number: int | None = None
    start_time: str | None = None
    end_time: str | None = None
    subject_name: str | None = None
    lesson_type: str | None = None
    teacher_name: str | None = None
    group_name: str | None = None
    classroom_name: str | None = None


class TemplateSlotBulkCreate(BaseModel):
    items: list[TemplateSlotCreate]


class TemplateSlotResponse(BaseModel):
    id: UUID
    semester_id: UUID
    week_number: int
    day_of_week: int
    slot_number: int
    start_time: str
    end_time: str
    subject_name: str
    lesson_type: str
    teacher_name: str | None
    group_name: str
    classroom_name: str | None


class DayTemplate(BaseModel):
    day_of_week: int
    day_name: str
    slots: list[TemplateSlotResponse]


class TemplateResponse(BaseModel):
    semester_id: UUID
    semester_name: str
    week_1: list[DayTemplate]
    week_2: list[DayTemplate]
