'use client';

import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createDirectConversation } from '../../../app/messages/actions';
import type { Message } from '../../entities/Message/types';

interface Props {
  ownerId: string;
  replyTo?: Message | null;
  onClearReply?: () => void;
}

export function ReplyInDmButton({ ownerId, replyTo, onClearReply }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    const result = await createDirectConversation(ownerId);
    if (result.success && result.conversationId) {
      if (replyTo) {
        sessionStorage.setItem(`pending_reply_${result.conversationId}`, JSON.stringify(replyTo));
      }
      router.push(`/messages/${result.conversationId}`);
    }
    setLoading(false);
  }, [ownerId, replyTo, router]);

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
          <ReplyIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="primary.main" noWrap>
              {replyTo.sender_name} {replyTo.sender_last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClearReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Button variant="outlined" startIcon={<ReplyIcon />} onClick={handleClick} disabled={loading}>
          Ответить в ЛС
        </Button>
      </Box>
    </Box>
  );
}
