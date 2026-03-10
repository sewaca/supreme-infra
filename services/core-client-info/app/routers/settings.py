from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import UserSettings
from app.schemas.settings import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    SettingsResponse,
    TwoFaResponse,
    UpdateSettingsRequest,
)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        return SettingsResponse(is_new_message_notifications_enabled=True, is_schedule_change_notifications_enabled=True)
    return SettingsResponse(
        is_new_message_notifications_enabled=settings.is_new_message_notifications_enabled,
        is_schedule_change_notifications_enabled=settings.is_schedule_change_notifications_enabled,
        telegram_token=settings.telegram_token,
        vk_token=settings.vk_token,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(user_id: UUID, body: UpdateSettingsRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    if body.is_new_message_notifications_enabled is not None:
        settings.is_new_message_notifications_enabled = body.is_new_message_notifications_enabled
    if body.is_schedule_change_notifications_enabled is not None:
        settings.is_schedule_change_notifications_enabled = body.is_schedule_change_notifications_enabled
    if body.telegram_token is not None:
        settings.telegram_token = body.telegram_token
    if body.vk_token is not None:
        settings.vk_token = body.vk_token
    await db.flush()
    return SettingsResponse(
        is_new_message_notifications_enabled=settings.is_new_message_notifications_enabled,
        is_schedule_change_notifications_enabled=settings.is_schedule_change_notifications_enabled,
        telegram_token=settings.telegram_token,
        vk_token=settings.vk_token,
    )


@router.post("/email", response_model=TwoFaResponse)
async def change_email(user_id: UUID, body: ChangeEmailRequest, db: AsyncSession = Depends(get_db)):
    # TODO: implement 2FA email change flow
    # Step 1: if no confirmation_code, send code to current email and return need2fa
    # Step 2: if confirmation_code provided, validate and update email
    if body.confirmation_code is None:
        return TwoFaResponse(status="need2fa", message="Код подтверждения отправлен на текущий email")
    raise NotImplementedError("change_email confirmation not implemented")


@router.post("/password", response_model=TwoFaResponse)
async def change_password(user_id: UUID, body: ChangePasswordRequest, db: AsyncSession = Depends(get_db)):
    # TODO: implement 2FA password change flow
    # Step 1: validate current password, send code, return need2fa
    # Step 2: validate code and update password hash (delegated to core-auth-bff)
    if body.confirmation_code is None:
        return TwoFaResponse(status="need2fa", message="Код подтверждения отправлен на ваш email")
    raise NotImplementedError("change_password confirmation not implemented")
