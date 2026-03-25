'use client';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TagIcon from '@mui/icons-material/Tag';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { User } from '../../shared/api/backendApi.types';
import { removeAuthToken } from '../../shared/lib/auth.client';

interface ProfilePageProps {
  user: User;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePage({ user }: ProfilePageProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    removeAuthToken();
    router.push('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: 'linear-gradient(135deg, #f5f7ff 0%, #f0f0ff 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Личный кабинет
          </Typography>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={isLoggingOut ? <CircularProgress size={14} color="error" /> : <LogoutIcon fontSize="small" />}
            onClick={handleLogout}
            disabled={isLoggingOut}
            sx={{ borderRadius: 2 }}
          >
            Выйти
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Avatar + name */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              fontSize: '1.75rem',
              fontWeight: 700,
              background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {user.name}
          </Typography>
          <Chip label={user.role ?? 'user'} size="small" sx={{ mt: 1, fontWeight: 500 }} />
        </Box>

        {/* Info fields */}
        {[
          { icon: <PersonOutlineIcon fontSize="small" />, label: 'Имя', value: user.name },
          { icon: <EmailOutlinedIcon fontSize="small" />, label: 'Email', value: user.email },
          { icon: <TagIcon fontSize="small" />, label: 'ID', value: user.id, mono: true },
        ].map(({ icon, label, value, mono }) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.5,
              mb: 1,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Box sx={{ color: 'text.secondary', mt: 0.25 }}>{icon}</Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontFamily: mono ? 'monospace' : undefined,
                  fontSize: mono ? '0.75rem' : undefined,
                  wordBreak: 'break-all',
                }}
              >
                {value}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography
            component="a"
            href="/"
            variant="body2"
            sx={{ color: '#667eea', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            ← Вернуться к рецептам
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
