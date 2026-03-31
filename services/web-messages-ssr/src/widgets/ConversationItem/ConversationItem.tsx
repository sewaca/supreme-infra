'use client';

import CampaignIcon from '@mui/icons-material/Campaign';
import { Avatar, Badge, Box, ListItemButton, Typography } from '@mui/material';
import Link from 'next/link';
import type { Conversation } from '../../entities/Conversation/types';
import { formatMessageDate } from '../../shared/lib/formatDate';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string | null;
}

export function ConversationItem({ conversation, isActive, currentUserId }: Props) {
  const { type, participants, title, last_message_at, last_message_preview, unread_count, peer_display_name } =
    conversation;

  const directPeer =
    type === 'direct'
      ? currentUserId
        ? participants.find((p) => p.user_id !== currentUserId)
        : participants[0]
      : undefined;

  const displayName =
    type === 'broadcast'
      ? (title ?? 'Рассылка')
      : peer_display_name?.trim()
        ? peer_display_name.trim()
        : directPeer
          ? `${directPeer.name} ${directPeer.last_name}`.trim()
          : participants[0]
            ? `${participants[0].name} ${participants[0].last_name}`.trim()
            : 'Неизвестный';

  const avatar = type === 'direct' ? (directPeer?.avatar ?? participants[0]?.avatar) : null;
  const initials =
    type === 'broadcast'
      ? 'Р'
      : directPeer
        ? `${directPeer.name[0] ?? ''}${directPeer.last_name[0] ?? ''}`
        : participants[0]
          ? `${participants[0].name[0]}${participants[0].last_name[0]}`
          : '?';

  return (
    <ListItemButton
      component={Link}
      href={`/messages/${conversation.id}`}
      selected={isActive}
      sx={{ px: 1.5, py: 1, gap: 1 }}
    >
      <Badge badgeContent={unread_count} color="primary" invisible={unread_count === 0} overlap="circular">
        <Avatar
          src={avatar ?? undefined}
          sx={{
            width: 40,
            height: 40,
            fontSize: '0.875rem',
            fontWeight: 700,
            ...(!avatar && {
              background: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
              color: 'rgba(255,255,255,0.9)',
            }),
          }}
        >
          {type === 'broadcast' ? <CampaignIcon fontSize="small" /> : initials}
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
