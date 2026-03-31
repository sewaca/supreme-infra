'use client';
import Button from '@mui/material/Button';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { useHelpCenter } from '../../../shared/hooks/useHelpCenter';

export const MismatchDataButton = () => {
  const { alert, showHelpAlert } = useHelpCenter();

  return (
    <>
      <Button variant="contained" color="error" fullWidth sx={{ marginTop: 'auto' }} onClick={() => showHelpAlert()}>
        {i18n('Данные не актуальны')}
      </Button>
      {alert}
    </>
  );
};
