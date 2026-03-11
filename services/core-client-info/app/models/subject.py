import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SubjectChoice(Base):
    __tablename__ = "subject_choice"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    choice_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    deadline_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class UserSubjectPriority(Base):
    __tablename__ = "user_subject_priority"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    choice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    subject_id: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
