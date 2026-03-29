from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationUpdateItem(BaseModel):
    conversation_id: UUID
    last_message_at: datetime | None = None
    last_message_preview: str | None = None
    unread_count: int = 0
    last_sender_name: str | None = None


class UpdatesResponse(BaseModel):
    conversations: list[ConversationUpdateItem]
    server_time: datetime
