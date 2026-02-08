'use client';
import { CloseOutlined } from '@mui/icons-material';
import { Alert, AlertColor, Box, IconButton, Modal, Snackbar, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { i18n } from '@supreme-int/i18n/src';
import { ReactNode, useState } from 'react';
import { AlertMessage } from 'services/web-profile-ssr/src/widgets/AlertMessage/AlertMessage';

export const MismatchDataButton = () => {
  const [alert, setAlert] = useState<ReactNode>(null);

  return (
    <>
      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ marginTop: 'auto' }}
        onClick={() =>
          setAlert(
            <AlertMessage setAlert={setAlert} severity="info" title={i18n('Обновить данные можно в студгородке')} />,
          )
        }
      >
        {i18n('Данные не актуальны')}
      </Button>
      {alert}
    </>
  );
};
