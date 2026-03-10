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
    confirmation_code: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirmation_code: str | None = None


class TwoFaResponse(BaseModel):
    status: str
    message: str | None = None
