import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user
from app.database import get_db
from app.models.user import AuthUser
from app.schemas.auth import AuthResponse, LoginRequest, MessageResponse, RegisterRequest, UserInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuthUser).where(AuthUser.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    access_token = create_access_token(user.id, user.email, user.name, user.role)

    return AuthResponse(
        access_token=access_token,
        user=UserInfo(id=user.id, email=user.email, name=user.name, role=user.role),
    )


@router.post("/register", response_model=MessageResponse)
async def register(body: RegisterRequest):
    return MessageResponse(message="Registration successful")


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserInfo(
        id=current_user["sub"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
    )
