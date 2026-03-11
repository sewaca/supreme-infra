from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.subject import SubjectChoice, UserSubjectPriority
from app.schemas.subject import SavePrioritiesRequest, SubjectChoiceResponse, UserSubjectPriorityResponse

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("/choices", response_model=list[SubjectChoiceResponse])
async def get_choices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubjectChoice).where(SubjectChoice.is_active))
    choices = result.scalars().all()
    return [
        SubjectChoiceResponse(id=c.id, choice_id=c.choice_id, deadline_date=c.deadline_date, is_active=c.is_active)
        for c in choices
    ]


@router.get("/user-priorities/{choice_id}", response_model=list[UserSubjectPriorityResponse])
async def get_user_priorities(choice_id: str, user_id: UUID, db: AsyncSession = Depends(get_db)):
    choice_result = await db.execute(select(SubjectChoice).where(SubjectChoice.choice_id == choice_id))
    choice = choice_result.scalar_one_or_none()
    if choice is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Subject choice not found")

    result = await db.execute(
        select(UserSubjectPriority)
        .where(UserSubjectPriority.user_id == user_id, UserSubjectPriority.choice_id == choice.id)
        .order_by(UserSubjectPriority.priority)
    )
    priorities = result.scalars().all()
    return [
        UserSubjectPriorityResponse(choice_id=p.choice_id, subject_id=p.subject_id, priority=p.priority)
        for p in priorities
    ]


@router.post("/save-priorities")
async def save_priorities(user_id: UUID, body: SavePrioritiesRequest, db: AsyncSession = Depends(get_db)):
    choice_result = await db.execute(select(SubjectChoice).where(SubjectChoice.choice_id == body.choice_id))
    choice = choice_result.scalar_one_or_none()
    if choice is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Subject choice not found")

    existing_result = await db.execute(
        select(UserSubjectPriority).where(
            UserSubjectPriority.user_id == user_id, UserSubjectPriority.choice_id == choice.id
        )
    )
    existing = {p.subject_id: p for p in existing_result.scalars().all()}

    for priority_idx, subject_id in enumerate(body.priorities):
        if subject_id in existing:
            existing[subject_id].priority = priority_idx
        else:
            db.add(
                UserSubjectPriority(user_id=user_id, choice_id=choice.id, subject_id=subject_id, priority=priority_idx)
            )

    await db.flush()
    return {"status": "success"}
