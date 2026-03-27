import logging
import uuid

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import AuthUser
from app.schemas.challenge import UpdateEmailRequest, UpdatePasswordRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/internal", tags=["internal"])


@router.patch("/users/{user_id}/email")
async def update_user_email(
    user_id: uuid.UUID,
    body: UpdateEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(AuthUser).where(AuthUser.email == body.new_email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")

    result = await db.execute(select(AuthUser).where(AuthUser.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_email = user.email
    user.email = body.new_email
    await db.commit()

    logger.info("[internal] email updated: user=%s %s → %s", user_id, old_email, body.new_email)
    return {"message": "Email updated"}


@router.patch("/users/{user_id}/password")
async def update_user_password(
    user_id: uuid.UUID,
    body: UpdatePasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuthUser).where(AuthUser.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    await db.commit()

    logger.info("[internal] password updated: user=%s", user_id)
    return {"message": "Password updated"}
