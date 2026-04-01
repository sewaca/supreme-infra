import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import ValidSession
from app.models.conversation import Conversation, ConversationParticipant
from app.models.message import Message
from app.schemas.common import ConversationUpdateItem, UpdatesResponse
from app.schemas.conversation import (
    ConversationListResponse,
    ConversationResponse,
    CreateDirectConversationRequest,
    ParticipantBrief,
)
from app.services.cursor import decode_cursor, encode_cursor
from app.services.user_cache_service import get_cached_users_batch

router = APIRouter(prefix="/conversations", tags=["conversations"])


async def _get_unread_counts_batch(
    conv_ids: list[uuid.UUID],
    current_user_id: uuid.UUID,
    db: AsyncSession,
) -> dict[uuid.UUID, int]:
    """Один SQL-запрос для unread count по всем диалогам текущей страницы."""
    if not conv_ids:
        return {}
    result = await db.execute(
        select(
            Message.conversation_id,
            func.count(Message.id).label("unread"),
        )
        .join(
            ConversationParticipant,
            and_(
                ConversationParticipant.conversation_id == Message.conversation_id,
                ConversationParticipant.user_id == current_user_id,
                ConversationParticipant.is_deleted.is_(False),
            ),
        )
        .where(
            Message.conversation_id.in_(conv_ids),
            Message.is_deleted.is_(False),
            or_(
                ConversationParticipant.last_read_at.is_(None),
                Message.created_at > ConversationParticipant.last_read_at,
            ),
        )
        .group_by(Message.conversation_id)
    )
    return {row.conversation_id: row.unread for row in result.all()}


async def _ensure_peer_display_names_direct(conv: Conversation, db: AsyncSession) -> None:
    """Заполняет peer_display_name для direct, если в БД ещё пусто (миграция / старые данные)."""
    if conv.type != "direct":
        return
    active = [p for p in conv.participants if not p.is_deleted]
    if len(active) != 2:
        return
    if all(p.peer_display_name for p in active):
        return
    uids = [p.user_id for p in active]
    users_map = await get_cached_users_batch(uids, db)
    changed = False
    for p in active:
        peer_uid = next(uid for uid in uids if uid != p.user_id)
        u = users_map.get(peer_uid)
        if u and not p.peer_display_name:
            p.peer_display_name = f"{u.name} {u.last_name}".strip() or None
            changed = True
    if changed:
        await db.flush()


async def _build_conversation_response(
    conv: Conversation,
    current_user_id: uuid.UUID,
    db: AsyncSession,
    *,
    unread_count: int | None = None,
    users_map: dict | None = None,
) -> ConversationResponse:
    participant = next((p for p in conv.participants if p.user_id == current_user_id), None)

    # Unread count: используем pre-computed если передан, иначе запрашиваем отдельно
    if unread_count is None:
        unread_count = 0
        if participant:
            count_query = select(func.count(Message.id)).where(
                Message.conversation_id == conv.id,
                Message.is_deleted.is_(False),
            )
            if participant.last_read_at:
                count_query = count_query.where(Message.created_at > participant.last_read_at)
            result = await db.execute(count_query)
            unread_count = result.scalar_one() or 0

    # Enrich participants from cache: используем pre-fetched map если передан
    if users_map is None:
        participant_ids = [p.user_id for p in conv.participants if not p.is_deleted]
        users_map = await get_cached_users_batch(participant_ids, db)

    participants_brief = [
        ParticipantBrief(
            user_id=p.user_id,
            name=users_map[p.user_id].name if p.user_id in users_map else "",
            last_name=users_map[p.user_id].last_name if p.user_id in users_map else "",
            avatar=users_map[p.user_id].avatar if p.user_id in users_map else None,
            role=users_map[p.user_id].role if p.user_id in users_map else None,
        )
        for p in conv.participants
        if not p.is_deleted
    ]

    peer_display_name: str | None = None
    if conv.type == "direct":
        my_row = next(
            (p for p in conv.participants if p.user_id == current_user_id and not p.is_deleted),
            None,
        )
        if my_row and my_row.peer_display_name:
            peer_display_name = my_row.peer_display_name.strip() or None
        else:
            other_id = next(
                (p.user_id for p in conv.participants if p.user_id != current_user_id and not p.is_deleted),
                None,
            )
            if other_id and other_id in users_map:
                u = users_map[other_id]
                peer_display_name = f"{u.name} {u.last_name}".strip() or None
        participants_brief.sort(key=lambda pb: (pb.user_id == current_user_id, str(pb.user_id)))

    return ConversationResponse(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        owner_id=conv.owner_id,
        last_message_at=conv.last_message_at,
        last_message_preview=conv.last_message_preview,
        unread_count=unread_count,
        participants=participants_brief,
        participant_count=len(participants_brief),
        peer_display_name=peer_display_name,
    )


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    current_user: ValidSession,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    query = select(Conversation).join(
        ConversationParticipant,
        and_(
            ConversationParticipant.conversation_id == Conversation.id,
            ConversationParticipant.user_id == current_user_id,
            ConversationParticipant.is_deleted.is_(False),
        ),
    )

    if cursor:
        cursor_ts, cursor_id = decode_cursor(cursor)
        query = query.where(
            or_(
                Conversation.last_message_at < cursor_ts,
                and_(
                    Conversation.last_message_at == cursor_ts,
                    Conversation.id < cursor_id,
                ),
                Conversation.last_message_at.is_(None),
            )
        )

    query = query.order_by(
        Conversation.last_message_at.desc().nullslast(),
        Conversation.id.desc(),
    ).limit(limit + 1)

    result = await db.execute(query)
    convs = result.scalars().all()

    has_more = len(convs) > limit
    items = convs[:limit]

    next_cursor = None
    if has_more and items and items[-1].last_message_at:
        next_cursor = encode_cursor(items[-1].last_message_at, items[-1].id)

    # Батч unread counts — 1 запрос вместо N
    conv_ids = [c.id for c in items]
    unread_map = await _get_unread_counts_batch(conv_ids, current_user_id, db)

    # Батч user cache — 1 запрос вместо N
    all_participant_ids = list({p.user_id for conv in items for p in conv.participants if not p.is_deleted})
    users_map = await get_cached_users_batch(all_participant_ids, db)

    response_items = [
        await _build_conversation_response(
            conv,
            current_user_id,
            db,
            unread_count=unread_map.get(conv.id, 0),
            users_map=users_map,
        )
        for conv in items
    ]

    return ConversationListResponse(items=response_items, next_cursor=next_cursor)


@router.post("/direct", response_model=ConversationResponse, status_code=201)
async def create_or_get_direct_conversation(
    body: CreateDirectConversationRequest,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    if body.recipient_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")

    # Найти existing direct conversation
    subq_current = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == current_user_id,
        ConversationParticipant.is_deleted.is_(False),
    )
    subq_recipient = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == body.recipient_id,
        ConversationParticipant.is_deleted.is_(False),
    )
    existing_query = select(Conversation).where(
        Conversation.type == "direct",
        Conversation.id.in_(subq_current),
        Conversation.id.in_(subq_recipient),
    )
    result = await db.execute(existing_query)
    existing = result.scalars().first()

    if existing:
        await _ensure_peer_display_names_direct(existing, db)
        return await _build_conversation_response(existing, current_user_id, db)

    # Создать новый
    conv = Conversation(type="direct")
    db.add(conv)
    await db.flush()

    db.add(ConversationParticipant(conversation_id=conv.id, user_id=current_user_id, role="member", can_reply=True))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=body.recipient_id, role="member", can_reply=True))
    await db.flush()

    users_for_peer = await get_cached_users_batch([current_user_id, body.recipient_id], db)

    def _peer_label(for_user_id: uuid.UUID) -> str:
        peer_uid = body.recipient_id if for_user_id == current_user_id else current_user_id
        u = users_for_peer.get(peer_uid)
        if not u:
            return ""
        return f"{u.name} {u.last_name}".strip()

    part_result = await db.execute(
        select(ConversationParticipant).where(ConversationParticipant.conversation_id == conv.id)
    )
    for row in part_result.scalars().all():
        row.peer_display_name = _peer_label(row.user_id) or None
    await db.flush()

    result = await db.execute(select(Conversation).where(Conversation.id == conv.id))
    conv = result.scalar_one()
    return await _build_conversation_response(conv, current_user_id, db)


@router.get("/updates", response_model=UpdatesResponse)
async def get_updates(
    current_user: ValidSession,
    since: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    query = (
        select(Conversation)
        .join(
            ConversationParticipant,
            and_(
                ConversationParticipant.conversation_id == Conversation.id,
                ConversationParticipant.user_id == current_user_id,
                ConversationParticipant.is_deleted.is_(False),
            ),
        )
        .where(Conversation.last_message_at > since)
    )
    result = await db.execute(query)
    convs = result.scalars().all()

    # Батч unread counts — 1 запрос вместо N
    conv_ids = [c.id for c in convs]
    unread_map: dict[uuid.UUID, int] = {}
    if conv_ids:
        unread_result = await db.execute(
            select(
                Message.conversation_id,
                func.count(Message.id).label("unread"),
            )
            .where(
                Message.conversation_id.in_(conv_ids),
                Message.is_deleted.is_(False),
                Message.created_at > since,
            )
            .group_by(Message.conversation_id)
        )
        unread_map = {row.conversation_id: row.unread for row in unread_result.all()}

    items = [
        ConversationUpdateItem(
            conversation_id=conv.id,
            last_message_at=conv.last_message_at,
            last_message_preview=conv.last_message_preview,
            unread_count=unread_map.get(conv.id, 0),
        )
        for conv in convs
    ]

    return UpdatesResponse(conversations=items, server_time=datetime.now(UTC))


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    participant = next((p for p in conv.participants if p.user_id == current_user_id and not p.is_deleted), None)
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    await _ensure_peer_display_names_direct(conv, db)
    return await _build_conversation_response(conv, current_user_id, db)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user_id,
        )
    )
    participant = result.scalar_one_or_none()
    if not participant or participant.is_deleted:
        raise HTTPException(status_code=403, detail="Not a participant")

    participant.is_deleted = True
    await db.flush()
