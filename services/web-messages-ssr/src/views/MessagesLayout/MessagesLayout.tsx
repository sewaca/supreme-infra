'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation } from '../../entities/Conversation/types';
import { useWebSocket, type WsClientEvent } from '../../shared/hooks/useWebSocket';
import { messagesWsDebug } from '../../shared/lib/messagesWsDebug';
import { ConversationListView } from '../ConversationListView/ConversationListView';
import styles from './MessagesLayout.module.css';

interface Props {
  initialConversations: Conversation[];
  userRole: string | null;
  userId: string | null;
  token: string | null;
  children: React.ReactNode;
}

export function MessagesLayout({ initialConversations, userRole, userId, token, children }: Props) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Show main panel on any path except the empty /messages root
  const showMain = pathname !== '/messages';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 769;

  const updateConversation = useCallback((conversationId: string, preview: string, lastMessageAt: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conversationId
          ? { ...c, last_message_at: lastMessageAt, last_message_preview: preview.slice(0, 200) }
          : c,
      );
      return updated.sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''));
    });
  }, []);

  // Listen for messages sent by the current user (bypasses WS is_own ambiguity)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { conversationId, message } = e.detail;
      updateConversation(conversationId, message.content, message.created_at);
    };
    window.addEventListener('conversation-updated', handler as EventListener);
    return () => window.removeEventListener('conversation-updated', handler as EventListener);
  }, [updateConversation]);

  const handleWsMessage = useCallback((event: WsClientEvent) => {
    if (event.type === 'new_message') {
      const cid = event.data.conversation_id;
      const createdAt = event.data.created_at;
      const senderId = event.data.sender_id;
      const content = event.data.content;
      if (cid == null || createdAt == null) {
        messagesWsDebug('MessagesLayout', 'sidebar_skip_new_message_missing_fields', {});
        return;
      }
      const cidStr = String(cid);
      const createdStr = String(createdAt);
      const isOwn = String(senderId) === String(userIdRef.current);
      const preview = typeof content === 'string' ? content.slice(0, 200) : '';
      messagesWsDebug('MessagesLayout', 'sidebar_apply_new_message', {
        convId: cidStr,
        msgId: String(event.data.id ?? ''),
        isOwn: String(isOwn),
      });
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === cidStr
            ? {
                ...c,
                last_message_at: createdStr,
                last_message_preview: preview,
                unread_count: isOwn ? c.unread_count : c.unread_count + 1,
              }
            : c,
        );
        return updated.sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''));
      });
    }
    if (event.type === 'message_edited') {
      const cid = event.data.conversation_id;
      const content = event.data.content;
      if (cid == null || typeof content !== 'string') return;
      const cidStr = String(cid);
      const preview = content.slice(0, 200);
      setConversations((prev) => prev.map((c) => (c.id === cidStr ? { ...c, last_message_preview: preview } : c)));
    }
    if (event.type === 'message_deleted') {
      const cid = event.data.conversation_id;
      if (cid == null) return;
      const cidStr = String(cid);
      setConversations((prev) =>
        prev.map((c) => (c.id === cidStr ? { ...c, last_message_preview: 'Сообщение удалено' } : c)),
      );
    }
    if (event.type === 'new_conversation') {
      const d = event.data;
      if (typeof d === 'object' && d !== null && 'id' in d && typeof (d as { id: unknown }).id === 'string') {
        setConversations((prev) => [d as unknown as Conversation, ...prev]);
      }
    }
  }, []);

  useWebSocket({ userId, token, onMessage: handleWsMessage });

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${showMain && isMobile ? styles.hidden : ''}`}>
        <ConversationListView
          conversations={conversations}
          userRole={userRole}
          currentPath={pathname}
          currentUserId={userId}
        />
      </aside>
      <main className={`${styles.main} ${!showMain && isMobile ? styles.hidden : ''}`}>{children}</main>
    </div>
  );
}
