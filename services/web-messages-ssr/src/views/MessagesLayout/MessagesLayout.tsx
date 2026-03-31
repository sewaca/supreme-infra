'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
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

export function MessagesLayout({ initialConversations, userRole, userId: _userId, token, children }: Props) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);

  const isInChat =
    pathname !== '/messages' &&
    pathname !== '/messages/new' &&
    !pathname.startsWith('/messages/broadcast') &&
    !pathname.startsWith('/messages/search');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 769;

  const handleWsMessage = useCallback((event: any) => {
    if (event.type === 'new_message') {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === event.data.conversation_id
            ? {
                ...c,
                last_message_at: event.data.created_at,
                last_message_preview: event.data.content.slice(0, 200),
                unread_count: event.data.is_own ? c.unread_count : c.unread_count + 1,
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
      <aside className={`${styles.sidebar} ${isInChat && isMobile ? styles.hidden : ''}`}>
        <ConversationListView conversations={conversations} userRole={userRole} currentPath={pathname} />
      </aside>
      <main className={`${styles.main} ${!isInChat && isMobile ? styles.hidden : ''}`}>{children}</main>
    </div>
  );
}
