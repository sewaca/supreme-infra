import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { SettingsPage } from 'services/web-profile-ssr/src/views/SettingsPage/SettingsPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const userId = getUserId();

  const res = await CoreClientInfo.getSettingsSettingsGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  const settings = res.data;

  return (
    <SettingsPage
      initialSettings={{
        isNewMessageNotificationsEnabled: settings?.is_new_message_notifications_enabled ?? true,
        isScheduleChangeNotificationsEnabled: settings?.is_schedule_change_notifications_enabled ?? true,
      }}
    />
  );
};
