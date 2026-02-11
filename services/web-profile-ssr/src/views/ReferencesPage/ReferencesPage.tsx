'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Container, IconButton, Stack, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { useCallback, useState } from 'react';
import type { ReferenceOrderOptions } from 'services/web-profile-ssr/app/profile/references/actions';
import { getReferences } from 'services/web-profile-ssr/app/profile/references/actions';
import type { OrderedReference } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { ReferenceDetailModal } from '../../widgets/references/ReferenceDetailModal/ReferenceDetailModal';
import { ReferenceHistory } from '../../widgets/references/ReferenceHistory/ReferenceHistory';
import { ReferenceOrderForm } from '../../widgets/references/ReferenceOrderForm/ReferenceOrderForm';
import { useReferencesTour } from './lib/useReferencesTour';

type Props = { initialReferences: OrderedReference[]; orderOptions: ReferenceOrderOptions };

export const ReferencesPage = ({ initialReferences, orderOptions }: Props) => {
  const { startTour } = useReferencesTour();
  const [references, setReferences] = useState(initialReferences);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<OrderedReference | null>(null);

  const refreshReferences = useCallback(async () => {
    const data = await getReferences();
    setReferences(data);
  }, []);

  const handleCardClick = useCallback((ref: OrderedReference) => {
    setSelectedReference(ref);
    setDetailModalOpen(true);
  }, []);

  return (
    <>
      <DefaultNavbar />
      <Container sx={{ minHeight: '100dvh', paddingBottom: 4 }}>
        <Spacer size={8} />

        <Stack spacing={1}>
          <Row>
            <Typography variant="h5">{i18n('Заказ справок')}</Typography>
            <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
              <HelpOutlineIcon fontSize="small" color="action" />
            </IconButton>
          </Row>

          <Typography variant="body2">
            {i18n('Закажите справку, выберите место получения и следите за статусом.')}
          </Typography>

          <Typography variant="body2">
            {i18n('Готовые справки можно скачать в PDF или забрать в указанном месте.')}
          </Typography>
        </Stack>

        <Spacer size={12} />
        <Box data-tour="reference-order-form" sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 2 }}>
          <ReferenceOrderForm orderOptions={orderOptions} onSuccess={refreshReferences} />
        </Box>
        <Spacer size={12} />

        <ReferenceHistory references={references} onCardClick={handleCardClick} />
      </Container>

      <ReferenceDetailModal
        reference={selectedReference}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReference(null);
        }}
        onSuccess={refreshReferences}
      />
    </>
  );
};
