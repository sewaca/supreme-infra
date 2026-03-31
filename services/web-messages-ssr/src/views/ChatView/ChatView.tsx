'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteMessage, editMessage, markAsRead, sendMessage } from '../../../app/messages/actions';
import type { Conversation } from '../../entities/Conversation/types';
import type { Message } from '../../entities/Message/types';
import type { MessageAction } from '../../widgets/MessageContextMenu/MessageContextMenu';
import { MessageInput } from '../../widgets/MessageInput/MessageInput';
import { MessageList } from '../../widgets/MessageList/MessageList';
import { ReplyInDmButton } from '../../widgets/ReplyInDmButton/ReplyInDmButton';
import styles from './ChatView.module.css';

interface Props {
  conversation: Conversation;
  initialMessages: Message[];
  initialCursor: string | null;
  initialHasMore: boolean;
  userId: string;
  userRole: string | null;
}

export function ChatView({
  conversation,
  initialMessages,
  initialCursor,
  initialHasMore,
  userId,
  userRole: _userRole,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const isBroadcast = conversation.type === 'broadcast';
  const isOwner = conversation.owner_id === userId;
  const canReply = !isBroadcast || isOwner;
  const canReplyInDm = isBroadcast && !isOwner;

  const otherParticipant = conversation.participants.find((p) => p.user_id !== userId);
  const displayName = isBroadcast
    ? (conversation.title ?? 'Рассылка')
    : otherParticipant
      ? `${otherParticipant.name} ${otherParticipant.last_name}`
      : 'Чат';

  const subtitle =
    isBroadcast && !isOwner
      ? 'Рассылка'
      : isBroadcast
        ? `Рассылка (${conversation.participant_count} студентов)`
        : undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on conversation change (mark as read on open)
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(conversation.id, messages[0].id);
    }
  }, [conversation.id]);

  const handleSend = useCallback(
    async (content: string, _files?: File[]) => {
      const fullContent = replyTo
        ? `> ${replyTo.sender_name} ${replyTo.sender_last_name}, ${new Date(replyTo.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}:\n> ${replyTo.content}\n\n${content}`
        : content;
      setReplyTo(null);
      const result = await sendMessage(conversation.id, fullContent);
      if (result.success && result.message) {
        setMessages((prev) => [result.message!, ...prev]);
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: { conversationId: conversation.id, message: result.message },
          }),
        );
      }
      return result;
    },
    [conversation.id, replyTo],
  );

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/history?conversation_id=${conversation.id}&cursor=${cursor}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, ...data.items]);
        setCursor(data.next_cursor);
        setHasMore(data.has_more);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, conversation.id]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const wsEvent = event.detail;
      if (
        wsEvent.type === 'new_message' &&
        wsEvent.data.conversation_id === conversation.id &&
        wsEvent.data.sender_id !== userId
      ) {
        setMessages((prev) => [wsEvent.data, ...prev]);
        markAsRead(conversation.id, wsEvent.data.id);
      }
      if (wsEvent.type === 'message_edited' && wsEvent.data.conversation_id === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === wsEvent.data.message_id ? { ...m, content: wsEvent.data.content, is_edited: true } : m,
          ),
        );
      }
      if (wsEvent.type === 'message_deleted' && wsEvent.data.conversation_id === conversation.id) {
        setMessages((prev) => prev.filter((m) => m.id !== wsEvent.data.message_id));
      }
    };
    window.addEventListener('ws-message' as any, handler);
    return () => window.removeEventListener('ws-message' as any, handler);
  }, [conversation.id, userId]);

  const handleAction = useCallback(
    (action: MessageAction, message: Message) => {
      if (action === 'reply') {
        setReplyTo(message);
      }
      if (action === 'reply-dm') {
        // handled by ReplyInDmButton
      }
      if (action === 'copy') {
        const time = new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const text = `${message.sender_name} ${message.sender_last_name} ${time}\n${message.content}`;
        navigator.clipboard.writeText(text).catch(() => {});
      }
      if (action === 'edit') {
        setEditingMessageId(message.id);
      }
      if (action === 'delete') {
        deleteMessage(conversation.id, message.id).then((res) => {
          if (res.success) {
            setMessages((prev) => prev.filter((m) => m.id !== message.id));
          }
        });
      }
    },
    [conversation.id],
  );

  const handleEditSubmit = useCallback(
    async (messageId: string, content: string) => {
      const res = await editMessage(conversation.id, messageId, content);
      if (res.success && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content, is_edited: true } : m)));
      }
      setEditingMessageId(null);
    },
    [conversation.id],
  );

  return (
    <Box className={styles.chatContainer}>
      <Box className={styles.header}>
        <IconButton component={Link} href="/messages" sx={{ display: { xs: 'flex', md: 'none' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, ml: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {displayName}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <MessageList
        messages={messages}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={handleLoadMore}
        userId={userId}
        canReplyInDm={canReplyInDm}
        editingMessageId={editingMessageId}
        onAction={handleAction}
        onEditSubmit={handleEditSubmit}
        onCancelEdit={() => setEditingMessageId(null)}
      />

      {canReply ? (
        <MessageInput
          onSend={handleSend}
          conversationId={conversation.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      ) : (
        <ReplyInDmButton ownerId={conversation.owner_id!} />
      )}
    </Box>
  );
}
