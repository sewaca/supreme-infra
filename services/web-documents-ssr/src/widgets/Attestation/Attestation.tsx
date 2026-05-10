'use client';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { AttestationResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';

interface Props {
  attestations: AttestationResponse[];
}

interface SemesterGroup {
  semester: number;
  rows: AttestationResponse[];
}

function groupBySemester(items: AttestationResponse[]): SemesterGroup[] {
  const map = new Map<number, SemesterGroup>();
  for (const a of items) {
    if (!map.has(a.semester)) map.set(a.semester, { semester: a.semester, rows: [] });
    map.get(a.semester)?.rows.push(a);
  }
  return Array.from(map.values()).sort((a, b) => b.semester - a.semester);
}

const StatusChip = ({ attested }: { attested: boolean }) =>
  attested ? (
    <Chip label="Аттестован" size="small" color="success" />
  ) : (
    <Chip label="Не аттестован" size="small" color="error" />
  );

interface RowProps {
  a: AttestationResponse;
  isLast: boolean;
}

const AttestationRow = ({ a, isLast }: RowProps) => (
  <>
    <Stack sx={{ px: 2, py: 1.5 }} gap={0.75}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
          {a.subject_name}
        </Typography>
        <StatusChip attested={a.is_attested} />
      </Stack>
      {a.teacher_full_name && (
        <Typography variant="body2" color="text.secondary">
          {a.teacher_full_name}
        </Typography>
      )}
      {!a.is_attested && a.reason && (
        <Typography variant="body2" color="error.main">
          Причина: {a.reason}
        </Typography>
      )}
    </Stack>
    {!isLast && <Divider sx={{ mx: 2 }} />}
  </>
);

export const Attestation = ({ attestations }: Props) => {
  const groups = groupBySemester(attestations);

  return (
    <Container sx={{ pb: 4 }}>
      <Spacer size={8} />

      {attestations.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 6 }}>
          Записи об аттестации отсутствуют
        </Typography>
      ) : (
        <Stack gap={3}>
          {groups.map((group) => (
            <Stack key={group.semester} gap={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {group.semester} семестр
              </Typography>
              <Card elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                {group.rows.map((a, idx) => (
                  <AttestationRow key={a.id} a={a} isLast={idx === group.rows.length - 1} />
                ))}
              </Card>
            </Stack>
          ))}
        </Stack>
      )}
    </Container>
  );
};
