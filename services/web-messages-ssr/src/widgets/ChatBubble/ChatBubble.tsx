'use client';

import { Avatar, Box, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';
import { FileAttachment } from '../FileAttachment/FileAttachment';
import { type MessageAction, MessageContextMenu } from '../MessageContextMenu/MessageContextMenu';
import styles from './ChatBubble.module.css';
import cx from 'classnames';

const SWIPE_THRESHOLD = 50;
const SWIPE_MAX = 68;

interface Props {
  message: Message;
  isOwn: boolean;
  canReplyInDm?: boolean;
  onAction?: (action: MessageAction, message: Message) => void;
  onScrollToMessage?: (messageId: string) => void;
  /** Ответ: двойной клик (desktop) или свайп влево (touch) */
  onDoubleClickReply?: () => void;
  /** Скрыть аватарку (для сгруппированных сообщений — аватар рендерится снаружи) */
  showAvatar?: boolean;
  /** Убрать max-width wrapper (когда ограничение задаётся снаружи группой) */
  noMaxWidth?: boolean;
  /** Первое сообщение в группе — показывать имя отправителя */
  isFirstInGroup?: boolean;
}

export function ChatBubble({
  message,
  isOwn,
  canReplyInDm = false,
  onAction,
  onScrollToMessage,
  onDoubleClickReply,
  showAvatar = true,
  noMaxWidth = false,
  isFirstInGroup = true,
}: Props) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipingRef = useRef(false);
  const swipeTriggeredRef = useRef(false);

  const openMenu = (top: number, left: number) => setMenuPos({ top, left });
  const closeMenu = () => setMenuPos(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientY, e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      longPressTimer.current = setTimeout(() => openMenu(e.clientY, e.clientX), 500);
    }
  };

  const handlePointerUp = () => clearTimeout(longPressTimer.current);

  // Swipe-to-reply (touch only, left swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    swipeTriggeredRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeTriggeredRef.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwipingRef.current) {
      // Ignore if primarily vertical (scroll) or rightward
      if (Math.abs(dx) < Math.abs(dy) || dx >= 0) return;
      isSwipingRef.current = true;
      clearTimeout(longPressTimer.current);
    }

    const offset = Math.max(dx, -SWIPE_MAX);
    setSwipeOffset(offset);

    if (offset <= -SWIPE_THRESHOLD) {
      swipeTriggeredRef.current = true;
      onDoubleClickReply?.();
      navigator.vibrate?.(8);
    }
  };

  const handleTouchEnd = () => {
    isSwipingRef.current = false;
    setSwipeOffset(0);
  };

  const handleAction = (action: MessageAction) => onAction?.(action, message);

  const isSwiping = swipeOffset !== 0;

  return (
    <Box
      className={cx(styles.wrapper, { [styles.own]: isOwn, [styles.other]: !isOwn, [styles.noMaxWidth]: noMaxWidth })}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={onDoubleClickReply ? handleTouchStart : undefined}
      onTouchMove={onDoubleClickReply ? handleTouchMove : undefined}
      onTouchEnd={onDoubleClickReply ? handleTouchEnd : undefined}
      sx={{
        transform: isSwiping ? `translateX(${swipeOffset}px)` : undefined,
        transition: isSwiping ? 'none' : 'transform 0.22s ease-out',
        willChange: isSwiping ? 'transform' : undefined,
        position: 'relative',
      }}
    >
      {!isOwn && showAvatar && (
        <Avatar
          src={message.sender_avatar ?? undefined}
          sx={{
            width: 30,
            height: 30,
            mt: 0.5,
            flexShrink: 0,
            fontSize: '0.8rem',
            fontWeight: 700,
            ...(!message.sender_avatar && {
              background: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
              color: 'rgba(255,255,255,0.9)',
            }),
          }}
        >
          {message.sender_name[0]}
        </Avatar>
      )}

      <Box
        className={cx(styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther)}
        onDoubleClick={(e) => {
          if (!onDoubleClickReply) return;
          e.preventDefault();
          onDoubleClickReply();
        }}
      >
        {!isOwn && isFirstInGroup && (
          <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ display: 'block', mb: 0.25 }}>
            {message.sender_name} {message.sender_last_name}
          </Typography>
        )}

        {/* Reply preview */}
        {message.reply_to_message && (
          <Box
            onClick={() => {
              const id = message.reply_to_message?.id;
              if (id) onScrollToMessage?.(id);
            }}
            sx={{
              mb: 0.5,
              px: 1,
              py: 0.375,
              borderLeft: '3px solid',
              borderColor: isOwn ? 'rgba(255,255,255,0.5)' : 'primary.main',
              bgcolor: isOwn ? 'rgba(0,0,0,0.12)' : 'action.hover',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color={isOwn ? 'rgba(255,255,255,0.85)' : 'primary.main'}
              sx={{ display: 'block' }}
              noWrap
            >
              {message.reply_to_message.sender_name} {message.reply_to_message.sender_last_name}
            </Typography>
            <Typography
              variant="caption"
              color={isOwn ? 'rgba(255,255,255,0.65)' : 'text.secondary'}
              sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {message.reply_to_message.content}
            </Typography>
          </Box>
        )}

        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

        {message.attachments.length > 0 && (
          <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {message.attachments.map((att) => (
              <FileAttachment key={att.id} attachment={att} />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.25 }}>
          {message.is_edited && (
            <Typography variant="caption" color={isOwn ? 'rgba(255,255,255,0.6)' : 'text.disabled'}>
              изм.
            </Typography>
          )}
          <Typography variant="caption" color={isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
            {formatMessageTime(message.created_at)}
          </Typography>
        </Box>
      </Box>

      <MessageContextMenu
        anchorPosition={menuPos}
        isOwn={isOwn}
        canReplyInDm={canReplyInDm}
        onAction={handleAction}
        onClose={closeMenu}
      />
    </Box>
  );
}
