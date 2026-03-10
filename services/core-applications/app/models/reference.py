import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReferenceOrder(Base):
    __tablename__ = "reference_order"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    reference_type: Mapped[str] = mapped_column(String, nullable=False)
    type_label: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="preparation")
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    pickup_point_id: Mapped[str | None] = mapped_column(String, nullable=True)
    virtual_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    storage_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String, nullable=True)
