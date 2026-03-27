import logging
import uuid
from datetime import UTC, datetime

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import UserSession
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

    revoke_stmt = update(UserSession).where(UserSession.user_id == user_id).where(UserSession.revoked_at.is_(None))
    if body.exclude_jti is not None:
        revoke_stmt = revoke_stmt.where(UserSession.jti != body.exclude_jti)
    revoke_stmt = revoke_stmt.values(revoked_at=datetime.now(UTC))
    result_revoke = await db.execute(revoke_stmt)

    await db.commit()

    logger.info(
        "[internal] password updated: user=%s revoked_sessions=%d (kept_jti=%s)",
        user_id,
        result_revoke.rowcount,
        body.exclude_jti,
    )
    return {"message": "Password updated"}
