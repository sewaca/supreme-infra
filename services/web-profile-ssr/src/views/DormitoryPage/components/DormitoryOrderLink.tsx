'use client';

import { Link, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n/src';
import { useLocation } from '@supreme-int/nextjs-shared/src/shared/hooks/useLocation';
import { useMemo } from 'react';

import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';

type Props = {
  contract: {
    number: string;
    id: string;
    startDate: string;
    endDate?: string;
  };
};

export const DormitoryOrderLink = ({ contract }: Props) => {
  const location = useLocation();

  const orderLink = useMemo(() => {
    const params = new URLSearchParams({ orderId: contract.id, ordersType: ORDER_TYPE.DORMITORY, retpath: location });
    return `/profile/orders?${params.toString()}`;
  }, [contract.id, location]);

  return (
    <Typography variant="body3" component="p" textAlign="center">
      {i18n('Договор')} <Link href={orderLink}>№{contract.number}</Link>
    </Typography>
  );
};
