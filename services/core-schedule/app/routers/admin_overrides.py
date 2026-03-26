from datetime import (
    date,
    time as dt_time,
)
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.schedule_override import ScheduleOverride
from app.schemas.override import OverrideCreate, OverrideResponse, OverrideUpdate

router = APIRouter(prefix="/admin/overrides", tags=["admin-overrides"])


def _parse_time(s: str | None) -> dt_time | None:
    if not s:
        return None
    parts = s.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _time_str(t: dt_time | None) -> str | None:
    return t.strftime("%H:%M") if t else None


def _to_response(o: ScheduleOverride) -> OverrideResponse:
    return OverrideResponse(
        id=o.id,
        semester_id=o.semester_id,
        date=o.date,
        slot_number=o.slot_number,
        group_name=o.group_name,
        action=o.action,
        new_subject_name=o.new_subject_name,
        new_lesson_type=o.new_lesson_type,
        new_teacher_name=o.new_teacher_name,
        new_classroom_name=o.new_classroom_name,
        new_start_time=_time_str(o.new_start_time),
        new_end_time=_time_str(o.new_end_time),
        comment=o.comment,
    )


@router.get("", response_model=list[OverrideResponse])
async def list_overrides(
    _user: AdminUser,
    semester_id: UUID = Query(...),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    group_name: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(ScheduleOverride).where(ScheduleOverride.semester_id == semester_id)
    if date_from:
        q = q.where(ScheduleOverride.date >= date_from)
    if date_to:
        q = q.where(ScheduleOverride.date <= date_to)
    if group_name:
        q = q.where(ScheduleOverride.group_name == group_name)
    q = q.order_by(ScheduleOverride.date, ScheduleOverride.slot_number).offset(offset).limit(limit)
    result = await db.execute(q)
    return [_to_response(o) for o in result.scalars().all()]


@router.post("", response_model=OverrideResponse, status_code=201)
async def create_override(body: OverrideCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = ScheduleOverride(
        semester_id=body.semester_id,
        date=body.date,
        slot_number=body.slot_number,
        group_name=body.group_name,
        action=body.action,
        new_subject_name=body.new_subject_name,
        new_lesson_type=body.new_lesson_type,
        new_teacher_name=body.new_teacher_name,
        new_classroom_name=body.new_classroom_name,
        new_start_time=_parse_time(body.new_start_time),
        new_end_time=_parse_time(body.new_end_time),
        comment=body.comment,
    )
    db.add(obj)
    await db.flush()
    return _to_response(obj)


@router.put("/{override_id}", response_model=OverrideResponse)
async def update_override(
    override_id: UUID, body: OverrideUpdate, _user: AdminUser, db: AsyncSession = Depends(get_db)
):
    obj = await db.get(ScheduleOverride, override_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Override not found")
    data = body.model_dump(exclude_unset=True)
    if "new_start_time" in data:
        data["new_start_time"] = _parse_time(data["new_start_time"])
    if "new_end_time" in data:
        data["new_end_time"] = _parse_time(data["new_end_time"])
    for field, value in data.items():
        setattr(obj, field, value)
    await db.flush()
    return _to_response(obj)


@router.delete("/{override_id}")
async def delete_override(override_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(ScheduleOverride, override_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Override not found")
    await db.delete(obj)
    return {"message": "Override deleted"}
