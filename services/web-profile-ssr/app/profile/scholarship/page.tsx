import {
  getApplicationsApplicationsGet,
  getNotificationsApplicationsNotificationsGet,
} from '@supreme-int/api-client/src/generated/core-applications';
import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { getAuthInfo } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { ScholarshipEmptyPage } from 'services/web-profile-ssr/src/views/ScholarshipEmptyPage/ScholarshipEmptyPage';
import { ScholarshipPage } from 'services/web-profile-ssr/src/views/ScholarshipPage/ScholarshipPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const { userId } = await getAuthInfo();

  const [userRes, appRes, notificationsRes] = await Promise.all([
    getUserProfileUserGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
    getApplicationsApplicationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'scholarship' },
    }),
    getNotificationsApplicationsNotificationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'scholarship' },
    }),
  ]);

  const user = userRes.data;
  const scholarshipApp = (appRes.data ?? []).find((a) => a.is_active);

  if (!user) {
    throw 'no user found';
  }

  if (!scholarshipApp) {
    return <ScholarshipEmptyPage />;
  }

  const fields = scholarshipApp.additional_fields ?? {};

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

  return (
    <ScholarshipPage
      studentName={`${user.last_name} ${user.name}`}
      amount={String(fields.amount ?? scholarshipApp.application_number)}
      currency={String(fields.currency ?? '₽')}
      order={{
        number: scholarshipApp.application_number,
        id: String(fields.order_id ?? scholarshipApp.id),
        startDate: formatDate(scholarshipApp.start_date) ?? '',
        endDate: formatDate(scholarshipApp.end_date),
      }}
      notifications={notifications}
    />
  );
};
