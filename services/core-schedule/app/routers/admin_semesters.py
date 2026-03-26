from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.semester import Semester
from app.schemas.semester import SemesterCreate, SemesterResponse, SemesterUpdate

router = APIRouter(prefix="/admin/semesters", tags=["admin-semesters"])


def _to_response(s: Semester) -> SemesterResponse:
    return SemesterResponse(
        id=s.id,
        name=s.name,
        start_date=s.start_date,
        end_date=s.end_date,
        cycle_anchor_date=s.cycle_anchor_date,
        is_active=s.is_active,
    )


@router.get("", response_model=list[SemesterResponse])
async def list_semesters(
    _user: AdminUser,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Semester).order_by(Semester.start_date.desc()).offset(offset).limit(limit))
    return [_to_response(s) for s in result.scalars().all()]


@router.post("", response_model=SemesterResponse, status_code=201)
async def create_semester(body: SemesterCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = Semester(**body.model_dump())
    db.add(obj)
    await db.flush()
    return _to_response(obj)


@router.get("/{semester_id}", response_model=SemesterResponse)
async def get_semester(semester_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Semester, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semester not found")
    return _to_response(obj)


@router.put("/{semester_id}", response_model=SemesterResponse)
async def update_semester(
    semester_id: UUID, body: SemesterUpdate, _user: AdminUser, db: AsyncSession = Depends(get_db)
):
    obj = await db.get(Semester, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semester not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.flush()
    return _to_response(obj)


@router.delete("/{semester_id}")
async def delete_semester(semester_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Semester, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semester not found")
    await db.delete(obj)
    return {"message": "Semester deleted"}
