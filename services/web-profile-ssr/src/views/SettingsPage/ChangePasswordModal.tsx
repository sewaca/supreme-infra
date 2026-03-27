'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CodeInput } from '@supreme-int/design-system/src/components/CodeInput/CodeInput';
import { i18n } from '@supreme-int/i18n';
import { useState } from 'react';
import { applyPasswordChange, startChallenge, verifyChallenge } from '../../../app/profile/settings/actions';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'password' | 'challenge' | 'success';

export const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const [step, setStep] = useState<Step>('password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const handleReset = () => {
    setStep('password');
    setNewPassword('');
    setConfirmPassword('');
    setChallengeId(null);
    setCode('');
    setError(null);
    setLoading(false);
    setAttemptsLeft(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleContinue = async () => {
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
      const result = await startChallenge();
      if (result.success && result.challengeId) {
        setChallengeId(result.challengeId);
        setStep('challenge');
      } else {
        setError(result.error || i18n('Произошла ошибка'));
      }
    } catch {
      setError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!challengeId || code.length !== 6) return;
    setError(null);
    setAttemptsLeft(null);
    setLoading(true);
    try {
      const verifyResult = await verifyChallenge(challengeId, code);
      if (!verifyResult.success) {
        setError(verifyResult.error || i18n('Неверный код'));
        if (verifyResult.attemptsLeft !== undefined) setAttemptsLeft(verifyResult.attemptsLeft);
        setCode('');
        setLoading(false);
        return;
      }

      const applyResult = await applyPasswordChange(challengeId, newPassword);
      if (applyResult.success) {
        setStep('success');
      } else {
        setError(applyResult.error || i18n('Не удалось изменить пароль'));
      }
    } catch {
      setError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestartChallenge = () => {
    setCode('');
    setError(null);
    setAttemptsLeft(null);
    setStep('password');
    setChallengeId(null);
  };

  const isMaxAttemptsError =
    error === i18n('Превышено количество попыток. Начните заново.') || error === i18n('Код истёк. Начните заново.');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'password' && i18n('Изменить пароль')}
        {step === 'challenge' && i18n('Подтверждение')}
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

          {step === 'challenge' && (
            <>
              <Typography variant="body2" color="text.secondary">
                {i18n('Введите 6-значный код, который был отправлен на ваш email')}
              </Typography>
              <Box sx={{ py: 1 }}>
                <CodeInput value={code} onChange={setCode} disabled={loading} error={!!error && !isMaxAttemptsError} />
              </Box>
              {attemptsLeft !== null && (
                <Typography variant="caption" color="error">
                  {i18n('Осталось попыток: {{n}}', { n: String(attemptsLeft) })}
                </Typography>
              )}
              {isMaxAttemptsError && (
                <Button size="small" onClick={handleRestartChallenge} sx={{ alignSelf: 'flex-start' }}>
                  {i18n('Начать заново')}
                </Button>
              )}
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
            <Button onClick={handleContinue} variant="contained" disabled={!newPassword || !confirmPassword || loading}>
              {loading ? <CircularProgress size={24} /> : i18n('Продолжить')}
            </Button>
          </>
        )}

        {step === 'challenge' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              {i18n('Отмена')}
            </Button>
            <Button
              onClick={handleVerify}
              variant="contained"
              disabled={code.length !== 6 || loading || isMaxAttemptsError}
            >
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
