'use client';

import DescriptionIcon from '@mui/icons-material/Description';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Card, CardActionArea, Stack, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { REFERENCE_STATUS_LABELS } from 'services/web-profile-ssr/src/entities/Reference/constants';
import type { OrderedReference } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { REFERENCE_STATUS } from 'services/web-profile-ssr/src/entities/Reference/Reference';

type Props = {
  reference: OrderedReference;
  onClick: () => void;
};

export const ReferenceHistoryCard = ({ reference, onClick }: Props) => {
  const statusLabel = REFERENCE_STATUS_LABELS[reference.status] ?? reference.status;
  const isReady = reference.status === REFERENCE_STATUS.READY;

  return (
    <Card variant="outlined" sx={{ background: 'transparent' }}>
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Row gap={1.5} alignItems="flex-start">
          <DescriptionIcon color="action" />

          <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="title2">{reference.typeLabel}</Typography>
            <Spacer size={2} />

            <Typography variant="body3" color="text.secondary">
              {i18n('Заказано')}: {reference.orderDate}
            </Typography>

            <Typography variant="body3" color="text.secondary">
              {i18n('Статус')}: {statusLabel}
              {reference.virtualOnly && ` • ${i18n('Только виртуальная')}`}
            </Typography>

            <Spacer size={2} />

            {isReady && reference.pickupPoint && !reference.virtualOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <LocationOnIcon color="primary" sx={{ fontSize: 14, mr: 0.5 }} />

                <Typography
                  component="p"
                  variant="caption"
                  color="primary"
                  sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                >
                  {reference.pickupPoint.name} — {reference.pickupPoint.address}, {reference.pickupPoint.room}
                </Typography>
              </div>
            )}
          </Stack>
        </Row>
      </CardActionArea>
    </Card>
  );
};
