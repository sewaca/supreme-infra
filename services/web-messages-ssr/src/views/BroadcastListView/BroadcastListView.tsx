'use client';

import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import { Box, Button, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { formatMessageDate } from '../../shared/lib/formatDate';

interface Props {
  broadcasts: Conversation[];
}

export function BroadcastListView({ broadcasts }: Props) {
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Рассылки</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/messages/broadcast/new"
          size="small"
        >
          Создать
        </Button>
      </Box>

      {broadcasts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">Нет рассылок. Создайте первую!</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {broadcasts.map((broadcast) => (
            <ListItemButton
              key={broadcast.id}
              component={Link}
              href={`/messages/${broadcast.id}`}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon>
                <CampaignIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={broadcast.title ?? 'Рассылка'}
                secondary={
                  broadcast.last_message_at
                    ? `${broadcast.last_message_preview ?? ''} · ${formatMessageDate(broadcast.last_message_at)}`
                    : `${broadcast.participant_count} участников`
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
