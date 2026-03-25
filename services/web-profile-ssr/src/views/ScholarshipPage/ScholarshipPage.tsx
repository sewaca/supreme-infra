'use client';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { NotificationsStack } from '../../widgets/NotificationsStack/NotificationsStack';
import { ScholarshipOrderLink } from './components/ScholarshipOrderLink';

type Props = {
  studentName: string;
  amount: string;
  currency: string;
  order: {
    number: string;
    id: string;
    startDate: string;
    endDate?: string;
  };
  notifications: Notification[];
};

export const ScholarshipPage = ({ studentName, amount, currency, order, notifications }: Props) => {
  // const { startTour } = usePageTour({ page: 'scholarship' });

  return (
    <>
      <DefaultNavbar
        position="absolute"
        center={<Typography variant="title1">{i18n('Стипендия')}</Typography>}
        // rightSlot={
        //   <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
        //     <HelpOutlineIcon fontSize="small" color="inherit" />
        //   </IconButton>
        // }
      />
      <Container sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 3 }}>
        <Spacer size={30} />

        <Typography variant="title2" component="p" textAlign="center" data-tour="scholarship-info">
          {amount} ₽/мес.
        </Typography>

        <Spacer size={6} />

        <ScholarshipOrderLink order={order} />
        <Typography variant="caption" color="secondary" component="p" textAlign="center">
          {i18n(order.endDate ? 'Действует с {{startDate}} по {{endDate}}' : 'Действует с {{startDate}}', {
            startDate: order.startDate,
            endDate: order.endDate ?? '',
          })}
        </Typography>

        <Spacer size={13} />

        <NotificationsStack notifications={notifications} />
      </Container>
    </>
  );
};
