'use client';

import { Alert, Box, Snackbar, Typography } from '@mui/material';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import router from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  attachFilesToMessage,
  deleteMessage,
  editMessage,
  markAsRead,
  sendMessage,
  type UploadedFile,
} from '../../../app/messages/actions';
import type { Conversation } from '../../entities/Conversation/types';
import type { Message } from '../../entities/Message/types';
import type { WsClientEvent } from '../../shared/hooks/useWebSocket';
import { messagesWsDebug } from '../../shared/lib/messagesWsDebug';
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
  const [errorSnackbar, setErrorSnackbar] = useState<string | null>(null);
  const atBottomRef = useRef(true);
  const pendingUnreadRef = useRef(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dmReplyTo, setDmReplyTo] = useState<Message | null>(null);

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
      window.dispatchEvent(new CustomEvent('conversation-read', { detail: { conversationId: conversation.id } }));
    }
  }, [conversation.id]);

  useEffect(() => {
    const key = `pending_reply_${conversation.id}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      sessionStorage.removeItem(key);
      try {
        setReplyTo(JSON.parse(raw) as Message);
      } catch {
        /* ignore */
      }
    }
  }, [conversation.id]);

  const handleSend = useCallback(
    async (content: string, uploadedFiles?: UploadedFile[]) => {
      // If editing — patch message, ignore files
      if (editingMessage) {
        const res = await editMessage(conversation.id, editingMessage.id, content);
        if (res.success && res.message) {
          setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? { ...m, content, is_edited: true } : m)));
          setEditingMessage(null);
          return { success: true };
        }
        return { success: false, error: res.error };
      }

      const hasFiles = uploadedFiles && uploadedFiles.length > 0;
      const contentType = hasFiles && !content ? 'file' : 'text';
      const res = await sendMessage(conversation.id, content, replyTo?.id ?? null, contentType);
      if (res.success && res.message) {
        let message = res.message;

        if (hasFiles) {
          const attachments = await attachFilesToMessage(message.id, uploadedFiles);
          message = { ...message, attachments };
        }

        const withReply =
          replyTo != null
            ? {
                ...message,
                reply_to_message: {
                  id: replyTo.id,
                  sender_name: replyTo.sender_name,
                  sender_last_name: replyTo.sender_last_name,
                  content: replyTo.content,
                },
              }
            : message;
        setMessages((prev) => [withReply, ...prev]);
        setReplyTo(null);
        setTimeout(() => messageListRef.current?.scrollToBottom(), 0);
        markAsRead(conversation.id, withReply.id);
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: { conversationId: conversation.id, message: withReply },
          }),
        );
      }
      return res;
    },
    [conversation.id, editingMessage, replyTo],
  );

  const handleAtBottomChange = useCallback(
    (isAtBottom: boolean) => {
      atBottomRef.current = isAtBottom;
      if (isAtBottom && pendingUnreadRef.current > 0) {
        const latestMsg = messages[0];
        if (latestMsg) {
          markAsRead(conversation.id, latestMsg.id);
          window.dispatchEvent(new CustomEvent('conversation-read', { detail: { conversationId: conversation.id } }));
        }
        pendingUnreadRef.current = 0;
        setUnreadCount(0);
      }
    },
    [messages, conversation.id],
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
    const handler = (event: Event) => {
      const wsEvent = (event as CustomEvent<WsClientEvent>).detail;
      const data = wsEvent.data;
      const cidRaw = data.conversation_id;
      if (cidRaw == null) {
        messagesWsDebug('ChatView', 'skip_no_conversation_id_in_payload', { userId, wsType: wsEvent.type });
        return;
      }
      if (String(cidRaw) !== conversation.id) {
        messagesWsDebug('ChatView', 'skip_wrong_conversation', {
          userId,
          wsType: wsEvent.type,
          eventConvId: String(cidRaw),
          openConvId: conversation.id,
        });
        return;
      }

      if (wsEvent.type === 'new_message') {
        const senderRaw = data.sender_id;
        if (senderRaw != null && String(senderRaw) === userId) {
          messagesWsDebug('ChatView', 'skip_own_new_message_echo', { userId, msgId: String(data.id ?? '') });
          return;
        }
        const raw = data as Record<string, unknown>;
        const incoming: Message = {
          ...(raw as unknown as Message),
          attachments: Array.isArray(raw.attachments) ? (raw.attachments as Message['attachments']) : [],
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) {
            messagesWsDebug('ChatView', 'skip_duplicate_message_id', { userId, msgId: incoming.id });
            return prev;
          }
          messagesWsDebug('ChatView', 'apply_new_message', { userId, msgId: incoming.id });
          return [incoming, ...prev];
        });

        // If message has file content but no attachments yet (race: WS fires before attach),
        // retry fetching the message after a short delay
        if (incoming.content_type === 'file' && incoming.attachments.length === 0) {
          setTimeout(async () => {
            try {
              const res = await fetch(`/api/messages/history?conversation_id=${conversation.id}&limit=10`);
              if (res.ok) {
                const histData = await res.json();
                const updated = (histData.items as Message[]).find((m) => m.id === incoming.id);
                if (updated && updated.attachments.length > 0) {
                  setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                }
              }
            } catch {}
          }, 1500);
        }

        const mid = data.id;
        if (mid != null) {
          if (atBottomRef.current) {
            markAsRead(conversation.id, String(mid));
            window.dispatchEvent(new CustomEvent('conversation-read', { detail: { conversationId: conversation.id } }));
          } else {
            pendingUnreadRef.current += 1;
            setUnreadCount(pendingUnreadRef.current);
          }
        }
        return;
      }
      if (wsEvent.type === 'message_edited') {
        const mid = data.message_id;
        const content = data.content;
        if (mid == null || typeof content !== 'string') {
          messagesWsDebug('ChatView', 'skip_edit_bad_payload', { userId });
          return;
        }
        const idStr = String(mid);
        messagesWsDebug('ChatView', 'apply_edit', { userId, messageId: idStr });
        setMessages((prev) => prev.map((m) => (m.id === idStr ? { ...m, content, is_edited: true } : m)));
        return;
      }
      if (wsEvent.type === 'message_deleted') {
        const mid = data.message_id;
        if (mid == null) return;
        const idStr = String(mid);
        messagesWsDebug('ChatView', 'apply_delete', { userId, messageId: idStr });
        setMessages((prev) => prev.filter((m) => m.id !== idStr));
      }
    };
    window.addEventListener('ws-message', handler as EventListener);
    return () => window.removeEventListener('ws-message', handler as EventListener);
  }, [conversation.id, userId]);

  const handleAction = useCallback(
    (action: MessageAction, message: Message) => {
      if (action === 'reply') {
        setEditingMessage(null);
        setReplyTo(message);
      }
      if (action === 'reply-dm') {
        setDmReplyTo(message);
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
        const confirmed = window.confirm(
          'Удалить это сообщение? Оно будет удалено у вас и у собеседника, восстановить его будет нельзя.',
        );
        if (!confirmed) return;
        deleteMessage(conversation.id, message.id).then((res) => {
          if (res.success) {
            setMessages((prev) => prev.filter((m) => m.id !== message.id));
          }
        });
      }
    },
    [conversation.id],
  );

  const handleMessageDoubleClick = useCallback(
    (message: Message) => {
      if (canReply) {
        setEditingMessage(null);
        setReplyTo(message);
        return;
      }
      if (canReplyInDm) {
        setDmReplyTo(message);
      }
    },
    [canReply, canReplyInDm],
  );

  return (
    <Box className={styles.chatContainer}>
      <NavBar
        onBack={() => router.push('/messages')}
        center={
          <Box sx={{ flex: 1, ml: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="title1" noWrap style={{ lineHeight: '1.2' }}>
              {displayName}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        }
      />

      <MessageList
        ref={messageListRef}
        messages={messages}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={handleLoadMore}
        userId={userId}
        canReplyInDm={canReplyInDm}
        unreadCount={unreadCount}
        onAtBottomChange={handleAtBottomChange}
        onAction={handleAction}
        onMessageDoubleClick={canReply || canReplyInDm ? handleMessageDoubleClick : undefined}
      />

      {canReply ? (
        <MessageInput
          onSend={handleSend}
          conversationId={conversation.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onError={setErrorSnackbar}
        />
      ) : conversation.owner_id ? (
        <ReplyInDmButton ownerId={conversation.owner_id} replyTo={dmReplyTo} onClearReply={() => setDmReplyTo(null)} />
      ) : null}

      <Snackbar
        open={!!errorSnackbar}
        autoHideDuration={5000}
        onClose={() => setErrorSnackbar(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorSnackbar(null)} sx={{ width: '100%' }}>
          {errorSnackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
