import { getNotificationsApplicationsNotificationsGet } from '@supreme-int/api-client/src/generated/core-applications';
import type { ApplicationNotificationResponse } from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { getTotalUnreadCountConversationsUnreadCountGet } from '@supreme-int/api-client/src/generated/core-messages';
import { coreApplicationsClient, coreClientInfoClient, coreMessagesClient } from '../../src/shared/api/clients';
import { getAuthInfo } from '../../src/shared/api/getAuthInfo';
import { NewsLayout } from '../../src/views/NewsLayout/NewsLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let avatar: string | null = null;
  let userName = auth.name ?? '';
  let unreadMessagesCount = 0;
  let appNotifications: ApplicationNotificationResponse[] = [];

  if (auth.userId) {
    const [profileRes, unreadRes, notificationsRes] = await Promise.all([
      getUserProfileUserGet({ client: coreClientInfoClient, query: { user_id: auth.userId } }),
      getTotalUnreadCountConversationsUnreadCountGet({ client: coreMessagesClient }),
      getNotificationsApplicationsNotificationsGet({ client: coreApplicationsClient, query: { user_id: auth.userId } }),
    ]);

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name ?? userName;
    }
    unreadMessagesCount = unreadRes.data?.total_unread_count ?? 0;
    appNotifications = notificationsRes.data ?? [];
  }

  return (
    <NewsLayout
      avatar={avatar}
      userName={userName}
      unreadMessagesCount={unreadMessagesCount}
      appNotifications={appNotifications}
    >
      {children}
    </NewsLayout>
  );
}
