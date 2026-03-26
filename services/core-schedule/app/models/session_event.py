import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Index, SmallInteger, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SessionEvent(Base):
    __tablename__ = "session_event"
    __table_args__ = (
        Index("ix_session_event_semester_group", "semester_id", "group_name"),
        Index("ix_session_event_semester_teacher", "semester_id", "teacher_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    semester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_number: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    subject_name: Mapped[str] = mapped_column(String, nullable=False)
    lesson_type: Mapped[str] = mapped_column(String, nullable=False)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    group_name: Mapped[str] = mapped_column(String, nullable=False)
    classroom_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
