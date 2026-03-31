from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ParticipantBrief(BaseModel):
    user_id: UUID
    name: str
    last_name: str
    avatar: str | None = None
    role: str | None = None  # 'student' | 'teacher'


class ConversationResponse(BaseModel):
    id: UUID
    type: str  # 'direct' | 'broadcast'
    title: str | None = None
    owner_id: UUID | None = None
    last_message_at: datetime | None = None
    last_message_preview: str | None = None
    unread_count: int = 0
    participants: list[ParticipantBrief] = []
    participant_count: int = 0  # полезно для broadcast
    # Direct: имя собеседника для текущего пользователя (дублирует peer_display_name в БД или из кэша).
    peer_display_name: str | None = None


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    next_cursor: str | None = None


class CreateDirectConversationRequest(BaseModel):
    recipient_id: UUID


class CreateBroadcastRequest(BaseModel):
    title: str
    group_names: list[str]
    initial_message: str | None = None
