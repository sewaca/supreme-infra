'use client';

import SyncIcon from '@mui/icons-material/Sync';
import Alert from '@mui/material/Alert';
import { useState } from 'react';
import { CaldavGuideDialog } from '../../CaldavGuideDialog/CaldavGuideDialog';

export function ScheduleCaldavPromo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Alert
        icon={<SyncIcon fontSize="small" />}
        severity="info"
        onClick={() => setOpen(true)}
        sx={{ cursor: 'pointer', borderRadius: '12px', mb: 1, mt: 1 }}
      >
        <strong>Привяжите CalDAV-календарь</strong> — расписание прямо в вашем телефоне!
      </Alert>
      <CaldavGuideDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
