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
      sx={{ width: '70vw', margin: '0 auto' }}
      anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
    >
      <Alert
        severity={severity}
        variant="filled"
        slotProps={{ action: { sx: { paddingTop: 0 } } }}
        sx={{ display: 'flex', alignItems: 'center', width: '100%' }}
        onClose={() => setAlert(null)}
      >
        <span>{title}</span>
      </Alert>
    </Snackbar>
  );
};
