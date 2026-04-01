'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';

interface Props {
  onSend: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string }>;
  conversationId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

export function MessageInput({
  onSend,
  conversationId: _conversationId,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  // Pre-fill content and focus when entering edit mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — sync content with editing message
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      setTimeout(() => textFieldRef.current?.focus(), 0);
    } else {
      setContent('');
    }
  }, [editingMessage?.id]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await onSend(trimmed);
    if (result.success) {
      setContent('');
    }
    setSending(false);
    textFieldRef.current?.focus();
  }, [content, sending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === 'Escape' && editingMessage) {
        onCancelEdit?.();
      }
    },
    [handleSend, editingMessage, onCancelEdit],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // TODO: upload files via /files/upload endpoint
  };

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {/* Editing bar */}
      {editingMessage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            bgcolor: 'action.hover',
            borderLeft: '3px solid',
            borderColor: 'warning.main',
          }}
        >
          <EditIcon fontSize="small" sx={{ color: 'warning.main', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="warning.main" noWrap>
              Редактирование
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {editingMessage.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelEdit}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Reply bar */}
      {replyTo && !editingMessage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            bgcolor: 'action.hover',
            borderLeft: '3px solid',
            borderColor: 'primary.main',
          }}
        >
          <ReplyIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="primary.main" noWrap>
              {replyTo.sender_name} {replyTo.sender_last_name}, {formatMessageTime(replyTo.created_at)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1 }}>
        <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
          <AttachFileIcon fontSize="small" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        />
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          maxRows={5}
          size="small"
          placeholder="Напишите сообщение..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!content.trim() || sending}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
