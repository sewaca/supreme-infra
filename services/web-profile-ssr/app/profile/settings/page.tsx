import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { loggingFetch } from 'services/web-profile-ssr/src/shared/api/fetchWithLog';
import { getServerAuthToken } from 'services/web-profile-ssr/src/shared/api/getAuthToken';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { environment } from 'services/web-profile-ssr/src/shared/lib/environment';
import type { SessionInfo } from 'services/web-profile-ssr/src/views/SettingsPage/SessionsSection';
import { SettingsPage } from 'services/web-profile-ssr/src/views/SettingsPage/SettingsPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const userId = getUserId();
  const token = await getServerAuthToken();

  const [settingsRes, sessions] = await Promise.all([
    CoreClientInfo.getSettingsSettingsGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
    token
      ? loggingFetch(`${environment.coreAuthUrl}/auth/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? (r.json() as Promise<SessionInfo[]>) : []))
          .catch(() => [] as SessionInfo[])
      : ([] as SessionInfo[]),
  ]);

  const settings = settingsRes.data;

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
