'use client';

import { ArrowForwardIos } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
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

  const handleDownloadPdf = () => {
    if (order.pdfUrl) {
      window.open(order.pdfUrl, '_blank');
    }
  };

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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                    onClick={() => handleNotificationClick(notification.action)}
                    action={notification.action && <ArrowForwardIos fontSize="inherit" sx={{ margin: 'auto 0' }} />}
                  >
                    <span>{notification.message}</span>
                  </Alert>
                ))}
              </Stack>
            )}

            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Номер приказа')}
                  </TableCell>
                  <TableCell>{order.number}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Название приказа')}
                  </TableCell>
                  <TableCell>{order.title}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Дата приказа')}
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Комментарий')}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-line' }}>{order.comment}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Дата начала действия')}
                  </TableCell>
                  <TableCell>{order.startDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Дата окончания действия')}
                  </TableCell>
                  <TableCell>{order.endDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Форма обучения')}
                  </TableCell>
                  <TableCell>{order.educationForm}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Тип обучения')}
                  </TableCell>
                  <TableCell>{order.educationType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Направление/Специальность')}
                  </TableCell>
                  <TableCell>{order.direction}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Факультет')}
                  </TableCell>
                  <TableCell>{order.faculty}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Курс')}
                  </TableCell>
                  <TableCell>{order.course}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Группа')}
                  </TableCell>
                  <TableCell>{order.group}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    {i18n('Квалификация')}
                  </TableCell>
                  <TableCell>{order.qualification}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {order.pdfUrl && (
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadPdf} fullWidth>
                {i18n('Скачать приказ в PDF')}
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      {alert}
    </>
  );
};
