import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RatingLevel(Base):
    __tablename__ = "rating_level"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    level: Mapped[str] = mapped_column(String, nullable=False, default="novice")
    current_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RankingPosition(Base):
    __tablename__ = "ranking_position"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    ranking_type: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    percentile: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievement"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    achievement_id: Mapped[str] = mapped_column(String, nullable=False)
    unlocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    unlocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_progress: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    times_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Streak(Base):
    __tablename__ = "streak"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    current: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserGrade(Base):
    __tablename__ = "user_grade"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    grade: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    grade_type: Mapped[str] = mapped_column(String, nullable=False)
    grade_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
