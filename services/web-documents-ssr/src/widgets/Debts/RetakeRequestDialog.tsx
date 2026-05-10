'use client';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import type { AcademicDebtResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import { useState } from 'react';

interface Props {
  debt: AcademicDebtResponse;
  senderName: string;
  open: boolean;
  onClose: () => void;
  onSend: (debtId: string, teacherId: string, content: string) => Promise<void>;
}

function buildDefaultText(debt: AcademicDebtResponse, senderName: string): string {
  const gradeLabel = debt.grade_type === 'exam' ? 'экзамен' : 'зачёт';
  return (
    `Добрый день, ${debt.teacher_name}!\n\n` +
    `Меня зовут ${senderName}. Прошу вас назначить пересдачу (${gradeLabel}) по предмету «${debt.subject}» ` +
    `(${debt.course} курс, ${debt.semester} семестр). ` +
    `Готов(а) подойти в удобное для вас время.\n\n` +
    `С уважением,\n${senderName}`
  );
}

export const RetakeRequestDialog = ({ debt, senderName, open, onClose, onSend }: Props) => {
  const [text, setText] = useState(() => buildDefaultText(debt, senderName));
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend(debt.id, debt.teacher_id, text);
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Запрос пересдачи — {debt.subject}</DialogTitle>
      <DialogContent>
        <TextField
          multiline
          fullWidth
          minRows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={sending || text.trim().length === 0}>
          {sending ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          Отправить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
