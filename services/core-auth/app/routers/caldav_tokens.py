import logging
import secrets
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.caldav_token import CaldavToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/caldav-tokens", tags=["caldav-tokens"])


class TokenCreateRequest(BaseModel):
    device_name: str = "CalDav calendar"


class TokenCreateResponse(BaseModel):
    id: uuid.UUID
    token: str
    device_name: str
    created_at: datetime


class TokenListItem(BaseModel):
    id: uuid.UUID
    device_name: str
    created_at: datetime
    revoked_at: datetime | None


@router.post("", response_model=TokenCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_caldav_token(
    body: TokenCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = CaldavToken(
        token=secrets.token_urlsafe(32),
        user_id=uuid.UUID(current_user["sub"]),
        device_name=body.device_name,
    )
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    logger.info("[caldav_token] created: id=%s user=%s", obj.id, current_user["sub"])
    return TokenCreateResponse(id=obj.id, token=obj.token, device_name=obj.device_name, created_at=obj.created_at)


@router.get("", response_model=list[TokenListItem])
async def list_caldav_tokens(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaldavToken)
        .where(CaldavToken.user_id == uuid.UUID(current_user["sub"]))
        .order_by(CaldavToken.created_at.desc())
    )
    return [
        TokenListItem(id=t.id, device_name=t.device_name, created_at=t.created_at, revoked_at=t.revoked_at)
        for t in result.scalars().all()
    ]


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_caldav_token(
    token_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CaldavToken).where(CaldavToken.id == token_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    if obj.user_id != uuid.UUID(current_user["sub"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your token")
    if obj.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already revoked")
    obj.revoked_at = datetime.now(UTC)
    logger.info("[caldav_token] revoked: id=%s user=%s", token_id, current_user["sub"])
