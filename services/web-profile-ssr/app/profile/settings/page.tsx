import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { loggingFetch } from 'services/web-profile-ssr/src/shared/api/fetchWithLog';
import { getServerAuthToken } from 'services/web-profile-ssr/src/shared/api/getAuthToken';
import { getMockedUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { environment } from 'services/web-profile-ssr/src/shared/lib/environment';
import type { SessionInfo } from 'services/web-profile-ssr/src/views/SettingsPage/SessionsSection';
import { SettingsPage } from 'services/web-profile-ssr/src/views/SettingsPage/SettingsPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const userId = getMockedUserId();
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
          .then(async (r) => {
            console.log('[settings/sessions] status:', r.status, r.statusText);
            const text = await r.text();
            console.log('[settings/sessions] raw body:', text);
            if (!r.ok) return [] as SessionInfo[];
            try {
              const data = JSON.parse(text) as SessionInfo[];
              console.log('[settings/sessions] parsed sessions count:', data.length);
              return data;
            } catch (e) {
              console.error('[settings/sessions] JSON parse error:', e);
              return [] as SessionInfo[];
            }
          })
          .catch((e) => {
            console.error('[settings/sessions] fetch error:', e);
            return [] as SessionInfo[];
          })
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
