from uuid import UUID

from fastapi import APIRouter, Depends, Response
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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Reference not found")
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
    # TODO: implement — create reference order, determine type_label from JSON config
    raise NotImplementedError("create_reference not implemented")


@router.post("/{reference_id}/cancel")
async def cancel_reference(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — set status to cancelled if in pending state
    raise NotImplementedError("cancel_reference not implemented")


@router.post("/{reference_id}/extend-storage")
async def extend_storage(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — extend storage_until date
    raise NotImplementedError("extend_storage not implemented")


@router.get("/{reference_id}/pdf")
async def get_reference_pdf(reference_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    # TODO: implement — return PDF file bytes
    raise NotImplementedError("get_reference_pdf not implemented")
