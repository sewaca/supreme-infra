import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import type { OrderType } from 'services/web-profile-ssr/src/entities/Order/Order';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { OrdersPage } from 'services/web-profile-ssr/src/views/OrdersPage/OrdersPage';
import { getOrderById, getOrders, getOrderTypeCounts } from './actions';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const orderId = params?.orderId;
  const ordersTypeParam = params?.ordersType;

  let selectedTypes: OrderType[] | undefined;
  if (ordersTypeParam && typeof ordersTypeParam === 'string') {
    const types = ordersTypeParam.split(',').filter((t) => Object.values(ORDER_TYPE).includes(t as OrderType));
    if (types.length > 0) {
      selectedTypes = types as OrderType[];
    }
  }

  const [initialOrders, typeCounts, selectedOrder] = await Promise.all([
    getOrders(0, 20, selectedTypes),
    getOrderTypeCounts(),
    orderId && typeof orderId === 'string' ? getOrderById(orderId) : Promise.resolve(null),
  ]);

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100dvh">
          <CircularProgress />
        </Box>
      }
    >
      <OrdersPage
        initialOrders={initialOrders}
        typeCounts={typeCounts}
        loadMore={getOrders}
        initialSelectedOrder={selectedOrder}
        initialSelectedTypes={selectedTypes}
      />
    </Suspense>
  );
};
