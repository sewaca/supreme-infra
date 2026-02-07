'use client';

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { useState } from 'react';
import { changePassword, sendPasswordConfirmationCode } from '../../../app/profile/settings/actions';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'password' | 'code' | 'success';

export const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const [step, setStep] = useState<Step>('password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setStep('password');
    setNewPassword('');
    setConfirmPassword('');
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

    if (newPassword !== confirmPassword) {
      setError(i18n('Пароли не совпадают'));
      return;
    }

    if (newPassword.length < 6) {
      setError(i18n('Пароль должен содержать минимум 6 символов'));
      return;
    }

    setLoading(true);

    try {
      const result = await sendPasswordConfirmationCode();
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
      const result = await changePassword('', newPassword, code);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || i18n('Произошла ошибка'));
      }
    } catch {
      setError(i18n('Произошла ошибка при изменении пароля'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'password' && i18n('Изменить пароль')}
        {step === 'code' && i18n('Подтверждение изменения пароля')}
        {step === 'success' && i18n('Пароль изменён')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {step === 'password' && (
            <>
              <TextField
                label={i18n('Новый пароль')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                autoFocus
                disabled={loading}
              />
              <TextField
                label={i18n('Подтвердите новый пароль')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                disabled={loading}
              />
            </>
          )}

          {step === 'code' && (
            <>
              <Alert severity="info">{i18n('Код подтверждения отправлен на ваш email')}</Alert>
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

          {step === 'success' && <Alert severity="success">{i18n('Пароль успешно изменён')}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        {step === 'password' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              {i18n('Отмена')}
            </Button>
            <Button onClick={handleSendCode} variant="contained" disabled={!newPassword || !confirmPassword || loading}>
              {loading ? <CircularProgress size={24} /> : i18n('Далее')}
            </Button>
          </>
        )}

        {step === 'code' && (
          <>
            <Button onClick={() => setStep('password')} disabled={loading}>
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
