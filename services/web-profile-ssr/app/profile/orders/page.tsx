import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import { OrdersPage } from 'services/web-profile-ssr/src/views/OrdersPage/OrdersPage';
import { getOrders, getOrderTypeCounts } from './actions';

export default async () => {
  const [initialOrders, typeCounts] = await Promise.all([getOrders(0, 20), getOrderTypeCounts()]);

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100dvh">
          <CircularProgress />
        </Box>
      }
    >
      <OrdersPage initialOrders={initialOrders} typeCounts={typeCounts} loadMore={getOrders} />
    </Suspense>
  );
};
