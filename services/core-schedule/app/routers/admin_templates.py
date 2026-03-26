from datetime import time as dt_time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.schedule_template import ScheduleTemplate
from app.schemas.template import TemplateSlotBulkCreate, TemplateSlotCreate, TemplateSlotResponse, TemplateSlotUpdate

router = APIRouter(prefix="/admin/templates", tags=["admin-templates"])


def _parse_time(s: str) -> dt_time:
    parts = s.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _time_str(t: dt_time) -> str:
    return t.strftime("%H:%M")


def _to_response(t: ScheduleTemplate) -> TemplateSlotResponse:
    return TemplateSlotResponse(
        id=t.id,
        semester_id=t.semester_id,
        week_number=t.week_number,
        day_of_week=t.day_of_week,
        slot_number=t.slot_number,
        start_time=_time_str(t.start_time),
        end_time=_time_str(t.end_time),
        subject_name=t.subject_name,
        lesson_type=t.lesson_type,
        teacher_name=t.teacher_name,
        group_name=t.group_name,
        classroom_name=t.classroom_name,
    )


@router.get("", response_model=list[TemplateSlotResponse])
async def list_templates(
    _user: AdminUser,
    semester_id: UUID = Query(...),
    week_number: int | None = Query(None),
    day_of_week: int | None = Query(None),
    group_name: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(ScheduleTemplate).where(ScheduleTemplate.semester_id == semester_id)
    if week_number is not None:
        q = q.where(ScheduleTemplate.week_number == week_number)
    if day_of_week is not None:
        q = q.where(ScheduleTemplate.day_of_week == day_of_week)
    if group_name is not None:
        q = q.where(ScheduleTemplate.group_name == group_name)
    q = q.order_by(ScheduleTemplate.week_number, ScheduleTemplate.day_of_week, ScheduleTemplate.slot_number)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    return [_to_response(t) for t in result.scalars().all()]


@router.post("", response_model=TemplateSlotResponse, status_code=201)
async def create_template(body: TemplateSlotCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = ScheduleTemplate(
        semester_id=body.semester_id,
        week_number=body.week_number,
        day_of_week=body.day_of_week,
        slot_number=body.slot_number,
        start_time=_parse_time(body.start_time),
        end_time=_parse_time(body.end_time),
        subject_name=body.subject_name,
        lesson_type=body.lesson_type,
        teacher_name=body.teacher_name,
        group_name=body.group_name,
        classroom_name=body.classroom_name,
    )
    db.add(obj)
    await db.flush()
    return _to_response(obj)


@router.post("/bulk", response_model=list[TemplateSlotResponse], status_code=201)
async def create_templates_bulk(body: TemplateSlotBulkCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    results = []
    for item in body.items:
        obj = ScheduleTemplate(
            semester_id=item.semester_id,
            week_number=item.week_number,
            day_of_week=item.day_of_week,
            slot_number=item.slot_number,
            start_time=_parse_time(item.start_time),
            end_time=_parse_time(item.end_time),
            subject_name=item.subject_name,
            lesson_type=item.lesson_type,
            teacher_name=item.teacher_name,
            group_name=item.group_name,
            classroom_name=item.classroom_name,
        )
        db.add(obj)
        results.append(obj)
    await db.flush()
    return [_to_response(t) for t in results]


@router.put("/{template_id}", response_model=TemplateSlotResponse)
async def update_template(
    template_id: UUID, body: TemplateSlotUpdate, _user: AdminUser, db: AsyncSession = Depends(get_db)
):
    obj = await db.get(ScheduleTemplate, template_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Template slot not found")
    data = body.model_dump(exclude_unset=True)
    if "start_time" in data and data["start_time"] is not None:
        data["start_time"] = _parse_time(data["start_time"])
    if "end_time" in data and data["end_time"] is not None:
        data["end_time"] = _parse_time(data["end_time"])
    for field, value in data.items():
        setattr(obj, field, value)
    await db.flush()
    return _to_response(obj)


@router.delete("/{template_id}")
async def delete_template(template_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(ScheduleTemplate, template_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Template slot not found")
    await db.delete(obj)
    return {"message": "Template slot deleted"}
