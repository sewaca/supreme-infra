from datetime import date
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class OrderNotificationResponse(BaseModel):
    severity: str
    message: str
    action: str | None = None


class OrderResponse(BaseModel):
    id: UUID
    type: str
    number: str
    title: str
    date: date
    additional_fields: dict[str, Any] | None = None
    pdf_url: str | None = None
    actions: dict[str, Any] | None = None
    notifications_count: int = 0


class OrderDetailResponse(OrderResponse):
    notifications: list[OrderNotificationResponse] = []


class OrdersListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    has_more: bool


class OrdersCountResponse(BaseModel):
    dormitory: int = 0
    scholarship: int = 0
    education: int = 0
    general: int = 0
