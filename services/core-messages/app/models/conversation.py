import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Conversation(Base):
    __tablename__ = "conversation"
    __table_args__ = (Index("ix_conversation_lma_id", "last_message_at", "id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'direct' | 'broadcast'
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)  # для broadcast
    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # teacher UUID для broadcast

    # Denormalized для быстрой сортировки списка чатов
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    last_message_preview: Mapped[str | None] = mapped_column(String(200), nullable=True)
    last_message_sender_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    participants: Mapped[list["ConversationParticipant"]] = relationship(back_populates="conversation", lazy="selectin")


class ConversationParticipant(Base):
    __tablename__ = "conversation_participant"

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_participant"),
        Index("ix_cp_user_deleted_conv", "user_id", "is_deleted", "conversation_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")  # 'owner' | 'member'
    can_reply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_read_message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Direct: cached full name of the counterparty for this row (sidebar title for that user).
    peer_display_name: Mapped[str | None] = mapped_column(String(500), nullable=True)

    conversation: Mapped["Conversation"] = relationship(back_populates="participants")
