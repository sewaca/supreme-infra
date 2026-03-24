from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


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
