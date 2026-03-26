from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.teacher_cache import TeacherCache
from app.schemas.teacher import TeacherCacheResponse, TeacherSyncRequest

router = APIRouter(prefix="/admin/teachers", tags=["admin-teachers"])


@router.get("", response_model=list[TeacherCacheResponse])
async def list_teachers(
    _user: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TeacherCache).order_by(TeacherCache.name))
    return [TeacherCacheResponse(id=t.id, name=t.name) for t in result.scalars().all()]


@router.post("/sync", response_model=list[TeacherCacheResponse])
async def sync_teachers(body: TeacherSyncRequest, _user: AdminUser, db: AsyncSession = Depends(get_db)):
    results = []
    for item in body.items:
        existing = await db.get(TeacherCache, item.id)
        if existing:
            existing.name = item.name
        else:
            existing = TeacherCache(id=item.id, name=item.name)
            db.add(existing)
        await db.flush()
        results.append(TeacherCacheResponse(id=existing.id, name=existing.name))
    return results
