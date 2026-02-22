import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { Suspense } from 'react';
import { Notification } from '../../entities/Notifications/Notifications';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { NotificationsStack } from '../../widgets/NotificationsStack/NotificationsStack';
import { DormitoryOrderLink } from './components/DormitoryOrderLink';
import { MismatchDataButton } from './components/MismatchDataButton';

type Props = {
  address: string;
  name: string;
  roomNumber: string;
  contract: {
    number: string;
    id: string;
    startDate: string;
    endDate?: string;
  };
  notifications: Notification[];
};

export const DormitoryPage = ({ address, name, roomNumber, contract, notifications }: Props) => {
  return (
    <>
      <DefaultNavbar position="absolute" center={<Typography variant="title1">{i18n('Общежитие')}</Typography>} />
      <Container sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 3 }}>
        <Spacer size={30} />
        <Typography variant="title2" component="p" textAlign="center">
          {name}, {address}
        </Typography>
        <Spacer size={2} />
        <Typography variant="body3" component="p" textAlign="center" color="secondary">
          {i18n('Комната')}: № {roomNumber}
        </Typography>

        <Spacer size={6} />

        <DormitoryOrderLink contract={contract} />
        <Typography variant="caption" color="secondary" component="p" textAlign="center">
          {i18n(contract.endDate ? 'Действует с {{startDate}} по {{endDate}}' : 'Действует с {{startDate}}', {
            startDate: contract.startDate,
            endDate: contract.endDate ?? '',
          })}
        </Typography>

        <Spacer size={13} />

        <NotificationsStack notifications={notifications} />

        <Suspense>
          <MismatchDataButton />
        </Suspense>
      </Container>
    </>
  );
};
