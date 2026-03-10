from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    reference_type: str
    pickup_point_id: str | None = None
    virtual_only: bool = False
