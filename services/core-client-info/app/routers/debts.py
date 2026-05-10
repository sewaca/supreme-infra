from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rating import AcademicDebt
from app.schemas.rating import AcademicDebtResponse, RequestRetakeRequest

router = APIRouter(prefix="/debts", tags=["debts"])


@router.get("", response_model=list[AcademicDebtResponse])
async def get_debts(user_id: UUID, db: AsyncSession = Depends(get_db)) -> list[AcademicDebtResponse]:
    result = await db.execute(
        select(AcademicDebt)
        .where(AcademicDebt.user_id == user_id)
        .order_by(AcademicDebt.course.desc(), AcademicDebt.semester.desc())
    )
    debts = result.scalars().all()
    return [AcademicDebtResponse.model_validate(d) for d in debts]


@router.patch("/{debt_id}/request-retake", response_model=AcademicDebtResponse)
async def request_retake(
    debt_id: UUID,
    body: RequestRetakeRequest,
    db: AsyncSession = Depends(get_db),
) -> AcademicDebtResponse:
    result = await db.execute(select(AcademicDebt).where(AcademicDebt.id == debt_id))
    debt = result.scalar_one_or_none()
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")

    debt.status = "requested"
    debt.conversation_id = body.conversation_id
    debt.requested_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(debt)
    return AcademicDebtResponse.model_validate(debt)
