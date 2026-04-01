import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserCache(Base):
    __tablename__ = "user_cache"
    __table_args__ = (
        Index("ix_user_cache_name_lower", text("lower(name)")),
        Index("ix_user_cache_last_name_lower", text("lower(last_name)")),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'student' | 'teacher' | 'admin'

    cached_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
