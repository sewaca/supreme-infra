import asyncio
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
from app.routers.conversations import _build_conversation_response, _get_unread_counts_batch
from app.schemas.conversation import ConversationResponse, CreateBroadcastRequest
from app.services.user_cache_service import get_cached_users_batch
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

    # Получить user_ids всех студентов из выбранных групп (параллельные HTTP запросы)
    student_ids: list[uuid.UUID] = []
    async with httpx.AsyncClient(timeout=10.0) as client:

        async def _fetch_group(group_name: str) -> list:
            try:
                resp = await client.get(
                    f"{settings.core_client_info_url}/profile/users-by-group",
                    params={"group": group_name},
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                pass
            return []

        results = await asyncio.gather(*[_fetch_group(g) for g in body.group_names])

    seen_ids: set[uuid.UUID] = set()
    for users_data in results:
        for u in users_data:
            uid = uuid.UUID(u["id"])
            if uid not in seen_ids:
                seen_ids.add(uid)
                student_ids.append(uid)

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

    # Батч unread counts и user cache — по 1 запросу на весь список
    conv_ids = [c.id for c in convs]
    unread_map = await _get_unread_counts_batch(conv_ids, teacher_id, db) if conv_ids else {}

    all_participant_ids = list({p.user_id for conv in convs for p in conv.participants if not p.is_deleted})
    users_map = await get_cached_users_batch(all_participant_ids, db) if all_participant_ids else {}

    return [
        await _build_conversation_response(
            conv,
            teacher_id,
            db,
            unread_count=unread_map.get(conv.id, 0),
            users_map=users_map,
        )
        for conv in convs
    ]


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
