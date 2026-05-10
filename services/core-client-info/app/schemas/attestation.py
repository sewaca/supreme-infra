from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AttestationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    subject_name: str
    is_attested: bool
    reason: str | None = None
    teacher_id: UUID | None = None
    teacher_full_name: str | None = None
    semester: int
    created_at: datetime
