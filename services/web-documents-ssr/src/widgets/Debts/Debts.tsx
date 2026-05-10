'use client';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { AcademicDebtResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import Link from 'next/link';
import { useState } from 'react';
import { requestRetake } from '../../../app/documents/debts/actions';
import { RetakeRequestDialog } from './RetakeRequestDialog';

interface Props {
  debts: AcademicDebtResponse[];
  senderName: string;
}

interface SemesterGroup {
  course: number;
  semester: number;
  rows: AcademicDebtResponse[];
}

function groupBySemester(debts: AcademicDebtResponse[]): SemesterGroup[] {
  const map = new Map<string, SemesterGroup>();
  for (const d of debts) {
    const key = `${d.course}-${d.semester}`;
    if (!map.has(key)) {
      map.set(key, { course: d.course, semester: d.semester, rows: [] });
    }
    map.get(key)?.rows.push(d);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.course !== b.course ? b.course - a.course : b.semester - a.semester,
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const GRADE_TYPE_LABEL: Record<string, string> = { exam: 'Экзамен', credit: 'Зачёт' };

const StatusChip = ({ debt }: { debt: AcademicDebtResponse }) => {
  if (debt.status === 'pending') return <Chip label="Не отправлено" size="small" />;
  if (debt.status === 'requested') return <Chip label="Запрос отправлен" size="small" color="warning" />;
  if (debt.status === 'scheduled') return <Chip label="Пересдача назначена" size="small" color="success" />;
  return null;
};

interface CardProps {
  debt: AcademicDebtResponse;
  senderName: string;
  isLast: boolean;
}

const DebtCard = ({ debt, senderName, isLast }: CardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSend = async (debtId: string, teacherId: string, content: string) => {
    await requestRetake(debtId, teacherId, content);
  };

  return (
    <>
      <Stack sx={{ px: 2, py: 1.5 }} gap={0.75}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
            {debt.subject}
          </Typography>
          <StatusChip debt={debt} />
        </Stack>

        <Stack direction="row" gap={2} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            {GRADE_TYPE_LABEL[debt.grade_type] ?? debt.grade_type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debt.hours} ч.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debt.teacher_name}
          </Typography>
        </Stack>

        {debt.status === 'scheduled' && debt.retake_date && (
          <Typography variant="body2" color="success.main">
            {formatDate(debt.retake_date)} в {formatTime(debt.retake_date)}
            {debt.retake_classroom ? `, ${debt.retake_classroom}` : ''}
          </Typography>
        )}

        {debt.status === 'pending' && (
          <>
            <Button
              variant="contained"
              size="small"
              sx={{ alignSelf: 'flex-start', mt: 0.5 }}
              onClick={() => setDialogOpen(true)}
            >
              Назначить пересдачу
            </Button>
            <RetakeRequestDialog
              debt={debt}
              senderName={senderName}
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              onSend={handleSend}
            />
          </>
        )}

        {(debt.status === 'requested' || debt.status === 'scheduled') && debt.conversation_id && (
          <Typography
            variant="body2"
            component={Link}
            href={`/messages/${debt.conversation_id}`}
            sx={{ alignSelf: 'flex-start', mt: 0.5, color: 'primary.main', textDecoration: 'none' }}
          >
            Перейти в чат →
          </Typography>
        )}
      </Stack>
      {!isLast && <Divider sx={{ mx: 2 }} />}
    </>
  );
};

export const Debts = ({ debts, senderName }: Props) => {
  const groups = groupBySemester(debts);

  return (
    <Container sx={{ pb: 4 }}>
      <Spacer size={8} />

      {debts.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 6 }}>
          Задолженностей не обнаружено
        </Typography>
      ) : (
        <Stack gap={3}>
          {groups.map((group) => (
            <Stack key={`${group.course}-${group.semester}`} gap={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {group.course} курс — {group.semester} семестр
              </Typography>
              <Card elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                {group.rows.map((debt, idx) => (
                  <DebtCard key={debt.id} debt={debt} senderName={senderName} isLast={idx === group.rows.length - 1} />
                ))}
              </Card>
            </Stack>
          ))}
        </Stack>
      )}
    </Container>
  );
};
