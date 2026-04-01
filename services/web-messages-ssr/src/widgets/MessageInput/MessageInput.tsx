'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import { Box, Chip, IconButton, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadedFile } from '../../../app/messages/actions';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';

interface Props {
  onSend: (content: string, uploadedFiles?: UploadedFile[]) => Promise<{ success: boolean; error?: string }>;
  conversationId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — sync content with editing message
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      setPendingFiles([]);
      setTimeout(() => textFieldRef.current?.focus(), 0);
    } else {
      setContent('');
    }
  }, [editingMessage?.id]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending) return;

    setSending(true);
    setUploadError(null);

    let uploadedFiles: UploadedFile[] | undefined;
    if (!editingMessage && pendingFiles.length > 0) {
      const formData = new FormData();
      for (const f of pendingFiles) formData.append('files', f);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        const retryAfter = res.headers.get('Retry-After');
        setUploadError(
          retryAfter
            ? `Слишком много загрузок. Повторите через ${retryAfter} сек.`
            : (data.detail ?? 'Ошибка загрузки файла'),
        );
        setSending(false);
        return;
      }

      uploadedFiles = data.files as UploadedFile[];
    }

    const result = await onSend(trimmed, uploadedFiles);
    if (result.success) {
      setContent('');
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setSending(false);
    textFieldRef.current?.focus();
  }, [content, pendingFiles, sending, editingMessage, onSend]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError(null);
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (content.trim().length > 0 || pendingFiles.length > 0) && !sending;

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

      {/* Pending files */}
      {pendingFiles.length > 0 && !editingMessage && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1.5, pt: 0.75 }}>
          {pendingFiles.map((f, i) => (
            <Chip
              key={`${f.name}-${f.size}-${i.toString(16)}`}
              icon={<InsertDriveFileIcon fontSize="small" />}
              label={`${f.name} · ${formatSize(f.size)}`}
              size="small"
              onDelete={() => removeFile(i)}
              sx={{ maxWidth: 240 }}
            />
          ))}
        </Box>
      )}

      {/* Upload error */}
      {uploadError && (
        <Typography variant="caption" color="error" sx={{ px: 1.5, pt: 0.5, display: 'block' }}>
          {uploadError}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1 }}>
        {!editingMessage && (
          <>
            <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={sending}>
              <AttachFileIcon fontSize="small" />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            />
          </>
        )}
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
        <IconButton color="primary" onClick={handleSend} disabled={!canSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
