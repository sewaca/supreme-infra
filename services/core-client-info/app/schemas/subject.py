from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SubjectInfo(BaseModel):
    id: str
    name: str
    teacher: str


class SubjectChoiceResponse(BaseModel):
    id: UUID
    choice_id: str
    deadline_date: datetime
    is_active: bool
    subjects: list[SubjectInfo] = []


class UserSubjectPriorityResponse(BaseModel):
    choice_id: UUID
    subject_id: str
    priority: int


class SavePrioritiesRequest(BaseModel):
    choice_id: str
    priorities: list[str]
