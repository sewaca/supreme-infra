'use client';

import { LogoutOutlined } from '@mui/icons-material';
import { Button, IconButton, Popover, Stack, Typography } from '@mui/material';
import { TOKEN_KEY } from '@supreme-int/api-client/src/core-auth-bff';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export const LogoutButton = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => setOpen(false);

  const handleLogout = () => {
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks universal browser support
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/');
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
          <Typography variant="body2">Вы уверены, что хотите выйти?</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClose}>
              Отмена
            </Button>
            <Button size="small" color="error" variant="contained" onClick={handleLogout}>
              Выйти
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
