import type { ConversationResponse, MessageResponse } from '@supreme-int/api-client/src/generated/core-messages';
import type { Conversation } from '../../entities/Conversation/types';
import type { Message } from '../../entities/Message/types';

function mapConversationType(type: string): Conversation['type'] {
  return type === 'broadcast' ? 'broadcast' : 'direct';
}

export function mapConversationResponseToConversation(c: ConversationResponse): Conversation {
  return {
    id: c.id,
    type: mapConversationType(c.type),
    title: c.title ?? null,
    owner_id: c.owner_id ?? null,
    last_message_at: c.last_message_at ?? null,
    last_message_preview: c.last_message_preview ?? null,
    unread_count: c.unread_count ?? 0,
    participants: (c.participants ?? []).map((p) => ({
      user_id: p.user_id,
      name: p.name,
      last_name: p.last_name,
      avatar: p.avatar ?? null,
      role: p.role ?? null,
    })),
    participant_count: c.participant_count ?? 0,
    peer_display_name: c.peer_display_name ?? null,
  };
}

export function mapMessageResponseToMessage(m: MessageResponse): Message {
  return {
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    sender_last_name: m.sender_last_name,
    sender_avatar: m.sender_avatar ?? null,
    content: m.content,
    content_type: m.content_type,
    attachments: (m.attachments ?? []).map((a) => ({
      id: a.id,
      file_url: a.file_url,
      file_name: a.file_name,
      file_size: a.file_size,
      mime_type: a.mime_type,
      thumbnail_url: a.thumbnail_url ?? null,
    })),
    created_at: m.created_at,
    is_own: m.is_own ?? false,
    is_edited: m.is_edited,
    reply_to_message: m.reply_to_message
      ? {
          id: m.reply_to_message.id,
          sender_name: m.reply_to_message.sender_name,
          sender_last_name: m.reply_to_message.sender_last_name,
          content: m.reply_to_message.content,
        }
      : undefined,
  };
}
