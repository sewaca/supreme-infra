'use client';

import { Button, Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { revokeSession } from 'services/web-profile-ssr/app/profile/settings/actions';

export type SessionInfo = {
  id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_current: boolean;
};

type Props = {
  sessions: SessionInfo[];
};

export const SessionsSection = ({ sessions }: Props) => {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return null;
  }

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    await revokeSession(sessionId);
    setRevokingId(null);
    router.refresh();
  };

  return (
    <>
      <Typography variant="h3">{i18n('Активные сессии')}</Typography>
      <List disablePadding>
        {sessions.map((session) => (
          <ListItem
            key={session.id}
            disableGutters
            secondaryAction={
              session.is_current ? (
                <Chip label={i18n('Текущая')} size="small" color="primary" />
              ) : (
                <Button
                  size="small"
                  color="error"
                  disabled={revokingId === session.id}
                  onClick={() => handleRevoke(session.id)}
                >
                  {i18n('Завершить')}
                </Button>
              )
            }
          >
            <ListItemText
              primary={session.user_agent ?? i18n('Неизвестное устройство')}
              secondary={[new Date(session.created_at).toLocaleString('ru'), session.ip_address]
                .filter(Boolean)
                .join(' · ')}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
