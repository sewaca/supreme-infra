from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class StartChallengeResponse(BaseModel):
    challenge_id: UUID
    expiring_at: datetime


class VerifyChallengeRequest(BaseModel):
    code: str


class VerifyChallengeResponse(BaseModel):
    status: str  # "resolved"


class CheckChallengeResponse(BaseModel):
    is_valid: bool
    user_id: UUID | None = None


class UpdateEmailRequest(BaseModel):
    new_email: str


class UpdatePasswordRequest(BaseModel):
    new_password: str
