'use client';

import { ArrowForwardIos } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { isDeeplink } from '@supreme-int/lib/src/deeplink';
import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import type { Order } from 'services/web-profile-ssr/src/entities/Order/Order';
import { handleDeeplink } from 'services/web-profile-ssr/src/shared/deeplinks';
import { AlertMessage } from '../../AlertMessage/AlertMessage';
import { DefaultNavbar } from '../../DefaultNavbar/DefaultNavbar';

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
};

export const OrderDetailModal = ({ order, open, onClose }: Props) => {
  const router = useRouter();
  const [alert, setAlert] = useState<ReactNode>(null);

  const isMobile = useMediaQuery('(max-width: 600px)');
  const hasActions = !!(order?.actions?.primary || order?.actions?.secondary);

  const dialogProps = useMemo<Partial<DialogProps>>(
    () => (isMobile ? { fullScreen: true } : { fullWidth: true, maxWidth: 'md' }),
    [isMobile],
  );

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
      <Dialog
        open={open}
        onClose={onClose}
        {...dialogProps}
        slotProps={{ paper: { sx: { backgroundColor: 'var(--color-background)' } } }}
      >
        <DialogTitle sx={{ padding: 0, paddingBottom: 2 }}>
          <DefaultNavbar
            onClose={onClose}
            center={<Typography variant="title1">{i18n('Информация о приказе')}</Typography>}
          />
        </DialogTitle>
        <DialogContent>
          {!order ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
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
          )}
        </DialogContent>
        {hasActions && (
          <DialogActions sx={{ paddingX: 3, paddingY: 2 }}>
            {order?.actions?.secondary && (
              <Button variant="outlined" onClick={() => handleActionClick(order.actions?.secondary?.action)} fullWidth>
                {order.actions.secondary.title}
              </Button>
            )}
            {order?.actions?.primary && (
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
        )}
      </Dialog>
      {alert}
    </>
  );
};
