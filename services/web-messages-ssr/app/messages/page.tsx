'use client';

import ChatIcon from '@mui/icons-material/Chat';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';

export default function MessagesPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
      }}
    >
      <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
      <Typography variant="body2" color="text.secondary">
        Выберите чат или начните новую переписку
      </Typography>
      <Button variant="outlined" component={Link} href="/messages/new" size="small">
        Написать
      </Button>
    </Box>
  );
}
