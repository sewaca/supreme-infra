import logging
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.challenge import CHALLENGE_TTL_MINUTES, MAX_ATTEMPTS, AuthChallenge
from app.models.session import UserSession
from app.models.user import AuthUser
from app.routers.challenge import _generate_code
from app.schemas.forgot_password import (
    ForgotPasswordResetRequest,
    ForgotPasswordStartRequest,
    ForgotPasswordStartResponse,
    ForgotPasswordVerifyRequest,
    ForgotPasswordVerifyResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["forgot-password"])


@router.post("/forgot-password", response_model=ForgotPasswordStartResponse)
async def start_forgot_password(
    body: ForgotPasswordStartRequest,
    db: AsyncSession = Depends(get_db),
):
    expiring_at = datetime.now(UTC) + timedelta(minutes=CHALLENGE_TTL_MINUTES)

    result = await db.execute(
        select(AuthUser).where(AuthUser.email == body.email, AuthUser.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if user is None:
        logger.info("[forgot-password] email not found: %s", body.email)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found")

    code = _generate_code()
    challenge = AuthChallenge(
        user_id=user.id,
        code=code,
        expiring_at=expiring_at,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)

    logger.info("[forgot-password] challenge=%s user=%s code=%s expires=%s", challenge.id, user.id, code, expiring_at)

    return ForgotPasswordStartResponse(challenge_id=challenge.id, expiring_at=expiring_at)


@router.post("/forgot-password/{challenge_id}/verify", response_model=ForgotPasswordVerifyResponse)
async def verify_forgot_password(
    challenge_id: uuid.UUID,
    body: ForgotPasswordVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuthChallenge).where(AuthChallenge.id == challenge_id))
    challenge = result.scalar_one_or_none()

    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")

    if challenge.resolved_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="already_resolved")

    if datetime.now(UTC) > challenge.expiring_at.replace(tzinfo=UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="expired")

    if challenge.attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="max_attempts_exceeded")

    challenge.attempts += 1

    if challenge.code != body.code:
        await db.commit()
        attempts_left = MAX_ATTEMPTS - challenge.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_code", "attempts_left": attempts_left},
        )

    challenge.resolved_at = datetime.now(UTC)
    await db.commit()

    logger.info("[forgot-password] verified: challenge=%s", challenge_id)
    return ForgotPasswordVerifyResponse(status="resolved")


@router.post("/forgot-password/{challenge_id}/reset")
async def reset_forgot_password(
    challenge_id: uuid.UUID,
    body: ForgotPasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    if len(body.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password too short")

    result = await db.execute(select(AuthChallenge).where(AuthChallenge.id == challenge_id))
    challenge = result.scalar_one_or_none()

    if challenge is None or challenge.resolved_at is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_challenge")

    if datetime.now(UTC) > challenge.expiring_at.replace(tzinfo=UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="expired")

    user_result = await db.execute(select(AuthUser).where(AuthUser.id == challenge.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    revoke_stmt = (
        update(UserSession)
        .where(UserSession.user_id == challenge.user_id)
        .where(UserSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    result_revoke = await db.execute(revoke_stmt)

    await db.commit()

    logger.info("[forgot-password] password reset: user=%s revoked_sessions=%d", user.id, result_revoke.rowcount)
    return {"message": "Password updated"}
