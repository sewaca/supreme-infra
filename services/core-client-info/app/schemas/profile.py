from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: UUID
    name: str
    last_name: str
    middle_name: str | None = None
    avatar: str | None = None
    birth_date: date | None = None
    snils: str | None = None
    snils_issue_date: date | None = None
    region: str | None = None
    group: str | None = None


class AcademicInfoItem(BaseModel):
    label: str
    value: str


class StudentStatsResponse(BaseModel):
    course: int | None = None
    faculty: str | None = None
    specialty: str | None = None
    direction: str | None = None
    profile: str | None = None
    group: str | None = None
    status: str | None = None
    qualification: str | None = None
    average_grade: Decimal | None = None
    education_form: str | None = None


class PersonalDataResponse(BaseModel):
    user: UserResponse
    academic_info: list[AcademicInfoItem]
    stats: StudentStatsResponse
