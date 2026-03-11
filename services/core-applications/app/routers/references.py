from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reference import ReferenceOrder
from app.schemas.reference import CreateReferenceRequest, ReferenceOrderResponse

router = APIRouter(prefix="/references", tags=["references"])


@router.get("", response_model=list[ReferenceOrderResponse])
async def get_references(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReferenceOrder).where(ReferenceOrder.user_id == user_id).order_by(ReferenceOrder.order_date.desc())
    )
    references = result.scalars().all()

    return [
        ReferenceOrderResponse(
            id=r.id,
            reference_type=r.reference_type,
            type_label=r.type_label,
            status=r.status,
            order_date=r.order_date,
            pickup_point_id=r.pickup_point_id,
            virtual_only=r.virtual_only,
            storage_until=r.storage_until,
            pdf_url=r.pdf_url,
        )
        for r in references
    ]


@router.get("/{reference_id}", response_model=ReferenceOrderResponse)
async def get_reference(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReferenceOrder).where(ReferenceOrder.id == reference_id, ReferenceOrder.user_id == user_id)
    )
    reference = result.scalar_one_or_none()

    if reference is None:
        raise HTTPException(status_code=404, code="NOT_FOUND")

    return ReferenceOrderResponse(
        id=reference.id,
        reference_type=reference.reference_type,
        type_label=reference.type_label,
        status=reference.status,
        order_date=reference.order_date,
        pickup_point_id=reference.pickup_point_id,
        virtual_only=reference.virtual_only,
        storage_until=reference.storage_until,
        pdf_url=reference.pdf_url,
    )


@router.post("/order", response_model=ReferenceOrderResponse, status_code=201)
async def create_reference(user_id: UUID, body: CreateReferenceRequest, db: AsyncSession = Depends(get_db)):
    type_label = f"references.type.{body.reference_type.value}"

    new_reference = ReferenceOrder(
        user_id=user_id,
        reference_type=body.reference_type.value,
        type_label=type_label,
        status="preparation",
        pickup_point_id=body.pickup_point_id,
        virtual_only=body.virtual_only,
        storage_until=None,
        pdf_url=None,
    )

    db.add(new_reference)
    await db.commit()
    await db.refresh(new_reference)

    return ReferenceOrderResponse(
        id=new_reference.id,
        reference_type=new_reference.reference_type,
        type_label=new_reference.type_label,
        status=new_reference.status,
        order_date=new_reference.order_date,
        pickup_point_id=new_reference.pickup_point_id,
        virtual_only=new_reference.virtual_only,
        storage_until=new_reference.storage_until,
        pdf_url=new_reference.pdf_url,
    )


@router.post("/{reference_id}/cancel")
async def cancel_reference(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReferenceOrder).where(ReferenceOrder.id == reference_id, ReferenceOrder.user_id == user_id)
    )
    reference = result.scalar_one_or_none()

    if not reference:
        raise HTTPException(status_code=404, code="NOT_FOUND")

    if reference.status not in ["preparation", "ready", "pending"]:
        raise HTTPException(status_code=400, code="WRONG_STATUS")

    reference.status = "cancelled"
    await db.commit()

    return {"status": "cancelled", "message": "api.references.cancelled"}


@router.post("/{reference_id}/extend-storage")
async def extend_storage(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReferenceOrder).where(ReferenceOrder.id == reference_id, ReferenceOrder.user_id == user_id)
    )
    reference = result.scalar_one_or_none()

    if not reference:
        raise HTTPException(status_code=404, code="NOT_FOUND")

    if reference.status != "ready":
        raise HTTPException(status_code=400, code="WRONG_STATUS")

    if not reference.storage_until:
        raise HTTPException(status_code=400, code="NO_EXPIRATION")

    reference.storage_until = reference.storage_until + timedelta(days=7)
    await db.commit()

    return {"storage_until": reference.storage_until, "message": "api.references.storage_extended"}


@router.get("/{reference_id}/pdf")
async def get_reference_pdf(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import RedirectResponse

    result = await db.execute(
        select(ReferenceOrder).where(ReferenceOrder.id == reference_id, ReferenceOrder.user_id == user_id)
    )
    reference = result.scalar_one_or_none()

    if not reference or not reference.pdf_url:
        raise HTTPException(status_code=404, code="NOT_FOUND")

    return RedirectResponse(url=reference.pdf_url)
