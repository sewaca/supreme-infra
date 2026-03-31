'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatDateSeparator } from '../../shared/lib/formatDate';
import { ChatBubble } from '../ChatBubble/ChatBubble';
import type { MessageAction } from '../MessageContextMenu/MessageContextMenu';
import styles from './MessageList.module.css';

interface Props {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  userId: string;
  canReplyInDm?: boolean;
  editingMessageId?: string | null;
  onAction?: (action: MessageAction, message: Message) => void;
  onEditSubmit?: (messageId: string, content: string) => void;
  onCancelEdit?: () => void;
}

export function MessageList({
  messages,
  hasMore,
  loading,
  onLoadMore,
  userId,
  canReplyInDm = false,
  editingMessageId,
  onAction,
  onEditSubmit,
  onCancelEdit,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialRef = useRef(true);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          if (scrollRef.current) {
            prevScrollHeightRef.current = scrollRef.current.scrollHeight;
          }
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — runs when messages array grows (preserves scroll position after loading older msgs)
  useEffect(() => {
    if (scrollRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop += diff;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  useEffect(() => {
    if (isInitialRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialRef.current = false;
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isInitialRef.current && scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isAtBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length]);

  const reversed = [...messages].reverse();
  let lastDate = '';

  return (
    <Box ref={scrollRef} className={styles.messageList}>
      <Box ref={sentinelRef} sx={{ minHeight: 1 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>

      {reversed.map((msg) => {
        const msgDate = new Date(msg.created_at).toDateString();
        const showDateSeparator = msgDate !== lastDate;
        lastDate = msgDate;

        return (
          <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column' }}>
            {showDateSeparator && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <Typography variant="caption" sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  {formatDateSeparator(msg.created_at)}
                </Typography>
              </Box>
            )}
            <ChatBubble
              message={msg}
              isOwn={msg.sender_id === userId}
              canReplyInDm={canReplyInDm}
              isEditing={editingMessageId === msg.id}
              onAction={onAction}
              onEditSubmit={onEditSubmit}
              onCancelEdit={onCancelEdit}
            />
          </Box>
        );
      })}

      {reversed.length === 0 && (
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">Нет сообщений. Начните переписку!</Typography>
        </Box>
      )}
    </Box>
  );
}
