'use client';

import CampaignIcon from '@mui/icons-material/Campaign';
import { Avatar, Badge, Box, ListItemButton, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { formatMessageDate } from '../../shared/lib/formatDate';

interface Props {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationItem({ conversation, isActive }: Props) {
  const { type, participants, title, last_message_at, last_message_preview, unread_count } = conversation;

  const displayName =
    type === 'broadcast'
      ? (title ?? 'Рассылка')
      : participants[0]
        ? `${participants[0].name} ${participants[0].last_name}`
        : 'Неизвестный';

  const avatar = type === 'direct' ? participants[0]?.avatar : null;
  const initials =
    type === 'broadcast' ? 'Р' : participants[0] ? `${participants[0].name[0]}${participants[0].last_name[0]}` : '?';

  return (
    <ListItemButton
      component={Link}
      href={`/messages/${conversation.id}`}
      selected={isActive}
      sx={{ px: 2, py: 1.5, gap: 1.5 }}
    >
      <Badge badgeContent={unread_count} color="primary" invisible={unread_count === 0} overlap="circular">
        <Avatar src={avatar ?? undefined} sx={{ width: 48, height: 48 }}>
          {type === 'broadcast' ? <CampaignIcon /> : initials}
        </Avatar>
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="subtitle2" noWrap fontWeight={unread_count > 0 ? 700 : 500}>
            {displayName}
          </Typography>
          {last_message_at && (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
              {formatMessageDate(last_message_at)}
            </Typography>
          )}
        </Box>
        {last_message_preview && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {last_message_preview}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
}
