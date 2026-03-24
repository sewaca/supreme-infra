from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class StudentStatsResponse(BaseModel):
    course: int | None = None
    faculty: str | None = None
    specialty: str | None = None
    direction: str | None = None
    profile: str | None = None
    group: str | None = None
    status: str | None = None
    qualification: str | None = None
    average_grade: Decimal | None = None
    education_form: str | None = None


class RatingLevelResponse(BaseModel):
    level: str
    current_xp: int
    title: str | None = None
    color: str | None = None
    next_level_xp: int | None = None


class RankingPositionResponse(BaseModel):
    ranking_type: str
    position: int
    total: int
    percentile: Decimal


class UserAchievementResponse(BaseModel):
    achievement_id: str
    unlocked: bool
    unlocked_at: datetime | None = None
    progress: int
    max_progress: int
    times_earned: int


class StreakResponse(BaseModel):
    current: int
    best: int
    last_updated: datetime


class UserGradeResponse(BaseModel):
    id: UUID
    subject: str
    grade: Decimal | None = None
    grade_type: str
    grade_date: datetime
    course: int
    semester: int
    hours: int
    teacher: str


class GradeImprovementResponse(BaseModel):
    subject: str
    old_grade: Decimal
    new_grade: Decimal
    improvement: Decimal
    grade_date: datetime
