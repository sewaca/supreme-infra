from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import ApplicationNotification, UserApplication
from app.schemas.application import ApplicationNotificationResponse, ApplicationResponse

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationResponse])
async def get_applications(user_id: UUID, type: str | None = Query(None), id: UUID | None = Query(None), db: AsyncSession = Depends(get_db)):
    if id:
        result = await db.execute(select(UserApplication).where(UserApplication.id == id, UserApplication.user_id == user_id))
        application = result.scalar_one_or_none()
        return [ApplicationResponse(id=application.id, application_type=application.application_type, application_number=application.application_number, additional_fields=application.additional_fields, start_date=application.start_date, end_date=application.end_date, is_active=application.is_active, notifications_count=application.notifications_count)] if application else []
    query = select(UserApplication).where(UserApplication.user_id == user_id)
    if type:
        query = query.where(UserApplication.application_type == type)
    result = await db.execute(query.order_by(UserApplication.created_at.desc()))
    applications = result.scalars().all()
    return [ApplicationResponse(id=a.id, application_type=a.application_type, application_number=a.application_number, additional_fields=a.additional_fields, start_date=a.start_date, end_date=a.end_date, is_active=a.is_active, notifications_count=a.notifications_count) for a in applications]


@router.get("/notifications", response_model=list[ApplicationNotificationResponse])
async def get_notifications(user_id: UUID, type: str | None = Query(None), application_id: UUID | None = Query(None), db: AsyncSession = Depends(get_db)):
    query = select(ApplicationNotification).join(UserApplication, ApplicationNotification.application_id == UserApplication.id).where(UserApplication.user_id == user_id)
    if application_id:
        query = query.where(ApplicationNotification.application_id == application_id)
    if type:
        query = query.where(UserApplication.application_type == type)
    result = await db.execute(query.order_by(ApplicationNotification.created_at.desc()))
    notifications = result.scalars().all()
    return [ApplicationNotificationResponse(id=n.id, application_id=n.application_id, severity=n.severity, message=n.message, action=n.action, created_at=n.created_at) for n in notifications]
