import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TwoFactorAuth(Base):
    __tablename__ = "two_factor_auth"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth_user.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    method: Mapped[str | None] = mapped_column(String(20), nullable=True, default="totp")
    secret: Mapped[str | None] = mapped_column(String, nullable=True)
    backup_codes: Mapped[str | None] = mapped_column(String, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
