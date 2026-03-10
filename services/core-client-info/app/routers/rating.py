from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rating import RatingLevel, RankingPosition, Streak, UserAchievement, UserGrade
from app.models.student import StudentStats
from app.schemas.rating import (
    GradeImprovementResponse,
    RatingLevelResponse,
    RankingPositionResponse,
    StreakResponse,
    StudentStatsResponse,
    UserAchievementResponse,
    UserGradeResponse,
)

router = APIRouter(prefix="/rating", tags=["rating"])


@router.get("/stats", response_model=StudentStatsResponse)
async def get_stats(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudentStats).where(StudentStats.user_id == user_id))
    stats = result.scalar_one_or_none()
    if stats is None:
        return StudentStatsResponse()
    return StudentStatsResponse(
        course=stats.course,
        faculty=stats.faculty,
        specialty=stats.specialty,
        direction=stats.direction,
        profile=stats.profile,
        group=stats.group,
        status=stats.status,
        qualification=stats.qualification,
        average_grade=stats.average_grade,
        education_form=stats.education_form,
    )


@router.get("/level", response_model=RatingLevelResponse)
async def get_level(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RatingLevel).where(RatingLevel.user_id == user_id))
    level = result.scalar_one_or_none()
    if level is None:
        return RatingLevelResponse(level="novice", current_xp=0)
    return RatingLevelResponse(level=level.level, current_xp=level.current_xp)


@router.get("/rankings", response_model=list[RankingPositionResponse])
async def get_rankings(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RankingPosition).where(RankingPosition.user_id == user_id))
    rankings = result.scalars().all()
    return [
        RankingPositionResponse(
            ranking_type=r.ranking_type,
            position=r.position,
            total=r.total,
            percentile=r.percentile,
        )
        for r in rankings
    ]


@router.get("/achievements", response_model=list[UserAchievementResponse])
async def get_achievements(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserAchievement).where(UserAchievement.user_id == user_id))
    achievements = result.scalars().all()
    return [
        UserAchievementResponse(
            achievement_id=a.achievement_id,
            unlocked=a.unlocked,
            unlocked_at=a.unlocked_at,
            progress=a.progress,
            max_progress=a.max_progress,
            times_earned=a.times_earned,
        )
        for a in achievements
    ]


@router.get("/streak", response_model=StreakResponse)
async def get_streak(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()
    if streak is None:
        return StreakResponse(current=0, best=0, last_updated=None)
    return StreakResponse(current=streak.current, best=streak.best, last_updated=streak.last_updated)


@router.get("/grades", response_model=list[UserGradeResponse])
async def get_grades(
    user_id: UUID,
    period: str | None = Query(None, description="all_time or last_session"),
    db: AsyncSession = Depends(get_db),
):
    query = select(UserGrade).where(UserGrade.user_id == user_id).order_by(UserGrade.grade_date.desc())
    result = await db.execute(query)
    grades = result.scalars().all()
    return [
        UserGradeResponse(
            id=g.id,
            subject=g.subject,
            grade=g.grade,
            grade_type=g.grade_type,
            grade_date=g.grade_date,
        )
        for g in grades
    ]


@router.get("/grade-improvements", response_model=list[GradeImprovementResponse])
async def get_grade_improvements(user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — calculate improvements by comparing consecutive grades per subject
    raise NotImplementedError("grade_improvements not implemented")
