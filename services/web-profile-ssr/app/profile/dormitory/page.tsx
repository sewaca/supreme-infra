import { CoreApplications } from '@supreme-int/api-client/src/index';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { DormitoryEmptyPage } from 'services/web-profile-ssr/src/views/DormitoryEmptyPage/DormitoryEmptyPage';
import { DormitoryPage } from 'services/web-profile-ssr/src/views/DormitoryPage/DormitoryPage';
import { submitDormitoryApplication } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  // FIXME: test purposes
  if (params?.emptyState === 'true') {
    return <DormitoryEmptyPage onSubmit={submitDormitoryApplication} />;
  }

  const userId = getUserId();

  const [appRes, notificationsRes, ordersRes] = await Promise.all([
    CoreApplications.getApplicationsApplicationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'dormitory' },
    }),
    CoreApplications.getNotificationsApplicationsNotificationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'dormitory' },
    }),
    CoreApplications.getOrdersOrdersGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'dormitory', limit: 1 },
    }),
  ]);

  const dormitoryApp = (appRes.data ?? []).find((a) => a.is_active);
  if (!dormitoryApp) {
    return <DormitoryEmptyPage onSubmit={submitDormitoryApplication} />;
  }

  const fields = dormitoryApp.additional_fields ?? {};

  const notifications: Notification[] = (notificationsRes.data ?? []).map((n) => ({
    severity: n.severity as Notification['severity'],
    message: n.message,
    action: n.action ?? undefined,
  }));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  // Use Order.id (from the orders table) — not dormitoryApp.id (UserApplication) which is a different entity
  const dormitoryOrderId = ordersRes.data?.orders[0]?.id ?? dormitoryApp.id;

  return (
    <DormitoryPage
      address={(fields.address as string) ?? ''}
      name={(fields.dormitoryName as string) ?? ''}
      roomNumber={(fields.roomNumber as string) ?? ''}
      contract={{
        number: (fields.contractNumber as string) ?? dormitoryApp.application_number,
        id: dormitoryOrderId,
        startDate: formatDate(dormitoryApp.start_date) ?? '',
        endDate: formatDate(dormitoryApp.end_date),
      }}
      notifications={notifications}
    />
  );
};
