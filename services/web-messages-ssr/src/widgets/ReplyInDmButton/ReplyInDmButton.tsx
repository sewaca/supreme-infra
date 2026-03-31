'use client';

import ReplyIcon from '@mui/icons-material/Reply';
import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createDirectConversation } from '../../../app/messages/actions';

interface Props {
  ownerId: string;
}

export function ReplyInDmButton({ ownerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    const result = await createDirectConversation(ownerId);
    if (result.success && result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
    setLoading(false);
  }, [ownerId, router]);

  return (
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
      <Button variant="outlined" startIcon={<ReplyIcon />} onClick={handleClick} disabled={loading}>
        Ответить в ЛС
      </Button>
    </Box>
  );
}
