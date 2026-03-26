from __future__ import annotations

import datetime
from uuid import UUID

from pydantic import BaseModel


class SemesterCreate(BaseModel):
    name: str
    start_date: datetime.date
    end_date: datetime.date
    cycle_anchor_date: datetime.date
    is_active: bool = False


class SemesterUpdate(BaseModel):
    name: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    cycle_anchor_date: datetime.date | None = None
    is_active: bool | None = None


class SemesterResponse(BaseModel):
    id: UUID
    name: str
    start_date: datetime.date
    end_date: datetime.date
    cycle_anchor_date: datetime.date
    is_active: bool
