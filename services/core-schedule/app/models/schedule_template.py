import uuid
from datetime import datetime, time

from sqlalchemy import CheckConstraint, DateTime, Index, SmallInteger, String, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScheduleTemplate(Base):
    __tablename__ = "schedule_template"
    __table_args__ = (
        UniqueConstraint(
            "semester_id",
            "week_number",
            "day_of_week",
            "slot_number",
            "group_name",
            name="uq_template_slot",
        ),
        Index("ix_schedule_template_semester_group", "semester_id", "group_name"),
        Index("ix_schedule_template_semester_teacher", "semester_id", "teacher_id"),
        CheckConstraint("week_number IN (1, 2)", name="ck_template_week"),
        CheckConstraint("day_of_week BETWEEN 0 AND 5", name="ck_template_dow"),
        CheckConstraint("slot_number BETWEEN 1 AND 8", name="ck_template_slot"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    semester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    week_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    slot_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
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
