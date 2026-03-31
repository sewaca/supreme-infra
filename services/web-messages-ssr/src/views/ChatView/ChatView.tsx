'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteMessage, editMessage, markAsRead, sendMessage } from '../../../app/messages/actions';
import type { Conversation } from '../../entities/Conversation/types';
import type { Message } from '../../entities/Message/types';
import type { MessageAction } from '../../widgets/MessageContextMenu/MessageContextMenu';
import { MessageInput } from '../../widgets/MessageInput/MessageInput';
import { MessageList, type MessageListHandle } from '../../widgets/MessageList/MessageList';
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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messageListRef = useRef<MessageListHandle>(null);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on conversation change
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(conversation.id, messages[0].id);
    }
  }, [conversation.id]);

  const handleSend = useCallback(
    async (content: string, _files?: File[]) => {
      // If editing — patch message, don't send new
      if (editingMessage) {
        const res = await editMessage(conversation.id, editingMessage.id, content);
        if (res.success && res.message) {
          setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? { ...m, content, is_edited: true } : m)));
          setEditingMessage(null);
          return { success: true };
        }
        return { success: false, error: res.error };
      }

      const res = await sendMessage(conversation.id, content, replyTo?.id ?? null);
      if (res.success && res.message) {
        setMessages((prev) => [res.message!, ...prev]);
        setReplyTo(null);
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: { conversationId: conversation.id, message: res.message },
          }),
        );
      }
      return res;
    },
    [conversation.id, editingMessage, replyTo],
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
        setEditingMessage(null);
        setReplyTo(message);
      }
      if (action === 'copy') {
        const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        });
        navigator.clipboard
          .writeText(`${message.sender_name} ${message.sender_last_name} ${time}\n${message.content}`)
          .catch(() => {});
      }
      if (action === 'edit') {
        setReplyTo(null);
        setEditingMessage(message);
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
        ref={messageListRef}
        messages={messages}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={handleLoadMore}
        userId={userId}
        canReplyInDm={canReplyInDm}
        onAction={handleAction}
      />

      {canReply ? (
        <MessageInput
          onSend={handleSend}
          conversationId={conversation.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      ) : (
        <ReplyInDmButton ownerId={conversation.owner_id!} />
      )}
    </Box>
  );
}
