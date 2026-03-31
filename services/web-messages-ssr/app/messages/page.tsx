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
      <Typography variant="h6" color="text.secondary">
        Выберите чат или начните новую переписку
      </Typography>
      <Button variant="contained" component={Link} href="/messages/new">
        Написать
      </Button>
    </Box>
  );
}
