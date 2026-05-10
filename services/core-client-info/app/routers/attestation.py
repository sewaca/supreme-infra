from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.database import get_db
from app.models.attestation import Attestation
from app.models.user import User
from app.schemas.attestation import AttestationResponse

router = APIRouter(prefix="/attestations", tags=["attestations"])


@router.get("", response_model=list[AttestationResponse])
async def get_attestations(user_id: UUID, db: AsyncSession = Depends(get_db)) -> list[AttestationResponse]:
    teacher = aliased(User)
    stmt = (
        select(Attestation, teacher)
        .outerjoin(teacher, teacher.id == Attestation.teacher_id)
        .where(Attestation.user_id == user_id)
        .order_by(Attestation.semester.desc(), Attestation.subject_name.asc())
    )
    rows = (await db.execute(stmt)).all()

    def fio(t: User | None) -> str | None:
        if t is None:
            return None
        parts = [t.last_name, t.name, t.middle_name]
        return " ".join(p for p in parts if p)

    return [
        AttestationResponse(
            id=a.id,
            subject_name=a.subject_name,
            is_attested=a.is_attested,
            reason=a.reason,
            teacher_id=a.teacher_id,
            teacher_full_name=fio(t),
            semester=a.semester,
            created_at=a.created_at,
        )
        for a, t in rows
    ]
