import ipaddress
import logging
import re
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TOKEN_EXPIRE_DAYS, create_access_token, get_current_user
from app.config import settings
from app.database import get_db
from app.models.session import UserSession
from app.models.user import AuthUser
from app.schemas.auth import (
    AuthResponse,
    ClientInfoUser,
    LoginRequest,
    LookupRequest,
    MessageResponse,
    RegisterRequest,
    UserInfo,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _get_location(ip: str | None) -> str | None:
    if not ip:
        return None
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private or addr.is_loopback:
            return None
    except ValueError:
        return None
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"http://ipwho.is/{ip}?output=json&fields=country,city")
            if r.status_code == 200:
                data = r.json()
                country = data.get("country")
                city = data.get("city")
                parts = [p for p in [country, city] if p]
                return ", ".join(parts) if parts else None
    except Exception:
        pass
    return None


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuthUser).where(AuthUser.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        logger.debug("[login] user not found: email=%s", body.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    logger.debug(
        "[login] checking password: email=%s | input=%r | stored_hash=%r",
        body.email,
        body.password,
        user.password_hash,
    )
    match = bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8"))
    logger.debug("[login] bcrypt.checkpw result: %s", match)

    if not match:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    jti = uuid.uuid4()
    access_token = create_access_token(user.id, user.email, user.name, user.role, jti=jti)

    header_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else None)
    ip = body.ip_address or header_ip
    session = UserSession(
        user_id=user.id,
        jti=jti,
        user_agent=request.headers.get("user-agent"),
        ip_address=ip,
        location=body.location,
        device=body.device,
        expires_at=datetime.now(UTC) + timedelta(days=TOKEN_EXPIRE_DAYS),
    )
    db.add(session)
    await db.commit()

    return AuthResponse(
        access_token=access_token,
        user=UserInfo(id=user.id, email=user.email, name=user.name, role=user.role),
    )


@router.post("/lookup", response_model=ClientInfoUser)
async def lookup(body: LookupRequest):
    snils_digits = re.sub(r"\D", "", body.snils)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.core_client_info_url}/profile/search-for-registration",
                json={"snils": snils_digits, "last_name": body.last_name},
            )
    except Exception as exc:
        logger.error("[lookup] core-client-info unreachable: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Identity service unavailable") from exc

    if resp.status_code == 404:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in system")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Identity service error")

    return ClientInfoUser(**resp.json())


@router.post("/register", response_model=MessageResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuthUser).where(AuthUser.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    snils_digits = re.sub(r"\D", "", body.snils)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.core_client_info_url}/profile/search-for-registration",
                json={"snils": snils_digits},
            )
    except Exception as exc:
        logger.error("[register] core-client-info unreachable: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Identity service unavailable") from exc

    if resp.status_code == 404:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identity not found or already registered")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not verify identity via SNILS")

    info = resp.json()
    client_info_id = uuid.UUID(info["id"])
    name_parts = [info.get("last_name"), info.get("name"), info.get("middle_name")]
    full_name = " ".join(p for p in name_parts if p)
    role = info.get("role", "student")

    existing = await db.execute(select(AuthUser).where(AuthUser.id == client_info_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already registered for this identity")

    password_hash = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = AuthUser(id=client_info_id, email=body.email, password_hash=password_hash, name=full_name, role=role)
    db.add(user)
    await db.commit()

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            await client.post(
                f"{settings.core_client_info_url}/profile/init-user",
                json={"user_id": str(client_info_id)},
            )
        except Exception as exc:
            logger.error("[register] core-client-info init-user failed: %s", exc)
        try:
            await client.post(
                f"{settings.core_applications_url}/applications/internal/init-user",
                json={"user_id": str(client_info_id)},
            )
        except Exception as exc:
            logger.error("[register] core-applications init-user failed: %s", exc)

    return MessageResponse(message="User created successfully")


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserInfo(
        id=current_user["sub"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
    )
