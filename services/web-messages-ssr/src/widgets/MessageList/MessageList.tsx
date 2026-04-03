'use client';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Avatar, Box, CircularProgress, Fab, Typography } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatDateSeparator } from '../../shared/lib/formatDate';
import { ChatBubble } from '../ChatBubble/ChatBubble';
import type { MessageAction } from '../MessageContextMenu/MessageContextMenu';
import styles from './MessageList.module.css';

type MessageGroup =
  | { type: 'separator'; date: string; key: string }
  | { type: 'group'; messages: Message[]; isOwn: boolean; key: string };

function buildGroups(messages: Message[], userId: string): MessageGroup[] {
  const result: MessageGroup[] = [];
  let lastDate = '';
  let currentGroup: { messages: Message[]; isOwn: boolean; senderId: string } | null = null;

  const flushGroup = () => {
    if (currentGroup) {
      result.push({
        type: 'group',
        messages: currentGroup.messages,
        isOwn: currentGroup.isOwn,
        key: currentGroup.messages[0].id,
      });
      currentGroup = null;
    }
  };

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    const isOwn = msg.sender_id === userId;

    if (msgDate !== lastDate) {
      flushGroup();
      result.push({ type: 'separator', date: msg.created_at, key: `sep-${msg.id}` });
      lastDate = msgDate;
    }

    if (!currentGroup || currentGroup.senderId !== msg.sender_id) {
      flushGroup();
      currentGroup = { messages: [msg], isOwn, senderId: msg.sender_id };
    } else {
      currentGroup.messages.push(msg);
    }
  }

  flushGroup();
  return result;
}

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
  scrollToBottom: () => void;
}

interface Props {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  userId: string;
  canReplyInDm?: boolean;
  onAction?: (action: MessageAction, message: Message) => void;
  onMessageDoubleClick?: (message: Message) => void;
}

export const MessageList = forwardRef<MessageListHandle, Props>(function MessageList(
  { messages, hasMore, loading, onLoadMore, userId, canReplyInDm = false, onAction, onMessageDoubleClick },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialRef = useRef(true);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  useImperativeHandle(ref, () => ({
    scrollToMessage: (messageId: string) => {
      const el = messageRefs.current.get(messageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background 0.3s';
        el.style.background = 'rgba(26,35,126,0.12)';
        setTimeout(() => {
          el.style.background = '';
        }, 1200);
      }
    },
    scrollToBottom,
  }));

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
  const groups = buildGroups(reversed, userId);

  return (
    <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box ref={scrollRef} className={styles.messageList} onScroll={handleScroll}>
        <Box ref={sentinelRef} sx={{ minHeight: 1 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </Box>

        {groups.map((group) => {
          if (group.type === 'separator') {
            return (
              <Box key={group.key} sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <Typography variant="caption" sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  {formatDateSeparator(group.date)}
                </Typography>
              </Box>
            );
          }

          const { messages: groupMsgs, isOwn } = group;
          const firstMsg = groupMsgs[0];

          if (isOwn) {
            return (
              <Box
                key={group.key}
                sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignSelf: 'flex-end', maxWidth: '75%' }}
              >
                {groupMsgs.map((msg, idx) => (
                  <Box
                    key={msg.id}
                    ref={(el) => {
                      if (el) messageRefs.current.set(msg.id, el as HTMLDivElement);
                      else messageRefs.current.delete(msg.id);
                    }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ChatBubble
                      message={msg}
                      isOwn={true}
                      noMaxWidth={true}
                      isFirstInGroup={idx === 0}
                      canReplyInDm={canReplyInDm}
                      onAction={onAction}
                      onScrollToMessage={(id) => ref && 'current' in ref && ref.current?.scrollToMessage(id)}
                      onDoubleClickReply={onMessageDoubleClick ? () => onMessageDoubleClick(msg) : undefined}
                    />
                  </Box>
                ))}
              </Box>
            );
          }

          // Other sender — sticky avatar beside the message group
          return (
            <Box
              key={group.key}
              sx={{ display: 'flex', gap: '6px', alignSelf: 'flex-start', alignItems: 'flex-end', maxWidth: '75%' }}
            >
              <Avatar
                src={firstMsg.sender_avatar ?? undefined}
                sx={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  position: 'sticky',
                  bottom: 8,
                  alignSelf: 'flex-end',
                  ...(!firstMsg.sender_avatar && {
                    background: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
                    color: 'rgba(255,255,255,0.9)',
                  }),
                }}
              >
                {firstMsg.sender_name[0]}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                {groupMsgs.map((msg, idx) => (
                  <Box
                    key={msg.id}
                    ref={(el) => {
                      if (el) messageRefs.current.set(msg.id, el as HTMLDivElement);
                      else messageRefs.current.delete(msg.id);
                    }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ChatBubble
                      message={msg}
                      isOwn={false}
                      showAvatar={false}
                      noMaxWidth={true}
                      isFirstInGroup={idx === 0}
                      canReplyInDm={canReplyInDm}
                      onAction={onAction}
                      onScrollToMessage={(id) => ref && 'current' in ref && ref.current?.scrollToMessage(id)}
                      onDoubleClickReply={onMessageDoubleClick ? () => onMessageDoubleClick(msg) : undefined}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}

        {reversed.length === 0 && (
          <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Нет сообщений. Начните переписку!</Typography>
          </Box>
        )}
      </Box>

      {showScrollButton && (
        <Fab size="small" onClick={scrollToBottom} sx={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10 }}>
          <KeyboardArrowDownIcon />
        </Fab>
      )}
    </Box>
  );
});
