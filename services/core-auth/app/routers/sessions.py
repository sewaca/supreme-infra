import logging
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decode_token_safe, get_current_user
from app.database import get_db
from app.models.caldav_token import CaldavToken
from app.models.session import UserSession
from app.schemas.auth import SessionInfo, ValidateSessionRequest, ValidateSessionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["sessions"])


@router.get("/sessions", response_model=list[SessionInfo])
async def get_sessions(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user["sub"])
    current_jti = current_user.get("jti")

    sessions_result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user_id)
        .where(UserSession.revoked_at.is_(None))
        .where(UserSession.expires_at > datetime.now(UTC))
        .order_by(UserSession.created_at.desc())
    )
    auth_sessions = [
        SessionInfo(
            id=s.id,
            type="session",
            created_at=s.created_at,
            expires_at=s.expires_at,
            revoked_at=s.revoked_at,
            user_agent=s.user_agent,
            ip_address=s.ip_address,
            location=s.location,
            device=s.device,
            is_current=(current_jti is not None and str(s.jti) == current_jti),
        )
        for s in sessions_result.scalars().all()
    ]

    caldav_result = await db.execute(
        select(CaldavToken)
        .where(CaldavToken.user_id == user_id, CaldavToken.revoked_at.is_(None))
        .order_by(CaldavToken.created_at.desc())
    )
    caldav_sessions = [
        SessionInfo(
            id=t.id,
            type="caldav",
            created_at=t.created_at,
            revoked_at=t.revoked_at,
            device=t.device_name,
        )
        for t in caldav_result.scalars().all()
    ]

    return auth_sessions + caldav_sessions


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user["sub"])
    now = datetime.now(UTC)

    # Try auth session first
    session_result = await db.execute(
        select(UserSession).where(UserSession.id == session_id).where(UserSession.user_id == user_id)
    )
    session = session_result.scalar_one_or_none()
    if session:
        if session.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already revoked")
        session.revoked_at = now
        await db.commit()
        logger.info("[revoke_session] session=%s revoked for user=%s", session_id, user_id)
        return

    # Try caldav token
    caldav_result = await db.execute(
        select(CaldavToken).where(CaldavToken.id == session_id).where(CaldavToken.user_id == user_id)
    )
    caldav = caldav_result.scalar_one_or_none()
    if caldav:
        if caldav.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already revoked")
        caldav.revoked_at = now
        await db.commit()
        logger.info("[revoke_session] caldav_token=%s revoked for user=%s", session_id, user_id)
        return

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


@router.post("/validate-session", response_model=ValidateSessionResponse)
async def validate_session(body: ValidateSessionRequest, db: AsyncSession = Depends(get_db)):
    payload, decode_status = decode_token_safe(body.token)

    if decode_status != "valid" or payload is None:
        return ValidateSessionResponse(status=decode_status)

    jti_str = payload.get("jti")
    if not jti_str:
        return ValidateSessionResponse(
            status="valid",
            user_id=payload["sub"],
            email=payload["email"],
            name=payload["name"],
            role=payload["role"],
        )

    try:
        jti = uuid.UUID(jti_str)
    except ValueError:
        return ValidateSessionResponse(status="invalid")

    result = await db.execute(select(UserSession).where(UserSession.jti == jti))
    session = result.scalar_one_or_none()

    if session is None:
        return ValidateSessionResponse(
            status="valid",
            user_id=payload["sub"],
            email=payload["email"],
            name=payload["name"],
            role=payload["role"],
        )

    if session.revoked_at is not None:
        return ValidateSessionResponse(status="revoked")

    return ValidateSessionResponse(
        status="valid",
        user_id=payload["sub"],
        email=payload["email"],
        name=payload["name"],
        role=payload["role"],
    )
