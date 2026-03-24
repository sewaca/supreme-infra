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
import { changePassword } from '../../../app/profile/settings/actions';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'password' | 'success';

export const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const [step, setStep] = useState<Step>('password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setStep('password');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleConfirm = async () => {
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
      const result = await changePassword(newPassword);
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

          {step === 'success' && <Alert severity="success">{i18n('Пароль успешно изменён')}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        {step === 'password' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              {i18n('Отмена')}
            </Button>
            <Button onClick={handleConfirm} variant="contained" disabled={!newPassword || !confirmPassword || loading}>
              {loading ? <CircularProgress size={24} /> : i18n('Сохранить')}
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
