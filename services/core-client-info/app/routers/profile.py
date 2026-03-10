from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.profile import PersonalDataResponse, UserResponse, AcademicInfoItem

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/user", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — fetch user info from USER table (owned by core-auth-bff or passed via JWT)
    raise NotImplementedError("get_user not implemented")


@router.get("/personal-data", response_model=PersonalDataResponse)
async def get_personal_data(user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — fetch USER + STUDENT_STATS and format academic_info list
    raise NotImplementedError("get_personal_data not implemented")
