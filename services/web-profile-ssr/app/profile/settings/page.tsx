import { getSessionsAuthSessionsGet } from '@supreme-int/api-client/src/generated/core-auth';
import { getSettingsSettingsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { coreAuthClient, coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getAuthInfo } from 'services/web-profile-ssr/src/shared/api/getUserId';
import type { SessionInfo } from 'services/web-profile-ssr/src/views/SettingsPage/SessionsSection';
import { SettingsPage } from 'services/web-profile-ssr/src/views/SettingsPage/SettingsPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const { userId } = await getAuthInfo();

  const [settingsRes, sessionsRes] = await Promise.all([
    getSettingsSettingsGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
    getSessionsAuthSessionsGet({ client: coreAuthClient }),
  ]);

  const settings = settingsRes.data;
  const sessions = (sessionsRes.data ?? []) as SessionInfo[];

  return (
    <SettingsPage
      initialSettings={{
        isNewMessageNotificationsEnabled: settings?.is_new_message_notifications_enabled ?? true,
        isScheduleChangeNotificationsEnabled: settings?.is_schedule_change_notifications_enabled ?? true,
      }}
      sessions={sessions}
    />
  );
};
