import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.challenge import CHALLENGE_TTL_MINUTES, MAX_ATTEMPTS, AuthChallenge
from app.schemas.challenge import (
    CheckChallengeResponse,
    StartChallengeResponse,
    VerifyChallengeRequest,
    VerifyChallengeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["challenge"])


def _generate_code() -> str:
    return str(secrets.randbelow(1_000_000)).zfill(6)


@router.post("/challenge", response_model=StartChallengeResponse)
async def start_challenge(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user["sub"])
    code = _generate_code()
    expiring_at = datetime.now(UTC) + timedelta(minutes=CHALLENGE_TTL_MINUTES)

    challenge = AuthChallenge(
        user_id=user_id,
        code=code,
        expiring_at=expiring_at,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)

    logger.info("[challenge] user=%s challenge=%s code=%s expires=%s", user_id, challenge.id, code, expiring_at)

    return StartChallengeResponse(challenge_id=challenge.id, expiring_at=expiring_at)


@router.post("/challenge/{challenge_id}/verify", response_model=VerifyChallengeResponse)
async def verify_challenge(
    challenge_id: uuid.UUID,
    body: VerifyChallengeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user["sub"])

    result = await db.execute(
        select(AuthChallenge).where(AuthChallenge.id == challenge_id).where(AuthChallenge.user_id == user_id)
    )
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

    logger.info("[challenge] verified: challenge=%s user=%s", challenge_id, user_id)
    return VerifyChallengeResponse(status="resolved")


@router.get("/challenge/{challenge_id}/check", response_model=CheckChallengeResponse)
async def check_challenge(
    challenge_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuthChallenge).where(AuthChallenge.id == challenge_id))
    challenge = result.scalar_one_or_none()

    if challenge is None:
        return CheckChallengeResponse(is_valid=False)

    is_resolved = challenge.resolved_at is not None
    not_expired = datetime.now(UTC) <= challenge.expiring_at.replace(tzinfo=UTC)

    if is_resolved and not_expired:
        return CheckChallengeResponse(is_valid=True, user_id=challenge.user_id)

    return CheckChallengeResponse(is_valid=False)
