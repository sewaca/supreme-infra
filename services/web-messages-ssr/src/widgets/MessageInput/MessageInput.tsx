'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';

interface Props {
  onSend: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string }>;
  conversationId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({ onSend, conversationId: _conversationId, replyTo, onCancelReply }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await onSend(trimmed);
    if (result.success) {
      setContent('');
    }
    setSending(false);
  }, [content, sending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // TODO: upload files via /files/upload endpoint
  };

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {replyTo && (
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

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, p: 1 }}>
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
          fullWidth
          multiline
          maxRows={5}
          size="small"
          placeholder="Напишите сообщение..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!content.trim() || sending}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
