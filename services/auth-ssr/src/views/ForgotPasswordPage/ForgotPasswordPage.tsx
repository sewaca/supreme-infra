'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CodeInput } from '@supreme-int/design-system/src/components/CodeInput/CodeInput';
import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { PasswordInput } from '@supreme-int/design-system/src/components/PasswordInput/PasswordInput';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  resetForgotPassword,
  startForgotPasswordChallenge,
  verifyForgotPasswordChallenge,
} from '../../../app/forgot-password-old/actions';
import { removeAuthToken } from '../../shared/lib/auth.client';

type Step = 'email' | 'challenge' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const resetFormValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const isMaxAttemptsError =
    codeError === i18n('Превышено количество попыток. Начните заново.') ||
    codeError === i18n('Код истёк. Начните заново.');

  const handleStartChallenge = async () => {
    if (!email) return;
    setServerError(null);
    setLoading(true);
    try {
      const result = await startForgotPasswordChallenge(email);
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

  const handleVerifyCode = async () => {
    if (!challengeId || code.length !== 6) return;
    setCodeError(null);
    setAttemptsLeft(null);
    setLoading(true);
    try {
      const result = await verifyForgotPasswordChallenge(challengeId, code);
      if (result.success) {
        setStep('reset');
      } else {
        setCodeError(result.error ?? i18n('Неверный код'));
        if (result.attemptsLeft !== undefined) setAttemptsLeft(result.attemptsLeft);
        setCode('');
      }
    } catch {
      setCodeError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!challengeId || !resetFormValid) return;
    setServerError(null);
    setLoading(true);
    try {
      const result = await resetForgotPassword(challengeId, newPassword);
      if (result.success) {
        removeAuthToken();
        setStep('success');
      } else {
        setServerError(result.error ?? i18n('Произошла ошибка'));
      }
    } catch {
      setServerError(i18n('Произошла ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setCode('');
    setCodeError(null);
    setAttemptsLeft(null);
    setChallengeId(null);
    setStep('email');
  };

  const handleBack = () => {
    if (step === 'email') {
      router.push('/login-old');
    } else {
      handleRestart();
    }
  };

  const navTitle =
    step === 'success' ? i18n('Пароль изменён') : step === 'reset' ? i18n('Новый пароль') : i18n('Сброс пароля');

  return (
    <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
      <NavBar
        onBack={step !== 'success' ? handleBack : undefined}
        center={<Typography variant="h5">{navTitle}</Typography>}
        onClose={() => router.push('/login-old')}
      />

      <Container maxWidth="xs" sx={{ pt: 4 }}>
        {step === 'email' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {i18n('Введите email вашего аккаунта, и мы отправим код для подтверждения')}
            </Typography>

            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              fullWidth
              label={i18n('Email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleStartChallenge()}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!email || loading}
              onClick={handleStartChallenge}
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
              <Button variant="outlined" fullWidth onClick={handleRestart}>
                {i18n('Начать заново')}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={code.length !== 6 || loading}
                onClick={handleVerifyCode}
              >
                {loading ? <CircularProgress size={24} /> : i18n('Подтвердить')}
              </Button>
            )}
          </Stack>
        )}

        {step === 'reset' && (
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
              disabled={!resetFormValid || loading}
              onClick={handleResetPassword}
            >
              {loading ? <CircularProgress size={24} /> : i18n('Сохранить пароль')}
            </Button>
          </Stack>
        )}

        {step === 'success' && (
          <Stack spacing={3}>
            <Alert severity="success">{i18n('Пароль успешно изменён')}</Alert>
            <Button variant="contained" fullWidth onClick={() => router.push('/login-old')}>
              {i18n('Войти')}
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
