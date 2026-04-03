"""Internal endpoints for service-to-service communication."""

from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/applications/internal", tags=["internal"])


class InitUserRequest(BaseModel):
    user_id: UUID


@router.post("/init-user")
async def init_user(body: InitUserRequest):
    # No required rows for a new user in core-applications.
    # Applications (scholarship, dormitory) and references are created on demand.
    # This endpoint exists so core-auth can call it post-registration
    # and future initialization logic can be added here.
    return {"ok": True}
