import { getStatsRatingStatsGet, getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import {
  groupScheduleGroupsGroupNameScheduleGet,
  teacherScheduleTeachersTeacherIdScheduleGet,
} from '@supreme-int/api-client/src/generated/core-schedule';
import { decodeJwt, TOKEN_KEY } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { cookies } from 'next/headers';
import '../../src/shared/api/clients';
import { getWeekRange, scheduleToEvents } from '../../src/shared/lib/schedule.utils';
import { CalendarPage } from '../../src/views/CalendarPage/CalendarPage';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  date_from?: string;
  date_to?: string;
}>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;

  const { dateFrom, dateTo } =
    params.date_from && params.date_to
      ? { dateFrom: params.date_from, dateTo: params.date_to }
      : getWeekRange(new Date());

  let schedule = [];
  let avatar: string | null = null;
  let userName = '';

  try {
    if (decoded) {
      const [profileRes, scheduleRes] = await Promise.allSettled([
        getUserProfileUserGet({ query: { user_id: decoded.sub } }),
        decoded.role === 'teacher'
          ? teacherScheduleTeachersTeacherIdScheduleGet({
              path: { teacher_id: decoded.sub },
              query: { date_from: dateFrom, date_to: dateTo },
            })
          : getStatsRatingStatsGet({ query: { user_id: decoded.sub } }).then(async (statsRes) => {
              const group = statsRes.data?.group ?? 'ИКПИ-25';
              return groupScheduleGroupsGroupNameScheduleGet({
                path: { group_name: group },
                query: { date_from: dateFrom, date_to: dateTo },
              });
            }),
      ]);

      if (profileRes.status === 'fulfilled') {
        avatar = profileRes.value.data?.avatar ?? null;
        userName = profileRes.value.data?.name ?? '';
      }
      if (scheduleRes.status === 'fulfilled') {
        schedule = (scheduleRes.value as { data?: typeof schedule }).data ?? [];
      }
    }
  } catch {
    // empty schedule on errors
  }

  const events = scheduleToEvents(schedule);

  return <CalendarPage events={events} initialDate={dateFrom} avatar={avatar} userName={userName} />;
}
