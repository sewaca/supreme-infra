import { getNotificationsApplicationsNotificationsGet } from '@supreme-int/api-client/src/generated/core-applications';
import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import type { ApplicationNotificationResponse } from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getTotalUnreadCountConversationsUnreadCountGet } from '@supreme-int/api-client/src/generated/core-messages';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { getNewsNewsGet } from '@supreme-int/api-client/src/generated/core-news';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';
import { groupScheduleGroupsGroupNameScheduleGet } from '@supreme-int/api-client/src/generated/core-schedule';
import { client as coreScheduleClient } from '@supreme-int/api-client/src/generated/core-schedule/client.gen';
import type { DaySchedule } from '@supreme-int/api-client/src/generated/core-schedule/types.gen';
import { getAuthInfo } from '../src/shared/api/getAuthInfo';
import { HomePage } from '../src/views/HomePage/HomePage';

export const dynamic = 'force-dynamic';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function Page() {
  const auth = await getAuthInfo();
  const today = toDateStr(new Date());

  let avatar: string | null = null;
  let userName = auth.name ?? '';
  let todaySchedule: DaySchedule | null = null;
  let unreadMessagesCount = 0;
  let appNotifications: ApplicationNotificationResponse[] = [];
  let news: NewsResponse[] = [];

  const newsRes = await getNewsNewsGet({ client: coreNewsClient, query: { limit: 3 } });
  news = newsRes.data ?? [];

  if (auth.userId) {
    const [profileRes, unreadRes, notificationsRes] = await Promise.all([
      getUserProfileUserGet({ client: coreClientInfoClient, query: { user_id: auth.userId } }),
      getTotalUnreadCountConversationsUnreadCountGet({ client: coreMessagesClient }),
      getNotificationsApplicationsNotificationsGet({
        client: coreApplicationsClient,
        query: { user_id: auth.userId },
      }),
    ]);

    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name ?? userName;

      const group = profileRes.data.group;
      if (group) {
        const scheduleRes = await groupScheduleGroupsGroupNameScheduleGet({
          client: coreScheduleClient,
          path: { group_name: group },
          query: { date_from: today, date_to: today },
        });
        todaySchedule = scheduleRes.data?.find((d) => d.date === today) ?? null;
      }
    }

    unreadMessagesCount = unreadRes.data?.total_unread_count ?? 0;
    appNotifications = notificationsRes.data ?? [];
  }

  return (
    <HomePage
      avatar={avatar}
      userName={userName}
      todaySchedule={todaySchedule}
      unreadMessagesCount={unreadMessagesCount}
      appNotifications={appNotifications}
      news={news}
    />
  );
}
