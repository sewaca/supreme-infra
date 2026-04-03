'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Box, Container, Divider, IconButton, Paper, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { usePageTour } from '@supreme-int/user-tours/src/usePageTour';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { NotificationsStack } from '../../widgets/NotificationsStack/NotificationsStack';
import { MismatchDataButton } from './components/MismatchDataButton';

const ACCENT = '#1a6651';

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
  const router = useRouter();
  const { startTour } = usePageTour({ page: 'dormitory', autoStart: false });
  const [contractLink, setContractLink] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search).toString();
    const retpath = searchParams ? `${window.location.pathname}?${searchParams}` : window.location.pathname;
    const params = new URLSearchParams({ orderId: contract.id, ordersType: ORDER_TYPE.DORMITORY, retpath });
    setContractLink(`/profile/orders?${params.toString()}`);
  }, [contract.id]);

  return (
    <>
      <DefaultNavbar
        position="absolute"
        center={<Typography variant="title1">{i18n('Общежитие')}</Typography>}
        rightSlot={
          <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
            <HelpOutlineIcon fontSize="small" color="inherit" />
          </IconButton>
        }
      />
      <Container
        sx={{ minHeight: 'var(--user-screen-height)', display: 'flex', flexDirection: 'column', paddingBottom: 3 }}
      >
        <Spacer size={30} />

        <Paper
          elevation={0}
          data-tour="dormitory-hero"
          sx={{
            background: 'linear-gradient(135deg, #1a6651 0%, #0e3d31 100%)',
            borderRadius: 4,
            padding: '28px 24px 24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -48,
              right: -48,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -28,
              right: 80,
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />

          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.2, display: 'block' }}
          >
            {i18n('Место проживания')}
          </Typography>

          <Spacer size={6} />

          <Typography sx={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, color: 'white' }}>{name}</Typography>

          <Spacer size={16} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <MeetingRoomOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {i18n('Комната')} № {roomNumber}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Spacer size={16} />

        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box
            data-tour="dormitory-contract"
            onClick={contractLink ? () => router.push(contractLink) : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              gap: 2,
              cursor: contractLink ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
              '&:hover': contractLink ? { bgcolor: 'action.hover' } : {},
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(26,102,81,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {i18n('Договор')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                №{contract.number}
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          </Box>

          <Divider sx={{ mx: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(26,102,81,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 20, color: ACCENT }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {i18n('Период проживания')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {i18n(contract.endDate ? '{{startDate}} — {{endDate}}' : 'с {{startDate}}', {
                  startDate: contract.startDate,
                  endDate: contract.endDate ?? '',
                })}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Spacer size={16} />

        <Box data-tour="dormitory-notifications">
          <NotificationsStack notifications={notifications} />
        </Box>

        <Suspense>
          <MismatchDataButton />
        </Suspense>
      </Container>
    </>
  );
};
