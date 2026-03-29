import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import ValidSession
from app.schemas.message import MessageResponse, MessageSearchResult, SearchMessagesResponse
from app.services.user_cache_service import get_cached_users_batch

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/search", response_model=SearchMessagesResponse)
async def search_messages(
    current_user: ValidSession,
    q: str = Query(..., min_length=2),
    limit: int = Query(default=20, le=50),
    cursor: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    current_user_id = uuid.UUID(current_user["sub"])

    sql = text("""
        SELECT m.id,
               m.conversation_id,
               m.sender_id,
               m.content,
               m.content_type,
               m.created_at,
               m.is_deleted,
               c.title AS conversation_title,
               c.type AS conversation_type,
               ts_headline(
                   'russian', m.content,
                   plainto_tsquery('russian', :q),
                   'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
               ) AS highlight
        FROM message m
        JOIN conversation c ON c.id = m.conversation_id
        JOIN conversation_participant cp ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = :user_id
          AND cp.is_deleted = false
          AND m.is_deleted = false
          AND m.content_search @@ plainto_tsquery('russian', :q)
        ORDER BY ts_rank(m.content_search, plainto_tsquery('russian', :q)) DESC,
                 m.created_at DESC
        LIMIT :limit
    """)

    result = await db.execute(sql, {"q": q, "user_id": current_user_id, "limit": limit + 1})
    rows = result.fetchall()

    rows = rows[:limit]

    if not rows:
        return SearchMessagesResponse(items=[], next_cursor=None)

    sender_ids = list({row.sender_id for row in rows})
    users_map = await get_cached_users_batch(sender_ids, db)

    items = []
    for row in rows:
        sender = users_map.get(row.sender_id)
        msg_response = MessageResponse(
            id=row.id,
            conversation_id=row.conversation_id,
            sender_id=row.sender_id,
            sender_name=sender.name if sender else "",
            sender_last_name=sender.last_name if sender else "",
            sender_avatar=sender.avatar if sender else None,
            content=row.content,
            content_type=row.content_type,
            attachments=[],
            created_at=row.created_at,
            is_own=(row.sender_id == current_user_id),
        )
        items.append(
            MessageSearchResult(
                message=msg_response,
                conversation_id=row.conversation_id,
                conversation_title=row.conversation_title,
                conversation_type=row.conversation_type,
                highlight=row.highlight or "",
            )
        )

    return SearchMessagesResponse(items=items, next_cursor=None)
