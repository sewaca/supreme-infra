import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import ValidSession
from app.models.conversation import Conversation, ConversationParticipant
from app.models.message import Message
from app.schemas.message import (
    MarkReadRequest,
    MessageListResponse,
    MessageResponse,
    SendMessageRequest,
)
from app.services.cursor import decode_cursor, encode_cursor
from app.services.user_cache_service import get_cached_users_batch
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["messages"])


async def _get_participant(
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ConversationParticipant:
    result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.is_deleted.is_(False),
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")
    return participant


async def _build_message_response(
    msg: Message,
    current_user_id: uuid.UUID,
    users_map: dict,
) -> MessageResponse:
    sender = users_map.get(msg.sender_id)
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=sender.name if sender else "",
        sender_last_name=sender.last_name if sender else "",
        sender_avatar=sender.avatar if sender else None,
        content=msg.content,
        content_type=msg.content_type,
        attachments=[
            {
                "id": a.id,
                "file_url": a.file_url,
                "file_name": a.file_name,
                "file_size": a.file_size,
                "mime_type": a.mime_type,
                "thumbnail_url": a.thumbnail_url,
            }
            for a in msg.attachments
        ],
        created_at=msg.created_at,
        is_own=(msg.sender_id == current_user_id),
    )


@router.get("", response_model=MessageListResponse)
async def list_messages(
    conversation_id: uuid.UUID,
    current_user: ValidSession,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=30, le=100),
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])
    await _get_participant(conversation_id, current_user_id, db)

    query = select(Message).where(
        Message.conversation_id == conversation_id,
        Message.is_deleted.is_(False),
    )

    if cursor:
        cursor_ts, cursor_id = decode_cursor(cursor)
        query = query.where(
            or_(
                Message.created_at < cursor_ts,
                and_(Message.created_at == cursor_ts, Message.id < cursor_id),
            )
        )

    query = query.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit + 1)
    result = await db.execute(query)
    messages = result.scalars().all()

    has_more = len(messages) > limit
    items = messages[:limit]

    next_cursor = None
    if has_more and items:
        next_cursor = encode_cursor(items[-1].created_at, items[-1].id)

    sender_ids = list({m.sender_id for m in items})
    users_map = await get_cached_users_batch(sender_ids, db)

    response_items = [await _build_message_response(msg, current_user_id, users_map) for msg in items]

    return MessageListResponse(items=response_items, next_cursor=next_cursor, has_more=has_more)


@router.post("", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: uuid.UUID,
    body: SendMessageRequest,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])
    participant = await _get_participant(conversation_id, current_user_id, db)

    if not participant.can_reply:
        raise HTTPException(status_code=403, detail="You cannot reply in this conversation")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user_id,
        content=body.content,
        content_type=body.content_type,
    )
    db.add(msg)
    await db.flush()

    # Update conversation denormalized fields
    preview = body.content[:200]
    await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(
            last_message_at=datetime.now(UTC),
            last_message_preview=preview,
            last_message_sender_id=current_user_id,
        )
    )
    await db.flush()

    # Get participant IDs for WS broadcast
    result = await db.execute(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.is_deleted.is_(False),
        )
    )
    participant_ids = [row[0] for row in result.all()]

    users_map = await get_cached_users_batch([current_user_id], db)
    await db.refresh(msg, attribute_names=["attachments"])
    response = await _build_message_response(msg, current_user_id, users_map)

    await ws_manager.broadcast_to_conversation(
        participant_ids,
        {"type": "new_message", "data": response.model_dump(mode="json")},
    )

    return response


@router.post("/read", status_code=204)
async def mark_read(
    conversation_id: uuid.UUID,
    body: MarkReadRequest,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])
    participant = await _get_participant(conversation_id, current_user_id, db)

    participant.last_read_message_id = body.last_read_message_id
    participant.last_read_at = datetime.now(UTC)
    await db.flush()

    # Get the message to find sender
    msg_result = await db.execute(select(Message).where(Message.id == body.last_read_message_id))
    msg = msg_result.scalar_one_or_none()
    if msg:
        await ws_manager.send_to_user(
            msg.sender_id,
            {
                "type": "message_read",
                "data": {
                    "conversation_id": str(conversation_id),
                    "user_id": str(current_user_id),
                    "last_read_message_id": str(body.last_read_message_id),
                },
            },
        )
