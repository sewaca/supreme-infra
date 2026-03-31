'use client';

import { Avatar, Box, TextField, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';
import { FileAttachment } from '../FileAttachment/FileAttachment';
import { type MessageAction, MessageContextMenu } from '../MessageContextMenu/MessageContextMenu';
import styles from './ChatBubble.module.css';

interface Props {
  message: Message;
  isOwn: boolean;
  canReplyInDm?: boolean;
  isEditing?: boolean;
  onAction?: (action: MessageAction, message: Message) => void;
  onEditSubmit?: (messageId: string, content: string) => void;
  onCancelEdit?: () => void;
}

export function ChatBubble({
  message,
  isOwn,
  canReplyInDm = false,
  isEditing = false,
  onAction,
  onEditSubmit,
  onCancelEdit,
}: Props) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [editContent, setEditContent] = useState(message.content);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const openMenu = (top: number, left: number) => setMenuPos({ top, left });
  const closeMenu = () => setMenuPos(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientY, e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      longPressTimer.current = setTimeout(() => {
        openMenu(e.clientY, e.clientX);
      }, 500);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleAction = (action: MessageAction) => {
    onAction?.(action, message);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editContent.trim()) {
        onEditSubmit?.(message.id, editContent.trim());
      }
    }
    if (e.key === 'Escape') {
      onCancelEdit?.();
    }
  };

  return (
    <Box
      className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {!isOwn && (
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

      <Box className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
        {!isOwn && (
          <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ display: 'block', mb: 0.25 }}>
            {message.sender_name} {message.sender_last_name}
          </Typography>
        )}

        {isEditing ? (
          <TextField
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleEditKeyDown}
            multiline
            fullWidth
            autoFocus
            size="small"
            variant="standard"
            slotProps={{
              input: {
                sx: { color: isOwn ? '#fff' : 'inherit', fontSize: '0.875rem' },
              },
            }}
            sx={{ '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.5)' } }}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        )}

        {!isEditing && message.attachments.length > 0 && (
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
