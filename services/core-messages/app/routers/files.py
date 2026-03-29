import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import ValidSession
from app.models.conversation import ConversationParticipant
from app.models.message import Message, MessageAttachment
from app.schemas.message import AttachmentResponse

router = APIRouter(prefix="/files", tags=["files"])


class AddAttachmentRequest(BaseModel):
    message_id: uuid.UUID
    file_url: str
    file_name: str
    file_size: int  # bytes
    mime_type: str
    thumbnail_url: str | None = None


@router.post("", response_model=AttachmentResponse, status_code=201)
async def add_attachment(
    body: AddAttachmentRequest,
    current_user: ValidSession,
    db: AsyncSession = Depends(get_db),
):
    """Save a pre-uploaded file attachment to a message.

    The file itself must already be uploaded via the dedicated file storage service.
    This endpoint only saves the file metadata and URL to the database.
    """
    current_user_id = uuid.UUID(current_user["sub"])

    # Verify message exists and belongs to a conversation user participates in
    msg_result = await db.execute(select(Message).where(Message.id == body.message_id))
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    part_result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == msg.conversation_id,
            ConversationParticipant.user_id == current_user_id,
            ConversationParticipant.is_deleted.is_(False),
        )
    )
    if not part_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    attachment = MessageAttachment(
        message_id=body.message_id,
        file_url=body.file_url,
        file_name=body.file_name,
        file_size=body.file_size,
        mime_type=body.mime_type,
        thumbnail_url=body.thumbnail_url,
    )
    db.add(attachment)
    await db.flush()

    return AttachmentResponse(
        id=attachment.id,
        file_url=attachment.file_url,
        file_name=attachment.file_name,
        file_size=attachment.file_size,
        mime_type=attachment.mime_type,
        thumbnail_url=attachment.thumbnail_url,
    )
