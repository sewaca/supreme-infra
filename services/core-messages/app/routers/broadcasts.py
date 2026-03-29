import uuid
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import ValidSession
from app.models.conversation import Conversation, ConversationParticipant
from app.models.message import Message
from app.routers.conversations import _build_conversation_response
from app.schemas.conversation import ConversationResponse, CreateBroadcastRequest
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_broadcast(
    body: CreateBroadcastRequest,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create broadcasts")

    teacher_id = uuid.UUID(current_user["sub"])

    # Получить user_ids всех студентов из выбранных групп
    student_ids: list[uuid.UUID] = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for group_name in body.group_names:
            try:
                resp = await client.get(
                    f"{settings.core_client_info_url}/profile/users-by-group",
                    params={"group": group_name},
                )
                if resp.status_code == 200:
                    users_data = resp.json()
                    for u in users_data:
                        uid = uuid.UUID(u["id"])
                        if uid not in student_ids:
                            student_ids.append(uid)
            except Exception:
                pass

    # Создать conversation
    conv = Conversation(type="broadcast", title=body.title, owner_id=teacher_id)
    db.add(conv)
    await db.flush()

    # Teacher как owner
    db.add(
        ConversationParticipant(
            conversation_id=conv.id,
            user_id=teacher_id,
            role="owner",
            can_reply=True,
        )
    )

    # Студенты как member (can_reply=False)
    for student_id in student_ids:
        db.add(
            ConversationParticipant(
                conversation_id=conv.id,
                user_id=student_id,
                role="member",
                can_reply=False,
            )
        )

    await db.flush()

    # Опциональное начальное сообщение
    if body.initial_message:
        msg = Message(
            conversation_id=conv.id,
            sender_id=teacher_id,
            content=body.initial_message,
            content_type="text",
        )
        db.add(msg)
        await db.flush()

        now = datetime.now(UTC)
        await db.execute(
            update(Conversation)
            .where(Conversation.id == conv.id)
            .values(
                last_message_at=now,
                last_message_preview=body.initial_message[:200],
                last_message_sender_id=teacher_id,
            )
        )
        await db.flush()

    result = await db.execute(select(Conversation).where(Conversation.id == conv.id))
    conv = result.scalar_one()
    response = await _build_conversation_response(conv, teacher_id, db)

    # Уведомить студентов через WS
    await ws_manager.broadcast_to_conversation(
        student_ids,
        {"type": "new_conversation", "data": response.model_dump(mode="json")},
    )

    return response


@router.get("", response_model=list[ConversationResponse])
async def list_broadcasts(
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view broadcasts")

    teacher_id = uuid.UUID(current_user["sub"])

    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.type == "broadcast",
            Conversation.owner_id == teacher_id,
        )
        .order_by(Conversation.created_at.desc())
    )
    convs = result.scalars().all()

    return [await _build_conversation_response(conv, teacher_id, db) for conv in convs]


@router.get("/groups", response_model=list[str])
async def get_groups(
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view groups")

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(f"{settings.core_client_info_url}/profile/groups")
        if resp.status_code == 200:
            return resp.json()
        return []
