from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.teacher_cache import TeacherCache
from app.services.ical_builder import build_ical
from app.services.schedule_resolver import (
    get_active_semester,
    resolve_group_schedule,
    resolve_teacher_schedule,
)

router = APIRouter(prefix="/caldav", tags=["caldav"])

PAST_WEEKS = 2
FUTURE_WEEKS = 16


@router.get("/groups/{group_name}/calendar.ics", response_class=Response)
async def group_calendar(
    group_name: str,
    db: AsyncSession = Depends(get_db),
):
    semester = await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="No active semester")

    today = date.today()
    date_from = today - timedelta(weeks=PAST_WEEKS)
    date_to = today + timedelta(weeks=FUTURE_WEEKS)

    days = await resolve_group_schedule(db, group_name, date_from, date_to, semester)
    ical = build_ical(days, calendar_name=f"Расписание {group_name}", uid_suffix=group_name)

    return Response(
        content=ical.encode("utf-8"),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="calendar.ics"'},
    )


async def _get_teacher_display_name(db: AsyncSession, teacher_id: UUID) -> str:
    result = await db.execute(select(TeacherCache).where(TeacherCache.id == teacher_id))
    teacher = result.scalar_one_or_none()
    return teacher.name if teacher else str(teacher_id)


@router.get("/teachers/{teacher_id}/calendar.ics", response_class=Response)
async def teacher_calendar(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    semester = await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="No active semester")

    today = date.today()
    date_from = today - timedelta(weeks=PAST_WEEKS)
    date_to = today + timedelta(weeks=FUTURE_WEEKS)

    days = await resolve_teacher_schedule(db, teacher_id, date_from, date_to, semester)
    teacher_name = await _get_teacher_display_name(db, teacher_id)
    ical = build_ical(days, calendar_name=f"Расписание {teacher_name}", uid_suffix=str(teacher_id))

    return Response(
        content=ical.encode("utf-8"),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="calendar.ics"'},
    )
