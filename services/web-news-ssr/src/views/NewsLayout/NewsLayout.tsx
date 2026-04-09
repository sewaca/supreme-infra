'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ApplicationNotificationResponse } from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { ProfileButton } from '../../widgets/ProfileButton/ProfileButton';

type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

function toAlertSeverity(s: string): AlertSeverity {
  if (s === 'warning' || s === 'error' || s === 'success') return s;
  return 'info';
}

interface Props {
  avatar: string | null;
  userName: string;
  unreadMessagesCount: number;
  appNotifications: ApplicationNotificationResponse[];
  children: React.ReactNode;
}

export function NewsLayout({ avatar, userName, unreadMessagesCount, appNotifications, children }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <NavBar
        leftSlot={null}
        center={
          <Typography variant="title1" fontWeight={600}>
            Новости
          </Typography>
        }
        rightSlot={<ProfileButton avatar={avatar} name={userName} />}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {unreadMessagesCount > 0 && (
          <Box component="a" href="/messages" sx={{ display: 'block', textDecoration: 'none', mx: 2, mt: 1.5 }}>
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              Есть непрочитанные сообщения
            </Alert>
          </Box>
        )}
        {appNotifications.map((notification) => {
          const href = notification.action ?? `/applications/${notification.application_id}`;
          return (
            <Box
              key={notification.id}
              component="a"
              href={href}
              sx={{ display: 'block', textDecoration: 'none', mx: 2, mt: 1 }}
            >
              <Alert severity={toAlertSeverity(notification.severity)} sx={{ borderRadius: 1 }}>
                {notification.message}
              </Alert>
            </Box>
          );
        })}
        {children}
      </Box>
    </Box>
  );
}
