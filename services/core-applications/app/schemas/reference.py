from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class ReferenceType(StrEnum):
    RDZD = "rdzd"
    WORKPLACE = "workplace"
    PARENTS_WORKPLACE = "parents_workplace"
    MILITARY = "military"
    SCHOLARSHIP = "scholarship"
    STUDY_CONFIRMATION = "study_confirmation"
    ACADEMIC_LEAVE = "academic_leave"
    TRANSCRIPT = "transcript"


class ReferenceStatus(StrEnum):
    PREPARATION = "preparation"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    READY = "ready"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class ReferenceOrderResponse(BaseModel):
    id: UUID
    reference_type: str
    type_label: str
    status: str
    order_date: datetime
    pickup_point_id: str | None = None
    virtual_only: bool
    storage_until: datetime | None = None
    pdf_url: str | None = None


class CreateReferenceRequest(BaseModel):
    reference_type: ReferenceType
    pickup_point_id: str | None = None
    virtual_only: bool = False
