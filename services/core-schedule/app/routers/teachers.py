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
    get_semester_by_id,
    get_teacher_exams,
    get_teacher_template,
    resolve_teacher_schedule,
)

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/{teacher_id}/schedule", response_model=list[DaySchedule])
async def teacher_schedule(
    teacher_id: UUID,
    date_from: date = Query(...),
    date_to: date = Query(...),
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await resolve_teacher_schedule(db, teacher_id, date_from, date_to, semester)


@router.get("/{teacher_id}/exams", response_model=list[SessionEventResponse])
async def teacher_exams(
    teacher_id: UUID,
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await get_teacher_exams(db, teacher_id, semester)


@router.get("/{teacher_id}/template", response_model=TemplateResponse)
async def teacher_template(
    teacher_id: UUID,
    semester_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    semester = await get_semester_by_id(db, semester_id) if semester_id else await get_active_semester(db)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return await get_teacher_template(db, teacher_id, semester)
