'use client';

import { ArrowForwardIos } from '@mui/icons-material';
import { Alert, Stack } from '@mui/material';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { isDeeplink } from '@supreme-int/lib/src/deeplink';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { Notification } from '../../entities/Notifications/Notifications';
import { handleDeeplink } from '../../shared/deeplinks';
import { AlertMessage } from '../AlertMessage/AlertMessage';

type Props = {
  notifications: Notification[];
};

export const NotificationsStack = ({ notifications }: Props) => {
  const router = useRouter();
  const [alert, setAlert] = useState<ReactNode>(null);

  const handleNotificationClick = async (action?: string) => {
    if (!action) return;

    if (!isDeeplink(action)) return router.push(action);

    const result = await handleDeeplink(action).catch(() => false);
    setAlert(
      <AlertMessage
        setAlert={setAlert}
        severity={result ? 'success' : 'error'}
        title={i18n(result ? 'Успешно!' : 'Что-то пошло не так. Попробуйте позже')}
      />,
    );
  };

  return (
    <>
      <Stack direction="column" gap={1}>
        {notifications.map((notification) => (
          <Alert
            key={`${notification.message}-${notification.action}`}
            severity={notification.severity}
            slotProps={{ message: { sx: { width: '100%' } }, action: { sx: { paddingTop: 0 } } }}
            sx={{ cursor: notification.action ? 'pointer' : 'default' }}
            onClick={() => handleNotificationClick(notification.action)}
            action={notification.action && <ArrowForwardIos fontSize="inherit" sx={{ margin: 'auto 0' }} />}
          >
            <span>{notification.message}</span>
          </Alert>
        ))}
      </Stack>
      {alert}
    </>
  );
};
