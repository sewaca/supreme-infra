'use client';

import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, List, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { ConversationItem } from '../../widgets/ConversationItem/ConversationItem';

interface Props {
  conversations: Conversation[];
  userRole: string | null;
  currentPath: string;
}

export function ConversationListView({ conversations, userRole, currentPath }: Props) {
  const activeId = currentPath.startsWith('/messages/') ? currentPath.split('/')[2] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Сообщения
        </Typography>
        <Box>
          <IconButton component={Link} href="/messages/search" size="small">
            <SearchIcon />
          </IconButton>
          <IconButton component={Link} href="/messages/new" size="small">
            <AddIcon />
          </IconButton>
          {userRole === 'teacher' && (
            <IconButton component={Link} href="/messages/broadcast" size="small">
              <CampaignIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Нет чатов</Typography>
          </Box>
        ) : (
          conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === activeId} />
          ))
        )}
      </List>
    </Box>
  );
}
