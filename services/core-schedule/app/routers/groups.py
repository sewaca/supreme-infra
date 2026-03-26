from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.schedule import DaySchedule
from app.schemas.session_event import SessionEventResponse
from app.schemas.template import TemplateResponse
from app.services.schedule_resolver import (
    get_active_semester,
    get_group_exams,
    get_group_template,
    get_semester_by_id,
    resolve_group_schedule,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/{group_name}/schedule", response_model=list[DaySchedule])
async def group_schedule(
    group_name: str,
    date_from: date = Query(...),
    date_to: date = Query(...),
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await resolve_group_schedule(db, group_name, date_from, date_to, semester)


@router.get("/{group_name}/exams", response_model=list[SessionEventResponse])
async def group_exams(
    group_name: str,
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await get_group_exams(db, group_name, semester)


@router.get("/{group_name}/template", response_model=TemplateResponse)
async def group_template(
    group_name: str,
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await get_group_template(db, group_name, semester)
