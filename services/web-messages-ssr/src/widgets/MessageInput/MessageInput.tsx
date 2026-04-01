'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import { Box, CircularProgress, IconButton, LinearProgress, TextField, Typography } from '@mui/material';
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
  onError?: (msg: string) => void;
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
  onError,
}: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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

    let uploadedFiles: UploadedFile[] | undefined;
    if (!editingMessage && pendingFiles.length > 0) {
      const formData = new FormData();
      for (const f of pendingFiles) formData.append('files', f);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        const retryAfter = res.headers.get('Retry-After');
        const errMsg = retryAfter
          ? `Слишком много загрузок. Повторите через ${retryAfter} сек.`
          : (data.detail ?? 'Ошибка загрузки файла');
        onError?.(errMsg);
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
    } else if (result.error) {
      onError?.(result.error);
    }
    setSending(false);
    textFieldRef.current?.focus();
  }, [content, pendingFiles, sending, editingMessage, onSend, onError]);

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
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (content.trim().length > 0 || pendingFiles.length > 0) && !sending;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', position: 'relative' }}>
      {sending && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 1.5, pt: 1 }}>
          {pendingFiles.map((f, i) => (
            <Box
              key={`${f.name}-${f.size}-${i.toString(16)}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                pl: 1,
                pr: 0.25,
                py: 0.5,
                bgcolor: 'action.selected',
                borderRadius: 2,
                maxWidth: 220,
                minWidth: 0,
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
              <Typography
                variant="caption"
                sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {f.name}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, px: 0.5 }}>
                {formatSize(f.size)}
              </Typography>
              <IconButton size="small" onClick={() => removeFile(i)} sx={{ p: 0.25, flexShrink: 0 }}>
                <CloseIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, px: 1, py: 0.75 }}>
        {!editingMessage && (
          <>
            <IconButton onClick={() => fileInputRef.current?.click()} disabled={sending} sx={{ flexShrink: 0 }}>
              <AttachFileIcon />
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
          sx={{ '& .MuiOutlinedInput-root fieldset': { border: 'none' } }}
        />
        <IconButton
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          disabled={!canSend}
          sx={{
            flexShrink: 0,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
            transition: 'background-color 0.15s',
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}
