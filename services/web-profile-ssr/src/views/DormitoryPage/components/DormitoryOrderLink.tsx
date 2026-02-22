'use client';

import { Link, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n/src';
import { useEffect, useState } from 'react';

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
  const [orderLink, setOrderLink] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search).toString();
    const retpath = searchParams ? `${window.location.pathname}?${searchParams}` : window.location.pathname;
    const params = new URLSearchParams({ orderId: contract.id, ordersType: ORDER_TYPE.DORMITORY, retpath });
    setOrderLink(`/profile/orders?${params.toString()}`);
  }, [contract.id]);

  return (
    <Typography variant="body3" component="p" textAlign="center">
      {i18n('Договор')} <Link href={orderLink}>№{contract.number}</Link>
    </Typography>
  );
};
