"""Internal endpoints for service-to-service communication (used by core-messages)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/profile", tags=["internal"])


class BatchUsersRequest(BaseModel):
    user_ids: list[UUID] = Field(..., max_length=100)


@router.post("/users/batch")
async def get_users_batch(body: BatchUsersRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id.in_(body.user_ids)))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "last_name": u.last_name,
            "middle_name": u.middle_name,
            "email": u.email,
            "avatar": u.avatar,
            "group": u.group,
            "faculty": u.faculty,
            "role": "teacher" if u.qualification == "teacher" else "student",
        }
        for u in users
    ]


@router.get("/groups")
async def get_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User.group).where(User.group.isnot(None)).distinct().order_by(User.group))
    return [row[0] for row in result.all()]


@router.get("/users-by-group")
async def get_users_by_group(group: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.group == group))
    users = result.scalars().all()
    return [{"id": str(u.id), "name": u.name, "last_name": u.last_name, "avatar": u.avatar} for u in users]
