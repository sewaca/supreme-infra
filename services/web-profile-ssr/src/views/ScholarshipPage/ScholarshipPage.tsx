'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import { Box, Container, Divider, IconButton, Paper, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { usePageTour } from '@supreme-int/user-tours/src/usePageTour';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { NotificationsStack } from '../../widgets/NotificationsStack/NotificationsStack';

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
  const router = useRouter();
  const { startTour } = usePageTour({ page: 'scholarship' });
  const [orderLink, setOrderLink] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search).toString();
    const retpath = searchParams ? `${window.location.pathname}?${searchParams}` : window.location.pathname;
    const params = new URLSearchParams({ orderId: order.id, ordersType: ORDER_TYPE.SCHOLARSHIP, retpath });
    setOrderLink(`/profile/orders?${params.toString()}`);
  }, [order.id]);

  return (
    <>
      <DefaultNavbar
        position="absolute"
        center={<Typography variant="title1">{i18n('Стипендия')}</Typography>}
        rightSlot={
          <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
            <HelpOutlineIcon fontSize="small" color="inherit" />
          </IconButton>
        }
      />
      <Container sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 3 }}>
        <Spacer size={30} />

        <Paper
          elevation={0}
          data-tour="scholarship-hero"
          sx={{
            background: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
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
            {i18n('Ежемесячная выплата')}
          </Typography>

          <Spacer size={6} />

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }} data-tour="scholarship-info">
            <Typography sx={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: 'white' }}>{amount}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>{currency}</Typography>
          </Box>

          <Spacer size={20} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <SchoolIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
              {studentName}
            </Typography>
          </Box>
        </Paper>

        <Spacer size={16} />

        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box
            data-tour="scholarship-contract"
            onClick={orderLink ? () => router.push(orderLink) : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              gap: 2,
              cursor: orderLink ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
              '&:hover': orderLink ? { bgcolor: 'action.hover' } : {},
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(43,72,120,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 20, color: '#2b4878' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {i18n('Основание')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {i18n('Приказ')} №{order.number}
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
                background: 'rgba(43,72,120,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 20, color: '#2b4878' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {i18n('Период выплат')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {i18n(order.endDate ? '{{startDate}} — {{endDate}}' : 'с {{startDate}}', {
                  startDate: order.startDate,
                  endDate: order.endDate ?? '',
                })}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Spacer size={16} />

        <Box data-tour="scholarship-notifications">
          <NotificationsStack notifications={notifications} />
        </Box>
      </Container>
    </>
  );
};
