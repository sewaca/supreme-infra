"""Internal endpoints for service-to-service communication (used by core-messages)."""

import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/profile", tags=["internal"])


def _levenshtein(a: str, b: str) -> int:
    a, b = a.lower(), b.lower()
    if len(a) < len(b):
        a, b = b, a
    row = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        new_row = [i + 1]
        for j, cb in enumerate(b):
            new_row.append(min(row[j + 1] + 1, new_row[j] + 1, row[j] + (ca != cb)))
        row = new_row
    return row[-1]


class RegistrationSearchRequest(BaseModel):
    snils: str
    last_name: str | None = None


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


@router.post("/search-for-registration")
async def search_for_registration(body: RegistrationSearchRequest, db: AsyncSession = Depends(get_db)):
    snils_digits = re.sub(r"\D", "", body.snils)
    if not snils_digits:
        raise HTTPException(status_code=400, detail="Invalid SNILS")

    result = await db.execute(select(User).where(User.snils.isnot(None)))
    users = result.scalars().all()

    candidates: list[tuple[int, User]] = []
    for user in users:
        if re.sub(r"\D", "", user.snils or "") != snils_digits:
            continue
        if body.last_name is not None:
            dist = _levenshtein(user.last_name, body.last_name)
            if dist <= 3:
                candidates.append((dist, user))
        else:
            candidates.append((0, user))

    if not candidates:
        raise HTTPException(status_code=404, detail="User not found")

    candidates.sort(key=lambda x: x[0])
    user = candidates[0][1]

    return {
        "id": str(user.id),
        "name": user.name,
        "last_name": user.last_name,
        "middle_name": user.middle_name,
        "email": user.email,
        "snils": user.snils,
        "role": "teacher" if user.qualification == "teacher" else "student",
    }
