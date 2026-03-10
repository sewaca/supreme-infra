from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.order import Order, OrderNotification
from app.schemas.order import (
    OrderDetailResponse,
    OrderNotificationResponse,
    OrderResponse,
    OrdersCountResponse,
    OrdersListResponse,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrdersListResponse)
async def get_orders(
    user_id: UUID,
    type: str | None = Query(None, description="Comma-separated order types: dormitory,scholarship,education,general"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == user_id)
    if type:
        types = [t.strip() for t in type.split(",")]
        query = query.where(Order.type.in_(types))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Order.date.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    notifications_count_query = (
        select(OrderNotification.order_id, func.count().label("count"))
        .where(OrderNotification.order_id.in_([o.id for o in orders]))
        .group_by(OrderNotification.order_id)
    )
    notifications_result = await db.execute(notifications_count_query)
    notifications_map = {row.order_id: row.count for row in notifications_result}

    order_responses = [
        OrderResponse(
            id=o.id,
            type=o.type,
            number=o.number,
            title=o.title,
            date=o.date,
            additional_fields=o.additional_fields,
            pdf_url=o.pdf_url,
            actions=o.actions,
            notifications_count=notifications_map.get(o.id, 0),
        )
        for o in orders
    ]

    return OrdersListResponse(orders=order_responses, total=total, has_more=(offset + limit) < total)


@router.get("/counts", response_model=OrdersCountResponse)
async def get_orders_counts(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order.type, func.count().label("count")).where(Order.user_id == user_id).group_by(Order.type)
    )
    counts = {row.type: row.count for row in result}
    return OrdersCountResponse(
        dormitory=counts.get("dormitory", 0),
        scholarship=counts.get("scholarship", 0),
        education=counts.get("education", 0),
        general=counts.get("general", 0),
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(order_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == user_id))
    order = result.scalar_one_or_none()
    if order is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")

    notifications_result = await db.execute(
        select(OrderNotification).where(OrderNotification.order_id == order_id)
    )
    notifications = notifications_result.scalars().all()

    return OrderDetailResponse(
        id=order.id,
        type=order.type,
        number=order.number,
        title=order.title,
        date=order.date,
        additional_fields=order.additional_fields,
        pdf_url=order.pdf_url,
        actions=order.actions,
        notifications=[
            OrderNotificationResponse(severity=n.severity, message=n.message, action=n.action)
            for n in notifications
        ],
    )


@router.get("/{order_id}/pdf")
async def get_order_pdf(order_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — return PDF file bytes from pdf_url
    raise NotImplementedError("get_order_pdf not implemented")
