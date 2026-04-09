import { getNotificationsApplicationsNotificationsGet } from '@supreme-int/api-client/src/generated/core-applications';
import type { ApplicationNotificationResponse } from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { listConversationsConversationsGet } from '@supreme-int/api-client/src/generated/core-messages';
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
    const [profileRes, conversationsRes, notificationsRes] = await Promise.all([
      getUserProfileUserGet({ client: coreClientInfoClient, query: { user_id: auth.userId } }),
      listConversationsConversationsGet({ client: coreMessagesClient, query: { limit: 50 } }),
      getNotificationsApplicationsNotificationsGet({ client: coreApplicationsClient, query: { user_id: auth.userId } }),
    ]);

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name ?? userName;
    }
    unreadMessagesCount = (conversationsRes.data?.items ?? []).reduce(
      (sum: number, c) => sum + (c.unread_count ?? 0),
      0,
    );
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
