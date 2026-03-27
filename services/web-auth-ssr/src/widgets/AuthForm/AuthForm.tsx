'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PasswordInput } from '@supreme-int/design-system/src/components/PasswordInput/PasswordInput';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { backendApi } from '../../shared/api/backendApi';
import { detectClientInfo, setAuthToken } from '../../shared/lib/auth.client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const BRAND_GRADIENT = 'linear-gradient(145deg, #1a237e 0%, #283593 100%)';

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const clientInfoRef = useRef<Awaited<ReturnType<typeof detectClientInfo>> | null>(null);

  useEffect(() => {
    detectClientInfo().then((info) => {
      clientInfoRef.current = info;
    });
  }, []);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { location, device, ip } = isLogin
        ? (clientInfoRef.current ?? (await detectClientInfo()))
        : { location: null, device: null, ip: null };
      const response = isLogin
        ? await backendApi.login({ ...formData, location, device, ip_address: ip })
        : await backendApi.register(formData);
      setAuthToken(response.access_token);
      router.push('/profile');
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
            {isLogin ? 'Вход в личный кабинет' : 'Регистрация'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLogin ? 'Введите данные для входа в систему' : 'Создайте аккаунт для доступа к порталу'}
          </Typography>
        </Box>

        <Collapse in={!!error} unmountOnExit>
          <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>

        <Collapse in={!isLogin} unmountOnExit>
          <TextField
            fullWidth
            label="ФИО"
            autoComplete="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required={!isLogin}
            sx={{ mb: 2 }}
          />
        </Collapse>

        <TextField
          fullWidth
          label="Email"
          type="email"
          autoComplete={isLogin ? 'email' : 'new-email'}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          sx={{ mb: 2 }}
        />

        <PasswordInput
          fullWidth
          label="Пароль"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          inputProps={{ minLength: 6 }}
          sx={{ mb: 3 }}
        />

        {/* Submit */}
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
          ) : isLogin ? (
            'Войти'
          ) : (
            'Зарегистрироваться'
          )}
        </Button>

        {/* Switch mode */}
        <Typography variant="body2" align="center" color="text.secondary">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <Link
            component={NextLink}
            href={isLogin ? '/register' : '/login'}
            underline="hover"
            sx={{ fontWeight: 600, color: '#1a237e' }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </Link>
        </Typography>

        {isLogin && (
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
            <Link component={NextLink} href="/forgot-password" underline="hover" sx={{ color: '#1a237e' }}>
              Забыли пароль?
            </Link>
          </Typography>
        )}
      </Box>
    </Box>
  );
}
