from uuid import UUID

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    is_new_message_notifications_enabled: bool
    is_schedule_change_notifications_enabled: bool
    telegram_token: str | None = None
    vk_token: str | None = None


class UpdateSettingsRequest(BaseModel):
    is_new_message_notifications_enabled: bool | None = None
    is_schedule_change_notifications_enabled: bool | None = None
    telegram_token: str | None = None
    vk_token: str | None = None


class ChangeEmailRequest(BaseModel):
    new_email: str
    challenge_id: UUID


class ChangePasswordRequest(BaseModel):
    new_password: str
    challenge_id: UUID


class MessageResponse(BaseModel):
    message: str
