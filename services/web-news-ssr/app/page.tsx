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
import type { DaySchedule, LessonSlot } from '@supreme-int/api-client/src/generated/core-schedule/types.gen';
import { getAuthInfo } from '../src/shared/api/getAuthInfo';
import { HomePage } from '../src/views/HomePage/HomePage';

export const dynamic = 'force-dynamic';

const TZ = 'Europe/Moscow';

function todayMoscow(now: Date): string {
  return now.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
}

function greetingMoscow(now: Date): string {
  const hour = Number(now.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function dateLabelMoscow(now: Date): string {
  return now.toLocaleDateString('ru-RU', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
}

function nextLessonMoscow(now: Date, lessons: LessonSlot[]): LessonSlot | null {
  const currentTime = now.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  return lessons.find((l) => l.start_time.slice(0, 5) > currentTime) ?? null;
}

export default async function Page() {
  const auth = await getAuthInfo();
  const now = new Date();
  const today = todayMoscow(now);

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

  const lessons = todaySchedule?.lessons ?? [];

  return (
    <HomePage
      avatar={avatar}
      userName={userName}
      lessons={lessons}
      nextLesson={nextLessonMoscow(now, lessons)}
      greeting={greetingMoscow(now)}
      dateLabel={dateLabelMoscow(now)}
      unreadMessagesCount={unreadMessagesCount}
      appNotifications={appNotifications}
      news={news}
    />
  );
}
