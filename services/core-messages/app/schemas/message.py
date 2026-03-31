from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AttachmentResponse(BaseModel):
    id: UUID
    file_url: str
    file_name: str
    file_size: int
    mime_type: str
    thumbnail_url: str | None = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender_name: str
    sender_last_name: str
    sender_avatar: str | None = None
    content: str
    content_type: str
    attachments: list[AttachmentResponse] = []
    created_at: datetime
    is_own: bool = False
    is_edited: bool = False


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    next_cursor: str | None = None
    has_more: bool = False


class SendMessageRequest(BaseModel):
    content: str = Field(..., max_length=5000)
    content_type: str = "text"


class EditMessageRequest(BaseModel):
    content: str = Field(..., max_length=5000)


class MarkReadRequest(BaseModel):
    last_read_message_id: UUID


class MessageSearchResult(BaseModel):
    message: MessageResponse
    conversation_id: UUID
    conversation_title: str | None = None
    conversation_type: str
    highlight: str


class SearchMessagesResponse(BaseModel):
    items: list[MessageSearchResult]
    next_cursor: str | None = None
