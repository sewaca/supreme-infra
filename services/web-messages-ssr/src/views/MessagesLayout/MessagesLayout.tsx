'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation } from '../../entities/Conversation/types';
import { useWebSocket, type WsClientEvent } from '../../shared/hooks/useWebSocket';
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
      if (typeof cid !== 'string' || typeof createdAt !== 'string') return;
      const isOwn = senderId === userIdRef.current;
      const preview = typeof content === 'string' ? content.slice(0, 200) : '';
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === cid
            ? {
                ...c,
                last_message_at: createdAt,
                last_message_preview: preview,
                unread_count: isOwn ? c.unread_count : c.unread_count + 1,
              }
            : c,
        );
        return updated.sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''));
      });
    }
    if (event.type === 'new_conversation') {
      const d = event.data;
      if (typeof d === 'object' && d !== null && 'id' in d && typeof (d as { id: unknown }).id === 'string') {
        setConversations((prev) => [d as unknown as Conversation, ...prev]);
      }
    }
  }, []);

  useWebSocket({ token, onMessage: handleWsMessage });

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${showMain && isMobile ? styles.hidden : ''}`}>
        <ConversationListView conversations={conversations} userRole={userRole} currentPath={pathname} />
      </aside>
      <main className={`${styles.main} ${!showMain && isMobile ? styles.hidden : ''}`}>{children}</main>
    </div>
  );
}
