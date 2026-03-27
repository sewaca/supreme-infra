import logging
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as app_settings
from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.settings import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    MessageResponse,
    SettingsResponse,
    UpdateSettingsRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


async def _validate_challenge(challenge_id: UUID, user_id: UUID) -> None:
    url = f"{app_settings.core_auth_url}/auth/challenge/{challenge_id}/check"
    logger.info("[challenge] checking: url=%s challenge_id=%s user_id=%s", url, challenge_id, user_id)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            logger.info("[challenge] response: status=%s body=%s", resp.status_code, resp.text)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.error("[challenge] check failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Challenge service unavailable") from exc

    is_valid = data.get("is_valid")
    challenge_user_id = data.get("user_id")
    logger.info("[challenge] is_valid=%s challenge_user_id=%r user_id=%r match=%s",
                is_valid, challenge_user_id, str(user_id),
                challenge_user_id is not None and UUID(challenge_user_id) == user_id)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge not resolved or expired")

    if challenge_user_id is None or UUID(challenge_user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Challenge does not belong to this user")


@router.get("", response_model=SettingsResponse)
async def get_settings(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_settings = result.scalar_one_or_none()
    if user_settings is None:
        return SettingsResponse(
            is_new_message_notifications_enabled=True, is_schedule_change_notifications_enabled=True
        )
    return SettingsResponse(
        is_new_message_notifications_enabled=user_settings.is_new_message_notifications_enabled,
        is_schedule_change_notifications_enabled=user_settings.is_schedule_change_notifications_enabled,
        telegram_token=user_settings.telegram_token,
        vk_token=user_settings.vk_token,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(user_id: UUID, body: UpdateSettingsRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_settings = result.scalar_one_or_none()
    if user_settings is None:
        user_settings = UserSettings(user_id=user_id)
        db.add(user_settings)
    if body.is_new_message_notifications_enabled is not None:
        user_settings.is_new_message_notifications_enabled = body.is_new_message_notifications_enabled
    if body.is_schedule_change_notifications_enabled is not None:
        user_settings.is_schedule_change_notifications_enabled = body.is_schedule_change_notifications_enabled
    if body.telegram_token is not None:
        user_settings.telegram_token = body.telegram_token
    if body.vk_token is not None:
        user_settings.vk_token = body.vk_token
    await db.flush()
    return SettingsResponse(
        is_new_message_notifications_enabled=user_settings.is_new_message_notifications_enabled,
        is_schedule_change_notifications_enabled=user_settings.is_schedule_change_notifications_enabled,
        telegram_token=user_settings.telegram_token,
        vk_token=user_settings.vk_token,
    )


@router.post("/email", response_model=MessageResponse)
async def change_email(user_id: UUID, body: ChangeEmailRequest, db: AsyncSession = Depends(get_db)):
    await _validate_challenge(body.challenge_id, user_id)

    # Update email in core-auth first (source of truth for login)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.patch(
                f"{app_settings.core_auth_url}/auth/internal/users/{user_id}/email",
                json={"new_email": body.new_email},
            )
            if resp.status_code == 409:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")
            resp.raise_for_status()
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        logger.error("[settings] core-auth email update failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Auth service unavailable") from exc

    # Update email in core-client-info profile
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is not None:
        user.email = body.new_email
        await db.commit()
        logger.info("[settings] email updated in profile: user=%s new=%s", user_id, body.new_email)

    return MessageResponse(message="Email updated")


@router.post("/password", response_model=MessageResponse)
async def change_password(user_id: UUID, body: ChangePasswordRequest, db: AsyncSession = Depends(get_db)):
    await _validate_challenge(body.challenge_id, user_id)

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.patch(
                f"{app_settings.core_auth_url}/auth/internal/users/{user_id}/password",
                json={"new_password": body.new_password},
            )
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("[settings] core-auth password update failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Auth service unavailable") from exc

    logger.info("[settings] password updated: user=%s", user_id)
    return MessageResponse(message="Password updated")
