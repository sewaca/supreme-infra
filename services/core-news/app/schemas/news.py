import uuid
from datetime import datetime

from pydantic import BaseModel


class NewsResponse(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    date: str
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}
