from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str
    location: str | None = None
    device: str | None = None
    ip_address: str | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class UserInfo(BaseModel):
    id: UUID
    email: str
    name: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    user: UserInfo


class MessageResponse(BaseModel):
    message: str


class SessionInfo(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    user_agent: str | None
    ip_address: str | None
    location: str | None = None
    device: str | None = None
    is_current: bool

    model_config = {"from_attributes": True}


class ValidateSessionRequest(BaseModel):
    token: str


class ValidateSessionResponse(BaseModel):
    status: str  # "valid", "revoked", "expired", "invalid"
    user_id: str | None = None
    email: str | None = None
    name: str | None = None
    role: str | None = None
