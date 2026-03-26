import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Index, SmallInteger, String, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScheduleOverride(Base):
    __tablename__ = "schedule_override"
    __table_args__ = (
        UniqueConstraint(
            "semester_id",
            "date",
            "slot_number",
            "group_name",
            name="uq_override_slot",
        ),
        Index("ix_schedule_override_lookup", "semester_id", "date", "group_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    semester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    group_name: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    new_subject_name: Mapped[str | None] = mapped_column(String, nullable=True)
    new_lesson_type: Mapped[str | None] = mapped_column(String, nullable=True)
    new_teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    new_classroom_name: Mapped[str | None] = mapped_column(String, nullable=True)
    new_start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    new_end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
