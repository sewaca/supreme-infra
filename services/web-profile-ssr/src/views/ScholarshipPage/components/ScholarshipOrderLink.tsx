'use client';

import { Link, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n/src';
import { useEffect, useState } from 'react';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';

type Props = {
  order: {
    number: string;
    id: string;
  };
};

export const ScholarshipOrderLink = ({ order }: Props) => {
  const [orderLink, setOrderLink] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search).toString();
    const retpath = searchParams ? `${window.location.pathname}?${searchParams}` : window.location.pathname;
    const params = new URLSearchParams({ orderId: order.id, ordersType: ORDER_TYPE.SCHOLARSHIP, retpath });
    setOrderLink(`/profile/orders?${params.toString()}`);
  }, [order.id]);

  return (
    <Typography variant="body3" component="p" textAlign="center">
      {i18n('Приказ')} <Link href={orderLink}>№{order.number}</Link>
    </Typography>
  );
};
