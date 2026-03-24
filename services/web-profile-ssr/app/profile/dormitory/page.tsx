import { CoreApplications } from '@supreme-int/api-client/src/index';
import type { Notification } from 'services/web-profile-ssr/src/entities/Notifications/Notifications';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { DormitoryPage } from 'services/web-profile-ssr/src/views/DormitoryPage/DormitoryPage';

export default async () => {
  const userId = getUserId();

  const [appRes, notificationsRes] = await Promise.all([
    CoreApplications.getApplicationsApplicationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'dormitory' },
    }),
    CoreApplications.getNotificationsApplicationsNotificationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId, type: 'dormitory' },
    }),
  ]);

  const dormitoryApp = (appRes.data ?? []).find((a) => a.is_active);
  if (!dormitoryApp) {
    // TODO: добавить логику для тех кто еще не живёт в общежитии
    return <div>Нет данных об общежитии</div>;
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

  return (
    <DormitoryPage
      address={(fields.address as string) ?? ''}
      name={(fields.dormitoryName as string) ?? ''}
      roomNumber={(fields.roomNumber as string) ?? ''}
      contract={{
        number: (fields.contractNumber as string) ?? dormitoryApp.application_number,
        id: dormitoryApp.id,
        startDate: formatDate(dormitoryApp.start_date) ?? '',
        endDate: formatDate(dormitoryApp.end_date),
      }}
      notifications={notifications}
    />
  );
};
