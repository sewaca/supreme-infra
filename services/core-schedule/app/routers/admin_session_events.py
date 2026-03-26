from datetime import time as dt_time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.session_event import SessionEvent
from app.schemas.session_event import SessionEventCreate, SessionEventResponse, SessionEventUpdate
from app.services.schedule_resolver import _load_teacher_names, _resolve_teacher_name

router = APIRouter(prefix="/admin/session-events", tags=["admin-session-events"])


def _parse_time(s: str) -> dt_time:
    parts = s.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _time_str(t: dt_time) -> str:
    return t.strftime("%H:%M")


def _to_response(e: SessionEvent, teacher_cache: dict[UUID, str]) -> SessionEventResponse:
    return SessionEventResponse(
        id=e.id,
        semester_id=e.semester_id,
        date=e.date,
        slot_number=e.slot_number,
        start_time=_time_str(e.start_time),
        end_time=_time_str(e.end_time),
        subject_name=e.subject_name,
        lesson_type=e.lesson_type,
        teacher_id=e.teacher_id,
        teacher_name=_resolve_teacher_name(e.teacher_id, teacher_cache),
        group_name=e.group_name,
        classroom_name=e.classroom_name,
    )


@router.get("", response_model=list[SessionEventResponse])
async def list_session_events(
    _user: AdminUser,
    semester_id: UUID = Query(...),
    group_name: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(SessionEvent).where(SessionEvent.semester_id == semester_id)
    if group_name:
        q = q.where(SessionEvent.group_name == group_name)
    q = q.order_by(SessionEvent.date, SessionEvent.start_time).offset(offset).limit(limit)
    teacher_cache = await _load_teacher_names(db)
    result = await db.execute(q)
    return [_to_response(e, teacher_cache) for e in result.scalars().all()]


@router.post("", response_model=SessionEventResponse, status_code=201)
async def create_session_event(body: SessionEventCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = SessionEvent(
        semester_id=body.semester_id,
        date=body.date,
        slot_number=body.slot_number,
        start_time=_parse_time(body.start_time),
        end_time=_parse_time(body.end_time),
        subject_name=body.subject_name,
        lesson_type=body.lesson_type,
        teacher_id=body.teacher_id,
        group_name=body.group_name,
        classroom_name=body.classroom_name,
    )
    db.add(obj)
    await db.flush()
    teacher_cache = await _load_teacher_names(db)
    return _to_response(obj, teacher_cache)


@router.put("/{event_id}", response_model=SessionEventResponse)
async def update_session_event(
    event_id: UUID, body: SessionEventUpdate, _user: AdminUser, db: AsyncSession = Depends(get_db)
):
    obj = await db.get(SessionEvent, event_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Session event not found")
    data = body.model_dump(exclude_unset=True)
    if "start_time" in data and data["start_time"] is not None:
        data["start_time"] = _parse_time(data["start_time"])
    if "end_time" in data and data["end_time"] is not None:
        data["end_time"] = _parse_time(data["end_time"])
    for field, value in data.items():
        setattr(obj, field, value)
    await db.flush()
    teacher_cache = await _load_teacher_names(db)
    return _to_response(obj, teacher_cache)


@router.delete("/{event_id}")
async def delete_session_event(event_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(SessionEvent, event_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Session event not found")
    await db.delete(obj)
    return {"message": "Session event deleted"}
