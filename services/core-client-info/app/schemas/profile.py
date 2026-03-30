from datetime import date
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


class PersonalDataResponse(BaseModel):
    user: UserResponse
    academic_info: list[AcademicInfoItem]
