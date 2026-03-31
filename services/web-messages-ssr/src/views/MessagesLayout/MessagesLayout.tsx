'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation } from '../../entities/Conversation/types';
import { useWebSocket } from '../../shared/hooks/useWebSocket';
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
    window.addEventListener('conversation-updated' as any, handler);
    return () => window.removeEventListener('conversation-updated' as any, handler);
  }, [updateConversation]);

  const handleWsMessage = useCallback((event: any) => {
    if (event.type === 'new_message') {
      const isOwn = event.data.sender_id === userIdRef.current;
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === event.data.conversation_id
            ? {
                ...c,
                last_message_at: event.data.created_at,
                last_message_preview: event.data.content.slice(0, 200),
                unread_count: isOwn ? c.unread_count : c.unread_count + 1,
              }
            : c,
        );
        return updated.sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''));
      });
    }
    if (event.type === 'new_conversation') {
      setConversations((prev) => [event.data, ...prev]);
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
