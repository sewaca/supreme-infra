'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, TextField } from '@mui/material';
import { useCallback, useRef, useState } from 'react';

interface Props {
  onSend: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string }>;
  conversationId: string; // reserved for future typing indicator
}

export function MessageInput({ onSend, conversationId: _conversationId }: Props) {
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

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // TODO: upload files via /files/upload endpoint, then send message with attachment IDs
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <IconButton size="small" onClick={handleFileClick}>
        <AttachFileIcon />
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
  );
}
