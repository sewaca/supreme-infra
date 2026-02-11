'use client';

import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { useMemo, useState } from 'react';
import { REFERENCE_STATUS_LABELS } from 'services/web-profile-ssr/src/entities/Reference/constants';
import type { OrderedReference } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { REFERENCE_STATUS } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { ReferenceHistoryCard } from '../ReferenceHistoryCard/ReferenceHistoryCard';

type Props = { references: OrderedReference[]; onCardClick: (ref: OrderedReference) => void };

type StatusFilter = 'all' | (typeof REFERENCE_STATUS)[keyof typeof REFERENCE_STATUS];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: i18n('Все') },
  { value: REFERENCE_STATUS.PREPARATION, label: REFERENCE_STATUS_LABELS.preparation },
  { value: REFERENCE_STATUS.IN_PROGRESS, label: REFERENCE_STATUS_LABELS.in_progress },
  { value: REFERENCE_STATUS.PENDING, label: REFERENCE_STATUS_LABELS.pending },
  { value: REFERENCE_STATUS.READY, label: REFERENCE_STATUS_LABELS.ready },
];

export const ReferenceHistory = ({ references, onCardClick }: Props) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredReferences = useMemo(
    () => (statusFilter === 'all' ? references : references.filter((r) => r.status === statusFilter)),
    [references, statusFilter],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: references.length,
      [REFERENCE_STATUS.PREPARATION]: 0,
      [REFERENCE_STATUS.IN_PROGRESS]: 0,
      [REFERENCE_STATUS.PENDING]: 0,
      [REFERENCE_STATUS.READY]: 0,
    };
    for (const r of references) {
      if (r.status in counts) counts[r.status as keyof typeof counts]++;
    }
    return counts;
  }, [references]);

  return (
    <Box data-tour="reference-history">
      <Typography variant="h6">{i18n('История заказов')}</Typography>
      <Spacer size={2} />
      <Box
        data-tour="reference-status-filter"
        sx={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, v) => v != null && setStatusFilter(v)}
          sx={{
            display: 'inline-flex',
            flexWrap: 'nowrap',
            '& .MuiToggleButton-root': { px: 2, py: 0.5, flexShrink: 0 },
            '& .MuiToggleButton-root.Mui-selected': {
              color: 'primary.main',
              borderColor: 'primary.main',
              bgcolor: 'transparent',
            },
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label} ({statusCounts[opt.value]})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Spacer size={8} />

      <Stack spacing={1}>
        {filteredReferences.length === 0 ? (
          <Typography variant="body2">
            {statusFilter === 'all' ? i18n('Пока нет заказанных справок') : i18n('Нет справок с выбранным статусом')}
          </Typography>
        ) : (
          filteredReferences.map((ref) => (
            <ReferenceHistoryCard key={ref.id} reference={ref} onClick={() => onCardClick(ref)} />
          ))
        )}
      </Stack>
    </Box>
  );
};
