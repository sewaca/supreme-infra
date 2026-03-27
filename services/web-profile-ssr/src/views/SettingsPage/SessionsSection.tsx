'use client';

import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
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
  location: string | null;
  device: string | null;
  is_current: boolean;
};

type Props = {
  sessions: SessionInfo[];
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return i18n('Неизвестное устройство');

  let browser = '';
  if (/YaBrowser\//.test(ua)) browser = 'Yandex Browser';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  let os = '';
  if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  if (browser && os) return `${browser} · ${os}`;
  return browser || os || i18n('Неизвестное устройство');
}

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
      <Box sx={{ overflowX: 'auto', width: '100%', mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{i18n('Устройство')}</TableCell>
              <TableCell>{i18n('Откуда')}</TableCell>
              <TableCell>{i18n('Вход')}</TableCell>
              <TableCell>{i18n('Истекает')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id} sx={{ backgroundColor: session.is_current ? '#e8eaf6' : undefined }}>
                <TableCell>
                  {session.device ?? parseUserAgent(session.user_agent)}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{session.location ?? '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(session.created_at).toLocaleString('ru')}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {session.expires_at ? new Date(session.expires_at).toLocaleString('ru') : '—'}
                </TableCell>
                <TableCell align="right">
                  {session.is_current ? (
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                      {i18n('Текущая')}
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      color="error"
                      disabled={revokingId === session.id}
                      onClick={() => handleRevoke(session.id)}
                    >
                      {i18n('Завершить')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
};
