import { OrdersPage } from 'services/web-profile-ssr/src/views/OrdersPage/OrdersPage';
import { getOrders, getOrderTypeCounts } from './actions';

export default async () => {
  const [initialOrders, typeCounts] = await Promise.all([getOrders(0, 20), getOrderTypeCounts()]);

  return <OrdersPage initialOrders={initialOrders} typeCounts={typeCounts} loadMore={getOrders} />;
};
