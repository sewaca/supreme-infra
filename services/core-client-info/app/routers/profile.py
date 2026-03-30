from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.profile import AcademicInfoItem, PersonalDataResponse, UserResponse

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/user", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="api.user.not_found")

    return UserResponse(
        id=user.id,
        name=user.name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        avatar=user.avatar,
        birth_date=user.birth_date,
        snils=user.snils,
        snils_issue_date=user.snils_issue_date,
        region=user.region,
        group=user.group,
    )


@router.get("/personal-data", response_model=PersonalDataResponse)
async def get_personal_data(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="api.user.not_found")

    user_response = UserResponse(
        id=user.id,
        name=user.name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        avatar=user.avatar,
        birth_date=user.birth_date,
        snils=user.snils,
        snils_issue_date=user.snils_issue_date,
        region=user.region,
    )

    academic_info = []

    if user.university:
        academic_info.append(AcademicInfoItem(label="profile.academic.university", value=user.university))
    if user.faculty:
        academic_info.append(AcademicInfoItem(label="profile.academic.faculty", value=user.faculty))
    if user.specialty:
        academic_info.append(AcademicInfoItem(label="profile.academic.specialty", value=user.specialty))
    if user.course:
        academic_info.append(AcademicInfoItem(label="profile.academic.course", value=str(user.course)))
    if user.group:
        academic_info.append(AcademicInfoItem(label="profile.academic.group", value=user.group))
    if user.education_form:
        academic_info.append(AcademicInfoItem(label="profile.academic.education_form", value=user.education_form))
    if user.average_grade:
        academic_info.append(AcademicInfoItem(label="profile.academic.average_grade", value=str(user.average_grade)))
    if user.student_card_number:
        academic_info.append(
            AcademicInfoItem(label="profile.academic.student_card_number", value=user.student_card_number)
        )
    if user.start_year and user.end_year:
        academic_info.append(
            AcademicInfoItem(label="profile.academic.study_period", value=f"{user.start_year}-{user.end_year}")
        )

    return PersonalDataResponse(user=user_response, academic_info=academic_info)
