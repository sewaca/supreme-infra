import { Alert, AlertColor, Snackbar } from '@mui/material';
import type { ReactNode } from 'react';

type Props = {
  severity: AlertColor;
  title: string;
  setAlert: (alert: ReactNode) => void;
};

export const AlertMessage = ({ severity, title, setAlert }: Props) => {
  return (
    <Snackbar
      onClose={() => setAlert(null)}
      open={true}
      autoHideDuration={5000}
      sx={{ width: '70vw' }}
      anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
    >
      <Alert
        severity={severity}
        variant="filled"
        sx={{ display: 'flex', alignItems: 'center', width: '100%' }}
        onClose={() => setAlert(null)}
      >
        <span>{title}</span>
      </Alert>
    </Snackbar>
  );
};
