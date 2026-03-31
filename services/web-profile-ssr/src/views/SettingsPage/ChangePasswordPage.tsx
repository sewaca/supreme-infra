'use client';

import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { CodeInput } from '@supreme-int/design-system/src/components/CodeInput/CodeInput';
import { PasswordInput } from '@supreme-int/design-system/src/components/PasswordInput/PasswordInput';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { applyPasswordChange, startChallenge, verifyChallenge } from '../../../app/profile/settings/actions';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';

type Step = 'form' | 'challenge' | 'success';

export const ChangePasswordPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const formValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const isMaxAttemptsError =
    codeError === i18n('Превышено количество попыток. Начните заново.') ||
    codeError === i18n('Код истёк. Начните заново.');

  const handleContinue = async () => {
    if (!formValid) return;
    setServerError(null);
    setLoading(true);
    try {
      const result = await startChallenge();
      if (result.success && result.challengeId) {
        setChallengeId(result.challengeId);
        setStep('challenge');
      } else {
        setServerError(result.error ?? i18n('Произошла ошибка'));
      }
    } catch {
      setServerError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!challengeId || code.length !== 6) return;
    setCodeError(null);
    setAttemptsLeft(null);
    setLoading(true);
    try {
      const verifyResult = await verifyChallenge(challengeId, code);
      if (!verifyResult.success) {
        setCodeError(verifyResult.error ?? i18n('Неверный код'));
        if (verifyResult.attemptsLeft !== undefined) setAttemptsLeft(verifyResult.attemptsLeft);
        setCode('');
        setLoading(false);
        return;
      }
      const applyResult = await applyPasswordChange(challengeId, newPassword);
      if (applyResult.success) {
        setStep('success');
      } else {
        setCodeError(applyResult.error ?? i18n('Не удалось изменить пароль'));
      }
    } catch {
      setCodeError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestartChallenge = () => {
    setCode('');
    setCodeError(null);
    setAttemptsLeft(null);
    setChallengeId(null);
    setStep('form');
  };

  return (
    <>
      <DefaultNavbar
        center={
          <Typography variant="title1">
            {step === 'success' ? i18n('Пароль изменён') : i18n('Изменить пароль')}
          </Typography>
        }
      />

      <Container maxWidth="sm" sx={{ pt: 4 }}>
        {step === 'form' && (
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <PasswordInput
              label={i18n('Новый пароль')}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              disabled={loading}
              error={passwordTooShort}
              helperText={passwordTooShort ? i18n('Минимум 6 символов') : ' '}
            />

            <PasswordInput
              label={i18n('Подтвердите пароль')}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              disabled={loading}
              error={passwordMismatch}
              helperText={passwordMismatch ? i18n('Пароли не совпадают') : ' '}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!formValid || loading}
              onClick={handleContinue}
            >
              {loading ? <CircularProgress size={24} /> : i18n('Продолжить')}
            </Button>
          </Stack>
        )}

        {step === 'challenge' && (
          <Stack spacing={3} alignItems="center">
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {i18n('Введите 6-значный код, который был отправлен на ваш email')}
            </Typography>

            <CodeInput value={code} onChange={setCode} disabled={loading} error={!!codeError && !isMaxAttemptsError} />

            {codeError && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {codeError}
              </Alert>
            )}

            {attemptsLeft !== null && !isMaxAttemptsError && (
              <Typography variant="caption" color="error">
                {i18n('Осталось попыток: {{n}}', { n: String(attemptsLeft) })}
              </Typography>
            )}

            {isMaxAttemptsError ? (
              <Button variant="outlined" fullWidth onClick={handleRestartChallenge}>
                {i18n('Начать заново')}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={code.length !== 6 || loading}
                onClick={handleVerify}
              >
                {loading ? <CircularProgress size={24} /> : i18n('Подтвердить')}
              </Button>
            )}
          </Stack>
        )}

        {step === 'success' && (
          <Stack spacing={3}>
            <Alert severity="success">{i18n('Пароль успешно изменён')}</Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => router.push('/profile/settings')}>
                {i18n('Вернуться к настройкам')}
              </Button>
            </Box>
          </Stack>
        )}
      </Container>
    </>
  );
};
