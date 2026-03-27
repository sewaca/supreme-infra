from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ForgotPasswordStartRequest(BaseModel):
    email: str


class ForgotPasswordStartResponse(BaseModel):
    challenge_id: UUID
    expiring_at: datetime


class ForgotPasswordVerifyRequest(BaseModel):
    code: str


class ForgotPasswordVerifyResponse(BaseModel):
    status: str  # "resolved"


class ForgotPasswordResetRequest(BaseModel):
    new_password: str
