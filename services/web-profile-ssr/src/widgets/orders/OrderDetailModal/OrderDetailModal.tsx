'use client';

import { ArrowForwardIos } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { isDeeplink } from '@supreme-int/lib/src/deeplink';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import type { Order } from 'services/web-profile-ssr/src/entities/Order/Order';
import { handleDeeplink } from 'services/web-profile-ssr/src/shared/deeplinks';
import { AlertMessage } from '../../AlertMessage/AlertMessage';

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
};

export const OrderDetailModal = ({ order, open, onClose }: Props) => {
  const router = useRouter();
  const [alert, setAlert] = useState<ReactNode>(null);

  if (!order) return null;

  const handleActionClick = async (action?: string) => {
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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ backgroundColor: 'background.paper' }}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{i18n('Информация о приказе')}</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {order.notifications && order.notifications.length > 0 && (
              <Stack spacing={1}>
                {order.notifications.map((notification) => (
                  <Alert
                    key={notification.message}
                    severity={notification.severity}
                    slotProps={{ message: { sx: { width: '100%' } }, action: { sx: { paddingTop: 0 } } }}
                    sx={{ cursor: notification.action ? 'pointer' : 'default' }}
                    onClick={() => handleActionClick(notification.action)}
                    action={notification.action && <ArrowForwardIos fontSize="inherit" sx={{ margin: 'auto 0' }} />}
                  >
                    <span>{notification.message}</span>
                  </Alert>
                ))}
              </Stack>
            )}

            <Stack direction="column" spacing={2}>
              <div>
                <Typography variant="caption" color="secondary" component="p">
                  {i18n('Название приказа')}
                </Typography>
                <Typography variant="body2" component="p">
                  {order.title}
                </Typography>
              </div>

              <div>
                <Typography variant="caption" color="secondary" component="p">
                  {i18n('Номер приказа')}
                </Typography>
                <Typography variant="body2" component="p">
                  {order.number}
                </Typography>
              </div>

              <div>
                <Typography variant="caption" color="secondary" component="p">
                  {i18n('Дата приказа')}
                </Typography>
                <Typography variant="body2" component="p">
                  {order.date}
                </Typography>
              </div>

              {order.additionalFields &&
                Object.entries(order.additionalFields).map(([key, value]) => (
                  <div key={key}>
                    <Typography variant="caption" color="secondary" component="p">
                      {i18n(key)}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ whiteSpace: 'pre-line' }}>
                      {value}
                    </Typography>
                  </div>
                ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          {order.actions?.secondary && (
            <Button variant="outlined" onClick={() => handleActionClick(order.actions?.secondary?.action)} fullWidth>
              {order.actions.secondary.title}
            </Button>
          )}
          {order.actions?.primary && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleActionClick(order.actions?.primary?.action)}
              fullWidth
            >
              {order.actions.primary.title}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {alert}
    </>
  );
};
