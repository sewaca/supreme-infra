'use server';

import type {
  OrderDetailResponse,
  OrderResponse,
} from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { CoreApplications } from '@supreme-int/api-client/src/index';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import type { Order, OrderType } from 'services/web-profile-ssr/src/entities/Order/Order';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export type OrderTypeCounts = Record<OrderType, number>;

function mapOrderResponse(order: OrderResponse): Order {
  const actions = order.actions as Record<string, { title: string; action: string }> | null | undefined;
  return {
    id: order.id,
    type: order.type as OrderType,
    number: order.number,
    title: order.title,
    date: order.date,
    additionalFields: order.additional_fields as Record<string, string> | undefined,
    pdfUrl: order.pdf_url ?? undefined,
    actions: actions
      ? {
          primary: actions.primary ?? undefined,
          secondary: actions.secondary ?? undefined,
        }
      : undefined,
  };
}

function mapOrderDetailResponse(order: OrderDetailResponse): Order {
  const actions = order.actions as Record<string, { title: string; action: string }> | null | undefined;
  return {
    id: order.id,
    type: order.type as OrderType,
    number: order.number,
    title: order.title,
    date: order.date,
    additionalFields: order.additional_fields as Record<string, string> | undefined,
    pdfUrl: order.pdf_url ?? undefined,
    notifications: order.notifications?.map(
      (n): Notification => ({
        severity: n.severity as Notification['severity'],
        message: n.message,
        action: n.action ?? undefined,
      }),
    ),
    actions: actions
      ? {
          primary: actions.primary ?? undefined,
          secondary: actions.secondary ?? undefined,
        }
      : undefined,
  };
}

export async function getOrderTypeCounts(): Promise<OrderTypeCounts> {
  const userId = getUserId();
  const res = await CoreApplications.getOrdersCountsOrdersCountsGet({
    client: coreApplicationsClient,
    query: { user_id: userId },
  });

  const counts = res.data ?? {};

  return {
    [ORDER_TYPE.DORMITORY]: counts.dormitory ?? 0,
    [ORDER_TYPE.SCHOLARSHIP]: counts.scholarship ?? 0,
    [ORDER_TYPE.EDUCATION]: counts.education ?? 0,
    [ORDER_TYPE.GENERAL]: counts.general ?? 0,
  };
}

export async function getOrders(offset = 0, limit = 20, types?: OrderType[]): Promise<Order[]> {
  const userId = getUserId();
  const res = await CoreApplications.getOrdersOrdersGet({
    client: coreApplicationsClient,
    query: {
      user_id: userId,
      offset,
      limit,
      type: types?.join(',') ?? undefined,
    },
  });

  if (!res.data) return [];
  return res.data.orders.map(mapOrderResponse);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const userId = getUserId();
  const res = await CoreApplications.getOrderOrdersOrderIdGet({
    client: coreApplicationsClient,
    path: { order_id: id },
    query: { user_id: userId },
  });

  if (!res.data) return null;
  return mapOrderDetailResponse(res.data);
}
