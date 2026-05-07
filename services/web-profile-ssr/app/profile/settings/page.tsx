import { getSessionsAuthSessionsGet } from '@supreme-int/api-client/src/generated/core-auth';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { getSettingsSettingsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfoOrUnauthorized as getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfoOrUnauthorized';
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
