'use server';

import type { Order, OrderType } from 'services/web-profile-ssr/src/entities/Order/Order';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { MOCK_ORDERS } from 'services/web-profile-ssr/src/entities/Order/mockOrders';

export type OrderTypeCounts = Record<OrderType, number>;

export async function getOrderTypeCounts(): Promise<OrderTypeCounts> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const counts: OrderTypeCounts = {
    [ORDER_TYPE.DORMITORY]: 0,
    [ORDER_TYPE.SCHOLARSHIP]: 0,
    [ORDER_TYPE.EDUCATION]: 0,
    [ORDER_TYPE.GENERAL]: 0,
  };

  for (const order of MOCK_ORDERS) {
    counts[order.type]++;
  }

  return counts;
}

export async function getOrders(offset = 0, limit = 20, types?: OrderType[]): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredOrders = MOCK_ORDERS;

  if (types && types.length > 0) {
    filteredOrders = MOCK_ORDERS.filter((order) => types.includes(order.type));
  }

  return filteredOrders.slice(offset, offset + limit);
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return MOCK_ORDERS.find((order) => order.id === id) || null;
}
