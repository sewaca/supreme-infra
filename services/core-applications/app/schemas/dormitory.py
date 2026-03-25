from pydantic import BaseModel, Field


class DormitoryApplicationRequest(BaseModel):
    year_of_study: int = Field(..., ge=1, le=6)
    reason: str = Field(..., min_length=1, max_length=1000)


class DormitoryApplicationResponse(BaseModel):
    status: str
