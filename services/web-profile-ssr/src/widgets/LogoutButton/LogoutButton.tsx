'use client';

import { LogoutOutlined } from '@mui/icons-material';
import { Button, CircularProgress, IconButton, Popover, Stack, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { useRef, useState } from 'react';
import { logoutCurrentSession } from 'services/web-profile-ssr/app/profile/settings/actions';

export const LogoutButton = () => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => setOpen(false);

  const handleLogout = async () => {
    setPending(true);
    await logoutCurrentSession();
  };

  return (
    <>
      <IconButton ref={anchorRef} color="inherit" onClick={() => setOpen(true)}>
        <LogoutOutlined />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={2} sx={{ p: 2, maxWidth: 220 }}>
          <Typography variant="body2">{i18n('Вы уверены, что хотите выйти?')}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClose} disabled={pending}>
              {i18n('Отмена')}
            </Button>
            <Button
              size="small"
              color="error"
              variant="contained"
              onClick={handleLogout}
              disabled={pending}
              startIcon={pending ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {i18n('Выйти')}
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
