'use client';

import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { useState } from 'react';
import { changeEmail, sendEmailConfirmationCode } from '../../../app/profile/settings/actions';

type ChangeEmailModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'email' | 'code' | 'success';

export const ChangeEmailModal = ({ open, onClose }: ChangeEmailModalProps) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSendCode = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await sendEmailConfirmationCode(email);
      if (result.success) {
        setStep('code');
      } else {
        setError(result.error || i18n('Произошла ошибка'));
      }
    } catch {
      setError(i18n('Произошла ошибка при отправке кода'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await changeEmail(email, code);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || i18n('Произошла ошибка'));
      }
    } catch {
      setError(i18n('Произошла ошибка при изменении email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'email' && i18n('Изменить email')}
        {step === 'code' && i18n('Подтверждение email')}
        {step === 'success' && i18n('Email изменён')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {step === 'email' && (
            <TextField
              label={i18n('Новый email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoFocus
              disabled={loading}
            />
          )}

          {step === 'code' && (
            <>
              <Alert severity="info">{i18n('Код подтверждения отправлен на {{email}}', { email })}</Alert>
              <TextField
                label={i18n('Код подтверждения')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
                autoFocus
                disabled={loading}
                inputProps={{ maxLength: 6 }}
              />
            </>
          )}

          {step === 'success' && <Alert severity="success">{i18n('Email успешно изменён на {{email}}', { email })}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        {step === 'email' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              {i18n('Отмена')}
            </Button>
            <Button onClick={handleSendCode} variant="contained" disabled={!email || loading}>
              {loading ? <CircularProgress size={24} /> : i18n('Далее')}
            </Button>
          </>
        )}

        {step === 'code' && (
          <>
            <Button onClick={() => setStep('email')} disabled={loading}>
              {i18n('Назад')}
            </Button>
            <Button onClick={handleConfirm} variant="contained" disabled={code.length !== 6 || loading}>
              {loading ? <CircularProgress size={24} /> : i18n('Подтвердить')}
            </Button>
          </>
        )}

        {step === 'success' && (
          <Button onClick={handleClose} variant="contained">
            {i18n('Закрыть')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
