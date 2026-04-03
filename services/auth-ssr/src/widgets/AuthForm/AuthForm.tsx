'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PasswordInput } from '@supreme-int/design-system/src/components/PasswordInput/PasswordInput';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { backendApi } from '../../shared/api/backendApi';
import type { ClientInfoUser } from '../../shared/lib/auth.client';
import { detectClientInfo, setAuthToken } from '../../shared/lib/auth.client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const BRAND_GRADIENT = 'linear-gradient(145deg, #1a237e 0%, #283593 100%)';

function formatSnils(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9)}`;
}

function roleLabel(role: string): string {
  if (role === 'teacher') return 'Преподаватель';
  return 'Студент';
}

type RegisterStep = 'form' | 'confirm' | 'success' | 'not_found';

function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundUser, setFoundUser] = useState<ClientInfoUser | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', snils: '', last_name: '' });

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await backendApi.lookup({
        snils: formData.snils.replace(/\D/g, ''),
        last_name: formData.last_name,
      });
      setFoundUser(user);
      setStep('confirm');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Произошла ошибка';
      if (msg.includes('not found') || msg.includes('не найден')) {
        setStep('not_found');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!foundUser) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await backendApi.register({
        email: formData.email,
        password: formData.password,
        snils: formData.snils.replace(/\D/g, ''),
      });
      setAuthToken(response.access_token);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'not_found') {
    return (
      <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Данные не найдены
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Не удалось найти ваши данные в системе. Обратитесь к методисту своего факультета.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            setStep('form');
            setError('');
          }}
          sx={{ mr: 1 }}
        >
          Попробовать снова
        </Button>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
          <Link component={NextLink} href="/login-old" underline="hover" sx={{ fontWeight: 600, color: '#1a237e' }}>
            Войти
          </Link>
        </Typography>
      </Box>
    );
  }

  if (step === 'success') {
    return (
      <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Регистрация завершена
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Аккаунт успешно создан. Добро пожаловать!
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push('/profile-old')}
          sx={{
            py: 1.5,
            px: 4,
            fontWeight: 600,
            fontSize: '1rem',
            background: BRAND_GRADIENT,
            boxShadow: '0 4px 15px rgba(26,35,126,0.35)',
          }}
        >
          OK
        </Button>
      </Box>
    );
  }

  if (step === 'confirm' && foundUser) {
    return (
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Это ваш аккаунт?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Мы нашли следующие данные. Проверьте, что они принадлежат вам.
        </Typography>

        <Collapse in={!!error} unmountOnExit>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>

        <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          {[
            ['СНИЛС', foundUser.snils ?? '—'],
            ['Фамилия', foundUser.last_name],
            ['Имя', foundUser.name],
            ['Отчество', foundUser.middle_name ?? '—'],
            ['Почта', foundUser.email],
            ['Роль', roleLabel(foundUser.role)],
          ].map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            onClick={handleConfirm}
            sx={{
              py: 1.5,
              fontWeight: 600,
              background: BRAND_GRADIENT,
              boxShadow: '0 4px 15px rgba(26,35,126,0.35)',
              '&:disabled': { background: 'rgba(0,0,0,0.12)', boxShadow: 'none' },
            }}
          >
            {isLoading ? (
              <CircularProgress size={22} thickness={3} sx={{ color: 'rgba(255,255,255,0.8)' }} />
            ) : (
              'Да, это я'
            )}
          </Button>
          <Button fullWidth variant="outlined" size="large" disabled={isLoading} onClick={() => setStep('not_found')}>
            Нет, не я
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleLookup} sx={{ width: '100%', maxWidth: 420 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Регистрация
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Создайте аккаунт для доступа к порталу
        </Typography>
      </Box>

      <Collapse in={!!error} unmountOnExit>
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
          {error}
        </Alert>
      </Collapse>

      <TextField
        fullWidth
        label="Фамилия"
        autoComplete="family-name"
        value={formData.last_name}
        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        required
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="СНИЛС"
        placeholder="123-456-789 00"
        value={formData.snils}
        onChange={(e) => setFormData({ ...formData, snils: formatSnils(e.target.value) })}
        required
        inputProps={{ inputMode: 'numeric' }}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ mb: 2 }} />

      <TextField
        fullWidth
        label="Email"
        type="email"
        autoComplete="new-email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        sx={{ mb: 2 }}
      />

      <PasswordInput
        fullWidth
        label="Пароль"
        autoComplete="new-password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        inputProps={{ minLength: 6 }}
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{
          mb: 2.5,
          py: 1.5,
          fontWeight: 600,
          fontSize: '1rem',
          background: BRAND_GRADIENT,
          boxShadow: '0 4px 15px rgba(26,35,126,0.35)',
          transition: 'all 0.2s',
          '&:hover': {
            background: 'linear-gradient(145deg, #0d1b4b 0%, #1a237e 100%)',
            boxShadow: '0 6px 20px rgba(26,35,126,0.5)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&:disabled': { background: 'rgba(0,0,0,0.12)', boxShadow: 'none' },
        }}
      >
        {isLoading ? (
          <CircularProgress size={22} thickness={3} sx={{ color: 'rgba(255,255,255,0.8)' }} />
        ) : (
          'Найти аккаунт'
        )}
      </Button>

      <Typography variant="body2" align="center" color="text.secondary">
        Уже есть аккаунт?{' '}
        <Link component={NextLink} href="/login-old" underline="hover" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Войти
        </Link>
      </Typography>
    </Box>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const clientInfoRef = useRef<Awaited<ReturnType<typeof detectClientInfo>> | null>(null);

  useEffect(() => {
    detectClientInfo().then((info) => {
      clientInfoRef.current = info;
    });
  }, []);

  if (mode === 'register') {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, md: 6 },
          bgcolor: 'background.paper',
          minHeight: '100vh',
        }}
      >
        <RegisterForm />
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { location, device, ip } = clientInfoRef.current ?? (await detectClientInfo());
      const response = await backendApi.login({ ...formData, location, device, ip_address: ip });
      setAuthToken(response.access_token);
      router.push('/profile-old');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 5, md: 6 },
        bgcolor: 'background.paper',
        minHeight: '100vh',
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Вход в личный кабинет
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Введите данные для входа в систему
          </Typography>
        </Box>

        <Collapse in={!!error} unmountOnExit>
          <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>

        <TextField
          fullWidth
          label="Email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          sx={{ mb: 2 }}
        />

        <PasswordInput
          fullWidth
          label="Пароль"
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          inputProps={{ minLength: 6 }}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{
            mb: 2.5,
            py: 1.5,
            fontWeight: 600,
            fontSize: '1rem',
            background: BRAND_GRADIENT,
            boxShadow: '0 4px 15px rgba(26,35,126,0.35)',
            transition: 'all 0.2s',
            '&:hover': {
              background: 'linear-gradient(145deg, #0d1b4b 0%, #1a237e 100%)',
              boxShadow: '0 6px 20px rgba(26,35,126,0.5)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
            '&:disabled': { background: 'rgba(0,0,0,0.12)', boxShadow: 'none' },
          }}
        >
          {isLoading ? <CircularProgress size={22} thickness={3} sx={{ color: 'rgba(255,255,255,0.8)' }} /> : 'Войти'}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          Нет аккаунта?{' '}
          <Link component={NextLink} href="/register-old" underline="hover" sx={{ fontWeight: 600, color: '#1a237e' }}>
            Зарегистрироваться
          </Link>
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }} fontWeight={600}>
          <Link component={NextLink} href="/forgot-password-old" underline="hover" sx={{ color: '#1a237e' }}>
            Забыли пароль?
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
