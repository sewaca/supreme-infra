'use client';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { backendApi } from '../../shared/api/backendApi';
import { setAuthToken } from '../../shared/lib/auth.client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const BRAND_GRADIENT = 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)';

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = isLogin ? await backendApi.login(formData) : await backendApi.register(formData);
      setAuthToken(response.access_token);
      router.push('/profile-old');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* ── Left brand panel ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 44%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: BRAND_GRADIENT,
          p: 6,
        }}
      >
        {/* Decorative blobs */}
        {[
          { top: '-12%', right: '-8%', size: 340, opacity: 0.1 },
          { bottom: '-8%', left: '-10%', size: 280, opacity: 0.08 },
          { top: '38%', left: '-6%', size: 160, opacity: 0.07 },
          { top: '10%', left: '60%', size: 100, opacity: 0.06 },
        ].map((blob, i) => (
          <Box
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative blobs have no stable identity
            key={i}
            sx={{
              position: 'absolute',
              width: blob.size,
              height: blob.size,
              borderRadius: '50%',
              bgcolor: `rgba(255,255,255,${blob.opacity})`,
              top: blob.top,
              bottom: blob.bottom,
              left: blob.left,
              right: blob.right,
              transition: 'opacity 0.3s',
            }}
          />
        ))}

        {/* Brand content */}
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <Typography sx={{ fontSize: '3.5rem', mb: 1, lineHeight: 1 }}>🍳</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, letterSpacing: '-0.5px' }}>
            Taste.IT
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 300, lineHeight: 1.7, mx: 'auto', mb: 4 }}>
            Ваш личный кулинарный помощник. Рецепты, которые вдохновляют каждый день.
          </Typography>

          {/* Feature chips */}
          {['Тысячи рецептов', 'Персональные подборки', 'Сохраняйте избранное'].map((label) => (
            <Box
              key={label}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 6,
                px: 2,
                py: 0.75,
                mb: 1,
                mr: 1,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                ✓ {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, md: 6 },
          bgcolor: 'background.paper',
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? 'Войдите, чтобы продолжить' : 'Присоединяйтесь к тысячам кулинаров'}
            </Typography>
          </Box>

          {/* Error */}
          <Collapse in={!!error} unmountOnExit>
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Collapse>

          {/* Name field (register only) */}
          <Collapse in={!isLogin} unmountOnExit>
            <TextField
              fullWidth
              label="Имя"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required={!isLogin}
              sx={{ mb: 2 }}
            />
          </Collapse>

          {/* Email */}
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

          {/* Password */}
          <TextField
            fullWidth
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            inputProps={{ minLength: 6 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
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
              boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'linear-gradient(145deg, #5a6fd6 0%, #6a3f97 100%)',
                boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
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
              sx={{ fontWeight: 600, color: '#667eea' }}
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
