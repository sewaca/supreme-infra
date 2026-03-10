from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ApplicationResponse(BaseModel):
    id: UUID
    application_type: str
    application_number: str
    additional_fields: dict[str, Any] | None
    start_date: datetime | None
    end_date: datetime | None
    is_active: bool
    notifications_count: int


class ApplicationNotificationResponse(BaseModel):
    id: UUID
    application_id: UUID
    severity: str
    message: str
    action: str | None
    created_at: datetime
