'use client';

import { LocationOnOutlined } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { type ReactNode, useMemo, useState } from 'react';
import { cancelReference, extendStorage } from 'services/web-profile-ssr/app/profile/references/actions';
import { REFERENCE_STATUS_LABELS } from 'services/web-profile-ssr/src/entities/Reference/constants';
import { WORKING_HOURS } from 'services/web-profile-ssr/src/entities/Reference/pickupPoints';
import type { OrderedReference } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { REFERENCE_STATUS } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { AlertMessage } from '../../AlertMessage/AlertMessage';

type Props = { reference: OrderedReference | null; open: boolean; onClose: () => void; onSuccess: () => void };

export const ReferenceDetailModal = ({ reference, open, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ReactNode>(null);

  const extendState = useMemo(() => {
    if (!reference?.storageUntil) return { showExtendButton: false };
    if (reference.status !== REFERENCE_STATUS.PENDING) return { showExtendButton: false };

    const [day, month, year] = reference.storageUntil.split('.').map(Number);
    const storageDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    storageDate.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((storageDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return { showExtendButton: daysUntilExpiry <= 3 };
  }, [reference]);

  if (!reference) return null;

  const statusLabel = REFERENCE_STATUS_LABELS[reference.status] ?? reference.status;
  const canCancel = reference.status === REFERENCE_STATUS.PREPARATION;
  const canViewPdf = !!reference.pdfUrl;

  const handleCancel = async () => {
    setAlert(null);
    setLoading(true);
    try {
      const result = await cancelReference(reference.id);
      if (result.success) {
        setAlert(<AlertMessage severity="success" title={i18n('Заказ отменён')} setAlert={setAlert} />);
        onSuccess();
        onClose();
      } else {
        setAlert(<AlertMessage severity="error" title={result.error ?? i18n('Ошибка отмены')} setAlert={setAlert} />);
      }
    } catch {
      setAlert(<AlertMessage severity="error" title={i18n('Ошибка отмены')} setAlert={setAlert} />);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    setAlert(null);
    setLoading(true);
    try {
      const result = await extendStorage(reference.id);
      if (result.success) {
        setAlert(<AlertMessage severity="success" title={i18n('Срок хранения продлён')} setAlert={setAlert} />);
        onSuccess();
        onClose();
      } else {
        setAlert(
          <AlertMessage severity="error" title={result.error ?? i18n('Ошибка продления')} setAlert={setAlert} />,
        );
      }
    } catch {
      setAlert(<AlertMessage severity="error" title={i18n('Ошибка продления')} setAlert={setAlert} />);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (reference.pdfUrl) window.open(reference.pdfUrl, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ paddingX: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {reference.typeLabel}
        <IconButton aria-label={i18n('Закрыть')} onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ paddingX: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            <strong>{i18n('Дата заказа')}</strong>: {reference.orderDate}
          </Typography>

          <Typography variant="body2">
            <strong>{i18n('Статус')}</strong>: {statusLabel}
          </Typography>

          {reference.virtualOnly && <Typography variant="body2">{i18n('Только виртуальная справка')}</Typography>}

          {reference.storageUntil && (
            <Row justifyContent="space-between" flexWrap="wrap">
              <Typography variant="body2">
                <strong>{i18n('Хранится до')}</strong>: {reference.storageUntil}
              </Typography>
              {extendState.showExtendButton && (
                <div style={{ height: 20, display: 'flex', alignItems: 'center' }}>
                  <Button size="small" variant="outlined" onClick={handleExtend} disabled={loading}>
                    {i18n('Продлить')}
                  </Button>
                </div>
              )}
            </Row>
          )}
        </Stack>
        <Spacer size={10} />

        {reference.pickupPoint && reference.status === REFERENCE_STATUS.READY && (
          <Alert
            variant="outlined"
            severity="info"
            icon={<LocationOnOutlined />}
            sx={{ '& .MuiAlert-icon': { mr: '4px' } }}
          >
            <Typography variant="body2" component="div">
              {reference.pickupPoint.name}
              <br />
              {reference.pickupPoint.address}, {reference.pickupPoint.room}, {WORKING_HOURS}
            </Typography>
          </Alert>
        )}

        <Spacer size={10} />

        {canViewPdf && (
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPdf} fullWidth>
            {i18n('Скачать PDF')}
          </Button>
        )}
      </DialogContent>

      {canCancel && (
        <DialogActions>
          <Button color="error" onClick={handleCancel} disabled={loading}>
            {i18n('Отменить заказ')}
          </Button>
        </DialogActions>
      )}
      {alert}
    </Dialog>
  );
};
