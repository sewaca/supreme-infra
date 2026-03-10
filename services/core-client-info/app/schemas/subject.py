from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SubjectChoiceResponse(BaseModel):
    id: UUID
    choice_id: str
    deadline_date: datetime
    is_active: bool


class UserSubjectPriorityResponse(BaseModel):
    choice_id: UUID
    subject_id: str
    priority: int


class SavePrioritiesRequest(BaseModel):
    choice_id: str
    priorities: list[str]
