from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.classroom import Classroom
from app.schemas.classroom import ClassroomCreate, ClassroomResponse, ClassroomUpdate

router = APIRouter(prefix="/admin/classrooms", tags=["admin-classrooms"])


@router.get("", response_model=list[ClassroomResponse])
async def list_classrooms(
    _user: AdminUser,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Classroom).order_by(Classroom.name).offset(offset).limit(limit))
    return [
        ClassroomResponse(id=c.id, name=c.name, building=c.building, capacity=c.capacity)
        for c in result.scalars().all()
    ]


@router.post("", response_model=ClassroomResponse, status_code=201)
async def create_classroom(body: ClassroomCreate, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = Classroom(name=body.name, building=body.building, capacity=body.capacity)
    db.add(obj)
    await db.flush()
    return ClassroomResponse(id=obj.id, name=obj.name, building=obj.building, capacity=obj.capacity)


@router.get("/{classroom_id}", response_model=ClassroomResponse)
async def get_classroom(classroom_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Classroom, classroom_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return ClassroomResponse(id=obj.id, name=obj.name, building=obj.building, capacity=obj.capacity)


@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: UUID, body: ClassroomUpdate, _user: AdminUser, db: AsyncSession = Depends(get_db)
):
    obj = await db.get(Classroom, classroom_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Classroom not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await db.flush()
    return ClassroomResponse(id=obj.id, name=obj.name, building=obj.building, capacity=obj.capacity)


@router.delete("/{classroom_id}")
async def delete_classroom(classroom_id: UUID, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Classroom, classroom_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Classroom not found")
    await db.delete(obj)
    return {"message": "Classroom deleted"}
